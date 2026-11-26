const express = require('express');
const Truck = require('../models/Truck');
const Load = require('../models/Load');
const Unlock = require('../models/Unlock');
const { auth } = require('../middleware/auth');
const { requireAccess, requireListing, hasUnlimitedUnlocks } = require('../middleware/plan');
const matching = require('../services/matching');

const router = express.Router();

const MAX_PHOTO_CHARS = 2500000;
const DATA_PHOTO = /^data:image\/(jpeg|jpg|png|webp);base64,[A-Za-z0-9+/=]+$/;

// Seed photos use public paths such as /photos/tanker-fleet.jpg.
const validPhoto = (value) =>
  typeof value === 'string' &&
  value.length > 0 &&
  value.length <= MAX_PHOTO_CHARS &&
  (DATA_PHOTO.test(value) || /^\/photos\/[a-z0-9-]+\.(jpg|jpeg|png|webp)$/i.test(value));

const requireVerified = (req, res, next) => {
  if (!req.user.company?.verified) {
    return res.status(403).json({
      error: 'VERIFICATION_REQUIRED',
      message: 'Your company is pending admin verification. You can list trucks once approved.',
    });
  }
  next();
};

const findTruck = async (req, res, next) => {
  try {
    const truck = await Truck.findById(req.params.id).populate('company');
    if (!truck) return res.status(404).json({ error: 'NOT_FOUND', message: 'Truck not found.' });
    req.truck = truck;
    next();
  } catch (err) {
    next(err);
  }
};

const ownsTruck = (req, res, next) => {
  const ownerId = String(req.truck.company?._id || req.truck.company);
  if (ownerId !== String(req.user.company?._id || req.user.company)) {
    return res.status(403).json({ error: 'FORBIDDEN', message: 'This truck belongs to another company.' });
  }
  next();
};

router.post('/', auth('carrier'), requireVerified, requireListing, async (req, res, next) => {
  try {
    const { type, plateNumber, capacityTons, capacityVolumeM3, city, coordinates, availableFrom, availableUntil, minRatePerKm, contactPhone, exactAddress, currency, photo } = req.body;

    if (!type || !plateNumber || !capacityTons || !city || !availableUntil || minRatePerKm === undefined || !contactPhone) {
      return res.status(400).json({
        error: 'BAD_INPUT',
        message: 'Type, plate, capacity, city, availability, minimum rate and contact phone are required.',
      });
    }
    if (!validPhoto(photo)) {
      return res.status(400).json({
        error: 'PHOTO_REQUIRED',
        message: 'Upload a clear picture of the truck before publishing.',
      });
    }

    const truck = await Truck.create({
      company: req.user.company?._id || req.user.company,
      type,
      plateNumber,
      capacityTons,
      capacityVolumeM3,
      currentLocation: {
        city,
        coordinates:
          Array.isArray(coordinates) && matching.hasCoords(coordinates.map(Number))
            ? coordinates.map(Number)
            : undefined,
      },
      availableFrom,
      availableUntil,
      minRatePerKm,
      currency: currency || 'USD',
      contactPhone,
      exactAddress,
      photos: [photo],
      status: 'available',
    });

    await truck.populate('company');

    res.status(201).json({
      ...matching.sanitizeTruck(truck, true),
      paidWithCredit: !!req.listingPaidWithCredit,
    });
  } catch (err) {
    next(err);
  }
});

router.get('/mine', auth('carrier'), async (req, res, next) => {
  try {
    const trucks = await Truck.find({ company: req.user.company?._id || req.user.company }).sort({ createdAt: -1 });
    res.json(trucks.map((t) => matching.sanitizeTruck(t, true)));
  } catch (err) {
    next(err);
  }
});

router.get('/match/:loadId', auth('shipper'), async (req, res, next) => {
  try {
    const load = await Load.findById(req.params.loadId);
    if (!load) return res.status(404).json({ error: 'NOT_FOUND', message: 'Load not found.' });

    const { radiusKm, limit } = req.query;
    const trucks = await matching.findTrucksForLoad(load, {
      radiusKm: Number(radiusKm) || 150,
      limit: Math.min(Number(limit) || 50, 100),
    });

    // Active monthly plans see every contact; otherwise only paid unlocks stay visible.
    const companyId = req.user.company?._id || req.user.company;
    const unlimited = await hasUnlimitedUnlocks(companyId);
    const unlocked = companyId && !unlimited
      ? await Unlock.find({
          company: companyId,
          targetType: 'truck',
          targetId: { $in: trucks.map((t) => t._id) },
        }).select('targetId')
      : [];
    const unlockedIds = new Set(unlocked.map((u) => String(u.targetId)));

    res.json(trucks.map((t) => matching.sanitizeTruck(t, unlimited || unlockedIds.has(String(t._id)))));
  } catch (err) {
    next(err);
  }
});

router.get('/:id', auth(), findTruck, requireAccess('truck'), (req, res) => {
  res.json(matching.sanitizeTruck(req.truck, true));
});

router.patch('/:id', auth('carrier'), findTruck, ownsTruck, async (req, res, next) => {
  try {
    const fields = ['type', 'plateNumber', 'capacityTons', 'capacityVolumeM3', 'availableFrom', 'availableUntil', 'minRatePerKm', 'contactPhone', 'exactAddress', 'status', 'currency'];
    for (const field of fields) {
      if (req.body[field] !== undefined) req.truck[field] = req.body[field];
    }
    if (req.body.photo !== undefined) {
      if (!validPhoto(req.body.photo)) {
        return res.status(400).json({ error: 'BAD_PHOTO', message: 'That picture could not be saved.' });
      }
      req.truck.photos = [req.body.photo];
    }
    if (req.body.city) req.truck.currentLocation.city = req.body.city;
    if (req.body.coordinates && matching.hasCoords(req.body.coordinates.map(Number))) {
      req.truck.currentLocation.coordinates = req.body.coordinates.map(Number);
    }

    await req.truck.save();
    res.json(matching.sanitizeTruck(req.truck, true));
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', auth('carrier'), findTruck, ownsTruck, async (req, res, next) => {
  try {
    await req.truck.deleteOne();
    res.json({ deleted: true });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
