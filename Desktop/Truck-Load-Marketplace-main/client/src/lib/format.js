export const TRUCK_TYPES = [
  'flatbed',
  'tanker',
  'refrigerated',
  'box',
  'tipper',
  'container',
  'lowbed',
];

export const money = (value, currency = 'USD') => {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return '—';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    maximumFractionDigits: 2,
  }).format(Number(value));
};

export const date = (value) => {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

export const initials = (name = '') =>
  name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('');

export const isLocked = (entity) => entity?.contactPhone === '••••••••';

export const planLabel = (sub) => {
  if (sub?.active) return 'Monthly plan';
  if (sub?.expired) return 'Monthly expired';
  if (sub?.plan === 'per_use') return `${sub.credits ?? 0} credits`;
  return 'Free plan';
};

export const paymentTone = (status) => {
  if (status === 'paid') return 'emerald';
  if (status === 'pending') return 'amber';
  if (status === 'failed') return 'rose';
  return 'slate';
};

