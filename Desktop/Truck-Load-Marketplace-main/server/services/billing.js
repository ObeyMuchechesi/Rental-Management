const crypto = require('crypto');
const Payment = require('../models/Payment');
const Subscription = require('../models/Subscription');
const Company = require('../models/Company');
const { PLANS, planById } = require('../config/plans');
const paynow = require('./paynow');

const DAY_MS = 86400000;

const MOBILE_METHODS = { ecocash: 'EcoCash', onemoney: 'OneMoney' };

const normalizePhone = (value) => {
  let digits = String(value || '').replace(/\D/g, '');
  if (digits.startsWith('263')) digits = `0${digits.slice(3)}`;
  return digits;
};

const validEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || ''));

const newReference = () =>
  `TL${Date.now().toString(36).toUpperCase()}${crypto.randomBytes(3).toString('hex').toUpperCase()}`;

const withStatus = (message, status, code) => {
  const error = new Error(message);
  error.status = status;
  error.code = code;
  return error;
};

const hasActiveSubscription = (sub) =>
  !!sub &&
  sub.plan === 'monthly' &&
  sub.status === 'active' &&
  !!sub.currentPeriodEnd &&
  new Date(sub.currentPeriodEnd) > new Date();

/** Flip an elapsed monthly plan to the expired status (lazy, on read). */
const syncSubscription = async (sub) => {
  if (!sub) return sub;
  if (
    sub.plan === 'monthly' &&
    sub.status === 'active' &&
    sub.currentPeriodEnd &&
    new Date(sub.currentPeriodEnd) <= new Date()
  ) {
    sub.status = 'expired';
    await sub.save();
  }
  return sub;
};

const ensureSubscription = async (companyId) => {
  if (!companyId) return null;
  const sub = await Subscription.findOneAndUpdate(
    { company: companyId },
    { $setOnInsert: { company: companyId, plan: 'free', status: 'none' } },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
  return syncSubscription(sub);
};

const subscriptionView = (sub) => {
  if (!sub || !sub.plan) {
    return {
      plan: 'free',
      status: 'none',
      credits: 0,
      currentPeriodEnd: null,
      active: false,
      expired: false,
      daysLeft: 0,
      entitlements: { unlimitedUnlocks: false, unlimitedListings: false, creditUnlocks: false },
    };
  }

  const now = new Date();
  const end = sub.currentPeriodEnd ? new Date(sub.currentPeriodEnd) : null;
  const active = sub.plan === 'monthly' && sub.status === 'active' && !!end && end > now;
  const expired =
    sub.plan === 'monthly' &&
    (sub.status === 'expired' || (sub.status === 'active' && !!end && end <= now));
  const credits = Number(sub.credits) || 0;

  return {
    plan: sub.plan,
    status: active ? 'active' : expired ? 'expired' : sub.status,
    credits,
    currentPeriodEnd: end,
    active,
    expired,
    daysLeft: active ? Math.max(0, Math.ceil((end - now) / DAY_MS)) : 0,
    entitlements: {
      unlimitedUnlocks: active,
      unlimitedListings: active,
      creditUnlocks: credits > 0,
    },
  };
};

const applyEntitlement = (sub, plan, { days, credits } = {}) => {
  if (plan === 'monthly') {
    const base = hasActiveSubscription(sub) ? new Date(sub.currentPeriodEnd) : new Date();
    sub.currentPeriodEnd = new Date(base.getTime() + (days || PLANS.monthly.days) * DAY_MS);
    sub.plan = 'monthly';
    sub.status = 'active';
    return sub;
  }

  sub.credits = (Number(sub.credits) || 0) + (credits || PLANS.credits.credits);
  if (sub.plan === 'free') sub.plan = 'per_use';
  return sub;
};

/** Idempotently mark a payment paid and grant what the plan bought. */
const activatePayment = async (payment, { paynowReference, note } = {}) => {
  if (!payment) return null;
  if (payment.status === 'paid') {
    return { payment, subscription: await ensureSubscription(payment.company) };
  }

  payment.status = 'paid';
  payment.paidAt = new Date();
  if (paynowReference) payment.paynowReference = paynowReference;
  if (note) payment.notes = note;
  await payment.save();

  const sub = await ensureSubscription(payment.company);
  if (!sub) throw new Error('Payment has no company.');
  applyEntitlement(sub, payment.plan, { credits: payment.credits });
  await sub.save();

  return { payment, subscription: sub };
};

const serializePayment = (payment) => ({
  _id: payment._id,
  reference: payment.reference,
  plan: payment.plan,
  planName: PLANS[payment.plan]?.name || payment.plan,
  status: payment.status,
  amount: payment.amount,
  currency: payment.currency,
  credits: payment.credits,
  provider: payment.provider,
  method: payment.provider === 'manual' ? 'manual' : payment.method || 'hosted',
  phone: payment.status === 'pending' ? payment.phone : undefined,
  instructions: payment.status === 'pending' ? payment.instructions : undefined,
  createdAt: payment.createdAt,
  paidAt: payment.paidAt,
  paynowReference: payment.paynowReference,
  browserUrl: payment.status === 'pending' ? payment.browserUrl : null,
  notes: payment.notes,
});

const publicBase = () => {
  const configured = process.env.PAYNOW_PUBLIC_URL;
  if (configured) return configured.replace(/\/+$/, '');
  const firstClient = (process.env.CLIENT_URL || '').split(',')[0].trim();
  return (firstClient || 'http://localhost:3000').replace(/\/+$/, '');
};

const createCheckout = async ({ companyId, user, planId, method, phone }) => {
  const plan = planById(planId);
  if (!plan) throw withStatus('Choose the monthly plan or a credit pack.', 400, 'BAD_PLAN');
  if (!companyId) throw withStatus('Complete company onboarding first.', 400, 'NO_COMPANY');
  if (!paynow.isConfigured()) {
    throw withStatus(
      'PayNow is not configured yet. Add PAYNOW_INTEGRATION_ID and PAYNOW_INTEGRATION_KEY to the server environment.',
      503,
      'PAYMENTS_NOT_CONFIGURED'
    );
  }

  const requestedMethod = String(method || '').toLowerCase();
  const mobileMethod = MOBILE_METHODS[requestedMethod];
  let payerPhone = '';

  if (mobileMethod) {
    payerPhone = normalizePhone(phone);
    if (!/^07\d{8}$/.test(payerPhone)) {
      throw withStatus(
        'Enter a valid Zimbabwe mobile number, for example 0771234567.',
        400,
        'BAD_PHONE'
      );
    }
    if (!process.env.PAYNOW_AUTHEMAIL && !validEmail(user?.email)) {
      throw withStatus('Your account needs a valid email address for the PayNow receipt.', 400, 'BAD_EMAIL');
    }
  }

  const company = await Company.findById(companyId).select('name');
  const reference = newReference();
  const base = publicBase();

  const payment = await Payment.create({
    reference,
    company: companyId,
    initiatedBy: user?._id,
    plan: plan.id,
    amount: plan.price,
    currency: plan.currency,
    credits: plan.credits,
    provider: 'paynow',
    method: mobileMethod ? requestedMethod : 'hosted',
    phone: payerPhone || undefined,
  });

  const common = {
    reference,
    amount: plan.price,
    info: `TruckLink ${plan.name} · ${company?.name || 'Company'}`,
    returnUrl: `${base}/pricing?payment=return&reference=${encodeURIComponent(reference)}`,
    resultUrl: `${base}/api/paynow/result`,
  };

  const result = mobileMethod
    ? await paynow.initiateMobile({
        ...common,
        email: user?.email,
        phone: payerPhone,
        method: requestedMethod,
      })
    : await paynow.initiateTransaction(common);

  if (!result.ok) {
    payment.status = 'failed';
    payment.notes = result.error;
    await payment.save();
    throw withStatus(result.error || 'PayNow could not start the payment.', 502, 'PAYNOW_ERROR');
  }

  payment.pollUrl = result.pollUrl;
  payment.browserUrl = result.browserUrl;

  if (mobileMethod) {
    payment.instructions =
      result.instructions ||
      `Approve the ${mobileMethod} prompt on ${payerPhone} and enter your PIN to pay.`;
    await payment.save();
    return {
      payment: serializePayment(payment),
      reference,
      mode: 'mobile',
      method: requestedMethod,
      instructions: payment.instructions,
    };
  }

  await payment.save();
  return {
    payment: serializePayment(payment),
    reference,
    redirectUrl: result.browserUrl,
    mode: 'paynow',
  };
};

/** Ask PayNow for the latest state of a pending payment. */
const refreshPayment = async (payment) => {
  if (!payment || payment.status !== 'pending' || payment.provider !== 'paynow' || !payment.pollUrl) {
    return payment;
  }

  const result = await paynow.checkStatus(payment.pollUrl);
  if (!result.ok) {
    payment.notes = result.error;
    await payment.save();
    return payment;
  }

  const status = String(result.status || '').toLowerCase();
  if (status === 'paid' || status === 'awaiting delivery') {
    const activated = await activatePayment(payment, {
      paynowReference: result.paynowReference,
      note: `Confirmed by PayNow (${result.status})`,
    });
    return activated.payment;
  }

  if (['cancelled', 'failed', 'refunded', 'disputed'].includes(status)) {
    payment.status = status === 'failed' ? 'failed' : 'cancelled';
    payment.notes = `PayNow status: ${result.status}`;
    await payment.save();
  }

  return payment;
};

/** PayNow result URL payload (form encoded, order preserved for the hash). */
const handlePaynowResult = async (raw) => {
  const verified = paynow.verifyRaw(raw);
  if (!verified.ok) return { ok: false, reason: verified.error };
  const { map } = verified;

  const payment = await Payment.findOne({ reference: map.reference });
  if (!payment) return { ok: false, reason: 'UNKNOWN_REFERENCE' };

  const status = String(map.status || '').toLowerCase();
  if (status === 'paid' || status === 'awaiting delivery') {
    await activatePayment(payment, {
      paynowReference: map.paynowreference,
      note: `PayNow result: ${map.status}`,
    });
    return { ok: true, activated: true, payment };
  }

  if (['cancelled', 'failed', 'refunded', 'disputed'].includes(status)) {
    payment.status = status === 'failed' ? 'failed' : 'cancelled';
    payment.notes = `PayNow result: ${map.status}`;
    await payment.save();
    return { ok: true, activated: false, payment };
  }

  return { ok: true, activated: false, payment };
};

/** Super admin bookkeeping: record a paid manual payment and grant it. */
const grantEntitlement = async ({ companyId, planId, days, credits, amount, initiatedBy, note }) => {
  const plan = planById(planId);
  if (!plan) throw withStatus('Choose the monthly plan or a credit pack.', 400, 'BAD_PLAN');

  const payment = await Payment.create({
    reference: newReference(),
    company: companyId,
    initiatedBy,
    plan: plan.id,
    status: 'paid',
    paidAt: new Date(),
    amount: amount !== undefined && amount !== null ? Number(amount) : plan.price,
    currency: plan.currency,
    credits: plan.id === 'credits' ? Number(credits) || plan.credits : 0,
    provider: 'manual',
    method: 'manual',
    notes: note || 'Granted by super admin',
  });

  const sub = await ensureSubscription(companyId);
  applyEntitlement(sub, plan.id, {
    days: Number(days) || undefined,
    credits: Number(credits) || undefined,
  });
  await sub.save();

  return { payment, subscription: subscriptionView(sub) };
};

module.exports = {
  hasActiveSubscription,
  syncSubscription,
  ensureSubscription,
  subscriptionView,
  applyEntitlement,
  activatePayment,
  serializePayment,
  createCheckout,
  refreshPayment,
  handlePaynowResult,
  grantEntitlement,
  newReference,
};
