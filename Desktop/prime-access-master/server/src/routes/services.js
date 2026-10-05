const express = require('express');
const Service = require('../models/Service');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

function slugify(s) {
  return String(s || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

// ---- Public: published services ----
router.get('/services', async (req, res) => {
  const items = await Service.find({ published: true }).sort({ sortOrder: 1, createdAt: 1 });
  res.json({ items });
});

router.get('/services/:slug', async (req, res) => {
  const item = await Service.findOne({ slug: req.params.slug, published: true });
  if (!item) return res.status(404).json({ error: 'Service not found.' });
  res.json({ item });
});

// ---- Admin CRUD ----
router.get('/admin/services', requireAuth, async (req, res) => {
  const items = await Service.find().sort({ sortOrder: 1, createdAt: 1 });
  res.json({ items });
});

router.post('/admin/services', requireAuth, async (req, res) => {
  const { title, slug, shortDescription, description, icon, image, features, whatsappMessage, popular, published, sortOrder } = req.body || {};
  if (!title || !shortDescription) {
    return res.status(400).json({ error: 'Title and short description are required.' });
  }
  let finalSlug = slugify(slug || title);
  if (!finalSlug) return res.status(400).json({ error: 'A valid slug is required.' });

  if (await Service.findOne({ slug: finalSlug })) {
    finalSlug = `${finalSlug}-${Date.now().toString(36)}`;
  }

  const item = await Service.create({
    title,
    slug: finalSlug,
    shortDescription,
    description: description || '',
    icon: icon || 'briefcase',
    image: image || '',
    features: Array.isArray(features) ? features.filter(Boolean).slice(0, 12) : [],
    whatsappMessage: whatsappMessage || '',
    popular: !!popular,
    published: published !== false,
    sortOrder: Number(sortOrder) || 0,
  });
  res.status(201).json({ item });
});

router.patch('/admin/services/:id', requireAuth, async (req, res) => {
  const item = await Service.findById(req.params.id);
  if (!item) return res.status(404).json({ error: 'Service not found.' });

  const allowed = ['title', 'shortDescription', 'description', 'icon', 'image', 'features', 'whatsappMessage', 'popular', 'published', 'sortOrder'];
  for (const key of allowed) {
    if (req.body[key] !== undefined) item[key] = req.body[key];
  }
  if (req.body.slug) {
    const s = slugify(req.body.slug);
    if (s && s !== item.slug && !(await Service.findOne({ slug: s }))) item.slug = s;
  }
  await item.save();
  res.json({ item });
});

router.delete('/admin/services/:id', requireAuth, async (req, res) => {
  await Service.findByIdAndDelete(req.params.id);
  res.json({ ok: true });
});

module.exports = router;