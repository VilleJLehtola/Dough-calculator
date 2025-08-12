import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Load bundled resources (can be replaced with dynamic imports)
import enCommon from './locales/en/common.json';
import fiCommon from './locales/fi/common.json';

const resources = {
  en: { common: enCommon },
  fi: { common: fiCommon }
};

// Determine initial language: localStorage('lang') -> browser -> 'fi'
const stored = (typeof window !== 'undefined' && localStorage.getItem('lang')) || null;
const initialLng = stored && stored !== 'auto'
  ? stored
  : (typeof navigator !== 'undefined' && navigator.language?.slice(0,2)) || 'fi';

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: initialLng,
    fallbackLng: 'en',
    defaultNS: 'common',
    interpolation: { escapeValue: false }
  });

// Keep working with the existing LanguageSwitcher.jsx
// It dispatches a 'langchange' event and writes localStorage('lang').
if (typeof window !== 'undefined') {
  window.addEventListener('langchange', (e) => {
    const code = e?.detail;
    if (code && code !== 'auto') {
      i18n.changeLanguage(code);
    } else if (code === 'auto') {
      const auto = (navigator.language || 'en').slice(0,2);
      i18n.changeLanguage(auto);
    }
  });
}

export default i18n;
