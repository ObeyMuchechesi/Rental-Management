const express = require('express');
const Load = require('../models/Load');
const { auth } = require('../middleware/auth');
const { requireAccess, hasUnlimitedUnlocks } = require('../middleware/plan');
const matching = require('../services/matching');

const router = express.Router();

const findLoad = async (req, res, next) => {
  try {
    const load = await Load.findById(req.params.id).populate('company');
    if (!load) return res.status(404).json({ error: 'NOT_FOUND', message: 'Load not found.' });
    req.load = load;
    next();
  } catch (err) {
    next(err);
  }
};

const ownsLoad = (req, res, next) => {
  const ownerId = String(req.load.company?._id || req.load.company);
  if (ownerId !== String(req.user.company?._id || req.user.company)) {
    return res.status(403).json({ error: 'FORBIDDEN', message: 'This load belongs to another company.' });
  }
  next();
};

router.post('/', auth('shipper'), async (req, res, next) => {
  try {
    const {
      cargoType,
      weightTons,
      truckTypesRequired,
      pickup,
      dropoff,
      offeredRatePerKm,
      totalOfferedRate,
      contactPhone,
    } = req.body;

    if (!cargoType || !weightTons || !pickup?.city || !dropoff?.city || !offeredRatePerKm || !contactPhone) {
      return res.status(400).json({
        error: 'BAD_INPUT',
        message: 'Cargo, weight, pickup, dropoff, offered rate and contact phone are required.',
      });
    }

    const toStop = (stop) => ({
      city: stop.city,
      date: stop.date || undefined,
      coordinates:
        Array.isArray(stop.coordinates) && matching.hasCoords(stop.coordinates.map(Number))
          ? stop.coordinates.map(Number)
          : undefined,
    });

    const load = await Load.create({
      company: req.user.company?._id || req.user.company,
      cargoType,
      weightTons,
      truckTypesRequired: Array.isArray(truckTypesRequired) ? truckTypesRequired : [],
      pickup: toStop(pickup),
      dropoff: toStop(dropoff),
      offeredRatePerKm,
      totalOfferedRate,
      contactPhone,
    });

    await load.populate('company');
    res.status(201).json(matching.sanitizeLoad(load, true));
  } catch (err) {
    next(err);
  }
});

router.get('/mine', auth('shipper'), async (req, res, next) => {
  try {
    const loads = await Load.find({ company: req.user.company?._id || req.user.company }).sort({ createdAt: -1 });
    res.json(loads.map((l) => matching.sanitizeLoad(l, true)));
  } catch (err) {
    next(err);
  }
});

// Carriers browse open loads with contact details masked.
router.get('/', auth('carrier'), async (req, res, next) => {
  try {
    const { truckType, minRate, city, status = 'open' } = req.query;
    const query = {};

    if (status !== 'all') query.status = status;
    if (truckType) query.truckTypesRequired = truckType;
    if (minRate) query.offeredRatePerKm = { $gte: Number(minRate) };
    if (city) query['pickup.city'] = new RegExp(matching.escapeRegex(city), 'i');

    const loads = await Load.find(query)
      .sort({ createdAt: -1 })
      .limit(100)
      .populate('company');

    // Active monthly plan: show every shipper contact without spending credits.
    const unlimited = await hasUnlimitedUnlocks(req.user.company?._id || req.user.company);

    res.json(loads.map((l) => matching.sanitizeLoad(l, unlimited)));
  } catch (err) {
    next(err);
  }
});

router.get('/:id', auth('carrier'), findLoad, requireAccess('load'), (req, res) => {
  res.json(matching.sanitizeLoad(req.load, true));
});

router.patch('/:id', auth('shipper'), findLoad, ownsLoad, async (req, res, next) => {
  try {
    const fields = ['cargoType', 'weightTons', 'truckTypesRequired', 'offeredRatePerKm', 'totalOfferedRate', 'status', 'contactPhone'];
    for (const field of fields) {
      if (req.body[field] !== undefined) req.load[field] = req.body[field];
    }
    if (req.load.status === 'completed' && !req.load.completedAt) req.load.completedAt = new Date();
    if (req.load.status !== 'completed') req.load.completedAt = undefined;

    await req.load.save();
    res.json(matching.sanitizeLoad(req.load, true));
  } catch (err) {
    next(err);
  }
});

// The shipper confirms the freight was delivered: this is a completed ride.
router.post('/:id/complete', auth('shipper'), findLoad, ownsLoad, async (req, res, next) => {
  try {
    if (req.load.status !== 'completed') {
      req.load.status = 'completed';
      req.load.completedAt = new Date();
      await req.load.save();
    }
    res.json(matching.sanitizeLoad(req.load, true));
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', auth('shipper'), findLoad, ownsLoad, async (req, res, next) => {
  try {
    await req.load.deleteOne();
    res.json({ deleted: true });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
