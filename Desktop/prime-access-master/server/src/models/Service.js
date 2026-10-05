const mongoose = require('mongoose');

const serviceSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 120 },
    slug: { type: String, required: true, unique: true, trim: true, lowercase: true },
    shortDescription: { type: String, required: true, trim: true, maxlength: 300 },
    description: { type: String, default: '', trim: true },
    icon: { type: String, default: 'briefcase', maxlength: 40 }, // icon key rendered client-side
    // Optional photo (URL) shown at the top of the service card / detail page
    image: { type: String, default: '', trim: true, maxlength: 1000 },
    features: [{ type: String, trim: true, maxlength: 200 }],
    // Pre-filled WhatsApp message for this service
    whatsappMessage: { type: String, default: '', maxlength: 500 },
    popular: { type: Boolean, default: false },
    published: { type: Boolean, default: true },
    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Service', serviceSchema);