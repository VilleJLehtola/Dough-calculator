// /api/og/recipe.js
import { ImageResponse } from "@vercel/og";

export const config = { runtime: "edge" };

export default async function handler(req) {
  const { searchParams, origin } = new URL(req.url);
  const title = (searchParams.get("title") || "Everything Dough").slice(0, 120);
  const by    = (searchParams.get("by") || "").slice(0, 60);
  const tags  = (searchParams.get("tags") || "").slice(0, 80);
  const img   = searchParams.get("img") || `${origin}/og-image.jpg`;

  return new ImageResponse(
    (
      <div
        style={{
          width: 1200,
          height: 630,
          position: "relative",
          display: "flex",
          background: "#0b1220",
          color: "#fff",
          fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Ubuntu, Cantarell, Noto Sans, Helvetica Neue, Arial"
        }}
      >
        {/* Photo */}
        <img
          src={img}
          width={1200}
          height={630}
          style={{ position: "absolute", inset: 0, objectFit: "cover" }}
        />
        {/* Gradient veil */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(180deg, rgba(0,0,0,.35), rgba(0,0,0,.65))"
          }}
        />
        {/* Content */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            padding: 48,
            display: "flex",
            flexDirection: "column",
            justifyContent: "flex-end"
          }}
        >
          <div style={{ fontSize: 48, fontWeight: 700, lineHeight: 1.1, marginBottom: 10 }}>
            {title}
          </div>
          <div style={{ display: "flex", gap: 18, alignItems: "center" }}>
            {by ? <div style={{ fontSize: 26, opacity: 0.9 }}>by {by}</div> : null}
            {tags ? <div style={{ fontSize: 22, opacity: 0.85 }}>#{tags}</div> : null}
          </div>

          <div
            style={{
              position: "absolute",
              top: 24,
              right: 24,
              padding: "8px 14px",
              borderRadius: 999,
              background: "rgba(15,23,42,.8)",
              fontSize: 20
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
