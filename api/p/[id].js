// /api/p/[id].js
// OG-enabled share page for a recipe ID. Bots see OG tags, users get redirected to /recipe/:id.
export const config = { runtime: 'edge' };

export default async function handler(req) {
  const url = new URL(req.url);
  const id = url.pathname.split('/').pop();
  const origin = url.origin;

  // Defaults
  let title = 'Everything Dough — Recipe';
  let description = 'Recipe details and instructions';
  let author = '';
  let cover = `${origin}/og-image.jpg`;
  let tags = '';

  try {
    // Fetch minimal public recipe info from Supabase REST
    const SUPABASE_URL = process.env.PUBLIC_SUPABASE_URL;
    const ANON = process.env.PUBLIC_SUPABASE_ANON_KEY;

    if (SUPABASE_URL && ANON && id) {
      const q = new URL(`${SUPABASE_URL}/rest/v1/recipes`);
      q.searchParams.set('id', `eq.${id}`);
      q.searchParams.set('select', 'title,description,images,cover_image,tags,author_id,created_at');

      const res = await fetch(q.toString(), {
        headers: { apikey: ANON, Authorization: `Bearer ${ANON}` },
        cache: 'no-store',
      });

      if (res.ok) {
        const rows = await res.json();
        const r = rows?.[0];
        if (r) {
          title = r.title || title;
          description = r.description || description;
          // prefer explicit cover_image, then first of images[]
          const firstImg =
            (Array.isArray(r.images) && r.images.length && (r.images[0].url || r.images[0])) ||
            r.cover_image ||
            '';
          if (firstImg) cover = firstImg;
          // tags string "a,b,c" -> "a, b, c"
          tags = String(r.tags || '')
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean)
            .slice(0, 3)
            .join(', ');
        }
      }
    }
  } catch (e) {
    // swallow; keep defaults
  }

  // Build dynamic OG image URL
  const og = new URL(`${origin}/api/og/recipe`);
  og.searchParams.set('title', title);
  if (author) og.searchParams.set('by', author);
  if (tags) og.searchParams.set('tags', tags);
  if (cover) og.searchParams.set('img', cover);

  const recipeUrl = `${origin}/recipe/${id}`;

  const html = `<!doctype html>
<html lang="en">
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${escapeHtml(title)}</title>
<link rel="canonical" href="${recipeUrl}">
<meta name="description" content="${escapeHtml(description)}">
<meta property="og:site_name" content="Everything Dough">
<meta property="og:type" content="article">
<meta property="og:title" content="${escapeHtml(title)}">
<meta property="og:description" content="${escapeHtml(description)}">
<meta property="og:image" content="${og.toString()}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:url" content="${recipeUrl}">
<meta name="twitter:card" content="summary_large_image">
<meta http-equiv="refresh" content="0; url=${recipeUrl}">
<body>
  <p>Redirecting to <a href="${recipeUrl}">${recipeUrl}</a>…</p>
  <script>location.replace(${JSON.stringify(recipeUrl)});</script>
</body>
</html>`;

  return new Response(html, { headers: { 'content-type': 'text/html; charset=utf-8' } });
}

// tiny escaper
function escapeHtml(s) {
  return String(s)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}
