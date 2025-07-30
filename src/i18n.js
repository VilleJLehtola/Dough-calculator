import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
  en: {
    translation: {
      "Calculator": "Calculator",
      "Favorites": "Favorites",
      "Recipes": "Recipes",
      "Admin": "Admin",
      "Login": "Login",
      "Logout": "Logout",
      "Language": "Language",
      "Dark Mode": "Dark Mode"
    }
  },
  fi: {
    translation: {
      "Calculator": "Laskuri",
      "Favorites": "Suosikit",
      "Recipes": "Reseptit",
      "Admin": "Admin",
      "Login": "Kirjaudu sisään",
      "Logout": "Kirjaudu ulos",
      "Language": "Kieli",
      "Dark Mode": "Tummat värit"
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
