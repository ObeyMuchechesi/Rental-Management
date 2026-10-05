const mongoose = require('mongoose');

const inquirySchema = new mongoose.Schema(
  {
    reference: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true, trim: true, maxlength: 120 },
    phone: { type: String, required: true, trim: true, maxlength: 40 },
    email: { type: String, required: true, lowercase: true, trim: true, maxlength: 160 },
    destination: { type: String, trim: true, maxlength: 80, default: '' },
    service: { type: String, trim: true, maxlength: 120, default: '' },
    message: { type: String, trim: true, maxlength: 4000, default: '' },

    status: {
      type: String,
      enum: ['new', 'in_progress', 'completed'],
      default: 'new',
      index: true,
    },
    // Where the inquiry came from (which page / button)
    source: { type: String, default: 'inquiry_form', maxlength: 60 },
    // Honeypot: real visitors never fill this
    bot: { type: Boolean, default: false },

    notifications: [
      {
        channel: { type: String, enum: ['whatsapp', 'email', 'webhook'], required: true },
        to: String,
        status: { type: String, enum: ['sent', 'failed', 'skipped'], default: 'sent' },
        error: String,
        at: { type: Date, default: Date.now },
      },
    ],

    clientConfirmationSent: { type: Boolean, default: false },

    // Audit trail of status changes for the admin dashboard
    history: [
      {
        status: { type: String, enum: ['new', 'in_progress', 'completed'], required: true },
        at: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

inquirySchema.index({ createdAt: -1 });
inquirySchema.index({ status: 1, createdAt: -1 });
inquirySchema.index({ name: 'text', email: 'text', phone: 'text', service: 'text' });

inquirySchema.methods.setStatus = function (status) {
  this.status = status;
  this.history.push({ status, at: new Date() });
};

module.exports = mongoose.model('Inquiry', inquirySchema);