const mongoose = require('mongoose');

// Lightweight, privacy-friendly event tracking.
// Events: pageview, service_view, whatsapp_click, call_click, inquiry_submitted
const analyticsEventSchema = new mongoose.Schema(
  {
    event: { type: String, required: true, index: true },
    page: { type: String, default: '', maxlength: 200 },
    service: { type: String, default: '', maxlength: 120 },
    source: { type: String, default: '', maxlength: 120 },
    session: { type: String, default: '', maxlength: 64 },
    ip: { type: String, default: '' },
    ua: { type: String, default: '', maxlength: 300 },
  },
  { timestamps: true }
);

analyticsEventSchema.index({ createdAt: 1 });
analyticsEventSchema.index({ event: 1, createdAt: -1 });

module.exports = mongoose.model('AnalyticsEvent', analyticsEventSchema);