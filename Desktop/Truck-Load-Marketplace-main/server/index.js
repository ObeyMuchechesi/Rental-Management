require('dotenv').config();
const mongoose = require('mongoose');
const app = require('./app');

const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('MONGODB_URI is missing. Copy server/.env.example to server/.env and fill it in.');
  process.exit(1);
}

const start = async () => {
  try {
    await mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 15000 });
    console.log(`MongoDB connected: ${mongoose.connection.host}/${mongoose.connection.name}`);

    app.listen(PORT, '0.0.0.0', () => {
      console.log(`API listening on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('Failed to start API:', err.message);
    process.exit(1);
  }
};

start();
