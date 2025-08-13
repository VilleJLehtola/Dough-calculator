import { useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

export default function LanguageSwitcher({ compact = false }) {
  const { i18n } = useTranslation();

  const langs = useMemo(
    () => [
      { code: 'fi', label: 'FI' },
      { code: 'en', label: 'EN' },
      { code: 'sv', label: 'SV' },
    ],
    []
  );

  const setLang = (lng) => {
    if (lng === i18n.language) return;
    i18n.changeLanguage(lng);
    try {
      localStorage.setItem('lang', lng);
    } catch {}
  };

  // keep <html lang=".."> in sync too (belt & suspenders)
  useEffect(() => {
    document?.documentElement && (document.documentElement.lang = i18n.language || 'fi');
  }, [i18n.language]);

  return (
    <div className={`inline-flex items-center gap-1 ${compact ? '' : 'px-2'}`} role="group" aria-label="Language switcher">
      {langs.map(({ code, label }) => {
        const active = i18n.language?.startsWith(code);
        return (
          <button
            key={code}
            type="button"
            onClick={() => setLang(code)}
            aria-pressed={active}
            className={[
              'text-sm px-2 py-1 rounded-md border transition',
              active
                ? 'font-semibold border-gray-400'
                : 'border-transparent opacity-70 hover:opacity-100'
            ].join(' ')}
            title={label}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
