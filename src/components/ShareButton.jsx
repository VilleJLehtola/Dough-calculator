// src/components/ShareButton.jsx
import { useMemo, useState } from "react";
import { Share2, Check } from "lucide-react";

export default function ShareButton({
  title,
  text,
  url,                // ⬅️ optional: pass short link like `${origin}/p/${id}`
  onShare,            // ⬅️ optional: (method) => void  e.g. 'web_share_api' | 'clipboard' | 'prompt'
  className = "",
}) {
  const [copied, setCopied] = useState(false);

  const shareUrl = useMemo(() => {
    if (url) return url;
    if (typeof window !== "undefined") return window.location.href;
    return "";
  }, [url]);

  const share = async () => {
    const payload = {
      title: title || (typeof document !== "undefined" ? document.title : "Share"),
      text: text || "",
      url: shareUrl,
    };

    // 1) Native share if supported
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share(payload);
        onShare?.("web_share_api");
        return;
      } catch {
        // user canceled or share failed — fall through to copy
      }
    }

    // 2) Fallback: copy to clipboard
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      onShare?.("clipboard");
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // 3) Last-ditch: prompt
      onShare?.("prompt");
      if (typeof window !== "undefined") {
        window.prompt("Copy link", shareUrl);
      }
    }
  };

  return (
    <button
      type="button"
      onClick={share}
      className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-md text-sm border ${
        copied
          ? "bg-green-600 text-white border-green-600"
          : "border-gray-300 dark:border-slate-600 hover:bg-gray-50 dark:hover:bg-slate-700 text-gray-800 dark:text-gray-200"
      } ${className}`}
      aria-label={copied ? "Link copied" : "Share"}
      title={copied ? "Copied!" : "Share"}
    >
      {copied ? <Check className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}
      {copied ? "Copied!" : "Share"}
      {/* Announce copy feedback for screen readers */}
      <span className="sr-only" aria-live="polite">
        {copied ? "Link copied" : ""}
      </span>
    </button>
  );
}
