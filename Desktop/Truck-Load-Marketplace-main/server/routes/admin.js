const express = require('express');
const Company = require('../models/Company');
const Truck = require('../models/Truck');
const Load = require('../models/Load');
const Subscription = require('../models/Subscription');
const Unlock = require('../models/Unlock');
const { auth } = require('../middleware/auth');

const router = express.Router();

router.use(auth('admin'));

router.get('/stats', async (req, res, next) => {
  try {
    const [companies, carriers, shippers, verified, trucks, availableTrucks, loads, openLoads, activeSubs, credits, unlocks] =
      await Promise.all([
        Company.countDocuments(),
        Company.countDocuments({ type: 'carrier' }),
        Company.countDocuments({ type: 'shipper' }),
        Company.countDocuments({ verified: true }),
        Truck.countDocuments(),
        Truck.countDocuments({ status: 'available' }),
        Load.countDocuments(),
        Load.countDocuments({ status: 'open' }),
        Subscription.countDocuments({ plan: 'monthly', status: 'active', currentPeriodEnd: { $gt: new Date() } }),
        Subscription.aggregate([{ $group: { _id: null, total: { $sum: '$credits' } } }]),
        Unlock.countDocuments(),
      ]);

    const [byMethod, topCompanies, topRoutes] = await Promise.all([
      Unlock.aggregate([{ $group: { _id: '$method', count: { $sum: 1 } } }]),
      Unlock.aggregate([
        { $group: { _id: '$company', unlocks: { $sum: 1 } } },
        { $sort: { unlocks: -1 } },
        { $limit: 5 },
        { $lookup: { from: 'companies', localField: '_id', foreignField: '_id', as: 'company' } },
        { $unwind: '$company' },
        { $project: { _id: 0, name: '$company.name', unlocks: 1 } },
      ]),
      Load.aggregate([
        { $group: { _id: { from: '$pickup.city', to: '$dropoff.city' }, loads: { $sum: 1 } } },
        { $sort: { loads: -1 } },
        { $limit: 5 },
        { $project: { _id: 0, route: { $concat: ['$_id.from', ' → ', '$_id.to'] }, loads: 1 } },
      ]),
    ]);

    res.json({
      companies: { total: companies, carriers, shippers, verified },
      trucks: { total: trucks, available: availableTrucks },
      loads: { total: loads, open: openLoads },
      subscriptions: { active: activeSubs, creditsOutstanding: credits[0]?.total || 0 },
      unlocks: {
        total: unlocks,
        byMethod: Object.fromEntries(byMethod.map((row) => [row._id, row.count])),
        topCompanies,
      },
      topRoutes,
    });
  } catch (err) {
    next(err);
  }
});

router.get('/companies', async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.verified === 'false') filter.verified = false;
    if (req.query.verified === 'true') filter.verified = true;

    const companies = await Company.find(filter).sort({ createdAt: -1 }).limit(200);
    res.json(companies);
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

module.exports = router;
