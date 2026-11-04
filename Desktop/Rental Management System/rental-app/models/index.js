import mongoose from "mongoose";
const { Schema, model, models } = mongoose;

const UserSchema = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  passwordHash: { type: String, required: true },
  role: { type: String, enum: ["landlord", "tenant"], required: true },
  tenant: { type: Schema.Types.ObjectId, ref: "Tenant", default: null },
}, { timestamps: true });

const PropertySchema = new Schema({
  owner: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
  name: { type: String, required: true },
  address: { type: String, required: true },
  type: { type: String, enum: ["apartment", "house", "commercial"], default: "apartment" },
}, { timestamps: true });

const UnitSchema = new Schema({
  property: { type: Schema.Types.ObjectId, ref: "Property", required: true },
  label: { type: String, required: true },
  bedrooms: Number,
  bathrooms: Number,
  rentAmount: { type: Number, required: true },
  status: { type: String, enum: ["vacant", "occupied", "maintenance"], default: "vacant" },
}, { timestamps: true });

const TenantSchema = new Schema({
  owner: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
  name: { type: String, required: true },
  email: { type: String, required: true, lowercase: true },
  phone: String,
  emergencyContact: String,
}, { timestamps: true });
TenantSchema.index({ owner: 1, email: 1 }, { unique: true });

const LeaseSchema = new Schema({
  unit: { type: Schema.Types.ObjectId, ref: "Unit", required: true },
  tenant: { type: Schema.Types.ObjectId, ref: "Tenant", required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  monthlyRent: { type: Number, required: true },
  deposit: Number,
  status: { type: String, enum: ["active", "ended", "upcoming"], default: "active" },
}, { timestamps: true });

const PaymentSchema = new Schema({
  lease: { type: Schema.Types.ObjectId, ref: "Lease", required: true },
  amount: { type: Number, required: true },
  dueDate: { type: Date, required: true },
  paidDate: Date,
  method: { type: String, enum: ["cash", "bank", "card", "other"] },
  status: { type: String, enum: ["pending", "paid", "late"], default: "pending" },
}, { timestamps: true });

const MaintenanceSchema = new Schema({
  unit: { type: Schema.Types.ObjectId, ref: "Unit", required: true },
  tenant: { type: Schema.Types.ObjectId, ref: "Tenant" },
  title: { type: String, required: true },
  description: String,
  priority: { type: String, enum: ["low", "medium", "high"], default: "medium" },
  status: { type: String, enum: ["open", "in_progress", "resolved"], default: "open" },
}, { timestamps: true });

export const User = models.User || model("User", UserSchema);
export const Property = models.Property || model("Property", PropertySchema);
export const Unit = models.Unit || model("Unit", UnitSchema);
export const Tenant = models.Tenant || model("Tenant", TenantSchema);
export const Lease = models.Lease || model("Lease", LeaseSchema);
export const Payment = models.Payment || model("Payment", PaymentSchema);
export const Maintenance = models.Maintenance || model("Maintenance", MaintenanceSchema);