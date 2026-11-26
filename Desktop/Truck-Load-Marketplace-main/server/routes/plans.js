const express = require('express');
const { auth } = require('../middleware/auth');
const { getOrCreateSubscription } = require('../middleware/plan');
const stripeService = require('../services/stripe');

const router = express.Router();

router.get('/me', auth(), async (req, res, next) => {
  try {
    const subscription = await getOrCreateSubscription(req.user.company?._id || req.user.company);
    res.json(subscription);
  } catch (err) {
    next(err);
  }
});

router.post('/subscribe', auth(), stripeService.createSubscriptionSession);
router.post('/credits', auth(), stripeService.createCreditPackSession);

module.exports = router;
