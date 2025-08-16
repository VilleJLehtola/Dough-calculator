// /api/sitemap.js
import { createClient } from '@supabase/supabase-js';

const SITE = 'https://www.breadcalculator.online';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default async function handler(req, res) {
  try {
    const { data, error } = await supabase
      .from('recipes')
      .select('id, updated_at, is_public')
      .order('updated_at', { ascending: false });

    if (error) throw error;

    const publicRecipes = (data || []).filter((r) => r.is_public !== false);

    const urls = [
      { loc: `${SITE}/`, pri: '1.0' },
      { loc: `${SITE}/browse`, pri: '0.8' },
      { loc: `${SITE}/calculator`, pri: '0.8' },
    ];

    publicRecipes.forEach((r) => {
      urls.push({
        loc: `${SITE}/recipe/${r.id}`,
        lastmod: r.updated_at ? new Date(r.updated_at).toISOString() : undefined,
        pri: '0.6',
      });
    });

    const xml =
      `<?xml version="1.0" encoding="UTF-8"?>\n` +
      `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
      urls
        .map(
          (u) => `<url>
  <loc>${u.loc}</loc>
${u.lastmod ? `  <lastmod>${u.lastmod}</lastmod>\n` : ''}  <priority>${u.pri}</priority>
</url>`
        )
        .join('\n') +
      `\n</urlset>`;

    res.setHeader('Content-Type', 'application/xml');
    res.status(200).send(xml);
  } catch (e) {
    console.error('sitemap generation failed', e);
    res.setHeader('Content-Type', 'application/xml');
    res.status(500).send(`<?xml version="1.0" encoding="UTF-8"?><error>failed</error>`);
  }
}
