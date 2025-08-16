// src/analytics.js
export function track(eventName, props) {
  try {
    if (typeof window !== 'undefined' && typeof window.plausible === 'function') {
      if (props) window.plausible(eventName, { props });
      else window.plausible(eventName);
    }
  } catch {}
}

// SPA pageviews on route change
// Call this once near the root (e.g., in App.jsx) to send pageviews whenever location changes
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export function usePlausiblePageviews() {
  const location = useLocation();
  useEffect(() => {
    // Force a new pageview with the current URL for SPA routing
    if (typeof window !== 'undefined' && typeof window.plausible === 'function') {
      window.plausible('pageview', { u: window.location.href });
    }
  }, [location.pathname, location.search, location.hash]);
}
