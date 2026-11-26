const express = require('express');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Company = require('../models/Company');
const Subscription = require('../models/Subscription');
const { auth, signToken } = require('../middleware/auth');
const { getOrCreateSubscription } = require('../middleware/plan');
const billing = require('../services/billing');

const router = express.Router();

router.post('/register', async (req, res, next) => {
  try {
    const { name, email, password, role, companyName, phone, address, taxId } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'BAD_INPUT', message: 'Name, email and password are required.' });
    }
    if (password.length < 8) {
      return res.status(400).json({ error: 'BAD_INPUT', message: 'Password must be at least 8 characters.' });
    }
    if (!['carrier', 'shipper'].includes(role)) {
      return res.status(400).json({ error: 'BAD_INPUT', message: 'Choose carrier or shipper.' });
    }

    const existing = await User.findOne({ email: String(email).toLowerCase() });
    if (existing) {
      return res.status(409).json({ error: 'EMAIL_TAKEN', message: 'That email is already registered.' });
    }

    const company = await Company.create({
      name: companyName || name,
      type: role,
      phone,
      address,
      taxId,
      verified: false,
    });

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({
      name,
      email: String(email).toLowerCase(),
      passwordHash,
      role,
      company: company._id,
    });

    await Subscription.create({ company: company._id });
    await user.populate('company');

    res.status(201).json({ token: signToken(user), user: user.toPublic() });
  } catch (err) {
    next(err);
  }
});

router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'BAD_INPUT', message: 'Email and password are required.' });
    }

    const user = await User.findOne({ email: String(email).toLowerCase() }).populate('company');
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      return res.status(401).json({ error: 'INVALID_CREDENTIALS', message: 'Wrong email or password.' });
    }

    res.json({ token: signToken(user), user: user.toPublic() });
  } catch (err) {
    next(err);
  }
});

router.get('/me', auth(), async (req, res, next) => {
  try {
    const subscription = await getOrCreateSubscription(req.user.company?._id || req.user.company);
    res.json({ user: req.user.toPublic(), subscription: billing.subscriptionView(subscription) });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
