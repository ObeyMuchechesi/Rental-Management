const mongoose = require('mongoose');

const unlockSchema = new mongoose.Schema(
  {
    company: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
    targetType: { type: String, enum: ['truck', 'load'], required: true },
    targetId: { type: mongoose.Schema.Types.ObjectId, required: true },
    method: { type: String, enum: ['subscription', 'credit'], required: true },
    amount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

unlockSchema.index({ company: 1, targetType: 1, targetId: 1 }, { unique: true });
unlockSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Unlock', unlockSchema);
