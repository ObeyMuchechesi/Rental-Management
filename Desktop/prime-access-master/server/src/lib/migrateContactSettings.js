const Setting = require('../models/Setting');

let migratePromise = null;

/**
 * Legacy contact details that shipped with earlier builds of the site
 * (old placeholder phone/WhatsApp numbers and the previous street address).
 * Only values that match these exactly are rewritten, so anything the
 * business has set deliberately in Admin > Settings is left untouched.
 * Safe to call on every boot - the second run finds nothing to change.
 */
const LEGACY_PHONE_DIGITS = ['263771234567'];
const LEGACY_WHATSAPP_DIGITS = ['263771234567'];

const PHONE = '+263772401643';
const WHATSAPP = '447829841469';
const ADDRESS = 'Harare, Zimbabwe';

function digits(value) {
  return String(value || '').replace(/[^0-9]/g, '');
}

function migrateContactSettings() {
  if (migratePromise) return migratePromise;

  migratePromise = (async () => {
    const s = await Setting.getSingleton();
    const changes = {};

    if (/sam nujoma/i.test(s.address || '')) changes.address = ADDRESS;
    if (LEGACY_PHONE_DIGITS.includes(digits(s.phone))) changes.phone = PHONE;
    if (LEGACY_PHONE_DIGITS.includes(digits(s.phoneDisplay))) changes.phoneDisplay = PHONE;
    if (LEGACY_WHATSAPP_DIGITS.includes(digits(s.whatsappNumber))) changes.whatsappNumber = WHATSAPP;

    if (Object.keys(changes).length === 0) return null;

    Object.assign(s, changes);
    s.updatedBy = 'contact-migration';
    await s.save();
    console.log(`[migrate] updated contact settings: ${Object.keys(changes).join(', ')}`);
    return changes;
  })().catch((err) => {
    console.error('[migrate] contact settings update failed:', err.message);
    return null;
  });

  return migratePromise;
}

module.exports = { migrateContactSettings, digits };
