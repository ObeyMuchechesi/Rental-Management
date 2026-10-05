const express = require('express');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const crypto = require('crypto');
const Media = require('../models/Media');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

// Vercel Blob mode is enabled when a Blob store is available: either via the
// static read/write token, or via BLOB_STORE_ID (paired with the deployment's
// short-lived VERCEL_OIDC_TOKEN, Vercel's current default for new projects).
// Files then live in Blob storage (persistent, CDN-served) instead of disk.
const useBlob = !!(process.env.BLOB_READ_WRITE_TOKEN || process.env.BLOB_STORE_ID);

const UPLOAD_DIR = path.join(__dirname, '..', '..', 'uploads');
try {
  if (!useBlob) fs.mkdirSync(UPLOAD_DIR, { recursive: true });
} catch {
  // Read-only filesystem (e.g. serverless) - disk uploads unavailable
}

const storage = useBlob
  ? multer.memoryStorage()
  : multer.diskStorage({
      destination: (req, file, cb) => cb(null, UPLOAD_DIR),
      filename: (req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase();
        cb(null, `${Date.now()}-${crypto.randomBytes(4).toString('hex')}${ext}`);
      },
    });

const upload = multer({
  storage,
  // In blob mode files bypass the server, so the multer path is only a
  // fallback for small files (keep under the 4.5 MB function limit).
  limits: { fileSize: useBlob ? 4 * 1024 * 1024 : 200 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const ok = /^image\/(jpeg|png|gif|webp)|^video\/(mp4|webm|quicktime)/.test(file.mimetype);
    cb(ok ? null : new Error('Only images (jpg, png, gif, webp) and videos (mp4, webm) are allowed.'), ok);
  },
});

// ---- Public: published media ----
router.get('/media/published', async (req, res) => {
  const items = await Media.find({ published: true }).sort({ createdAt: -1 });
  res.json({ items });
});

// ---- Admin: all media ----
router.get('/admin/media', requireAuth, async (req, res) => {
  const items = await Media.find().sort({ createdAt: -1 });
  res.json({ items });
});

// ---- Admin: issue a short-lived client token for direct browser->Blob uploads ----
router.post('/admin/media/upload', requireAuth, async (req, res) => {
  if (!useBlob) return res.status(400).json({ error: 'Blob storage is not configured on this server.' });
  try {
    const { handleUpload } = require('@vercel/blob/client');
    const jsonResponse = await handleUpload({
      body: req.body,
      request: req,
      onBeforeGenerateToken: async () => ({
        allowedContentTypes: ['image/*', 'video/*'],
        addRandomSuffix: true,
        maximumSizeInBytes: 200 * 1024 * 1024, // 200 MB
      }),
    });
    res.json(jsonResponse);
  } catch (err) {
    res.status(400).json({ error: err.message || 'Unable to start upload.' });
  }
});

// ---- Admin: upload (multipart) or register an already-uploaded Blob URL ----
router.post('/admin/media', requireAuth, upload.single('file'), async (req, res) => {
  // Case 1: metadata for a file the browser uploaded directly to Blob
  if (!req.file && req.body && req.body.url && req.body.type) {
    const type = req.body.type === 'video' ? 'video' : 'image';
    const item = await Media.create({
      title: req.body.title || req.body.url.split('/').pop() || 'Upload',
      caption: req.body.caption || '',
      type,
      url: req.body.url,
      mimeType: req.body.mimeType || '',
      size: Number(req.body.size) || 0,
      category: req.body.category || (type === 'video' ? 'video' : 'gallery'),
      published: req.body.published !== 'false',
    });
    return res.status(201).json({ item });
  }

  // Case 2: file uploaded to this server (local dev / small fallback)
  if (!req.file) return res.status(400).json({ error: 'No file uploaded.' });

  const type = req.file.mimetype.startsWith('image/') ? 'image' : 'video';

  if (useBlob) {
    const { put } = require('@vercel/blob');
    const ext = path.extname(req.file.originalname).toLowerCase() || (type === 'image' ? '.jpg' : '.mp4');
    const { url } = await put(`media/${Date.now()}-${crypto.randomBytes(4).toString('hex')}${ext}`, req.file.buffer, {
      access: 'public',
      addRandomSuffix: true,
      contentType: req.file.mimetype,
    });
    const item = await Media.create({
      title: req.body.title || req.file.originalname,
      caption: req.body.caption || '',
      type,
      url,
      mimeType: req.file.mimetype,
      size: req.file.size,
      category: req.body.category || (type === 'video' ? 'video' : 'gallery'),
      published: req.body.published !== 'false',
    });
    return res.status(201).json({ item });
  }

  const item = await Media.create({
    title: req.body.title || req.file.originalname,
    caption: req.body.caption || '',
    type,
    url: `/uploads/${req.file.filename}`,
    mimeType: req.file.mimetype,
    size: req.file.size,
    category: req.body.category || (type === 'video' ? 'video' : 'gallery'),
    published: req.body.published !== 'false',
  });
  res.status(201).json({ item });
});

// ---- Admin: update (publish/unpublish, title, caption) ----
router.patch('/admin/media/:id', requireAuth, async (req, res) => {
  const item = await Media.findById(req.params.id);
  if (!item) return res.status(404).json({ error: 'Media not found.' });
  const allowed = ['title', 'caption', 'published', 'category'];
  for (const key of allowed) {
    if (req.body[key] !== undefined) item[key] = req.body[key];
  }
  await item.save();
  res.json({ item });
});

// ---- Admin: delete (removes the Blob file or local file too) ----
router.delete('/admin/media/:id', requireAuth, async (req, res) => {
  const item = await Media.findById(req.params.id);
  if (!item) return res.status(404).json({ error: 'Media not found.' });

  if (useBlob && /^https:\/\//.test(item.url)) {
    try {
      const { del } = require('@vercel/blob');
      await del(item.url);
    } catch (err) {
      console.warn('[media] blob delete failed (file may already be gone):', err.message);
    }
  } else if (item.url.startsWith('/uploads/')) {
    const file = path.join(UPLOAD_DIR, path.basename(item.url));
    fs.promises.unlink(file).catch(() => {});
  }

  await item.deleteOne();
  res.json({ ok: true });
});

module.exports = router;