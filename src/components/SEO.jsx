// src/components/SEO.jsx
import { useEffect } from 'react';

const SITE = 'https://www.breadcalculator.online';
const DEFAULT_TITLE = 'Taikinalaskin • Bread & Pizza Dough Calculator';
const DEFAULT_DESC =
  'Calculate perfect bread and pizza dough: hydration, salt, starter, rye, seeds, cold fermentation. Save favorites and browse recipes.';
const DEFAULT_IMAGE = `${SITE}/og-default.jpg`;

function upsertMeta(attr, key, value) {
  if (!value) return;
  let el = document.head.querySelector(`${attr}[${key}="${attr === 'meta' ? '' : ''}"]${key ? '' : ''}`);
  if (attr === 'meta') {
    el = document.head.querySelector(`meta[${key}]${key ? '' : ''}[${key}="${attr}"]`);
  }
}

function setMetaByName(name, content) {
  if (!content) return;
  let el = document.head.querySelector(`meta[name="${name}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute('name', name);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function setMetaByProp(prop, content) {
  if (!content) return;
  let el = document.head.querySelector(`meta[property="${prop}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute('property', prop);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function setLinkRel(rel, href, extra = {}) {
  if (!href) return;
  let el = document.head.querySelector(`link[rel="${rel}"]${extra.hrefLang ? `[hreflang="${extra.hrefLang}"]` : ''}`);
  if (!el) {
    el = document.createElement('link');
    el.setAttribute('rel', rel);
    if (extra.hrefLang) el.setAttribute('hreflang', extra.hrefLang);
    document.head.appendChild(el);
  }
  el.setAttribute('href', href);
}

function setHtmlLang(lang) {
  if (!lang) return;
  document.documentElement.setAttribute('lang', lang);
}

function setRobots(noindex) {
  const val = noindex ? 'noindex,nofollow' : 'index,follow';
  setMetaByName('robots', val);
}

function setJsonLd(id, json) {
  // id is a stable identifier for replacing the same script
  const tagId = `jsonld-${id}`;
  let el = document.head.querySelector(`script#${tagId}`);
  if (!el) {
    el = document.createElement('script');
    el.type = 'application/ld+json';
    el.id = tagId;
    document.head.appendChild(el);
  }
  el.textContent = JSON.stringify(json);
}

export default function SEO({
  title = DEFAULT_TITLE,
  description = DEFAULT_DESC,
  canonical,
  ogImage = DEFAULT_IMAGE,
  lang = 'fi',
  alternates = [
    { hrefLang: 'fi', href: SITE },
    { hrefLang: 'en', href: `${SITE}/?lang=en` },
    { hrefLang: 'sv', href: `${SITE}/?lang=sv` },
    { hrefLang: 'x-default', href: SITE },
  ],
  noindex = false,
  jsonLd,           // optional object to inject
  jsonLdId = 'page' // stable id to update/replace same script
}) {
  useEffect(() => {
    // Title
    if (title) document.title = title;

    // Basic
    setMetaByName('description', description);
    setHtmlLang(lang);
    setRobots(noindex);

    // Canonical
    const url = canonical || window.location.href;
    setLinkRel('canonical', url);

    // Alternates
    if (Array.isArray(alternates)) {
      alternates.forEach(a => {
        if (a?.href && a?.hrefLang) setLinkRel('alternate', a.href, { hrefLang: a.hrefLang });
      });
    }

    // Open Graph / Twitter
    setMetaByProp('og:type', 'website');
    setMetaByProp('og:title', title);
    setMetaByProp('og:description', description);
    setMetaByProp('og:url', url);
    setMetaByProp('og:image', ogImage);

    setMetaByName('twitter:card', 'summary_large_image');
    setMetaByName('twitter:title', title);
    setMetaByName('twitter:description', description);
    setMetaByName('twitter:image', ogImage);

    // JSON-LD (if provided)
    if (jsonLd) setJsonLd(jsonLdId, jsonLd);
  }, [title, description, canonical, ogImage, lang, noindex, JSON.stringify(alternates), JSON.stringify(jsonLd)]);

  return null; // purely head-management
}
