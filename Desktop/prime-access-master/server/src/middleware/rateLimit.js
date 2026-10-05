const rateLimit = require('express-rate-limit');

// Public inquiry endpoint - limits submissions per IP per window
const inquiryLimiter = rateLimit({
  windowMs: (parseInt(process.env.RATE_WINDOW_MINUTES, 10) || 15) * 60 * 1000,
  max: parseInt(process.env.MAX_INQUIRIES_PER_IP_PER_WINDOW, 10) || 5,
  message: {
    error:
      'Too many inquiries from this device. Please wait a few minutes or contact us directly on WhatsApp.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Login endpoint - slow down brute force attempts
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: 'Too many login attempts. Please try again in 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = { inquiryLimiter, loginLimiter };