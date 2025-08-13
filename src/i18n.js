// src/i18n.js
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// ✅ Correct paths
import en from './locales/en/common.json';
import fi from './locales/fi/common.json';
import sv from './locales/sv/common.json';

const savedLang =
  typeof window !== 'undefined' ? window.localStorage?.getItem('lang') : null;

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: { common: en },
      fi: { common: fi },
      sv: { common: sv },
    },
    lng: savedLang || 'fi',
    fallbackLng: ['fi', 'en', 'sv'],
    ns: ['common'],
    defaultNS: 'common',
    interpolation: { escapeValue: false },
    returnNull: false,
  });

export default i18n;
