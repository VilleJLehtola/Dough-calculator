import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

const LANGS = [
  { code: 'auto', label: 'Auto', emoji: '🌐' },
  { code: 'fi', label: 'FI', emoji: '🇫🇮' },
  { code: 'en', label: 'EN', emoji: '🇬🇧' },
  { code: 'sv', label: 'SV', emoji: '🇸🇪' },
];

export default function LanguageSwitcher() {
  const { i18n } = useTranslation();
  const [lang, setLangState] = useState(localStorage.getItem('lang') || 'auto');

  const setLang = (code) => {
    if (code === lang) return;

    setLangState(code);

    try {
      localStorage.setItem('lang', code);
    } catch {}

    // Notify listeners (RecipeViewPage listens to this)
    window.dispatchEvent(new CustomEvent('langchange', { detail: code }));

    // Keep <html lang> in sync for a11y/SEO
    try {
      document.documentElement.lang = code === 'auto' ? 'fi' : code;
    } catch {}

    // Optional: sync with global i18n if available
    if (i18n?.changeLanguage && code !== 'auto') {
      i18n.changeLanguage(code);
    }
  };

  useEffect(() => {
    // Ensure html lang matches on mount
    document.documentElement.lang = lang === 'auto' ? 'fi' : lang;
  }, []);

  return (
    <div className="flex items-center gap-2">
      {LANGS.map((l) => (
        <button
          key={l.code}
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
