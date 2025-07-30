import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
  en: {
    translation: {
      "Flour": "Flour",
      "Water": "Water",
      "Grams": "Grams",
      "Hydration": "Hydration",
      "Salt": "Salt",
      "Pizza": "Pizza",
      "Bread": "Bread",
      "Include Rye Flour": "Include 20% Rye Flour",
      "Include Seeds": "Include Seeds (15%)",
      "Cold Fermentation": "Cold Fermentation",
      "Include Oil": "Include Oil (3%)",
      "Show Recipe": "Show Recipe",
      "Clear": "Clear",
      "Input type tooltip": "Choose whether to input flour or water amount",
      "Input amount tooltip": "Enter the amount of flour or water in grams",
      "Hydration tooltip": "Water as a percentage of flour weight",
      "Salt tooltip": "Salt as a percentage of flour weight"
    }
  },
  fi: {
    translation: {
      "Flour": "Jauho",
      "Water": "Vesi",
      "Grams": "Grammat",
      "Hydration": "Hydraatio",
      "Salt": "Suola",
      "Pizza": "Pizza",
      "Bread": "Leipä",
      "Include Rye Flour": "Sisältää 20% ruisjauhoja",
      "Include Seeds": "Lisää siemeniä (15%)",
      "Cold Fermentation": "Kylmäkohotus",
      "Include Oil": "Sisältää öljyä (3%)",
      "Show Recipe": "Näytä resepti",
      "Clear": "Tyhjennä",
      "Input type tooltip": "Valitse haluatko syöttää jauhojen vai veden määrän",
      "Input amount tooltip": "Syötä grammoina joko jauhot tai vesi",
      "Hydration tooltip": "Veden osuus jauhojen painosta prosentteina",
      "Salt tooltip": "Suolan osuus jauhojen painosta prosentteina"
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

