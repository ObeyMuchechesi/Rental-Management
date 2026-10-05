const bcrypt = require('bcryptjs');
const Admin = require('../models/Admin');

let ensurePromise = null;

/**
 * Creates the initial admin account if none exists. Runs once per process
 * and is guarded so a race on serverless cold starts can never crash a
 * request (a duplicate unique-key error is swallowed).
 */
function ensureAdmin() {
  if (ensurePromise) return ensurePromise;

  ensurePromise = (async () => {
    const count = await Admin.countDocuments();
    if (count > 0) return null;

    const email = (process.env.ADMIN_EMAIL || 'admin@primeaccess.co.zw').toLowerCase();
    const password = process.env.ADMIN_PASSWORD || 'ChangeMe123!';
    try {
      await Admin.create({
        name: 'Prime Access Admin',
        email,
        passwordHash: await bcrypt.hash(password, 10),
      });
      console.log(`[seed] admin account created: ${email}`);
      return email;
    } catch (err) {
      // Another instance may have created it already
      if (err && err.code === 11000) return email;
      throw err;
    }
  })();

  return ensurePromise;
}

module.exports = { ensureAdmin };