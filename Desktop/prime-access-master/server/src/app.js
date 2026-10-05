const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const fs = require('fs');
const mongoose = require('mongoose');

const { connectDB } = require('./db');
const { ensureAdmin } = require('./lib/ensureAdmin');
const { migrateContactSettings } = require('./lib/migrateContactSettings');

const app = express();

app.set('trust proxy', 1);
app.use(cors({ origin: process.env.CLIENT_ORIGIN || true, credentials: true }));
app.use(express.json({ limit: '1mb' }));
app.use(cookieParser());

// Health check responds without a database round-trip
app.get('/api/health', (req, res) => res.json({ ok: true, time: new Date().toISOString() }));

// Lazy MongoDB connection - required for serverless cold starts.
// After the first successful connect we also ensure the initial admin exists.
let seeded = false;
app.use(async (req, res, next) => {
  try {
    if (mongoose.connection.readyState !== 1) await connectDB();
    if (!seeded) {
      seeded = true;
      ensureAdmin().catch((err) => console.error('[seed] admin setup failed', err.message));
      migrateContactSettings(); // never throws - rewrites legacy phone/WhatsApp/address once
    }
    next();
  } catch (err) {
    console.error('[db] connection failed:', err.message);
    res.status(503).json({ error: 'Database unavailable. Please try again shortly.' });
  }
});

// Uploaded media served statically (local / self-hosted only;
// on Vercel files live in Blob storage and the CDN handles them)
const UPLOAD_DIR = path.join(__dirname, '..', 'uploads');
app.use('/uploads', express.static(UPLOAD_DIR, { maxAge: '7d', immutable: false }));

// API routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api', require('./routes/inquiries'));
app.use('/api', require('./routes/services'));
app.use('/api', require('./routes/settings'));
app.use('/api', require('./routes/media'));
app.use('/api', require('./routes/analytics'));

// Production: serve the built React app (static assets + SPA fallback)
if (process.env.NODE_ENV === 'production') {
  const staticDirs = [
    path.join(__dirname, '..', '..', 'public'),
    path.join(__dirname, '..', '..', 'client', 'dist'),
  ];
  for (const dir of staticDirs) {
    if (fs.existsSync(dir)) {
      app.use(express.static(dir, { maxAge: '1y', immutable: true, index: false }));
    }
  }
  app.get(/^\/(?!api\/|uploads\/).*/, (req, res, next) => {
    if (req.method !== 'GET') return next();
    // Never return HTML for missing static files
    if (path.extname(req.path)) return next();
    for (const dir of staticDirs) {
      const file = path.join(dir, 'index.html');
      if (fs.existsSync(file)) {
        return res.sendFile(file);
      }
    }
    next();
  });
}

// Error handler (including multer and blob errors)
app.use((err, req, res, next) => {
  if (err && err.message && (err.name === 'MulterError' || /only images/i.test(err.message))) {
    return res.status(400).json({ error: err.message });
  }
  if (err && /blob/i.test(err.name || '') && err.status) {
    return res.status(err.status).json({ error: err.message });
  }
  console.error('[error]', err);
  res.status(500).json({ error: 'Something went wrong on the server.' });
});

module.exports = app;