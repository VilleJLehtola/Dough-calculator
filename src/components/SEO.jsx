// src/components/SEO.jsx
import React from 'react';
import { Helmet } from 'react-helmet-async';

const SITE = 'https://www.breadcalculator.online';
const DEFAULT_TITLE = 'Taikinalaskin • Bread & Pizza Dough Calculator';
const DEFAULT_DESC =
  'Calculate perfect bread and pizza dough: hydration, salt, starter, rye, seeds, cold fermentation. Save favorites and browse recipes.';
const DEFAULT_IMAGE = `${SITE}/og-default.jpg`; // Put a 1200x630 image in /public

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
  children,
}) {
  const url = canonical || (typeof window !== 'undefined' ? window.location.href : SITE);

  return (
    <Helmet
      // ✅ Use the supported API instead of <html lang="..."/>
      htmlAttributes={{ lang }}
    >
      <title>{title}</title>
      <meta name="description" content={description} />
      {url && <link rel="canonical" href={url} />}

      {Array.isArray(alternates) &&
        alternates.map((a) =>
          a?.href && a?.hrefLang ? (
            <link key={a.hrefLang} rel="alternate" hrefLang={a.hrefLang} href={a.href} />
          ) : null
        )}

      {/* Open Graph / Twitter */}
      <meta property="og:type" content="website" />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      {url && <meta property="og:url" content={url} />}
      {ogImage && <meta property="og:image" content={ogImage} />}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      {ogImage && <meta name="twitter:image" content={ogImage} />}

      {noindex && <meta name="robots" content="noindex,nofollow" />}

      {/* JSON-LD or extra tags go here */}
      {children}
    </Helmet>
  );
}
