import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useSettings } from '../SettingsContext';

const SITE_URL = 'https://primeaccess.co.zw';
const DEFAULT_BRAND = 'Prime Access Immigration Consultancy Firm';
const DEFAULT_IMAGE = '/og-image.png';

function setMetaTag(selector, attrName, attrValue, content) {
  if (!content) return;
  let element = document.querySelector(selector);
  if (!element) {
    element = document.createElement('meta');
    element.setAttribute(attrName, attrValue);
    document.head.appendChild(element);
  }
  element.setAttribute('content', content);
}

function setCanonical(href) {
  let link = document.querySelector('link[rel="canonical"]');
  if (!link) {
    link = document.createElement('link');
    link.setAttribute('rel', 'canonical');
    document.head.appendChild(link);
  }
  link.setAttribute('href', href);
}

function setJsonLd(id, data) {
  let script = document.getElementById(id);
  if (!data) {
    if (script) script.remove();
    return;
  }
  if (!script) {
    script = document.createElement('script');
    script.id = id;
    script.type = 'application/ld+json';
    document.head.appendChild(script);
  }
  script.textContent = JSON.stringify(data);
}

export default function SEO({
  title,
  description,
  keywords,
  canonical,
  ogType = 'website',
  ogImage,
  schema,
  breadcrumbs,
  noindex = false,
}) {
  const { settings } = useSettings();
  const location = useLocation();

  useEffect(() => {
    const brand = settings?.brandName || DEFAULT_BRAND;
    const origin = typeof window !== 'undefined' && window.location.origin
      ? window.location.origin
      : SITE_URL;

    // 1. Title formatting
    let pageTitle = '';
    if (!title) {
      pageTitle = settings?.seoTitle || `${brand} | Immigration Consultancy Firm Zimbabwe`;
    } else if (title.includes(brand)) {
      pageTitle = title;
    } else {
      pageTitle = `${title} | ${brand}`;
    }
    document.title = pageTitle;

    // 2. Meta description
    const metaDesc = description || settings?.seoDescription ||
      'Prime Access is a trusted immigration consultancy firm based in Zimbabwe. Expert guidance for UK visas, student visas, Schengen visas, business travel, and flight booking.';
    setMetaTag('meta[name="description"]', 'name', 'description', metaDesc);

    // 3. Keywords
    const metaKeywords = keywords ||
      'immigration consultancy Zimbabwe, UK visa Zimbabwe, student visa UK, Schengen visa Zimbabwe, work visa UK, Harare immigration consultant, Prime Access Zimbabwe, flight booking Harare, visa appeal guidance';
    setMetaTag('meta[name="keywords"]', 'name', 'keywords', metaKeywords);

    // 4. Canonical URL
    const canonicalPath = canonical || location.pathname;
    const fullCanonical = canonicalPath.startsWith('http')
      ? canonicalPath
      : `${origin}${canonicalPath === '/' ? '' : canonicalPath}`;
    setCanonical(fullCanonical);

    // 5. Robots
    setMetaTag(
      'meta[name="robots"]',
      'name',
      'robots',
      noindex ? 'noindex, nofollow' : 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1'
    );

    // 6. Open Graph
    const resolvedImage = ogImage
      ? (ogImage.startsWith('http') ? ogImage : `${origin}${ogImage}`)
      : `${origin}${DEFAULT_IMAGE}`;

    setMetaTag('meta[property="og:title"]', 'property', 'og:title', pageTitle);
    setMetaTag('meta[property="og:description"]', 'property', 'og:description', metaDesc);
    setMetaTag('meta[property="og:url"]', 'property', 'og:url', fullCanonical);
    setMetaTag('meta[property="og:type"]', 'property', 'og:type', ogType);
    setMetaTag('meta[property="og:site_name"]', 'property', 'og:site_name', brand);
    setMetaTag('meta[property="og:image"]', 'property', 'og:image', resolvedImage);
    setMetaTag('meta[property="og:locale"]', 'property', 'og:locale', 'en_GB');

    // 7. Twitter
    setMetaTag('meta[name="twitter:card"]', 'name', 'twitter:card', 'summary_large_image');
    setMetaTag('meta[name="twitter:title"]', 'name', 'twitter:title', pageTitle);
    setMetaTag('meta[name="twitter:description"]', 'name', 'twitter:description', metaDesc);
    setMetaTag('meta[name="twitter:image"]', 'name', 'twitter:image', resolvedImage);

    // 8. Structured Data JSON-LD
    const schemasToInject = [];

    // Optional breadcrumb list
    if (breadcrumbs && breadcrumbs.length > 0) {
      schemasToInject.push({
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: breadcrumbs.map((crumb, idx) => ({
          '@type': 'ListItem',
          position: idx + 1,
          name: crumb.name,
          item: crumb.url.startsWith('http') ? crumb.url : `${origin}${crumb.url}`,
        })),
      });
    }

    // Page-specific schema
    if (schema) {
      if (Array.isArray(schema)) {
        schemasToInject.push(...schema);
      } else {
        schemasToInject.push(schema);
      }
    }

    if (schemasToInject.length === 1) {
      setJsonLd('schema-page-seo', schemasToInject[0]);
    } else if (schemasToInject.length > 1) {
      setJsonLd('schema-page-seo', {
        '@context': 'https://schema.org',
        '@graph': schemasToInject,
      });
    } else {
      setJsonLd('schema-page-seo', null);
    }

    return () => {
      // Cleanup dynamic page schema when unmounting
      setJsonLd('schema-page-seo', null);
    };
  }, [
    title,
    description,
    keywords,
    canonical,
    ogType,
    ogImage,
    schema,
    breadcrumbs,
    noindex,
    settings,
    location.pathname,
  ]);

  return null;
}
