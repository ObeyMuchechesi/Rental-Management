const express = require('express');
const crypto = require('crypto');
const Inquiry = require('../models/Inquiry');
const Setting = require('../models/Setting');
const { notifyInquiry } = require('../lib/notify');
const { requireAuth } = require('../middleware/auth');
const { inquiryLimiter } = require('../middleware/rateLimit');

const router = express.Router();

const VALID_SERVICES = ['uk_visa', 'visit_visa', 'student_visa', 'business_visa', 'schengen', 'university_placement', 'evisa', 'refusal_guidance', 'other'];

function sanitize(s) {
  return String(s || '').trim().slice(0, 4000);
}

// ---- Public: submit an inquiry ----
router.post('/inquiries', inquiryLimiter, async (req, res) => {
  // Honeypot anti-spam: hidden field real users never fill
  if (req.body && req.body.website) {
    return res.status(200).json({ ok: true, honeypot: true });
  }

  const { name, phone, email, destination, service, message, source } = req.body || {};
  if (!sanitize(name) || !sanitize(phone) || !sanitize(email)) {
    return res.status(400).json({ error: 'Please provide your name, phone/WhatsApp number and email.' });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(sanitize(email))) {
    return res.status(400).json({ error: 'Please provide a valid email address.' });
  }

  const inquiry = new Inquiry({
    reference: 'PA-' + crypto.randomBytes(3).toString('hex').toUpperCase(),
    name: sanitize(name),
    phone: sanitize(phone),
    email: sanitize(email).toLowerCase(),
    destination: sanitize(destination),
    service: sanitize(service),
    message: sanitize(message),
    source: sanitize(source) || 'inquiry_form',
    history: [{ status: 'new', at: new Date() }],
  });

  await inquiry.save();

  // Fire alerts (WhatsApp + email + webhook). Never blocks the response.
  try {
    const settings = await Setting.getSingleton();
    await notifyInquiry(inquiry, settings);
  } catch (err) {
    console.error('[notify] alert failed for', inquiry.reference, err);
  }

  const settings = await Setting.getSingleton();
  // WhatsApp handoff: pre-fill a new chat with the business number so the
  // visitor just hits send. The inquiry itself (with all details) is saved
  // above and visible in the admin dashboard.
  const waText =
    'Hi Prime Access Immigration Consultant, I would like to enquire about your immigration services';
  res.status(201).json({
    ok: true,
    reference: inquiry.reference,
    confirmation: `Thank you, ${inquiry.name}. Your inquiry has been received (Ref: ${inquiry.reference}).`,
    whatsappUrl: `https://wa.me/${settings.whatsappNumber || ''}?text=${encodeURIComponent(waText)}`,
  });
});

// ---- Admin: list inquiries with search + filters ----
router.get('/admin/inquiries', requireAuth, async (req, res) => {
  const { status, q, service, sort = 'newest', page = 1, limit = 25 } = req.query;
  const filter = {};
  if (status && status !== 'all') filter.status = status;
  if (service) filter.service = service;

  if (q) {
    const rx = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    filter.$or = [{ name: rx }, { email: rx }, { phone: rx }, { service: rx }, { reference: rx }];
  }

  const sortOpts = sort === 'oldest' ? { createdAt: 1 } : { createdAt: -1 };
  const total = await Inquiry.countDocuments(filter);
  const items = await Inquiry.find(filter)
    .sort(sortOpts)
    .skip((Math.max(1, Number(page) || 1) - 1) * Number(limit))
    .limit(Number(limit));

  res.json({ items, total, page: Number(page), pages: Math.ceil(total / Number(limit)) });
});

// ---- Admin: update status / notes ----
router.patch('/admin/inquiries/:id', requireAuth, async (req, res) => {
  const inquiry = await Inquiry.findById(req.params.id);
  if (!inquiry) return res.status(404).json({ error: 'Inquiry not found.' });

  const { status } = req.body || {};
  if (status && ['new', 'in_progress', 'completed'].includes(status)) {
    if (status !== inquiry.status) inquiry.setStatus(status);
  }

  await inquiry.save();
  res.json({ item: inquiry });
});

// ---- Admin: delete ----
router.delete('/admin/inquiries/:id', requireAuth, async (req, res) => {
  await Inquiry.findByIdAndDelete(req.params.id);
  res.json({ ok: true });
});

// ---- Admin: quick stats for the inquiries page ----
router.get('/admin/inquiries/stats/summary', requireAuth, async (req, res) => {
  const [total, newCount, inProgress, completed] = await Promise.all([
    Inquiry.countDocuments({}),
    Inquiry.countDocuments({ status: 'new' }),
    Inquiry.countDocuments({ status: 'in_progress' }),
    Inquiry.countDocuments({ status: 'completed' }),
  ]);
  res.json({ total, new: newCount, in_progress: inProgress, completed });
});

module.exports = router;