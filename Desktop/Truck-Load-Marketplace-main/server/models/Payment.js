const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema(
  {
    reference: { type: String, required: true, unique: true, trim: true },
    company: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
    initiatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    plan: { type: String, enum: ['monthly', 'credits'], required: true },
    status: { type: String, enum: ['pending', 'paid', 'failed', 'cancelled'], default: 'pending' },
    amount: { type: Number, required: true },
    currency: { type: String, default: 'USD' },
    credits: { type: Number, default: 0 },
    provider: { type: String, enum: ['paynow', 'manual'], default: 'paynow' },
    method: { type: String, enum: ['ecocash', 'onemoney', 'card', 'hosted', 'manual'], default: 'hosted' },
    phone: String,
    instructions: String,
    pollUrl: String,
    browserUrl: String,
    paynowReference: String,
    paidAt: Date,
    notes: String,
  },
  { timestamps: true }
);

paymentSchema.index({ company: 1, createdAt: -1 });
paymentSchema.index({ status: 1, paidAt: -1 });

module.exports = mongoose.model('Payment', paymentSchema);
