import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
  en: {
    translation: {
      // Existing
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
      "Salt tooltip": "Salt as a percentage of flour weight",

      // New
      "Ingredient amounts": "Ingredient amounts",
      "Starter": "Starter",
      "Oil": "Oil",
      "Seeds": "Seeds",
      "Total": "Total",
      "Flour types": "Flour types",
      "all-purpose": "all-purpose",
      "whole wheat": "whole wheat",
      "Recipe": "Recipe",
      "fold": "fold",
      "Add seeds": "add seeds",
      "Mix flour and water. Let rest for 30 minutes.": "Mix flour and water. Let rest for 30 minutes.",
      "Add the starter and mix into a smooth dough.": "Add the starter and mix into a smooth dough.",
      "Shape, proof, and bake at 230°C.": "Shape, proof, and bake at 230°C.",
      "Shape, cover, and refrigerate overnight. Bake at 230°C.": "Shape, cover, and refrigerate overnight. Bake at 230°C.",
      "Mix flour, water, salt, and yeast or starter.": "Mix flour, water, salt, and yeast or starter.",
      "Add oil and mix into the dough.": "Add oil and mix into the dough.",
      "Let the dough rest 1–2h at room temperature, then cold ferment overnight.": "Let the dough rest 1–2h at room temperature, then cold ferment overnight.",
      "Let rise for 6–8 hours at room temperature.": "Let rise for 6–8 hours at room temperature.",
      "Shape the pizza bases and let rest 30 min.": "Shape the pizza bases and let rest 30 min.",
      "Add toppings and bake at 250–300°C on stone or tray.": "Add toppings and bake at 250–300°C on stone or tray.",
      "Cold fermentation": "Cold fermentation",
      "Yes": "Yes",
      "No": "No",
      "Calculator": "Calculator",
      "Show Recipe": "Show Recipe",
      "Clear": "Clear",
      "00-jauho": "00 flour",
      "puolikarkea": "coarse wheat flour",
    }
  },
  fi: {
    translation: {
      // Existing
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
      "Salt tooltip": "Suolan osuus jauhojen painosta prosentteina",

      // New
      "Ingredient amounts": "Ainesosien määrät",
      "Starter": "Juuri",
      "Oil": "Öljy",
      "Seeds": "Siemenet",
      "Total": "Yhteensä",
      "Flour types": "Jauhotyypit",
      "all-purpose": "vehnäjauho",
      "whole wheat": "kokojyväjauho",
      "Recipe": "Resepti",
      "fold": "taitto",
      "Add seeds": "lisää siemenet",
      "Mix flour and water. Let rest for 30 minutes.": "Sekoita jauhot ja vesi, anna levätä 30 minuuttia.",
      "Add the starter and mix into a smooth dough.": "Lisää juuri ja sekoita tasaiseksi taikinaksi.",
      "Shape, proof, and bake at 230°C.": "Muotoile, kohota ja paista uunissa 230 °C.",
      "Shape, cover, and refrigerate overnight. Bake at 230°C.": "Muotoile, peitä ja laita jääkaappiin yön yli. Paista uunissa 230 °C.",
      "Mix flour, water, salt, and yeast or starter.": "Sekoita jauhot, vesi, suola ja hiiva tai juuri.",
      "Add oil and mix into the dough.": "Lisää öljy ja sekoita taikinaan.",
      "Let the dough rest 1–2h at room temperature, then cold ferment overnight.": "Anna taikinan levätä huoneenlämmössä 1–2 h, sitten kylmäkohota jääkaapissa yön yli.",
      "Let rise for 6–8 hours at room temperature.": "Anna kohota huoneenlämmössä 6–8 h.",
      "Shape the pizza bases and let rest 30 min.": "Muotoile pizzapohjat ja anna levätä vielä 30 min.",
      "Add toppings and bake at 250–300°C on stone or tray.": "Lisää täytteet ja paista uunissa 250–300 °C kivellä tai pellillä.",
      "Cold fermentation": "Kylmäkohotus",
      "Yes": "Kyllä",
      "No": "Ei",
      "00-jauho": "00-jauho (valkoinen hieno vehnäjauho)",
      "puolikarkea": "puolikarkea vehnäjauho"

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
