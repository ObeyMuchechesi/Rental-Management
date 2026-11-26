const CURRENCY = process.env.PAYNOW_CURRENCY || 'USD';
const CREDITS_PER_PACK = Number(process.env.CREDITS_PER_PACK) || 20;

const PLANS = {
  monthly: {
    id: 'monthly',
    name: 'Monthly',
    price: 29,
    currency: CURRENCY,
    days: 30,
    credits: 0,
    description: 'Unlimited contact unlocks and unlimited truck listings for 30 days.',
  },
  credits: {
    id: 'credits',
    name: 'Pay as you go',
    price: 10,
    currency: CURRENCY,
    credits: CREDITS_PER_PACK,
    description: `${CREDITS_PER_PACK} credits. One credit unlocks one contact or lists one truck.`,
  },
};

const planById = (id) => PLANS[id] || null;

module.exports = { PLANS, CURRENCY, CREDITS_PER_PACK, planById };
