import db from "@/data/nutrition.json";

/** Map a free-text ingredient name to a nutrition id. Tweak as needed. */
export function mapNameToFoodId(name = "") {
  const n = name.toLowerCase();

  // obvious ones first
  if (/\b(salt|suola|salt)\b/.test(n)) return "salt";
  if (/\b(olive\s*oil|öljy|olja|oil)\b/.test(n)) return "olive_oil";
  if (/\b(water|vesi|vatten)\b/.test(n)) return "water";
  if (/\b(seed|siemen|frön|sesame|sunflower|flax|linseed)\b/.test(n)) return "seed_mix_default";
  if (/\b(starter|juuri|levain|surdeg)\b/.test(n)) return "starter"; // handled specially

  // flours
  if (/tipo\s*0?0\b/.test(n)) return "wheat_flour_tipo00";
  if (/\b(white|bread|all[-\s]?purpose|vehnä|vitt)\b/.test(n)) return "wheat_flour_all_purpose";
  if (/\b(whole\s*wheat|graham|täysjyvä)\b/.test(n)) return "whole_wheat_flour";
  if (/\b(rye|ruis|råg)\b/.test(n)) return "rye_flour";

  // default
  return "wheat_flour_all_purpose";
}

export function sum(parts) {
  return parts.reduce(
    (acc, { id, grams }) => {
      const n = db[id]?.per_100g;
      if (!n) return acc;
      const f = grams / 100;
      acc.kcal += n.kcal * f;
      acc.carbs += n.carbs * f;
      acc.protein += n.protein * f;
      acc.fat += n.fat * f;
      acc.fiber += n.fiber * f;
      acc.sodium_mg += n.sodium_mg * f;
      acc.weight += grams;
      return acc;
    },
    { kcal: 0, carbs: 0, protein: 0, fat: 0, fiber: 0, sodium_mg: 0, weight: 0 }
  );
}

/** Starter is split into flour + water. Default 100% hydration. */
export function expandStarter(gramsStarter, flourId = "wheat_flour_all_purpose", starterHydration = 100) {
  if (!gramsStarter || gramsStarter <= 0) return [];
  const flour = gramsStarter * (100 / (100 + starterHydration));
  const water = gramsStarter - flour;
  return [
    { id: flourId, grams: flour },
    { id: "water", grams: water },
  ];
}

/**
 * Build nutrition parts from a recipe object.
 * Accepts a recipe with ingredients [{ name, amount, unit }].
 * Units expected in grams for accuracy; ml is treated as grams for water/oil.
 */
export function partsFromRecipe(recipe) {
  const parts = [];
  if (!recipe?.ingredients) return parts;

  for (const ing of recipe.ingredients) {
    const name = ing.name || "";
    const unit = (ing.unit || "").toLowerCase();
    let grams = Number(ing.amount) || 0;

    // crude ml->g assumption for water/oil
    if (unit === "ml" || unit === "milliliter" || unit === "milliliters") {
      if (/oil|öljy|olja/i.test(name)) {
        grams = grams * 0.91; // olive oil density approx
      } else {
        grams = grams; // water ~1 g/ml
      }
    }

    const id = mapNameToFoodId(name);

    if (id === "starter") {
      // try to infer flour id from other flour names in recipe
      const flourIng =
        recipe.ingredients.find(i => /tipo\s*0?0|white|bread|all[-\s]?purpose|vehnä|vitt|whole\s*wheat|täysjyvä|rye|ruis|råg/i.test(i.name || "")) || {};
      const flourId = mapNameToFoodId(flourIng.name || "flour");
      parts.push(...expandStarter(grams, flourId, 100));
    } else {
      parts.push({ id, grams });
    }
  }

  return parts;
}

/** Main computation + per-100g/per-slice derivations. */
export function computeNutrition(recipe, { bakeLossPct = 15, sliceGrams = 50 } = {}) {
  const parts = partsFromRecipe(recipe);
  const totals = sum(parts);
  const bakedWeight = totals.weight * (1 - bakeLossPct / 100);

  const per100 = {
    kcal: (totals.kcal / bakedWeight) * 100,
    carbs: (totals.carbs / bakedWeight) * 100,
    protein: (totals.protein / bakedWeight) * 100,
    fat: (totals.fat / bakedWeight) * 100,
    fiber: (totals.fiber / bakedWeight) * 100,
    sodium_mg: (totals.sodium_mg / bakedWeight) * 100,
  };

  const perSlice = {
    kcal: (totals.kcal / bakedWeight) * sliceGrams,
    carbs: (totals.carbs / bakedWeight) * sliceGrams,
    protein: (totals.protein / bakedWeight) * sliceGrams,
    fat: (totals.fat / bakedWeight) * sliceGrams,
    fiber: (totals.fiber / bakedWeight) * sliceGrams,
    sodium_mg: (totals.sodium_mg / bakedWeight) * sliceGrams,
  };

  return {
    totals,
    bakedWeight,
    per100,
    perSlice,
  };
}

export function round1(x) { return Math.round(x * 10) / 10; }
export function round0(x) { return Math.round(x); }
