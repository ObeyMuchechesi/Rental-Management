const mongoose = require('mongoose');
const { TRUCK_TYPES } = require('./Truck');

const stopSchema = new mongoose.Schema(
  {
    coordinates: { type: [Number], default: undefined },
    city: { type: String, required: true, trim: true },
    date: Date,
  },
  { _id: false }
);

const loadSchema = new mongoose.Schema(
  {
    company: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
    cargoType: { type: String, required: true, trim: true },
    weightTons: { type: Number, required: true },
    truckTypesRequired: [{ type: String, enum: TRUCK_TYPES }],
    pickup: { type: stopSchema, required: true },
    dropoff: { type: stopSchema, required: true },
    offeredRatePerKm: { type: Number, required: true },
    totalOfferedRate: Number,
    status: { type: String, enum: ['open', 'matched', 'completed', 'closed'], default: 'open' },
    completedAt: Date,
    contactPhone: { type: String, required: true },
  },
  { timestamps: true }
);

loadSchema.index({ 'pickup.coordinates': '2dsphere' });
loadSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model('Load', loadSchema);
