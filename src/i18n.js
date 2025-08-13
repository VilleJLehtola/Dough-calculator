import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Import translation resources
import en from './common/en/common.json';
import fi from './common/fi/common.json';
import sv from './common/sv/common.json';

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: { common: en },
      fi: { common: fi },
      sv: { common: sv }
    },
    lng: 'fi',            // default language
    fallbackLng: ['fi', 'en', 'sv'],
    ns: ['common'],
    defaultNS: 'common',
    interpolation: { escapeValue: false }
  });

export default i18n;
