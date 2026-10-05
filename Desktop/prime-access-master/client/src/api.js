const TOKEN_KEY = 'pa_admin_token';

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}
export function setToken(token) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

export async function api(path, { method = 'GET', body, auth = true, headers = {} } = {}) {
  const opts = { method, headers: { 'Content-Type': 'application/json', ...headers } };
  if (body !== undefined) opts.body = JSON.stringify(body);
  if (auth) {
    const token = getToken();
    if (token) opts.headers.Authorization = `Bearer ${token}`;
  }
  const res = await fetch(`/api${path}`, opts);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
  return data;
}

// Fire-and-forget analytics (page views, WhatsApp/call clicks...)
let sessionId = localStorage.getItem('pa_session') || Math.random().toString(36).slice(2, 10);
localStorage.setItem('pa_session', sessionId);

export function track(event, extra = {}) {
  try {
    fetch('/api/analytics/event', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event,
        page: window.location.pathname,
        session: sessionId,
        ...extra,
      }),
    }).catch(() => {});
  } catch {
    /* never block UI on analytics */
  }
}

export function trackPageView() {
  track('pageview');
}

export function waLink(phone, message) {
  const p = String(phone || '').replace(/[^0-9]/g, '');
  return `https://wa.me/${p}?text=${encodeURIComponent(message || '')}`;
}

// Standard enquiry message used by every WhatsApp button on the site
export const WHATSAPP_MESSAGE =
  'Hi Prime Access Immigration Consultant, I would like to enquire about your immigration services';