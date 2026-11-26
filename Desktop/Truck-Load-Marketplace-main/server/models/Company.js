const mongoose = require('mongoose');

const companySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    type: { type: String, enum: ['carrier', 'shipper', 'both'], default: 'carrier' },
    phone: String,
    address: String,
    taxId: String,
    verified: { type: Boolean, default: false },
    rating: { type: Number, default: 0, min: 0, max: 5 },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Company', companySchema);
