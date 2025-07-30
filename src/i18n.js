import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
  en: {
    translation: {
      "Calculator": "Calculator",
      "Flour": "Flour",
      "Water": "Water",
      "Salt": "Salt",
      "Pizza": "Pizza",
      "Bread": "Bread",
      "Show Recipe": "Show Recipe",
    }
  },
  fi: {
    translation: {
      "Calculator": "Laskin",
      "Flour": "Jauhot",
      "Water": "Vesi",
      "Salt": "Suola",
      "Pizza": "Pizza",
      "Bread": "Leipä",
      "Show Recipe": "Näytä resepti",
    }
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'fi', // default language
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;
