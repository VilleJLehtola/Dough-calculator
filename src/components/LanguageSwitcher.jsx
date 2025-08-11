import React from 'react';

const choices = [
  { code: 'auto', label: 'Auto', emoji: '🌐' },
  { code: 'en',   label: 'EN',   emoji: '🇬🇧' },
  { code: 'fi',   label: 'FI',   emoji: '🇫🇮' },
  { code: 'sv',   label: 'SV',   emoji: '🇸🇪' },
];

export default function LanguageSwitcher({ className = '' }) {
  const [lang, setLang] = React.useState(
    typeof window !== 'undefined' ? localStorage.getItem('lang') || 'auto' : 'auto'
  );

  const pick = (code) => {
    try {
      localStorage.setItem('lang', code);
    } catch {}
    setLang(code);
    // tell any listeners (RecipeViewPage) immediately
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('langchange', { detail: code }));
    }
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {choices.map((c) => {
        const active = c.code === lang;
        return (
          <button
            key={c.code}
            type="button"
            onClick={() => pick(c.code)}
            className={[
              'inline-flex items-center gap-1 px-2 py-1 rounded-lg text-sm',
              'border transition',
              active
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700',
            ].join(' ')}
            aria-pressed={active}
            title={c.label}
          >
            <span aria-hidden>{c.emoji}</span>
            <span className="hidden sm:inline">{c.label}</span>
          </button>
        );
      })}
    </div>
  );
}
