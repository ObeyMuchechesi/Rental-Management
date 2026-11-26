const express = require('express');
const Payment = require('../models/Payment');
const { auth } = require('../middleware/auth');
const { getOrCreateSubscription, hasActiveSubscription } = require('../middleware/plan');
const billing = require('../services/billing');
const paynow = require('../services/paynow');
const { PLANS, CURRENCY } = require('../config/plans');

const router = express.Router();

const companyIdOf = (req) => req.user.company?._id || req.user.company;

const checkout = async (req, res, next, planId) => {
  try {
    const result = await billing.createCheckout({
      companyId: companyIdOf(req),
      user: req.user,
      planId,
    });
    res.json(result);
  } catch (err) {
    if (err.status) {
      return res.status(err.status).json({ error: err.code || 'PAYMENT_ERROR', message: err.message });
    }
    next(err);
  }
};

router.get('/catalog', (req, res) => {
  res.json({
    currency: CURRENCY,
    provider: 'paynow',
    configured: paynow.isConfigured(),
    plans: [PLANS.monthly, PLANS.credits],
  });
});

router.get('/me', auth(), async (req, res, next) => {
  try {
    const sub = await getOrCreateSubscription(companyIdOf(req));
    res.json(billing.subscriptionView(sub));
  } catch (err) {
    next(err);
  }
});

router.post('/subscribe', auth(), (req, res, next) => checkout(req, res, next, 'monthly'));
router.post('/credits', auth(), (req, res, next) => checkout(req, res, next, 'credits'));

router.get('/payments', auth(), async (req, res, next) => {
  try {
    const companyId = companyIdOf(req);
    if (!companyId) return res.json([]);
    const payments = await Payment.find({ company: companyId })
      .sort({ createdAt: -1 })
      .limit(Math.min(Number(req.query.limit) || 25, 100));
    res.json(payments.map(billing.serializePayment));
  } catch (err) {
    next(err);
  }
});

router.get('/payments/:reference/status', auth(), async (req, res, next) => {
  try {
    const companyId = companyIdOf(req);
    const payment = await Payment.findOne({ reference: req.params.reference, company: companyId });
    if (!payment) {
      return res.status(404).json({ error: 'NOT_FOUND', message: 'Payment not found.' });
    }

    const refreshed = await billing.refreshPayment(payment);
    const sub = await getOrCreateSubscription(companyId);

    res.json({
      payment: billing.serializePayment(refreshed),
      subscription: billing.subscriptionView(sub),
      active: hasActiveSubscription(sub),
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
