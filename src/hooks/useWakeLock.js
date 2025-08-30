// Keep the screen awake while `enabled` is true, with safe fallbacks.
// Works on most Chromium/Android. No-ops elsewhere.
import { useEffect, useRef } from "react";

export default function useWakeLock(enabled) {
  const lockRef = useRef(null);

  useEffect(() => {
    let cancelled = false;

    async function requestLock() {
      if (!enabled) return;
      if (!("wakeLock" in navigator)) return; // not supported
      try {
        const lock = await navigator.wakeLock.request("screen");
        if (cancelled) {
          try { await lock.release(); } catch {}
          return;
        }
        lockRef.current = lock;
        lock.addEventListener?.("release", () => {
          // Attempt to re-acquire if still enabled and page is visible
          if (enabled && document.visibilityState === "visible") {
            requestLock();
          }
        });
      } catch {
        // ignore; could be denied or unsupported
      }
    }

    if (enabled && document.visibilityState === "visible") {
      requestLock();
    }

    // Re-acquire on visibility return
    const onVis = () => {
      if (enabled && document.visibilityState === "visible" && !lockRef.current) {
        requestLock();
      }
    };
    document.addEventListener("visibilitychange", onVis);

    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", onVis);
      const l = lockRef.current;
      lockRef.current = null;
      if (l?.release) l.release().catch(() => {});
    };
  }, [enabled]);
}
