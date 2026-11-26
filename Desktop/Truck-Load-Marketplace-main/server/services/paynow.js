const crypto = require('crypto');

const TIMEOUT_MS = 15000;

const baseUrl = () =>
  (process.env.PAYNOW_BASE_URL || 'https://www.paynow.co.zw').replace(/\/+$/, '');
const integrationId = () => process.env.PAYNOW_INTEGRATION_ID || '';
const integrationKey = () => process.env.PAYNOW_INTEGRATION_KEY || '';

const isConfigured = () => Boolean(integrationId() && integrationKey());

const sha512 = (value) => crypto.createHash('sha512').update(value).digest('hex').toUpperCase();

// PayNow hashes the plain (decoded) field values in the order they appear,
// with the integration key appended, then SHA-512 and upper-cases the digest.
const hashValues = (values) => sha512([...values, integrationKey()].join(''));

const safeDecode = (value) => {
  try {
    return decodeURIComponent(String(value).replace(/\+/g, ' '));
  } catch {
    return String(value);
  }
};

const parseRaw = (raw = '') => {
  const entries = String(raw)
    .trim()
    .split('&')
    .filter(Boolean)
    .map((pair) => {
      const index = pair.indexOf('=');
      if (index === -1) return [safeDecode(pair), ''];
      return [safeDecode(pair.slice(0, index)), safeDecode(pair.slice(index + 1))];
    });
  return { entries, map: Object.fromEntries(entries) };
};

const verifyEntries = (entries) => {
  if (!integrationKey() || !entries.length) return false;
  const hashIndex = entries.findIndex(([key]) => key.toLowerCase() === 'hash');
  if (hashIndex === -1) return false;
  const provided = entries[hashIndex][1].toUpperCase();
  if (!provided) return false;
  const values = entries.filter(([,], index) => index !== hashIndex).map(([, value]) => value);
  return provided === hashValues(values);
};

const verifyRaw = (raw) => {
  const { entries, map } = parseRaw(raw);
  if (!verifyEntries(entries)) return { ok: false, error: 'BAD_SIGNATURE', map };
  return { ok: true, entries, map };
};

const request = async (url, options) => {
  const response = await fetch(url, { ...options, signal: AbortSignal.timeout(TIMEOUT_MS) });
  const raw = await response.text();
  return { response, raw };
};

const initiateTransaction = async ({ reference, amount, info, returnUrl, resultUrl }) => {
  if (!isConfigured()) {
    return { ok: false, error: 'PayNow is not configured on this server.' };
  }

  const fields = [
    ['id', integrationId()],
    ['reference', reference],
    ['amount', Number(amount).toFixed(2)],
    ['additionalinfo', info],
    ['returnurl', returnUrl],
    ['resulturl', resultUrl],
  ];

  // PayNow's test integrations reject any authemail that is not the merchant's
  // own registered address, so only send one when explicitly configured.
  if (process.env.PAYNOW_AUTHEMAIL) {
    fields.push(['authemail', process.env.PAYNOW_AUTHEMAIL]);
  }

  fields.push(['status', 'Message']);

  const body = new URLSearchParams();
  for (const [key, value] of fields) body.append(key, value);
  body.append('hash', hashValues(fields.map(([, value]) => value)));

  try {
    const { response, raw } = await request(`${baseUrl()}/interface/initiatetransaction`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
    });
    const { entries, map } = parseRaw(raw);

    if (!response.ok) {
      return { ok: false, error: `PayNow returned HTTP ${response.status}.`, raw, map };
    }
    if (String(map.status || '').toLowerCase() !== 'ok') {
      return { ok: false, error: map.error || 'PayNow rejected the transaction.', raw, map };
    }
    if (!verifyEntries(entries)) {
      return { ok: false, error: 'PayNow response signature did not match.', raw, map };
    }

    return {
      ok: true,
      browserUrl: map.browserurl || map.browserUrl,
      pollUrl: map.pollurl || map.pollUrl,
      map,
    };
  } catch (err) {
    return { ok: false, error: `Could not reach PayNow: ${err.message}` };
  }
};

const checkStatus = async (pollUrl) => {
  if (!pollUrl) return { ok: false, status: 'Unknown', error: 'Missing poll URL.' };
  try {
    const { response, raw } = await request(pollUrl, { method: 'GET' });
    const { entries, map } = parseRaw(raw);
    if (!response.ok) {
      return { ok: false, status: 'Unknown', error: `PayNow returned HTTP ${response.status}.` };
    }
    if (!verifyEntries(entries)) {
      return { ok: false, status: 'Unknown', error: 'PayNow poll signature did not match.' };
    }
    return {
      ok: true,
      status: map.status || 'Unknown',
      paynowReference: map.paynowreference,
      amount: map.amount,
      map,
    };
  } catch (err) {
    return { ok: false, status: 'Unknown', error: err.message };
  }
};

module.exports = {
  isConfigured,
  initiateTransaction,
  checkStatus,
  verifyRaw,
  parseRaw,
  hashValues,
  safeDecode,
};
