import { useEffect, useRef, useState } from "react";

/**
 * Captures the `beforeinstallprompt` event (Android/desktop Chrome).
 * Returns { canInstall, install, installed, isStandalone }.
 */
export default function usePWAInstall() {
  const deferred = useRef(null);
  const [canInstall, setCanInstall] = useState(false);
  const [installed, setInstalled] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Detect standalone (installed) on most browsers
    const standalone =
      window.matchMedia?.("(display-mode: standalone)")?.matches ||
      window.navigator.standalone === true;
    setIsStandalone(standalone);
  }, []);

  useEffect(() => {
    const onBip = (e) => {
      // Prevent the mini-infobar
      e.preventDefault();
      deferred.current = e;
      setCanInstall(true);
    };
    const onInstalled = () => {
      setInstalled(true);
      setCanInstall(false);
      deferred.current = null;
    };

    window.addEventListener("beforeinstallprompt", onBip);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBip);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const install = async () => {
    const ev = deferred.current;
    if (!ev) return false;
    try {
      ev.prompt();
      const res = await ev.userChoice;
      if (res?.outcome === "accepted") {
        setInstalled(true);
        setCanInstall(false);
      }
      deferred.current = null;
      return res?.outcome === "accepted";
    } catch {
      return false;
    }
  };

  return { canInstall, install, installed, isStandalone };
}
