// /api/p/[id].js
// Share page with real OG tags. Bots read this HTML; users are redirected.
// Requires env vars: PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY
export const config = { runtime: "edge" };

export default async function handler(req) {
  const url = new URL(req.url);
  const id = url.pathname.split("/").pop();
  const origin = url.origin;

  let title = "Everything Dough — Recipe";
  let description = "Recipe details and instructions";
  let cover = `${origin}/og-image.jpg`;
  let tagNames = [];

  try {
    const SUPABASE_URL = process.env.PUBLIC_SUPABASE_URL;
    const ANON = process.env.PUBLIC_SUPABASE_ANON_KEY;

    if (SUPABASE_URL && ANON && id) {
      // --- 1) Fetch recipe basics ---
      const rq = new URL(`${SUPABASE_URL}/rest/v1/recipes`);
      rq.searchParams.set("id", `eq.${id}`);
      rq.searchParams.set("select", "title,description,images,cover_image");

      const rres = await fetch(rq.toString(), {
        headers: { apikey: ANON, Authorization: `Bearer ${ANON}` },
        cache: "no-store",
      });

      if (rres.ok) {
        const rows = await rres.json();
        const r = rows?.[0];
        if (r) {
          title = r.title || title;
          description = r.description || description;

          const firstImg =
            (Array.isArray(r.images) && r.images.length && (r.images[0]?.url || r.images[0])) ||
            r.cover_image ||
            "";
          if (firstImg) cover = firstImg;
        }
      }

      // --- 2) Fetch tag names via join: recipe_tags -> tags(name) ---
      // Requires FK: recipe_tags.tag_id -> tags.id
      const tq = new URL(`${SUPABASE_URL}/rest/v1/recipe_tags`);
      tq.searchParams.set("select", "tags(name)");
      tq.searchParams.set("recipe_id", `eq.${id}`);

      const tres = await fetch(tq.toString(), {
        headers: { apikey: ANON, Authorization: `Bearer ${ANON}` },
        cache: "no-store",
      });

      if (tres.ok) {
        const trows = await tres.json();
        tagNames = [...new Set(trows.map((row) => row?.tags?.name).filter(Boolean))];
      }
    }
  } catch {
    // keep defaults on any error
  }

  const recipeUrl = `${origin}/recipe/${id}`;
  const ogImage = cover || `${origin}/og-image.jpg`;
  const tagMeta = tagNames
    .slice(0, 3)
    .map((t) => `<meta property="article:tag" content="${esc(t)}">`)
    .join("\n");

  const html = `<!doctype html>
<html lang="en">
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(title)}</title>
<link rel="canonical" href="${recipeUrl}">
<meta name="description" content="${esc(description)}">

<meta property="og:site_name" content="Everything Dough">
<meta property="og:type" content="article">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:image" content="${ogImage}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:url" content="${recipeUrl}">
${tagMeta}

<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(title)}">
<meta name="twitter:description" content="${esc(description)}">
<meta name="twitter:image" content="${ogImage}">

<meta http-equiv="refresh" content="0; url=${recipeUrl}">
<body>
  <p>Redirecting to <a href="${recipeUrl}">${recipeUrl}</a>…</p>
  <script>location.replace(${JSON.stringify(recipeUrl)});</script>
</body>
</html>`;

  return new Response(html, {
    headers: {
      "content-type": "text/html; charset=utf-8",
      // cache a bit on the edge; adjust as you like
      "cache-control": "public, max-age=0, s-maxage=60",
    },
  });
}

function esc(s) {
  return String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
