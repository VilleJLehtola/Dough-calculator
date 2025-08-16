import { useState } from 'react';
import { Share2, Check } from 'lucide-react';

export default function ShareButton({ title, text }) {
  const [copied, setCopied] = useState(false);

  const share = async () => {
    const url = window.location.href;

    // 1) Native share if supported
    if (navigator.share) {
      try {
        await navigator.share({ title: title || document.title, text: text || '', url });
        return;
      } catch {
        /* user canceled or share failed — fall through to copy */
      }
    }

    // 2) Fallback: copy to clipboard
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Last-ditch: prompt
      window.prompt('Copy link', url);
    }
  };

  return (
    <button
      onClick={share}
      className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-md text-sm border ${
        copied
          ? 'bg-green-600 text-white border-green-600'
          : 'border-gray-300 dark:border-slate-600 hover:bg-gray-50 dark:hover:bg-slate-700 text-gray-800 dark:text-gray-200'
      }`}
      aria-label="Share"
      title={copied ? 'Copied!' : 'Share'}
    >
      {copied ? <Check className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}
      {copied ? 'Copied!' : 'Share'}
    </button>
  );
}
