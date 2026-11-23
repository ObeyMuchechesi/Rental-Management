const mongoose = require('mongoose');

let connectPromise = null;

/**
 * Connects to MongoDB and caches the connection promise so serverless
 * cold starts reuse the same connection instead of reconnecting.
 * - MONGO_URI (Atlas or local) is used when set.
 * - Otherwise, in development only, an in-memory MongoDB is started.
 */
async function connectDB() {
  if (connectPromise) return connectPromise;

  connectPromise = (async () => {
    const uri = process.env.MONGO_URI;

    if (uri) {
      await mongoose.connect(uri, { serverSelectionTimeoutMS: 8000 });
      console.log(`[db] connected to MongoDB at ${maskUri(uri)}`);
      return;
    }

    if (process.env.NODE_ENV === 'production') {
      throw new Error('MONGO_URI is required in production.');
    }

    console.log('[db] MONGO_URI not set - starting in-memory MongoDB (dev only)...');
    const { MongoMemoryServer } = require('mongodb-memory-server');
    const mongod = await MongoMemoryServer.create();
    await mongoose.connect(mongod.getUri('primeaccess'), { serverSelectionTimeoutMS: 15000 });
    console.log('[db] connected to in-memory MongoDB (data resets on restart)');
  })();

  return connectPromise;
}

function maskUri(uri) {
  try {
    const u = new URL(uri);
    if (u.password) u.password = '***';
    return u.toString();
  } catch {
    return uri;
  }
}

module.exports = { connectDB };