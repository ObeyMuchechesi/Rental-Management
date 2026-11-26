/* eslint-disable no-console */
require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

const run = async () => {
  if (!process.env.MONGODB_URI) {
    console.error('MONGODB_URI is missing. Set it in the environment before bootstrapping.');
    process.exit(1);
  }

  const email = (process.env.SUPERADMIN_EMAIL || 'superadmin@trucklink.test').toLowerCase();
  const password = process.env.SUPERADMIN_PASSWORD || 'Super@12345';
  const name = process.env.SUPERADMIN_NAME || 'TruckLink Super Admin';

  if (password.length < 8) {
    console.error('SUPERADMIN_PASSWORD must be at least 8 characters.');
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 20000 });
  console.log(`Connected to ${mongoose.connection.host}/${mongoose.connection.name}`);

  await User.syncIndexes();

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await User.findOneAndUpdate(
    { email },
    { $set: { name, email, passwordHash, role: 'admin', company: null } },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  console.log('\nSuper admin ready:');
  console.log(`  email    ${user.email}`);
  console.log(`  password ${password}`);
  console.log(`  user id  ${user._id}`);
  console.log('\nChange this password after the first sign-in.');

  await mongoose.disconnect();
};

run().catch(async (err) => {
  console.error('Bootstrap failed:', err);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});
