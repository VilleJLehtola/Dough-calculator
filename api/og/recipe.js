// /api/og/recipe.js
// Dynamic Open Graph image for a recipe.
// Usage: /api/og/recipe?title=...&by=...&img=https://.../image.jpg
import { ImageResponse } from '@vercel/og';

export const config = { runtime: 'edge' };

export default async function handler(req) {
  const { searchParams, origin } = new URL(req.url);
  const title = (searchParams.get('title') || 'Everything Dough').slice(0, 120);
  const by = (searchParams.get('by') || '').slice(0, 60);
  const tags = (searchParams.get('tags') || '').slice(0, 80);
  const img = searchParams.get('img');

  const bg = img || `${origin}/og-image.jpg`;

  return new ImageResponse(
    (
      // No custom font (keep it robust). Clean gradient overlay + photo bg.
      // Size 1200x630 (Twitter/FB large image).
      <div
        style={{
          width: '1200px',
          height: '630px',
          display: 'flex',
          position: 'relative',
          backgroundImage: `linear-gradient(180deg, rgba(0,0,0,0.35), rgba(0,0,0,0.65)), url(${bg})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: '0',
            padding: '48px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-end',
            color: '#fff',
          }}
        >
          <div style={{ fontSize: 48, fontWeight: 700, lineHeight: 1.1, marginBottom: 10 }}>
            {title}
          </div>
          <div style={{ display: 'flex', gap: 18, alignItems: 'center' }}>
            {by ? <div style={{ fontSize: 26, opacity: 0.9 }}>by {by}</div> : null}
            {tags ? <div style={{ fontSize: 22, opacity: 0.8 }}>#{tags}</div> : null}
          </div>

          <div
            style={{
              position: 'absolute',
              top: 24,
              right: 24,
              padding: '8px 14px',
              borderRadius: 999,
              background: 'rgba(15,23,42,.8)',
              fontSize: 20,
            }}
          >
            Everything Dough
          </div>
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
