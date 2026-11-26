/**
 * Vercel serverless entry point.
 * Every /api/* request is routed here (see vercel.json) and handed to the
 * Express app in server/app.js.
 *
 * MongoDB connections are cached across invocations: serverless instances are
 * reused, and reconnecting on every request exhausts the cluster's connection
 * limit.
 */
const path = require('path');

// Resolve the same mongoose instance the Express app uses, so models and the
// connection share one state (server/node_modules in a monorepo checkout,
// hoisted in a Vercel build).
const mongoose = require(require.resolve('mongoose', { paths: [path.join(__dirname, '..', 'server')] }));
const app = require('../server/app');

const connect = async () => {
  if (!process.env.MONGODB_URI) {
    throw new Error('MONGODB_URI is not configured for this deployment.');
  }
  if (mongoose.connection.readyState === 1) return;

  if (!global.__trucklinkDb) {
    global.__trucklinkDb = mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 10000,
      maxPoolSize: 5,
    });
  }

  await global.__trucklinkDb;
};

module.exports = async (req, res) => {
  // Vercel's rewrite may hand us the destination path; Express expects the
  // public /api prefix.
  if (req.url === '/api/index' || req.url.startsWith('/api/index?')) {
    req.url = req.url.replace('/api/index', '/api');
  }

  try {
    await connect();
  } catch (err) {
    const reason = process.env.MONGODB_URI ? 'CONNECTION_FAILED' : 'MONGODB_URI_MISSING';
    console.error(`Database unavailable (${reason}):`, err.message);
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    return res.end(
      JSON.stringify({
        error: 'DB_UNAVAILABLE',
        reason,
        message: 'The database is unreachable right now.',
      })
    );
  }

  return app(req, res);
};
