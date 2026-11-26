const mongoose = require('mongoose');

const subscriptionSchema = new mongoose.Schema(
  {
    company: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', unique: true },
    plan: { type: String, enum: ['free', 'monthly', 'per_use'], default: 'free' },
    status: { type: String, enum: ['active', 'past_due', 'canceled', 'expired', 'none'], default: 'none' },
    currentPeriodEnd: Date,
    credits: { type: Number, default: 0 },
  },
  { timestamps: true }
);

subscriptionSchema.methods.isActive = function isActive() {
  return (
    this.plan === 'monthly' &&
    this.status === 'active' &&
    !!this.currentPeriodEnd &&
    this.currentPeriodEnd > new Date()
  );
};

module.exports = mongoose.model('Subscription', subscriptionSchema);
