const express = require('express');
const bcrypt = require('bcryptjs');
const Admin = require('../models/Admin');
const { signToken, requireAuth } = require('../middleware/auth');
const { loginLimiter } = require('../middleware/rateLimit');

const router = express.Router();

router.post('/login', loginLimiter, async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: 'Email and password are required.' });

  const admin = await Admin.findOne({ email: String(email).toLowerCase().trim() });
  if (!admin || !(await admin.comparePassword(String(password)))) {
    return res.status(401).json({ error: 'Invalid email or password.' });
  }

  admin.lastLoginAt = new Date();
  await admin.save();

  const token = signToken(admin);
  res.json({ token, admin: { id: admin._id, name: admin.name, email: admin.email } });
});

router.post('/logout', (req, res) => {
  res.json({ ok: true });
});

router.get('/me', requireAuth, async (req, res) => {
  const admin = await Admin.findById(req.adminId).select('name email lastLoginAt');
  if (!admin) return res.status(404).json({ error: 'Admin not found.' });
  res.json({ admin });
});

// Public: change password (used on first login with the seeded default)
router.post('/change-password', requireAuth, async (req, res) => {
  const { currentPassword, newPassword } = req.body || {};
  if (!currentPassword || !newPassword || String(newPassword).length < 8) {
    return res.status(400).json({ error: 'Current password and a new password of at least 8 characters are required.' });
  }
  const admin = await Admin.findById(req.adminId);
  if (!(await admin.comparePassword(String(currentPassword)))) {
    return res.status(401).json({ error: 'Current password is incorrect.' });
  }
  admin.passwordHash = await bcrypt.hash(String(newPassword), 10);
  await admin.save();
  res.json({ ok: true });
});

module.exports = router;