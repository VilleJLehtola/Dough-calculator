// src/pages/BrowsePage.jsx
import React, { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import supabase from "@/supabaseClient";
import { useTranslation } from "react-i18next";
import SearchBar from "@/components/SearchBar";
import FiltersSheet from "@/components/FiltersSheet";
import SEO from "@/components/SEO";
import SmartImage from "@/components/SmartImage";
import useDebouncedValue from "@/hooks/useDebouncedValue";
import EmptyState from "@/components/states/EmptyState";
import ErrorState from "@/components/states/ErrorState";
import { CARD_SIZES } from "@/utils/img";

const DEFAULT_SIZE = 24;
const MIN_SIZE = 6;
const MAX_SIZE = 60;

export default function BrowsePage() {
  const { t } = useTranslation();
  const [sp, setSp] = useSearchParams();

  // --- init from URL ---
  const initialQ = sp.get("q") || "";
  const initialSort = sp.get("sort") === "oldest" ? "oldest" : "newest";
  const initialImg = sp.get("img") === "1";
  const initialTags = (sp.get("tags") || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const initialSize = clampInt(parseInt(sp.get("size") || DEFAULT_SIZE, 10), MIN_SIZE, MAX_SIZE);

  // core state
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");

  const [q, setQ] = useState(initialQ);
  const qDebounced = useDebouncedValue(q, 300);

  const [filtersOpen, setFiltersOpen] = useState(false);
  const [filters, setFilters] = useState({
    sort: initialSort,     // 'newest' | 'oldest'
    hasImage: initialImg,  // client-side filter
    tags: initialTags,     // tag names
  });

  // pagination
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(initialSize);
  const [hasMore, setHasMore] = useState(true);

  // Popular tags (DB-wide, not just current results)
  const [popularTags, setPopularTags] = useState([]);
  useEffect(() => {
    let alive = true;
    supabase
      .from("tags_popular") // view suggested earlier
      .select("name")
      .limit(24)
      .then(({ data }) => {
        if (!alive) return;
        setPopularTags((data || []).map((x) => x.name));
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  // reflect state -> URL
  useEffect(() => {
    const next = new URLSearchParams(sp);
    q ? next.set("q", q) : next.delete("q");
    next.set("sort", filters.sort);
    filters.hasImage ? next.set("img", "1") : next.delete("img");
    filters.tags?.length ? next.set("tags", filters.tags.join(",")) : next.delete("tags");
    pageSize !== DEFAULT_SIZE ? next.set("size", String(pageSize)) : next.delete("size");
    setSp(next, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, filters.sort, filters.hasImage, filters.tags, pageSize]);

  // restart pagination when core inputs change
  useEffect(() => {
    setPage(0);
  }, [qDebounced, filters.sort, filters.tags, pageSize]);

  // fetch a page
  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      const isFirstPage = page === 0;
      setError("");
      if (isFirstPage) setLoading(true);
      else setLoadingMore(true);

      try {
        // base select: join tag names for display, ask for count
        let query = supabase
          .from("recipes")
          .select(
            "id,title,description,cover_image,images,created_at,recipe_tags(tags(name),tag_id)",
            { count: "exact" }
          )
          .order("created_at", { ascending: filters.sort === "oldest" });

        // tag filter (ANY-of)
        if (filters.tags?.length) {
          query = supabase
            .from("recipes")
            .select(
              "id,title,description,cover_image,images,created_at,recipe_tags!inner(tags(name),tag_id)",
              { count: "exact" }
            )
            .order("created_at", { ascending: filters.sort === "oldest" })
            .in("recipe_tags.tags.name", filters.tags);
        }

        // text search (simple ILIKE on title/description)
        const needle = qDebounced.trim();
        if (needle.length >= 2) {
          const term = `%${needle}%`;
          query = query.or(`title.ilike.${term},description.ilike.${term}`);
        }

        // pagination
        const from = page * pageSize;
        const to = from + pageSize - 1;
        const { data, count, error } = await query.range(from, to);

        if (cancelled) return;
        if (error) throw error;

        const normalized =
          (data || []).map((r) => ({
            ...r,
            tag_names: (r.recipe_tags || []).map((rt) => rt?.tags?.name).filter(Boolean),
          })) || [];

        setRows((prev) => (isFirstPage ? normalized : [...prev, ...normalized]));
        setTotal(count || 0);

        const loadedSoFar = from + (normalized.length || 0);
        setHasMore((count || 0) > loadedSoFar);
      } catch (e) {
        if (!cancelled) {
          setError(e?.message || "Unexpected error");
          if (page === 0) setRows([]);
          setHasMore(false);
          setTotal(0);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
          setLoadingMore(false);
        }
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [qDebounced, filters.sort, filters.tags, page, pageSize]);

  // derived helpers
  const heroFor = (r) => {
    if (r?.cover_image) return r.cover_image;
    if (Array.isArray(r?.images) && r.images.length) {
      const first = r.images[0];
      return typeof first === "string" ? first : first?.url;
    }
    return null;
  };

  const availableTags = useMemo(() => {
    const s = new Set();
    rows.forEach((r) => Array.isArray(r.tag_names) && r.tag_names.forEach((t) => s.add(t)));
    return Array.from(s).sort((a, b) => a.localeCompare(b));
  }, [rows]);

  // client-side image filter
  const filtered = useMemo(() => {
    let list = rows;
    if (filters.hasImage) list = list.filter((r) => !!heroFor(r));
    return list;
  }, [rows, filters.hasImage]);

  const handleSubmit = () => {};

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <SEO
        title="Browse Recipes • Taikinalaskin"
        description="Explore community bread and pizza recipes; filter by style and tags."
        canonical="https://www.breadcalculator.online/browse"
      />

      {/* Header (stack on mobile) */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-2">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          {t("recipe_library", "Recipe library")}
        </h1>

        {/* Search */}
        <div className="w-full sm:max-w-xl">
          <SearchBar
            value={q}
            onChange={setQ}
            onSubmit={handleSubmit}
            onClear={() => setQ("")}
            onOpenFilters={() => setFiltersOpen(true)}
            filtersOpen={filtersOpen}
            filtersControlsId="filters-sheet"
            placeholder={t("search_recipes", "Search recipes")}
          />
        </div>
      </div>

      {/* Subheader: info + page size, wraps on mobile */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
        <p className="text-gray-600 dark:text-gray-400">
          {t("latest_recipes", "Latest recipes")}
        </p>

        <div className="text-xs text-gray-500 dark:text-gray-400 flex flex-wrap items-center gap-2">
          <span className="whitespace-normal">
            {t("showing_of", "Showing")} <strong>{filtered.length}</strong>{" "}
            {t("of", "of")} <strong>{total}</strong> • {t("page", "Page")}{" "}
            <strong>{page + 1}</strong> • {t("page_size", "Page size")}{" "}
            <strong>{pageSize}</strong>
          </span>

          <label className="inline-flex items-center gap-1">
            <span className="sr-only">{t("page_size", "Page size")}</span>
            <select
              value={pageSize}
              onChange={(e) => setPageSize(clampInt(Number(e.target.value), MIN_SIZE, MAX_SIZE))}
              className="border border-gray-300 dark:border-slate-600 rounded px-2 py-1 bg-white dark:bg-slate-800 text-gray-700 dark:text-gray-200"
              aria-label={t("page_size", "Page size")}
            >
              {[12, 24, 36, 48, 60].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      {/* Popular tags row (helps on mobile) */}
      {Array.isArray(popularTags) && popularTags.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-2">
          {popularTags.slice(0, 10).map((tag) => (
            <button
              key={`pop-${tag}`}
              className="text-xs px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-700"
              onClick={() =>
                setFilters((prev) => ({
                  ...prev,
                  tags: Array.from(new Set([...(prev.tags || []), tag])),
                }))
              }
              title={`#${tag}`}
            >
              #{tag}
            </button>
          ))}
        </div>
      )}

      {/* Grid / states */}
      {loading && page === 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-5">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={`s-${i}`}
              className="rounded-xl overflow-hidden border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800"
            >
              <div className="w-full aspect-[4/3] sm:aspect-[16/9] bg-gray-100 dark:bg-slate-900 animate-pulse" />
              <div className="p-3 space-y-2">
                <div className="h-5 w-2/3 bg-gray-100 dark:bg-slate-700 rounded animate-pulse" />
                <div className="h-4 w-4/5 bg-gray-100 dark:bg-slate-700 rounded animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <ErrorState
          title={t("fetch_error", "Could not load recipes")}
          detail={error}
          action={
            <button
              onClick={() => setQ((s) => s)}
              className="px-3 py-1.5 rounded-md text-sm bg-blue-600 text-white hover:bg-blue-500"
            >
              {t("retry", "Retry")}
            </button>
          }
        />
      ) : filtered.length === 0 ? (
        <EmptyState title={t("no_recipes_found", "No recipes found.")}>
          {t("try_adjusting_filters", "Try adjusting filters or clearing the search.")}
        </EmptyState>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-5">
            {filtered.map((r, i) => {
              const hero = heroFor(r);
              const isFirst = i === 0; // mild LCP win
              return (
                <Link
                  key={r.id}
                  to={`/recipe/${r.id}`}
                  className="rounded-xl overflow-hidden border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:shadow transition"
                >
                  <div className="w-full aspect-[4/3] sm:aspect-[16/9] bg-gray-100 dark:bg-slate-900">
                    {hero ? (
                      <SmartImage
                        src={hero}
                        alt={r.title || "Recipe"}
                        className="w-full h-full object-cover"
                        sizes={CARD_SIZES}
                        preferredFormats={["avif", "webp"]}
                        loading={isFirst ? "eager" : "lazy"}
                        fetchPriority={isFirst ? "high" : "low"}
                        decoding="async"
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

                    {/* Tag chips */}
                    {Array.isArray(r.tag_names) && r.tag_names.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {r.tag_names.slice(0, 6).map((tag) => (
                          <button
                            key={tag}
                            className="text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-700"
                            onClick={(e) => {
                              e.preventDefault();
                              setFilters((prev) => ({
                                ...prev,
                                tags: Array.from(new Set([...(prev.tags || []), tag])),
                              }));
                              setFiltersOpen(true);
                            }}
                            title={`#${tag}`}
                          >
                            #{tag}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>

          {/* Load more */}
          {(hasMore || loadingMore) && (
            <div className="flex justify-center mt-6">
              {loadingMore ? (
                <button
                  disabled
                  className="px-4 py-2 rounded-md border border-gray-300 dark:border-slate-600 text-sm opacity-70"
                >
                  {t("loading", "Loading…")}
                </button>
              ) : hasMore ? (
                <button
                  onClick={() => setPage((p) => p + 1)}
                  className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-500"
                >
                  {t("load_more", "Load more")}
                </button>
              ) : null}
            </div>
          )}
        </>
      )}

      {/* Filters sheet */}
      <FiltersSheet
        open={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        onApply={(f) => {
          setFilters(f);
          setFiltersOpen(false);
        }}
        initial={filters}
        availableTags={Array.from(new Set([...(popularTags || []), ...availableTags]))}
      />
    </div>
  );
}

function clampInt(n, min, max) {
  if (!Number.isFinite(n)) return min;
  return Math.min(max, Math.max(min, n));
}
