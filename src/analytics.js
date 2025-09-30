// src/analytics.tsx (or analytics.js)
import { useEffect } from "react";

export function AnalyticsTracker() {
  useEffect(() => {
    const id   = import.meta.env.VITE_UMAMI_WEBSITE_ID;
    const src  = import.meta.env.VITE_UMAMI_SRC || "https://analytics.breadcalculator.online/script.js";
    const host = import.meta.env.VITE_UMAMI_HOST_URL; // optional

    if (!id) return;

    const s = document.createElement("script");
    s.async = true;
    s.src = src;
    s.setAttribute("data-website-id", id);
    if (host) s.setAttribute("data-host-url", host);

    document.head.appendChild(s);
    return () => { document.head.removeChild(s); };
  }, []);

  return null;
}
