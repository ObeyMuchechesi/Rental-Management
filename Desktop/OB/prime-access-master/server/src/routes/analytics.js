const express = require('express');
const AnalyticsEvent = require('../models/AnalyticsEvent');
const Inquiry = require('../models/Inquiry');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

const ALLOWED_EVENTS = ['pageview', 'service_view', 'whatsapp_click', 'call_click', 'inquiry_submitted'];

// ---- Public: fire-and-forget event tracking ----
router.post('/analytics/event', async (req, res) => {
  const { event, page, service, source, session } = req.body || {};
  if (!ALLOWED_EVENTS.includes(event)) return res.status(400).json({ error: 'Unknown event.' });

  const doc = {
    event,
    page: String(page || '').slice(0, 200),
    service: String(service || '').slice(0, 120),
    source: String(source || '').slice(0, 120),
    session: String(session || '').slice(0, 64),
    ip: (req.headers['x-forwarded-for'] || '').split(',')[0].trim() || req.socket.remoteAddress || '',
    ua: String(req.headers['user-agent'] || '').slice(0, 300),
  };

  // Fire and forget - do not await so the client is never blocked
  AnalyticsEvent.create(doc).catch((e) => console.error('[analytics] save failed', e.message));
  res.status(202).json({ ok: true });
});

// ---- Admin: aggregated report ----
router.get('/admin/analytics', requireAuth, async (req, res) => {
  const days = Math.min(parseInt(req.query.days, 10) || 30, 365);
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const [total, byEvent, byDayEvent, topPages, topServices, inquiriesTotal, inquiriesByDay] = await Promise.all([
    AnalyticsEvent.countDocuments({ createdAt: { $gte: since } }),
    AnalyticsEvent.aggregate([{ $match: { createdAt: { $gte: since } } }, { $group: { _id: '$event', count: { $sum: 1 } } }]),
    AnalyticsEvent.aggregate([
      { $match: { createdAt: { $gte: since } } },
      { $group: { _id: { date: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, event: '$event' }, count: { $sum: 1 } } },
    ]),
    AnalyticsEvent.aggregate([
      { $match: { createdAt: { $gte: since }, page: { $ne: '' } } },
      { $group: { _id: '$page', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]),
    AnalyticsEvent.aggregate([
      { $match: { createdAt: { $gte: since }, service: { $ne: '' } } },
      { $group: { _id: '$service', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]),
    Inquiry.countDocuments({ createdAt: { $gte: since } }),
    Inquiry.aggregate([
      { $match: { createdAt: { $gte: since } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]),
  ]);

  const eventMap = Object.fromEntries(byEvent.map((e) => [e._id, e.count]));
  const dayTypeMap = {};
  for (const row of byDayEvent) {
    const key = row._id.date;
    if (!dayTypeMap[key]) dayTypeMap[key] = {};
    dayTypeMap[key][row._id.event] = row.count;
  }
  const inquiryDayMap = Object.fromEntries(inquiriesByDay.map((d) => [d._id, d.count]));

  const timeline = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(since.getTime() + i * 24 * 60 * 60 * 1000);
    const key = d.toISOString().slice(0, 10);
    const agg = dayTypeMap[key] || {};
    timeline.push({
      date: key,
      events: Object.values(agg).reduce((a, b) => a + b, 0),
      inquiries: inquiryDayMap[key] || 0,
      pageviews: agg.pageview || 0,
      serviceViews: agg.service_view || 0,
      whatsappClicks: agg.whatsapp_click || 0,
      callClicks: agg.call_click || 0,
    });
  }

  res.json({
    days,
    totals: {
      events: total,
      pageviews: eventMap.pageview || 0,
      serviceViews: eventMap.service_view || 0,
      whatsappClicks: eventMap.whatsapp_click || 0,
      callClicks: eventMap.call_click || 0,
      inquiries: inquiriesTotal,
    },
    byEvent: eventMap,
    timeline,
    topPages,
    topServices,
  });
});

module.exports = router;