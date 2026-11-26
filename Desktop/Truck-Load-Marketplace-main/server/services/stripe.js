const Subscription = require('../models/Subscription');
const { getOrCreateSubscription } = require('../middleware/plan');

const client = () => {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  return require('stripe')(key);
};

const requireStripe = (res) => {
  const stripe = client();
  if (!stripe) {
    res.status(503).json({
      error: 'STRIPE_NOT_CONFIGURED',
      message:
        'Payments are not configured yet. Add STRIPE_SECRET_KEY, PRICE_MONTHLY and PRICE_CREDIT_PACK to server/.env.',
    });
    return null;
  }
  return stripe;
};

const ensureCustomer = async (stripe, sub, user) => {
  if (sub.stripeCustomerId) return sub.stripeCustomerId;

  const customer = await stripe.customers.create({
    email: user.email,
    name: user.name,
    metadata: { company: String(user.company?._id || user.company) },
  });

  await Subscription.updateOne({ _id: sub._id }, { $set: { stripeCustomerId: customer.id } });

  return customer.id;
};

exports.createSubscriptionSession = async (req, res, next) => {
  const stripe = requireStripe(res);
  if (!stripe) return;

  try {
    if (!process.env.PRICE_MONTHLY) {
      return res.status(503).json({
        error: 'STRIPE_NOT_CONFIGURED',
        message: 'Set PRICE_MONTHLY to your Stripe subscription price id.',
      });
    }

    const sub = await getOrCreateSubscription(req.user.company?._id || req.user.company);
    const customerId = await ensureCustomer(stripe, sub, req.user);

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer: customerId,
      line_items: [{ price: process.env.PRICE_MONTHLY, quantity: 1 }],
      success_url: `${process.env.CLIENT_URL?.split(',')[0] || 'http://localhost:3000'}/dashboard?paid=1`,
      cancel_url: `${process.env.CLIENT_URL?.split(',')[0] || 'http://localhost:3000'}/pricing`,
      metadata: {
        company: String(req.user.company?._id || req.user.company),
        type: 'subscription',
      },
    });

    res.json({ url: session.url });
  } catch (err) {
    next(err);
  }
};

exports.createCreditPackSession = async (req, res, next) => {
  const stripe = requireStripe(res);
  if (!stripe) return;

  try {
    if (!process.env.PRICE_CREDIT_PACK) {
      return res.status(503).json({
        error: 'STRIPE_NOT_CONFIGURED',
        message: 'Set PRICE_CREDIT_PACK to your Stripe one-off price id.',
      });
    }

    const sub = await getOrCreateSubscription(req.user.company?._id || req.user.company);
    const customerId = await ensureCustomer(stripe, sub, req.user);
    const credits = process.env.CREDITS_PER_PACK || '20';

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      customer: customerId,
      line_items: [{ price: process.env.PRICE_CREDIT_PACK, quantity: 1 }],
      success_url: `${process.env.CLIENT_URL?.split(',')[0] || 'http://localhost:3000'}/dashboard?paid=1`,
      cancel_url: `${process.env.CLIENT_URL?.split(',')[0] || 'http://localhost:3000'}/pricing`,
      metadata: {
        company: String(req.user.company?._id || req.user.company),
        type: 'credits',
        credits,
      },
    });

    res.json({ url: session.url });
  } catch (err) {
    next(err);
  }
};

exports.stripeClient = client;
