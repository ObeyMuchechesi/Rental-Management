const mongoose = require('mongoose');

const mediaSchema = new mongoose.Schema(
  {
    title: { type: String, trim: true, maxlength: 160, default: '' },
    caption: { type: String, trim: true, maxlength: 300, default: '' },
    type: { type: String, enum: ['image', 'video'], required: true },
    // Path on disk relative to server/uploads, or external URL
    url: { type: String, required: true },
    mimeType: String,
    size: Number,
    category: { type: String, enum: ['gallery', 'video', 'hero'], default: 'gallery' },
    published: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Media', mediaSchema);