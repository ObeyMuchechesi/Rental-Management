const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const app = require('./app');
const { connectDB } = require('./db');
const { ensureAdmin } = require('./lib/ensureAdmin');
const { migrateContactSettings } = require('./lib/migrateContactSettings');

const PORT = parseInt(process.env.PORT, 10) || 5000;

async function main() {
  await connectDB();
  await migrateContactSettings();
  const email = await ensureAdmin();
  if (email) {
    console.log(`[seed] initial admin: ${email} (change the password after first login)`);
  }
  app.listen(PORT, () => {
    console.log(`Prime Access API listening on http://localhost:${PORT}`);
  });
}

main().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});