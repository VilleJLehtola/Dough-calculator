// src/pages/FrontPage.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import supabase from "@/supabaseClient";
import SEO from "@/components/SEO";
import { track } from "@/analytics";
import SmartImage from "@/components/SmartImage";
import { supaRender, supaSrcSet, CARD_SIZES } from "@/utils/img";

/**
 * Utilities
 */
const BUCKET = "recipe-images";

function heroForRow(r) {
  if (r?.cover_image) return r.cover_image;
  if (Array.isArray(r?.images) && r.images.length) {
    const first = r.images[0];
    return typeof first === "string" ? first : first?.url || null;
  }
  return null;
}

// Try to produce a WebP/AVIF variant for common sources (Unsplash & generic)
function toNextGen(url) {
  if (!url) return url;
  try {
    const u = new URL(url);
    // Unsplash supports fm=webp/avif
    if (/images\.unsplash\.com/i.test(u.hostname)) {
      u.searchParams.set("fm", "webp");
      u.searchParams.set("auto", "format");
      u.searchParams.set("q", "80");
      return u.toString();
    }
    // Generic best effort (many CDNs accept format/webp)
    if (!u.searchParams.has("format")) {
      u.searchParams.set("format", "webp");
    }
    return u.toString();
  } catch {
    // If it's not a valid URL (e.g., relative), leave as-is
    return url;
  }
}

/**
 * LCP-friendly Picture (hero) — eager, high priority, sized.
 * Falls back cleanly if the source doesn't actually support WebP.
 */
function HeroPicture({ src, alt = "", className = "", priority = false }) {
  const isSupa = typeof src === "string" && src.includes("/storage/v1/object/public/");
  const sizes = "100vw";
  const isPriority = Boolean(priority);

  if (isSupa) {
    const srcSetWebp = supaSrcSet(src, [640, 960, 1280, 1600, 1920], {
      format: "webp",
      quality: 80,
      resize: "cover",
    });
    const srcSetAvif = supaSrcSet(src, [640, 960, 1280, 1600, 1920], {
      format: "avif",
      quality: 70,
      resize: "cover",
    });
    const fallback = supaRender(src, { width: 1280, quality: 80, format: "webp" });

    return (
      <picture>
        <source type="image/avif" srcSet={srcSetAvif} sizes={sizes} />
        <source type="image/webp" srcSet={srcSetWebp} sizes={sizes} />
        <img
          src={fallback}
          alt={alt}
          className={className}
          loading={isPriority ? "eager" : "lazy"}
          fetchPriority={isPriority ? "high" : "auto"}
          decoding="async"
          sizes={sizes}
        />
      </picture>
    );
  }

  // Fallback for Unsplash/others (we still try next-gen via query params)
  const u = new URL(src, window.location.origin);
  if (/images\.unsplash\.com/i.test(u.hostname)) {
    u.searchParams.set("fm", "webp");
    u.searchParams.set("auto", "format");
    u.searchParams.set("q", "80");
  }
  return (
    <img
      src={u.toString()}
      alt={alt}
      className={className}
      loading={isPriority ? "eager" : "lazy"}
      fetchPriority={isPriority ? "high" : "auto"}
      decoding="async"
      sizes={sizes}
    />
  );
}

/**
 * Card image for thumbnails — lazy by default, responsive sizes.
 */
function ThumbImage({ src, alt = "", className = "" }) {
  const sizes =
    "(min-width:1536px) 18vw, (min-width:1280px) 22vw, (min-width:1024px) 25vw, (min-width:640px) 33vw, 100vw";
  // Use SmartImage for caching/error-handling you already have;
  // pass the perf hints so Lighthouse is happy.
  return (
    <SmartImage
      src={src}
      alt={alt}
      className={className}
      loading="lazy"
      decoding="async"
      sizes={sizes}
    />
  );
}

export default function FrontPage() {
  const [latest, setLatest] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch a light list for the front page
  useEffect(() => {
    let cancelled = false;

    async function run() {
      setLoading(true);
      try {
        // Use the light browse view if you have it; otherwise select only the needed columns
        const { data, error } = await supabase
          .from("browse_recipes_v")
          .select(
            "id,title,description,cover_image,images,created_at,username,email,tags"
          )
          .order("created_at", { ascending: false })
          .limit(12);

        if (cancelled) return;

        if (error) {
          console.warn("frontpage fetch error", error);
          setLatest([]);
        } else {
          setLatest(data || []);
        }
      } catch (e) {
        if (!cancelled) {
          console.warn("frontpage unexpected error", e);
          setLatest([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    run();
    track("Homepage Viewed");
    return () => {
      cancelled = true;
    };
  }, []);

  // Pick an LCP hero (first with an image)
  const hero = useMemo(() => {
    for (const r of latest) {
      const img = heroForRow(r);
      if (img) return { ...r, hero: img };
    }
    return null;
  }, [latest]);

  const rest = useMemo(() => {
    const skipId = hero?.id;
    return latest.filter((r) => r.id !== skipId);
  }, [latest, hero?.id]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <SEO
        title="Everything Dough • Taikinalaskin"
        description="Browse community bread & pizza recipes, calculate your dough, and learn faster."
        canonical="https://www.breadcalculator.online/"
      />

      {/* HERO (LCP) */}
      <section
        className="relative w-full mt-2 mb-6 rounded-2xl overflow-hidden ring-1 ring-white/10"
        aria-label="Highlighted recipe"
      >
        <div className="w-full aspect-[21/9] sm:aspect-[16/7]">
          {hero?.hero ? (
            <HeroPicture
              src={hero.hero}
              alt={hero.title || "Featured recipe"}
              className="w-full h-full object-cover"
              sizes="100vw"
              priority
            />
          ) : (
            <div className="w-full h-full bg-gray-100 dark:bg-slate-900 animate-pulse" />
          )}
        </div>

        {/* Overlay copy is kept minimal to avoid shifting and layout cost */}
        {hero && (
          <div className="absolute inset-x-0 bottom-0 p-4 sm:p-6 bg-gradient-to-t from-black/50 to-transparent">
            <div className="max-w-3xl">
              <h1 className="text-xl sm:text-2xl font-semibold text-white drop-shadow">
                {hero.title}
              </h1>
              {hero.description ? (
                <p className="mt-1 text-white/90 line-clamp-2">
                  {hero.description}
                </p>
              ) : null}
              <Link
                to={`/recipe/${hero.id}`}
                className="mt-3 inline-flex items-center px-3 py-1.5 rounded-md bg-white/90 text-gray-900 hover:bg-white"
              >
                Open recipe
              </Link>
            </div>
          </div>
        )}
      </section>

      {/* LATEST GRID */}
      <section aria-label="Latest recipes">
        <div className="flex items-baseline justify-between mb-2">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Latest recipes
          </h2>
          <Link
            to="/browse"
            className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
          >
            Browse all →
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
            {[...Array(8)].map((_, i) => (
              <div
                key={`s-${i}`}
                className="rounded-xl overflow-hidden border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800"
              >
                <div className="w-full aspect-[16/9] bg-gray-100 dark:bg-slate-900 animate-pulse" />
                <div className="p-3 space-y-2">
                  <div className="h-5 w-2/3 bg-gray-100 dark:bg-slate-700 rounded animate-pulse" />
                  <div className="h-4 w-4/5 bg-gray-100 dark:bg-slate-700 rounded animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        ) : rest.length === 0 ? (
          <div className="text-gray-600 dark:text-gray-300">
            No recipes yet.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
            {rest.map((r) => {
              const img = heroForRow(r);
              return (
                <Link
                  key={r.id}
                  to={`/recipe/${r.id}`}
                  className="rounded-xl overflow-hidden border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:shadow transition"
                  aria-label={`Open recipe ${r.title || ""}`}
                >
                  <div className="w-full aspect-[16/9] bg-gray-100 dark:bg-slate-900">
                    {img ? (
                      <ThumbImage
                        src={img}
                        alt={r.title || "Recipe"}
                        className="w-full h-full object-cover"
                      />
                    ) : null}
                  </div>
                  <div className="p-3">
                    <div className="font-semibold text-gray-900 dark:text-white line-clamp-1">
                      {r.title || "Recipe"}
                    </div>
                    {r.description ? (
                      <div className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2">
                        {r.description}
                      </div>
                    ) : null}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      {/* BELOW-THE-FOLD sections: keep light or add with IntersectionObserver later if needed */}
    </div>
  );
}
