const express = require('express');
const Setting = require('../models/Setting');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

const PUBLIC_FIELDS =
  'brandName tagline heroTitle heroSubtitle announcement announcementEnabled phone phoneDisplay whatsappNumber email address facebookUrl mapEmbedUrl businessHours aboutIntro testimonials seoTitle seoDescription videos updatedAt';

// ---- Public ----
router.get('/settings/public', async (req, res) => {
  const s = await Setting.getSingleton();
  res.json({ settings: s.toObject({ versionKey: false }) });
});

// ---- Admin: full settings ----
router.get('/admin/settings', requireAuth, async (req, res) => {
  const s = await Setting.getSingleton();
  res.json({ settings: s.toObject({ versionKey: false }) });
});

router.put('/admin/settings', requireAuth, async (req, res) => {
  const s = await Setting.getSingleton();
  const allowed = [
    'brandName', 'tagline', 'heroTitle', 'heroSubtitle', 'announcement', 'announcementEnabled',
    'phone', 'phoneDisplay', 'whatsappNumber', 'email', 'address', 'facebookUrl', 'mapEmbedUrl',
    'businessHours', 'aboutIntro', 'testimonials', 'seoTitle', 'seoDescription', 'videos',
  ];
  for (const key of allowed) {
    if (req.body[key] !== undefined) s[key] = req.body[key];
  }
  s.updatedBy = req.adminEmail;
  await s.save();
  res.json({ settings: s.toObject({ versionKey: false }) });
});

module.exports = router;