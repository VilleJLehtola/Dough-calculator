// src/analytics.js
import { useEffect } from "react";

const UMAMI_SRC_DEFAULT = "https://analytics.breadcalculator.online/script.js"; // change later when your subdomain is live

export function AnalyticsTracker() {
  useEffect(() => {
    const id   = import.meta.env.VITE_UMAMI_WEBSITE_ID;  // required
    const src  = import.meta.env.VITE_UMAMI_SRC || UMAMI_SRC_DEFAULT;
    const host = import.meta.env.VITE_UMAMI_HOST_URL;    // optional (for proxying /api)

    if (!id) return; // no-op if not configured

    const s = document.createElement("script");
    s.defer = true; // Umami recommends defer
    s.src = src;
    s.setAttribute("data-website-id", id);
    if (host) s.setAttribute("data-host-url", host);

    document.head.appendChild(s);
    return () => { document.head.removeChild(s); };
  }, []);

  return null;
}

// Simple wrapper so you can call track('event', {key:'val'})
export function track(eventName, data) {
  if (typeof window === "undefined") return;
  const u = window.umami;
  if (!u || typeof u.track !== "function") return;
  // data is optional
  return data ? u.track(eventName, data) : u.track(eventName);
}
