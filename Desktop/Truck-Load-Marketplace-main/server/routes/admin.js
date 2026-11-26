const express = require('express');
const Company = require('../models/Company');
const Truck = require('../models/Truck');
const Load = require('../models/Load');
const Subscription = require('../models/Subscription');
const Unlock = require('../models/Unlock');
const Payment = require('../models/Payment');
const { auth } = require('../middleware/auth');
const billing = require('../services/billing');
const { PLANS } = require('../config/plans');

const router = express.Router();

router.use(auth('admin'));

const startOfMonthUTC = (date) =>
  new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));

const monthSeries = (count) => {
  const now = new Date();
  const months = [];
  for (let offset = count - 1; offset >= 0; offset -= 1) {
    const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - offset, 1));
    const end = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + 1, 1));
    months.push({
      key: `${start.getUTCFullYear()}-${String(start.getUTCMonth() + 1).padStart(2, '0')}`,
      label: start.toLocaleString('en-US', { month: 'short', timeZone: 'UTC' }),
      start,
      end,
    });
  }
  return months;
};

router.get('/overview', async (req, res, next) => {
  try {
    const now = new Date();
    const startThisMonth = startOfMonthUTC(now);
    const buckets = monthSeries(6);
    const seriesStart = buckets[0].start;

    const [
      companiesTotal,
      carriers,
      shippers,
      verified,
      pendingCount,
      newCompaniesThisMonth,
      trucksTotal,
      trucksAvailable,
      loadsTotal,
      loadsOpen,
      loadsCompleted,
      loadsCompletedThisMonth,
      activeMonthly,
      expiredMonthly,
      perUseCount,
      freeCount,
      creditsAgg,
      unlocksTotal,
      creditUnlocks,
      subscriptionUnlocks,
      revenueAgg,
      revenueThisMonthAgg,
      paymentsPaid,
      paymentsPending,
      paymentsFailed,
      avgLoadAgg,
      revenueBuckets,
      rideBuckets,
      companyBuckets,
      topRoutes,
      recentPayments,
      recentCompanies,
      pendingCompanies,
    ] = await Promise.all([
      Company.countDocuments(),
      Company.countDocuments({ type: 'carrier' }),
      Company.countDocuments({ type: 'shipper' }),
      Company.countDocuments({ verified: true }),
      Company.countDocuments({ verified: false }),
      Company.countDocuments({ createdAt: { $gte: startThisMonth } }),
      Truck.countDocuments(),
      Truck.countDocuments({ status: 'available' }),
      Load.countDocuments(),
      Load.countDocuments({ status: 'open' }),
      Load.countDocuments({ status: 'completed' }),
      Load.countDocuments({ status: 'completed', completedAt: { $gte: startThisMonth } }),
      Subscription.countDocuments({ plan: 'monthly', status: 'active', currentPeriodEnd: { $gt: now } }),
      Subscription.countDocuments({
        plan: 'monthly',
        $or: [{ status: 'expired' }, { status: 'active', currentPeriodEnd: { $lte: now } }],
      }),
      Subscription.countDocuments({ plan: 'per_use' }),
      Subscription.countDocuments({ plan: 'free' }),
      Subscription.aggregate([{ $group: { _id: null, total: { $sum: '$credits' } } }]),
      Unlock.countDocuments(),
      Unlock.countDocuments({ method: 'credit' }),
      Unlock.countDocuments({ method: 'subscription' }),
      Payment.aggregate([
        { $match: { status: 'paid' } },
        { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } },
      ]),
      Payment.aggregate([
        { $match: { status: 'paid', paidAt: { $gte: startThisMonth } } },
        { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } },
      ]),
      Payment.countDocuments({ status: 'paid' }),
      Payment.countDocuments({ status: 'pending' }),
      Payment.countDocuments({ status: 'failed' }),
      Load.aggregate([
        { $match: { totalOfferedRate: { $gt: 0 } } },
        { $group: { _id: null, average: { $avg: '$totalOfferedRate' } } },
      ]),
      Payment.aggregate([
        { $match: { status: 'paid', paidAt: { $gte: seriesStart } } },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m', date: '$paidAt' } },
            revenue: { $sum: '$amount' },
            payments: { $sum: 1 },
          },
        },
      ]),
      Load.aggregate([
        { $match: { status: 'completed', completedAt: { $gte: seriesStart } } },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m', date: '$completedAt' } },
            rides: { $sum: 1 },
          },
        },
      ]),
      Company.aggregate([
        { $match: { createdAt: { $gte: seriesStart } } },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
            companies: { $sum: 1 },
          },
        },
      ]),
      Load.aggregate([
        { $group: { _id: { from: '$pickup.city', to: '$dropoff.city' }, loads: { $sum: 1 } } },
        { $sort: { loads: -1 } },
        { $limit: 5 },
        { $project: { _id: 0, route: { $concat: ['$_id.from', ' → ', '$_id.to'] }, loads: 1 } },
      ]),
      Payment.aggregate([
        { $sort: { paidAt: -1, createdAt: -1 } },
        { $limit: 8 },
        {
          $lookup: {
            from: 'companies',
            localField: 'company',
            foreignField: '_id',
            as: 'companyDoc',
          },
        },
        { $unwind: { path: '$companyDoc', preserveNullAndEmptyArrays: true } },
        {
          $project: {
            reference: 1,
            plan: 1,
            status: 1,
            amount: 1,
            currency: 1,
            provider: 1,
            createdAt: 1,
            paidAt: 1,
            company: { _id: '$companyDoc._id', name: '$companyDoc.name' },
          },
        },
      ]),
      Company.find().sort({ createdAt: -1 }).limit(5).select('name type verified createdAt').lean(),
      Company.find({ verified: false }).sort({ createdAt: 1 }).limit(6).lean(),
    ]);

    const revenueMap = Object.fromEntries(revenueBuckets.map((row) => [row._id, row]));
    const rideMap = Object.fromEntries(rideBuckets.map((row) => [row._id, row]));
    const companyMap = Object.fromEntries(companyBuckets.map((row) => [row._id, row]));

    const revenue = {
      allTime: revenueAgg[0]?.total || 0,
      thisMonth: revenueThisMonthAgg[0]?.total || 0,
      mrr: activeMonthly * PLANS.monthly.price,
      paidCount: paymentsPaid,
      pendingCount: paymentsPending,
      failedCount: paymentsFailed,
    };

    res.json({
      generatedAt: now,
      kpis: {
        revenue,
        companies: {
          total: companiesTotal,
          carriers,
          shippers,
          verified,
          pending: pendingCount,
          newThisMonth: newCompaniesThisMonth,
        },
        subscriptions: {
          activeMonthly,
          expiredMonthly,
          perUse: perUseCount,
          free: freeCount,
          creditsOutstanding: creditsAgg[0]?.total || 0,
        },
        rides: {
          total: loadsTotal,
          completed: loadsCompleted,
          open: loadsOpen,
          completedThisMonth: loadsCompletedThisMonth,
          completionRate: loadsTotal ? Math.round((loadsCompleted / loadsTotal) * 100) : 0,
        },
        fleet: { total: trucksTotal, available: trucksAvailable },
        marketplace: {
          unlocks: unlocksTotal,
          creditUnlocks,
          subscriptionUnlocks,
          avgLoadValue: avgLoadAgg[0]?.average || 0,
        },
      },
      revenueSeries: buckets.map((bucket) => ({
        key: bucket.key,
        label: bucket.label,
        revenue: revenueMap[bucket.key]?.revenue || 0,
        payments: revenueMap[bucket.key]?.payments || 0,
        rides: rideMap[bucket.key]?.rides || 0,
        companies: companyMap[bucket.key]?.companies || 0,
      })),
      planMix: [
        { label: 'Monthly active', value: activeMonthly, tone: 'emerald' },
        { label: 'Monthly expired', value: expiredMonthly, tone: 'amber' },
        { label: 'Pay as you go', value: perUseCount, tone: 'indigo' },
        { label: 'Free', value: freeCount, tone: 'slate' },
      ],
      topRoutes,
      recentPayments: recentPayments.map((payment) => ({
        ...payment,
        planName: PLANS[payment.plan]?.name || payment.plan,
      })),
      recentCompanies,
      pendingCompanies,
    });
  } catch (err) {
    next(err);
  }
});

router.get('/companies', async (req, res, next) => {
  try {
    const match = {};
    if (req.query.verified === 'false') match.verified = false;
    if (req.query.verified === 'true') match.verified = true;

    const companies = await Company.aggregate([
      { $match: match },
      { $sort: { createdAt: -1 } },
      { $limit: 300 },
      {
        $lookup: {
          from: 'subscriptions',
          localField: '_id',
          foreignField: 'company',
          as: 'subscriptionDoc',
        },
      },
      { $unwind: { path: '$subscriptionDoc', preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: 'trucks',
          localField: '_id',
          foreignField: 'company',
          as: 'truckDocs',
        },
      },
      {
        $lookup: {
          from: 'loads',
          localField: '_id',
          foreignField: 'company',
          as: 'loadDocs',
        },
      },
      {
        $project: {
          name: 1,
          type: 1,
          phone: 1,
          address: 1,
          taxId: 1,
          verified: 1,
          rating: 1,
          createdAt: 1,
          trucks: { $size: '$truckDocs' },
          loads: { $size: '$loadDocs' },
          subscription: {
            plan: '$subscriptionDoc.plan',
            status: '$subscriptionDoc.status',
            credits: '$subscriptionDoc.credits',
            currentPeriodEnd: '$subscriptionDoc.currentPeriodEnd',
          },
        },
      },
    ]);

    res.json(
      companies.map((company) => ({
        ...company,
        subscription: billing.subscriptionView(company.subscription),
      }))
    );
  } catch (err) {
    next(err);
  }
});

router.post('/companies/:id/verify', async (req, res, next) => {
  try {
    const verified = req.body.verified !== false;
    const company = await Company.findByIdAndUpdate(req.params.id, { verified }, { new: true });
    if (!company) return res.status(404).json({ error: 'NOT_FOUND', message: 'Company not found.' });
    res.json(company);
  } catch (err) {
    next(err);
  }
});

router.post('/companies/:id/subscription', async (req, res, next) => {
  try {
    const { plan = 'monthly', days, credits, amount, note } = req.body;
    if (!['monthly', 'credits'].includes(plan)) {
      return res.status(400).json({ error: 'BAD_INPUT', message: 'Plan must be monthly or credits.' });
    }

    const company = await Company.findById(req.params.id);
    if (!company) return res.status(404).json({ error: 'NOT_FOUND', message: 'Company not found.' });

    const result = await billing.grantEntitlement({
      companyId: company._id,
      planId: plan,
      days,
      credits,
      amount,
      initiatedBy: req.user._id,
      note,
    });

    res.json({
      payment: billing.serializePayment(result.payment),
      subscription: result.subscription,
    });
  } catch (err) {
    next(err);
  }
});

router.get('/payments', async (req, res, next) => {
  try {
    const match = {};
    if (req.query.status) match.status = req.query.status;

    const payments = await Payment.aggregate([
      { $match: match },
      { $sort: { paidAt: -1, createdAt: -1 } },
      { $limit: Math.min(Number(req.query.limit) || 100, 300) },
      {
        $lookup: {
          from: 'companies',
          localField: 'company',
          foreignField: '_id',
          as: 'companyDoc',
        },
      },
      { $unwind: { path: '$companyDoc', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          reference: 1,
          plan: 1,
          status: 1,
          amount: 1,
          currency: 1,
          credits: 1,
          provider: 1,
          createdAt: 1,
          paidAt: 1,
          paynowReference: 1,
          notes: 1,
          company: { _id: '$companyDoc._id', name: '$companyDoc.name' },
        },
      },
    ]);

    res.json(
      payments.map((payment) => ({
        ...payment,
        planName: PLANS[payment.plan]?.name || payment.plan,
      }))
    );
  } catch (err) {
    next(err);
  }
});

router.post('/payments/:id/activate', async (req, res, next) => {
  try {
    const payment = await Payment.findById(req.params.id);
    if (!payment) return res.status(404).json({ error: 'NOT_FOUND', message: 'Payment not found.' });
    if (payment.status === 'paid') {
      return res.status(409).json({ error: 'ALREADY_PAID', message: 'That payment is already marked paid.' });
    }

    const result = await billing.activatePayment(payment, {
      note: `Manually confirmed by ${req.user.name}`,
    });

    res.json({
      payment: billing.serializePayment(result.payment),
      subscription: billing.subscriptionView(result.subscription),
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
