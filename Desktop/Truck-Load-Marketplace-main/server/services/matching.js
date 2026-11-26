const Truck = require('../models/Truck');

const escapeRegex = (value = '') => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const maskPlate = (plate = '') => {
  const clean = String(plate).replace(/\s+/g, '');
  return clean.length > 4 ? `•••${clean.slice(-4)}` : '••••';
};

const hasCoords = (coordinates) =>
  Array.isArray(coordinates) &&
  coordinates.length === 2 &&
  coordinates.every((n) => typeof n === 'number' && Number.isFinite(n));

/** Trucks are returned in list payloads with contact data stripped. */
const sanitizeTruck = (truck, unlocked = false) => {
  const t = truck.toObject ? truck.toObject() : { ...truck };

  t.distanceKm =
    typeof t.distanceMeters === 'number' ? +(t.distanceMeters / 1000).toFixed(1) : undefined;
  delete t.distanceMeters;
  delete t.geo;

  const city = t.currentLocation?.city || null;

  if (!unlocked) {
    t.contactPhone = '••••••••';
    t.exactAddress = null;
    t.plateNumber = maskPlate(t.plateNumber);
    t.currentLocation = { city };
  } else {
    t.currentLocation = hasCoords(t.currentLocation?.coordinates)
      ? { city, coordinates: t.currentLocation.coordinates }
      : { city };
  }

  return t;
};

const sanitizeLoad = (load, unlocked = false) => {
  const l = load.toObject ? load.toObject() : { ...load };

  l.distanceKm =
    typeof l.distanceMeters === 'number' ? +(l.distanceMeters / 1000).toFixed(1) : undefined;
  delete l.distanceMeters;

  const stop = (s) =>
    unlocked && hasCoords(s?.coordinates)
      ? { city: s.city, date: s.date, coordinates: s.coordinates }
      : { city: s?.city || null, date: s?.date };

  l.pickup = stop(l.pickup);
  l.dropoff = stop(l.dropoff);

  if (!unlocked) l.contactPhone = '••••••••';

  return l;
};

/**
 * A truck matches when it is available, fits the required body type and
 * capacity, is free on the pickup date, is inside the radius, and accepts the
 * offered rate: minRatePerKm <= offeredRatePerKm.
 */
const findTrucksForLoad = async (load, { radiusKm = 150, limit = 50 } = {}) => {
  const query = {
    status: 'available',
    capacityTons: { $gte: load.weightTons },
    availableUntil: { $gte: load.pickup?.date || new Date() },
    minRatePerKm: { $lte: load.offeredRatePerKm },
  };

  if (load.truckTypesRequired?.length) {
    query.type = { $in: load.truckTypesRequired };
  }

  const lookup = [
    { $lookup: { from: 'companies', localField: 'company', foreignField: '_id', as: 'company' } },
    { $unwind: '$company' },
  ];

  if (hasCoords(load.pickup?.coordinates)) {
    return Truck.aggregate([
      {
        $geoNear: {
          near: { type: 'Point', coordinates: load.pickup.coordinates },
          distanceField: 'distanceMeters',
          maxDistance: radiusKm * 1000,
          spherical: true,
          query,
        },
      },
      { $sort: { distanceMeters: 1 } },
      { $limit: limit },
      ...lookup,
    ]);
  }

  // No coordinates on the load: fall back to a city match instead of a radius.
  const trucks = await Truck.find({
    ...query,
    'currentLocation.city': new RegExp(escapeRegex(load.pickup?.city || ''), 'i'),
  })
    .sort({ minRatePerKm: 1 })
    .limit(limit)
    .populate('company');

  return trucks.map((t) => t.toObject());
};

module.exports = {
  sanitizeTruck,
  sanitizeLoad,
  findTrucksForLoad,
  hasCoords,
  escapeRegex,
};
