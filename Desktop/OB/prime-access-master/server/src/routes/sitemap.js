const express = require('express');
const router = express.Router();
const Service = require('../models/Service');

const DEFAULT_SERVICES = [
  'uk-visa-immigration',
  'visit-visas',
  'student-visas',
  'business-visas',
  'schengen-assistance',
  'university-placement',
  'evisa-account-creation',
  'refusal-letter-guidance',
];

router.get('/sitemap.xml', async (req, res) => {
  try {
    const host = req.headers.host || 'www.primeaccessimmigration.co.zw';
    const protocol = req.headers['x-forwarded-proto'] || 'https';
    const baseUrl = `${protocol}://${host}`;

    let services = [];
    try {
      services = await Service.find({ published: true }).select('slug updatedAt').lean();
    } catch {
      // fallback if DB query fails
    }

    const serviceSlugs = services.length > 0
      ? services.map((s) => ({ slug: s.slug, lastmod: s.updatedAt ? new Date(s.updatedAt).toISOString().split('T')[0] : '2026-11-23' }))
      : DEFAULT_SERVICES.map((slug) => ({ slug, lastmod: '2026-11-23' }));

    const today = new Date().toISOString().split('T')[0];

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
  <url>
    <loc>${baseUrl}/</loc>
    <lastmod>${today}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
    <image:image>
      <image:loc>${baseUrl}/og-image.png</image:loc>
      <image:title>Prime Access Immigration Consultancy Firm Zimbabwe</image:title>
    </image:image>
  </url>
  <url>
    <loc>${baseUrl}/services</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>${baseUrl}/flight-booking</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>${baseUrl}/about</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>${baseUrl}/contact</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>${baseUrl}/privacy</loc>
    <lastmod>${today}</lastmod>
    <changefreq>yearly</changefreq>
    <priority>0.3</priority>
  </url>
  <url>
    <loc>${baseUrl}/terms</loc>
    <lastmod>${today}</lastmod>
    <changefreq>yearly</changefreq>
    <priority>0.3</priority>
  </url>
${serviceSlugs
  .map(
    (s) => `  <url>
    <loc>${baseUrl}/services/${s.slug}</loc>
    <lastmod>${s.lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`
  )
  .join('\n')}
</urlset>`;

    res.type('application/xml').send(xml);
  } catch (err) {
    console.error('[sitemap] generation error:', err);
    res.status(500).send('Error generating sitemap');
  }
});

router.get('/robots.txt', (req, res) => {
  const host = req.headers.host || 'www.primeaccessimmigration.co.zw';
  const protocol = req.headers['x-forwarded-proto'] || 'https';
  const baseUrl = `${protocol}://${host}`;

  const robots = `# https://www.robotstxt.org/robotstxt.html
User-agent: *
Allow: /
Disallow: /admin
Disallow: /admin/
Disallow: /api/

# Host and Sitemaps
Host: ${baseUrl}
Sitemap: ${baseUrl}/sitemap.xml
`;
  res.type('text/plain').send(robots);
});

module.exports = router;
