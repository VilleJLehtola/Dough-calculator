import React, { useEffect, useState } from 'react';

const LANGS = [
  { code: 'auto', label: 'Auto', emoji: '🌐' },
  { code: 'fi', label: 'FI', emoji: '🇫🇮' },
  { code: 'en', label: 'EN', emoji: '🇬🇧' },
  { code: 'sv', label: 'SV', emoji: '🇸🇪' },
];

export default function LanguageSwitcher() {
  const { t } = useTranslation();
  const [lang, setLang] = useState(localStorage.getItem('lang') || 'auto');

  useEffect(() => {
    localStorage.setItem('lang', lang);
    // notify listeners (RecipeViewPage)
    window.dispatchEvent(new CustomEvent('langchange', { detail: lang }));
  }, [lang]);

  return (
    <div className="flex items-center gap-2">
      {LANGS.map((l) => (
        <button
          key={l.code}
          type="button"
          onClick={() => setLang(l.code)}
          className={`px-2.5 py-1 rounded-lg text-sm border transition ${
            lang === l.code
              ? 'bg-blue-600 text-white border-blue-700'
              : 'bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 border-gray-200 dark:border-gray-700 hover:bg-blue-50 dark:hover:bg-gray-700'
          }`}
          title={l.label}
        >
          <span role="img" aria-label={l.label}>{l.emoji}</span>
        </button>
      ))}
    </div>
  );
}
