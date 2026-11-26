const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ['carrier', 'shipper', 'admin'], required: true },
    company: { type: mongoose.Schema.Types.ObjectId, ref: 'Company' },
  },
  { timestamps: true }
);

userSchema.methods.toPublic = function toPublic() {
  const company = this.company && this.company.toObject ? this.company.toObject() : this.company;
  return {
    _id: this._id,
    name: this.name,
    email: this.email,
    role: this.role,
    company,
    createdAt: this.createdAt,
  };
};

module.exports = mongoose.model('User', userSchema);
