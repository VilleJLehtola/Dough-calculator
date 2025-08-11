import React, { useEffect, useState } from 'react';

const FLAGS = [
  { code: 'auto', label: 'Auto',    emoji: '🌐' },
  { code: 'fi',   label: 'Suomi',   emoji: '🇫🇮' },
  { code: 'en',   label: 'English', emoji: '🇬🇧' }, // or 🇺🇸
  { code: 'sv',   label: 'Svenska', emoji: '🇸🇪' },
];

export default function LanguageSwitcher() {
  const [lang, setLang] = useState(localStorage.getItem('lang') || 'auto');

  useEffect(() => {
    localStorage.setItem('lang', lang);
    // notify this tab immediately (and any listeners)
    window.dispatchEvent(new CustomEvent('langchange', { detail: lang }));
  }, [lang]);

  return (
    <div className="flex gap-2 items-center">
      {FLAGS.map(f => (
        <button
          key={f.code}
          onClick={() => setLang(f.code)}
          className={`px-2 py-1 rounded-lg border text-base transition
            ${lang === f.code ? 'bg-white/10 border-white/40' : 'border-transparent hover:bg-white/5'}`}
          title={f.label}
          aria-label={f.label}
          aria-pressed={lang === f.code}
        >
          <span className="leading-none">{f.emoji}</span>
        </button>
      ))}
    </div>
  );
}
