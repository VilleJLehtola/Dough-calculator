// src/analytics.js
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/** Fire a Plausible event with optional props */
export function track(eventName, props) {
  try {
    if (typeof window !== 'undefined' && typeof window.plausible === 'function') {
      props ? window.plausible(eventName, { props }) : window.plausible(eventName);
    }
  } catch {}
}

/** Hook: send SPA pageviews on route change */
function usePlausiblePageviews() {
  const loc = useLocation();
  useEffect(() => {
    if (typeof window !== 'undefined' && typeof window.plausible === 'function') {
      // Use full URL so Plausible sees path + query/hash
      window.plausible('pageview', { u: window.location.href });
    }
  }, [loc.pathname, loc.search, loc.hash]);
}

/** Component that activates the hook under the Router */
export function AnalyticsTracker() {
  usePlausiblePageviews();
  return null;
}
