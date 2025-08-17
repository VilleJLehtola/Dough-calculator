// src/utils/img.js
// Detects Supabase-public URLs and rewrites them to the render endpoint.
// Also builds responsive srcset strings in next-gen formats.

const SUPABASE_HOST = "https://btozmkrowcrjzvxxhlbn.supabase.co";
const PUBLIC_PREFIX = `${SUPABASE_HOST}/storage/v1/object/public/`;
const RENDER_BASE = `${SUPABASE_HOST}/storage/v1/render/image/public/`;

/**
 * Return a render URL for a public Supabase image with transforms applied.
 * @param {string} url  public URL from supabase.storage.getPublicUrl
 * @param {object} opt  { width, height, quality, format('webp'|'avif'), resize('cover'|'contain'|...) }
 */
export function supaRender(url, opt = {}) {
  if (!url || typeof url !== "string") return url;

  // Not a supabase public URL? return as-is.
  if (!url.startsWith(PUBLIC_PREFIX)) return url;

  const path = url.slice(PUBLIC_PREFIX.length);
  const {
    width,
    height,
    quality = 78,
    format = "webp",
    resize = "cover",
    // you can also pass: background, position, blur, etc if needed
  } = opt;

  const params = new URLSearchParams();
  if (width) params.set("width", width);
  if (height) params.set("height", height);
  if (quality) params.set("quality", String(quality));
  if (format) params.set("format", format);
  if (resize) params.set("resize", resize);

  return `${RENDER_BASE}${path}?${params.toString()}`;
}

/**
 * Build a responsive srcset for a Supabase image.
 * widths = array of pixel widths that Lighthouse can choose from.
 */
export function supaSrcSet(url, widths = [360, 600, 900, 1200, 1600], opts = {}) {
  return widths
    .map((w) => `${supaRender(url, { ...opts, width: w })} ${w}w`)
    .join(", ");
}

/**
 * Return a good sizes attribute for cards/grids.
 * Tweak if your layout changes.
 */
export const CARD_SIZES =
  "(min-width:1536px) 18vw, (min-width:1280px) 22vw, (min-width:1024px) 25vw, (min-width:640px) 33vw, 100vw";
