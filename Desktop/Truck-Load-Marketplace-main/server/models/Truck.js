const mongoose = require('mongoose');

const TRUCK_TYPES = [
  'flatbed',
  'tanker',
  'refrigerated',
  'box',
  'tipper',
  'container',
  'lowbed',
];

// GeoJSON point used for radius matching. Kept in sync with
// currentLocation.coordinates by the pre-save hook below.
const geoPointSchema = new mongoose.Schema(
  {
    type: { type: String, enum: ['Point'], required: true },
    coordinates: { type: [Number], required: true },
  },
  { _id: false }
);

const truckSchema = new mongoose.Schema(
  {
    company: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
    type: { type: String, enum: TRUCK_TYPES, required: true },
    plateNumber: { type: String, required: true, trim: true },
    capacityTons: { type: Number, required: true },
    capacityVolumeM3: Number,
    currentLocation: {
      city: { type: String, required: true, trim: true },
      // [longitude, latitude]. Optional: a truck can be listed with just a city.
      coordinates: { type: [Number], default: undefined },
    },
    geo: { type: geoPointSchema, default: undefined },
    availableFrom: Date,
    availableUntil: { type: Date, required: true },
    minRatePerKm: { type: Number, required: true },
    currency: { type: String, default: 'USD' },
    status: { type: String, enum: ['available', 'on_trip', 'inactive'], default: 'available' },
    contactPhone: { type: String, required: true },
    exactAddress: String,
    photos: [String],
  },
  { timestamps: true }
);

truckSchema.index({ geo: '2dsphere' });
truckSchema.index({ type: 1, status: 1, availableUntil: 1 });
truckSchema.index({ company: 1, plateNumber: 1 }, { unique: true });

truckSchema.pre('save', function syncGeo(next) {
  const coords = this.currentLocation?.coordinates;
  this.geo = Array.isArray(coords) && coords.length === 2 ? { type: 'Point', coordinates: coords } : undefined;
  next();
});

module.exports = mongoose.model('Truck', truckSchema);
module.exports.TRUCK_TYPES = TRUCK_TYPES;
