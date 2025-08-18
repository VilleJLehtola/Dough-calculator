// src/pages/FrontPage.jsx
import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import supabase from "@/supabaseClient";
import { useTranslation } from "react-i18next";
import SEO from "@/components/SEO";
import { supaRender, supaSrcSet, CARD_SIZES } from "@/utils/img";

// small picture helper for cards/heroes
function PictureImg({
  url,
  alt = "",
  className = "",
  sizes = "100vw",
  widths = [640, 1200],
  eager = false,
  quality = 72,
}) {
  if (!url) return <div className={`bg-gray-200 dark:bg-slate-800 ${className}`} />;
  return (
    <picture>
      <source
        type="image/avif"
        srcSet={supaSrcSet(url, widths, { format: "avif", quality })}
        sizes={sizes}
      />
      <source
        type="image/webp"
        srcSet={supaSrcSet(url, widths, { format: "webp", quality })}
        sizes={sizes}
      />
      <img
        src={supaRender(url, { width: widths[widths.length - 1], format: "webp", quality })}
        alt={alt}
        className={className}
        loading={eager ? "eager" : "lazy"}
        fetchPriority={eager ? "high" : "auto"}
        decoding={eager ? "sync" : "async"}
        draggable="false"
      />
    </picture>
  );
}

const ADMIN_USERNAMES = ["ville_jlehtola"]; // tweak as needed

export default function FrontPage() {
  const { t } = useTranslation();

  const [latestAdmin, setLatestAdmin] = useState([]);
  const [mostLiked, setMostLiked] = useState([]);
  const [hero, setHero] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoading(true);
      try {
        // Latest from admins
        const { data: latestRows } = await supabase
          .from("browse_recipes_v")
          .select(
            "id,title,description,cover_image,images,username,tags,likes_count,created_at"
          )
          .in("username", ADMIN_USERNAMES)
          .order("created_at", { ascending: false })
          .limit(8);

        // Most liked (site-wide)
        const { data: likedRows } = await supabase
          .from("browse_recipes_v")
          .select(
            "id,title,description,cover_image,images,username,tags,likes_count,created_at"
          )
          .order("likes_count", { ascending: false, nullsFirst: false })
          .order("created_at", { ascending: false })
          .limit(8);

        if (cancelled) return;

        setLatestAdmin(latestRows || []);
        setMostLiked(likedRows || []);

        // Hero from the newest admin recipe that has an image
        const heroRow = (latestRows || []).find((r) => {
          if (r?.cover_image) return true;
          return Array.isArray(r?.images) && r.images.length > 0;
        });
        const heroUrl =
          heroRow?.cover_image ||
          (Array.isArray(heroRow?.images) ? heroRow.images[0] : null);
        setHero(typeof heroUrl === "string" ? heroUrl : heroUrl?.url || null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const cardImageFor = (row) => {
    if (row?.cover_image) return row.cover_image;
    if (Array.isArray(row?.images) && row.images.length) {
      const first = row.images[0];
      return typeof first === "string" ? first : first?.url;
    }
    return null;
  };

  const renderCard = (r) => {
    const img = cardImageFor(r);
    return (
      <Link
        key={r.id}
        to={`/recipe/${r.id}`}
        className="rounded-xl overflow-hidden border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:shadow transition"
      >
        <div className="w-full aspect-[16/9] bg-gray-100 dark:bg-slate-900">
          {img ? (
            <PictureImg
              url={img}
              alt={r.title || "Recipe"}
              className="w-full h-full object-cover"
              sizes={CARD_SIZES}
              widths={[360, 600, 900]}
              eager={false}
              quality={72}
            />
          ) : null}
        </div>
        <div className="p-3">
          <div className="font-semibold text-gray-900 dark:text-white line-clamp-1">
            {r.title}
          </div>
          {r.description ? (
            <div className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2">
              {r.description}
            </div>
          ) : null}

          {Array.isArray(r.tags) && r.tags.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {r.tags.slice(0, 5).map((tag) => (
                <span
                  key={`${r.id}-${tag}`}
                  className="text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-700"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </Link>
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <SEO
        title="Everything Dough • Home"
        description="Latest recipes from the team and the community’s most liked bakes."
        canonical="https://www.breadcalculator.online/"
      />

      {/* HERO (no toolbar text) */}
      <div className="relative w-full aspect-[21/6] rounded-2xl overflow-hidden mb-6 ring-1 ring-white/10">
        {hero ? (
          <PictureImg
            url={hero}
            alt="Hero"
            className="w-full h-full object-cover"
            sizes="100vw"
            widths={[640, 1200, 1600]}
            eager
            quality={70}
          />
        ) : (
          <div className="w-full h-full bg-gray-100 dark:bg-slate-900" />
        )}
        <div className="absolute inset-0 bg-gradient-to-tr from-black/20 to-transparent pointer-events-none" />
      </div>

      {/* LATEST FROM THE TEAM */}
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          {t("latest_from_team", "Latest from the team")}
        </h2>
        <Link
          to="/browse"
          className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
        >
          {t("browse_all", "Browse all")}
        </Link>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
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
      ) : latestAdmin?.length ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {latestAdmin.map(renderCard)}
        </div>
      ) : (
        <div className="text-gray-600 dark:text-gray-300 mb-8">
          {t("no_latest", "No recent admin recipes.")}
        </div>
      )}

      {/* MOST LIKED */}
      <div className="mt-8 flex items-center justify-between mb-2">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          {t("most_liked", "Most liked")}
        </h2>
        <Link
          to="/browse"
          className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
        >
          {t("browse_all", "Browse all")}
        </Link>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <div
              key={`s2-${i}`}
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
      ) : mostLiked?.length ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {mostLiked.map(renderCard)}
        </div>
      ) : (
        <div className="text-gray-600 dark:text-gray-300">
          {t("no_mostliked", "No most liked recipes yet.")}
        </div>
      )}
    </div>
  );
}
