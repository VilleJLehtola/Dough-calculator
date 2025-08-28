import { useMemo, useState } from "react";
import usePWAInstall from "@/hooks/usePWAInstall";
import { Download, Check } from "lucide-react";

export default function InstallAppButton({ className = "" }) {
  const { canInstall, install, installed, isStandalone } = usePWAInstall();
  const [done, setDone] = useState(false);

  const visible = useMemo(() => {
    // Hide if already installed/standalone
    if (installed || isStandalone) return false;
    // Show if we have a real prompt
    if (canInstall) return true;

    // iOS Safari doesn't fire beforeinstallprompt — we can optionally show a helper
    const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
    const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
    return isIOS && isSafari; // show helper button on iOS Safari
  }, [canInstall, installed, isStandalone]);

  if (!visible) return null;

  const onClick = async () => {
    // If we have a real prompt
    if (canInstall) {
      const ok = await install();
      setDone(ok);
      if (ok) setTimeout(() => setDone(false), 1200);
      return;
    }
    // iOS helper
    alert(
      "Asenna aloitusnäyttöön:\n\n1) Napauta Safari-jakopainiketta\n2) Valitse 'Lisää Koti-valikkoon'"
    );
  };

  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-md text-sm border border-gray-300 dark:border-slate-600 hover:bg-gray-50 dark:hover:bg-slate-700 text-gray-800 dark:text-gray-200 ${className}`}
      title="Install app"
      aria-label="Install app"
    >
      {done ? <Check className="w-4 h-4" /> : <Download className="w-4 h-4" />}
      {done ? "Installed" : "Install app"}
    </button>
  );
}
