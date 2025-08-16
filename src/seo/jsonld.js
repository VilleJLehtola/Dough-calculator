export function recipeJsonLd({
  name,
  description,
  images = [],
  ingredients = [],
  instructions = [],
  authorName,
  datePublished,
  totalTime,   // ISO 8601 like "PT12H" if available
  prepTime,
  cookTime,
  recipeYield,
}) {
  const howToSteps = (instructions || []).map((s, i) => ({
    '@type': 'HowToStep',
    position: i + 1,
    text: typeof s === 'string' ? s : (s?.text || ''),
  }));

  const recipeIngredient = (ingredients || [])
    .map((r) => (typeof r === 'string' ? r : (r?.text ?? r?.name ?? '')))
    .filter(Boolean);

  return {
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
  };
}
