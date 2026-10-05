// Vercel function entry - the Express app handles every request class:
// /api/* API routes, static assets and SPA routes (see vercel.json rewrite).
require('dotenv').config();
module.exports = require('../server/src/app');