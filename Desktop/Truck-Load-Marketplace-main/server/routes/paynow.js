const express = require('express');
const billing = require('../services/billing');

const router = express.Router();

// Mounted before express.json(): PayNow posts form-encoded results and we must
// hash the raw field order exactly as received.
router.post('/result', express.text({ type: () => true, limit: '256kb' }), async (req, res) => {
  try {
    const result = await billing.handlePaynowResult(req.body || '');
    if (!result.ok) {
      console.warn(`PayNow result rejected: ${result.reason}`);
      return res.status(400).type('text/plain').send(result.reason);
    }
    return res.type('text/plain').send('OK');
  } catch (err) {
    console.error('PayNow result failed:', err);
    return res.status(500).type('text/plain').send('ERROR');
  }
});

router.get('/result', (req, res) => {
  res.type('text/plain').send('PayNow result endpoint');
});

module.exports = router;
