// src/analytics.js
import { useEffect } from "react";

const UMAMI_SRC_DEFAULT = "https://analytics.breadcalculator.online/script.js";

export function AnalyticsTracker() {
  useEffect(() => {
    const id   = import.meta.env.VITE_UMAMI_WEBSITE_ID;
    const src  = import.meta.env.VITE_UMAMI_SRC || UMAMI_SRC_DEFAULT;
    const host = import.meta.env.VITE_UMAMI_HOST_URL;

    if (!id) return;

    const s = document.createElement("script");
    s.defer = true;
    s.src = src;
    s.setAttribute("data-website-id", id);
    if (host) s.setAttribute("data-host-url", host);
    document.head.appendChild(s);
    return () => document.head.removeChild(s);
  }, []);
  return null;
}

export function track(eventName, data) {
  if (typeof window === "undefined" || !window.umami?.track) return;
  return data ? window.umami.track(eventName, data) : window.umami.track(eventName);
}
