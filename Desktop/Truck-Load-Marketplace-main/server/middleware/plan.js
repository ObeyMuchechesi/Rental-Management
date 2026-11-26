const Subscription = require('../models/Subscription');
const Unlock = require('../models/Unlock');
const billing = require('../services/billing');

const hasActiveSubscription = billing.hasActiveSubscription;

const getOrCreateSubscription = async (companyId) => {
  if (!companyId) return null;
  return billing.ensureSubscription(companyId);
};

/** Active monthly plans see gated contact details everywhere, without spending credits. */
const hasUnlimitedUnlocks = async (companyId) => {
  const sub = await getOrCreateSubscription(companyId);
  return hasActiveSubscription(sub);
};

/**
 * Gate for viewing gated contact details.
 * active subscription -> free access
 * credits > 0         -> spend one credit, log the unlock
 * otherwise           -> 402 Payment Required
 */
const requireAccess = (targetType) => async (req, res, next) => {
  try {
    const companyId = req.user.company?._id || req.user.company;
    const targetId = req.params.id;

    if (!companyId) {
      return res.status(400).json({ error: 'NO_COMPANY', message: 'Complete company onboarding first.' });
    }

    // Never charge twice for the same target.
    const existing = await Unlock.findOne({ company: companyId, targetType, targetId });
    if (existing) {
      req.unlockedBy = existing.method;
      return next();
    }

    const sub = await getOrCreateSubscription(companyId);

    if (hasActiveSubscription(sub)) {
      await Unlock.updateOne(
        { company: companyId, targetType, targetId },
        { $setOnInsert: { method: 'subscription', amount: 0 } },
        { upsert: true }
      );
      req.unlockedBy = 'subscription';
      return next();
    }

    // Atomic decrement - a concurrent request can never overspend credits.
    const updated = await Subscription.findOneAndUpdate(
      { company: companyId, credits: { $gt: 0 } },
      { $inc: { credits: -1 } },
      { new: true }
    );

    if (updated) {
      try {
        await Unlock.create({
          company: companyId,
          targetType,
          targetId,
          method: 'credit',
          amount: 1,
        });
      } catch (err) {
        // Lost a race on the unique index: refund the credit we just spent.
        if (err.code === 11000) {
          await Subscription.updateOne({ company: companyId }, { $inc: { credits: 1 } });
          req.unlockedBy = 'credit';
          return next();
        }
        throw err;
      }
      req.unlockedBy = 'credit';
      return next();
    }

    return res.status(402).json({
      error: 'PAYMENT_REQUIRED',
      message:
        sub?.expired || sub?.status === 'expired'
          ? 'Your monthly plan has expired. Renew it or buy credits to see contact details again.'
          : 'Buy credits or subscribe to view details.',
      plans: ['monthly', 'credits'],
      subscription: billing.subscriptionView(sub),
    });
  } catch (err) {
    next(err);
  }
};

/** Carriers must be subscribed or spend a listing credit to add a truck. */
const requireListing = async (req, res, next) => {
  try {
    const companyId = req.user.company?._id || req.user.company;
    if (!companyId) {
      return res.status(400).json({ error: 'NO_COMPANY', message: 'Complete company onboarding first.' });
    }

    const sub = await getOrCreateSubscription(companyId);
    if (hasActiveSubscription(sub)) return next();

    const updated = await Subscription.findOneAndUpdate(
      { company: companyId, credits: { $gt: 0 } },
      { $inc: { credits: -1 } },
      { new: true }
    );
    if (updated) {
      req.listingPaidWithCredit = true;
      return next();
    }

    return res.status(402).json({
      error: 'PAYMENT_REQUIRED',
      message:
        sub?.status === 'expired'
          ? 'Your monthly plan has expired. Renew it or buy credits to publish a truck.'
          : 'Subscribe or buy listing credits to publish a truck.',
      plans: ['monthly', 'credits'],
      subscription: billing.subscriptionView(sub),
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  requireAccess,
  requireListing,
  hasActiveSubscription,
  hasUnlimitedUnlocks,
  getOrCreateSubscription,
};
