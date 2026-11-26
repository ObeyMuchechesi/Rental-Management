const express = require('express');
const Subscription = require('../models/Subscription');
const stripeService = require('../services/stripe');

const router = express.Router();

// Mounted before express.json(): Stripe needs the raw body to verify signatures.
router.post('/stripe', express.raw({ type: 'application/json' }), async (req, res, next) => {
  const stripe = stripeService.stripeClient();

  if (!stripe || !process.env.STRIPE_WEBHOOK_SECRET) {
    return res.status(503).json({
      error: 'STRIPE_NOT_CONFIGURED',
      message: 'Set STRIPE_SECRET_KEY and STRIPE_WEBHOOK_SECRET to receive webhooks.',
    });
  }

  let event;
  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      req.headers['stripe-signature'],
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    return res.status(400).json({ error: 'INVALID_SIGNATURE', message: err.message });
  }

  try {
    const s = event.data.object;

    if (event.type === 'checkout.session.completed') {
      const companyId = s.metadata?.company;
      if (companyId && s.metadata?.type === 'credits') {
        await Subscription.findOneAndUpdate(
          { company: companyId },
          { $inc: { credits: Number(s.metadata.credits) || 0 }, $set: { plan: 'per_use' } },
          { upsert: true, new: true }
        );
      }

      if (companyId && s.metadata?.type === 'subscription') {
        let periodEnd;
        if (s.subscription) {
          const remote = await stripe.subscriptions.retrieve(s.subscription);
          periodEnd = new Date(remote.current_period_end * 1000);
        }
        await Subscription.findOneAndUpdate(
          { company: companyId },
          {
            $set: {
              plan: 'monthly',
              status: 'active',
              stripeSubscriptionId: s.subscription,
              stripeCustomerId: s.customer,
              ...(periodEnd ? { currentPeriodEnd: periodEnd } : {}),
            },
          },
          { upsert: true, new: true }
        );
      }
    }

    if (event.type === 'invoice.paid') {
      const periodEnd = event.data.object.lines?.data?.[0]?.period?.end;
      await Subscription.updateOne(
        { stripeCustomerId: event.data.object.customer },
        {
          $set: {
            status: 'active',
            ...(periodEnd ? { currentPeriodEnd: new Date(periodEnd * 1000) } : {}),
          },
        }
      );
    }

    if (event.type === 'invoice.payment_failed') {
      await Subscription.updateOne(
        { stripeCustomerId: event.data.object.customer },
        { $set: { status: 'past_due' } }
      );
    }

    if (event.type === 'customer.subscription.deleted') {
      await Subscription.updateOne(
        { stripeSubscriptionId: event.data.object.id },
        { $set: { status: 'canceled', plan: 'free' } }
      );
    }

    res.json({ received: true });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
