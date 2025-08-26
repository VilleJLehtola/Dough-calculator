// /api/p/[id].js
// OG-enabled share page for a recipe ID.
// Bots see OG tags with the recipe's cover image; users redirect to /recipe/:id.
export const config = { runtime: "edge" };

export default async function handler(req) {
  const url = new URL(req.url);
  const id = url.pathname.split("/").pop();
  const origin = url.origin;

  let title = "Everything Dough — Recipe";
  let description = "Recipe details and instructions";
  let cover = `${origin}/og-image.jpg`;
  let tags = "";

  try {
    const SUPABASE_URL = process.env.PUBLIC_SUPABASE_URL;
    const ANON = process.env.PUBLIC_SUPABASE_ANON_KEY;

    if (SUPABASE_URL && ANON && id) {
      const q = new URL(`${SUPABASE_URL}/rest/v1/recipes`);
      q.searchParams.set("id", `eq.${id}`);
      q.searchParams.set("select", "title,description,images,cover_image,tags");

      const res = await fetch(q.toString(), {
        headers: { apikey: ANON, Authorization: `Bearer ${ANON}` },
        cache: "no-store",
      });

      if (res.ok) {
        const rows = await res.json();
        const r = rows?.[0];
        if (r) {
          title = r.title || title;
          description = r.description || description;

          // prefer explicit cover_image, then first of images[]
          const firstImg =
            (Array.isArray(r.images) && r.images.length && (r.images[0]?.url || r.images[0])) ||
            r.cover_image ||
            "";
          if (firstImg) cover = firstImg;

          tags = String(r.tags || "")
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean)
            .slice(0, 3)
            .join(", ");
        }
      }
    }
  } catch {
    // keep defaults on any error
  }

  const recipeUrl = `${origin}/recipe/${id}`;
  const ogImage = cover || `${origin}/og-image.jpg`;

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
${tags ? `<meta property="article:tag" content="${esc(tags)}">` : ""}

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
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}

function esc(s) {
  return String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
