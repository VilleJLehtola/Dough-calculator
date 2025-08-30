// src/utils/slug.js
export function slugify(input = "") {
  return String(input)
    .normalize("NFKD")               // split accents (ä → a +  ̈)
    .replace(/[\u0300-\u036f]/g, "") // strip diacritics
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")     // non-alphanum → hyphen
    .replace(/^-+|-+$/g, "")         // trim hyphens
    .slice(0, 80) || "recipe";
}
