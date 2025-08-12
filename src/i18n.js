import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import enCommon from '@/locales/en/common.json';
import fiCommon from '@/locales/fi/common.json';

const resources = {
  en: { common: enCommon },
  fi: { common: fiCommon },
};

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
    interpolation: { escapeValue: false },
  });

if (typeof window !== 'undefined') {
  window.addEventListener('langchange', (e) => {
    const code = e?.detail;
    if (code && code !== 'auto') {
      i18n.changeLanguage(code);
    } else {
      const auto = (navigator.language || 'en').slice(0,2);
      i18n.changeLanguage(auto);
    }
  });
}

export default i18n;
