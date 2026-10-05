// Vercel serves static assets from public/** through its CDN.
// This script copies the built React app (client/dist) into public/.
const fs = require('fs');
const path = require('path');

const src = path.join(__dirname, '..', 'client', 'dist');
const dest = path.join(__dirname, '..', 'public');

if (!fs.existsSync(src)) {
  console.error('[copy-static] client/dist not found - run the client build first (npm run build -w client).');
  process.exit(1);
}

fs.rmSync(dest, { recursive: true, force: true });
fs.cpSync(src, dest, { recursive: true });
console.log('[copy-static] client build copied to public/');