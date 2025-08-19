// src/seo/jsonld.js
export function recipeJsonLd({
  name,
  description,
  images = [],
  ingredients = [],
  instructions = [],
  authorName,
  datePublished,
  totalTime,   // ISO 8601 e.g. "PT12H" if available
  prepTime,
  cookTime,
  recipeYield,
  // NEW: pass a plain object with NutritionInformation fields (strings with units)
  // e.g. { calories: "210 kcal", carbohydrateContent: "40 g", ... , servingSize: "1 slice" }
  nutrition
}) {
  const howToSteps = (instructions || []).map((s, i) => ({
    '@type': 'HowToStep',
    position: i + 1,
    text: typeof s === 'string' ? s : (s?.text || ''),
  }));

  const recipeIngredient = (ingredients || [])
    .map((r) => (typeof r === 'string' ? r : (r?.text ?? r?.name ?? '')))
    .filter(Boolean);

  // Build JSON-LD
  const json = {
    '@context': 'https://schema.org',
    '@type': 'Recipe',
    name,
    description,
    image: images,
    recipeIngredient,
    recipeInstructions: howToSteps,
    author: authorName ? { '@type': 'Person', name: authorName } : undefined,
    datePublished,
    totalTime,
    prepTime,
    cookTime,
    recipeYield,
    // Include NutritionInformation only if provided
    nutrition: nutrition ? { '@type': 'NutritionInformation', ...nutrition } : undefined
  };

  // Remove undefined fields to keep the output tidy
  return Object.fromEntries(
    Object.entries(json).filter(([, v]) => v !== undefined && v !== null)
  );
}
