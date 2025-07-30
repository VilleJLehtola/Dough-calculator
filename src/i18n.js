import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
en: {
  translation: {
    ...
    "Base": "Base (g)",
    "Hydration": "Hydration",
    "Salt": "Salt",
    "Oil": "Oil",
    "Pizza": "Pizza",
    "Bread": "Bread",
    "Dough Type": "Dough Type",
    "Include Seeds": "Include Seeds (15%)",
    "Include Rye Flour": "Include Rye Flour (20%)",
    "Cold Fermentation": "Cold Fermentation",
    "Show Recipe": "Show Recipe"
  }
},
fi: {
  translation: {
    ...
    "Base": "Perusta (g)",
    "Hydration": "Hydraatio",
    "Salt": "Suola",
    "Oil": "Öljy",
    "Pizza": "Pizza",
    "Bread": "Leipä",
    "Dough Type": "Taikinatyyppi",
    "Include Seeds": "Lisää siemenet (15%)",
    "Include Rye Flour": "Lisää ruisjauho (20%)",
    "Cold Fermentation": "Kylmäkohotus",
    "Show Recipe": "Näytä resepti"
  }
}



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
