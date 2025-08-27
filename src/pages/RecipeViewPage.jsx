// src/pages/RecipeViewPage.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useParams, Link } from "react-router-dom";
import supabase from "@/supabaseClient";
import { Clock, Users, ChefHat, Pencil, Scale } from "lucide-react";
import { useTranslation } from "react-i18next";
import LikeFavoriteBar from "@/components/LikeFavoriteBar";
import ShareButton from "@/components/ShareButton";
import CommentsSection from "@/components/CommentsSection";
import { track } from "@/analytics";
import SEO from "@/components/SEO";
import { recipeJsonLd } from "@/seo/jsonld";
import EmptyState from "@/components/states/EmptyState";
import ErrorState from "@/components/states/ErrorState";
import { supaRender, supaSrcSet } from "@/utils/img";
import NutritionCard from "@/components/NutritionCard";
import { computeNutrition, round0 } from "@/utils/nutrition";
import ReportIssueLink from "@/components/ReportIssueLink";
import StepTimers from "@/components/StepTimers"; // shows timers for steps with s.time
import ShoppingListButton from "@/components/ShoppingListButton"; // ⬅️ Add-to-list button
import CopyIngredientsButton from "@/components/CopyIngredientsButton"; // ⬅️ Optional: copy list

const BUCKET = "recipe-images";

// local picture helper to avoid pulling SmartImage here
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

/* ---------------------- Smooth, touch-enabled carousel ---------------------- */
function HeroCarousel({ items = [], title = "", overlay = null, t }) {
  const urls = (items || [])
    .map((im) => (typeof im === "string" ? im : im?.url))
    .filter(Boolean);

  const [idx, setIdx] = useState(0);
  const containerRef = useRef(null);

  // drag state
  const [dragging, setDragging] = useState(false);
  const startX = useRef(0);
  const dx = useRef(0);
  const widthRef = useRef(1);

  const go = (n) => {
    if (!urls.length) return;
    setIdx((prev) => (prev + n + urls.length) % urls.length);
  };

  const onKey = (e) => {
    if (e.key === "ArrowLeft") go(-1);
    if (e.key === "ArrowRight") go(1);
  };

  // touch handlers
  const onTouchStart = (e) => {
    if (!urls.length) return;
    const w = containerRef.current?.clientWidth || window.innerWidth || 1;
    widthRef.current = w;
    startX.current = e.touches[0].clientX;
    dx.current = 0;
    setDragging(true);
  };
  const onTouchMove = (e) => {
    if (!dragging) return;
    dx.current = e.touches[0].clientX - startX.current;
    setDragging((d) => d);
  };
  const onTouchEnd = () => {
    if (!dragging) return;
    const dist = dx.current;
    const w = widthRef.current;
    const threshold = w * 0.2;
    if (Math.abs(dist) > threshold) {
      go(dist > 0 ? -1 : 1);
    }
    setDragging(false);
    dx.current = 0;
  };

  useEffect(() => {
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  if (!urls?.length) {
    return (
      <div className="relative w-full aspect-video bg-gray-200 dark:bg-gray-800 rounded-xl overflow-hidden flex items-center justify-center">
        <div className="text-gray-500 dark:text-gray-400">{title || ""}</div>
        {overlay}
      </div>
    );
  }

  const offsetPct =
    dragging && widthRef.current ? (dx.current / widthRef.current) * 100 : 0;

  return (
    <div
      ref={containerRef}
      className="relative w-full aspect-video rounded-xl overflow-hidden"
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      {/* Sliding track */}
      <div
        className={[
          "w-full h-full flex",
          dragging ? "transition-none" : "transition-transform duration-500 ease-out",
        ].join(" ")}
        style={{
          transform: `translateX(calc(${-idx * 100}% + ${offsetPct}%))`,
          willChange: "transform",
        }}
      >
        {urls.map((u, i) => (
          <div key={`${u}-${i}`} className="w-full h-full flex-shrink-0">
            <PictureImg
              url={u}
              alt={title || `Slide ${i + 1}`}
              className="w-full h-full object-cover"
              sizes="100vw"
              widths={[640, 1200, 1600]}
              eager={i === 0}
              quality={70}
            />
          </div>
        ))}
      </div>

      {/* Overlay (author, description, etc) */}
      {overlay}

      {/* Prev/Next */}
      <button
        aria-label={t("prev_image", "Previous image")}
        className="z-10 absolute left-2 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white rounded-full w-9 h-9 flex items-center justify-center"
        onClick={() => go(-1)}
      >
        ‹
      </button>
      <button
        aria-label={t("next_image", "Next image")}
        className="z-10 absolute right-2 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white rounded-full w-9 h-9 flex items-center justify-center"
        onClick={() => go(1)}
      >
        ›
      </button>

      {/* Dots */}
      <div className="absolute bottom-2 w-full flex items-center justify-center gap-2">
        {urls.map((_, i) => (
          <button
            key={i}
            aria-label={t("go_to_slide", { index: i + 1 })}
            className={`w-2.5 h-2.5 rounded-full ${
              i === idx ? "bg-white" : "bg-white/50 hover:bg-white/80"
            }`}
            onClick={() => setIdx(i)}
          />
        ))}
      </div>
    </div>
  );
}

/* ------------------------------- helpers -------------------------------- */
async function listFolderUrls(folder) {
  const { data: files, error } = await supabase.storage
    .from(BUCKET)
    .list(folder, { limit: 200 });
  if (error || !files?.length) return [];
  return files
    .filter((f) => !f.name.startsWith("."))
    .map((f) => {
      const path = `${folder}/${f.name}`;
      const { data: pub } = supabase.storage.from(BUCKET).getPublicUrl(path);
      return { url: pub.publicUrl, path };
    });
}

/* ---------------------------------- Page ----------------------------------- */
export default function RecipeViewPage() {
  const { t } = useTranslation("common"); // ensure "common" ns, fallback-safe
  const { id } = useParams();

  // Loading / error states
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Recipe + author + images
  const [recipe, setRecipe] = useState(null);
  const [author, setAuthor] = useState(null);
  const [images, setImages] = useState([]); // strings or {url}

  // Translation payload (if any)
  const [tData, setT] = useState(null);

  // UI language
  const [uiLang, setUiLang] = useState(localStorage.getItem("lang") || "auto");
  const targetLang = useMemo(
    () => (uiLang === "auto" ? "fi" : uiLang),
    [uiLang]
  );
  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === "lang") setUiLang(localStorage.getItem("lang") || "auto");
    };
    const onLangChange = (e) =>
      setUiLang(e.detail || localStorage.getItem("lang") || "auto");
    window.addEventListener("storage", onStorage);
    window.addEventListener("langchange", onLangChange);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("langchange", onLangChange);
    };
  }, []);

  // Current user (for Edit and Comments)
  const [userId, setUserId] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  useEffect(() => {
    let alive = true;
    supabase.auth.getUser().then(async ({ data }) => {
      const uid = data?.user?.id ?? null;
      if (!alive) return;
      setUserId(uid);

      if (uid) {
        try {
          const { data: row } = await supabase
            .from("users")
            .select("id, email, username, avatar_url, full_name, is_admin")
            .eq("id", uid)
            .maybeSingle();
          if (row?.is_admin) setIsAdmin(true);
        } catch {}
      }
    });
    return () => {
      alive = false;
    };
  }, []);

  // Load recipe + author + images
  useEffect(() => {
    let cancelled = false;

    (async () => {
      if (!id) return;

      setLoading(true);
      setError("");

      const { data: recRow, error: recErr } = await supabase
        .from("recipes")
        .select("*")
        .eq("id", id)
        .single();

      if (cancelled) return;

      if (recErr) {
        setRecipe(null);
        setAuthor(null);
        setImages([]);
        setError(recErr.message || "Recipe not found");
        setLoading(false);
        return;
      }

      setRecipe(recRow ?? null);

      const authorId =
        recRow?.author_id ?? recRow?.created_by ?? recRow?.user_id ?? null;
      if (authorId) {
        try {
          const { data: authRow, error: authErr } = await supabase
            .from("users")
            .select("id, email, username, avatar_url, full_name")
            .eq("id", authorId)
            .maybeSingle();
          if (!authErr) setAuthor(authRow ?? null);
        } catch {}
      } else {
        setAuthor(null);
      }

      if (Array.isArray(recRow?.images) && recRow.images.length) {
        setImages(recRow.images);
      } else if (recRow?.cover_image) {
        setImages([recRow.cover_image]);
      } else {
        const list = await listFolderUrls(`recipes/${id}`);
        if (!cancelled) setImages(list.map((x) => x.url));
      }

      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [id]);

  // Translation
  useEffect(() => {
    let cancelled = false;

    (async () => {
      if (!id) return;

      if (uiLang === "auto") {
        setT(null);
        return;
      }

      try {
        const { data: trRow } = await supabase
          .from("recipe_translations")
          .select("title,description,ingredients,steps")
          .eq("recipe_id", id)
          .eq("lang", targetLang)
          .maybeSingle();

        if (trRow) {
          setT({
            title: trRow.title ?? undefined,
            description: trRow.description ?? undefined,
            ingredients: Array.isArray(trRow.ingredients)
              ? trRow.ingredients
              : undefined,
            steps: Array.isArray(trRow.steps) ? trRow.steps : undefined,
          });
        } else {
          setT(null);
        }
      } catch {
        setT(null);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [id, uiLang, targetLang]);

  // Analytics
  useEffect(() => {
    if (!recipe?.id) return;
    track("Recipe Viewed", {
      recipe_id: recipe.id,
      recipe_slug: recipe.slug || "",
      lang: localStorage.getItem("lang") || "auto",
    });
  }, [recipe?.id, recipe?.slug]);

  // Derive renderables
  const title = tData?.title ?? recipe?.title ?? recipe?.name ?? "";
  const description = tData?.description ?? recipe?.description ?? "";
  const ingredientsRaw = useMemo(() => {
    const base = tData?.ingredients ?? recipe?.ingredients ?? [];
    if (Array.isArray(base)) return base;
    return String(base || "")
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean)
      .map((name) => ({ name }));
  }, [tData, recipe]);

  const steps = useMemo(() => {
    const base = tData?.steps ?? recipe?.steps ?? [];
    if (Array.isArray(base)) return base;
    return String(base || "")
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean)
      .map((text, i) => ({ position: i + 1, text }));
  }, [tData, recipe]);

  const tags = useMemo(
    () =>
      String(recipe?.tags ?? "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
    [recipe]
  );

  const totalTime = useMemo(() => {
    const raw =
      recipe?.prep_time_minutes ?? recipe?.total_time ?? recipe?.time ?? null;
    if (raw == null) return null;
    const n = Number(String(raw).replace(/[^\d.,]/g, "").replace(",", "."));
    return Number.isFinite(n) ? n : null;
  }, [recipe]);

  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 640);
  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 640);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const [showScale, setShowScale] = useState(false);
  useEffect(() => {
    if (showScale && isMobile) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = prev;
      };
    }
  }, [showScale, isMobile]);

  const baseFlour = useMemo(() => {
    return ingredientsRaw.reduce((sum, ing) => {
      const amt = Number(ing.amount);
      const isFlour =
        Boolean(ing.isFlour) || /(jauho|flour)/i.test(ing.name || "");
      return sum + (isFlour && Number.isFinite(amt) ? amt : 0);
    }, 0);
  }, [ingredientsRaw]);

  const [scale, setScale] = useState(1);
  const percent = Math.round(scale * 100);
  const targetFlour = baseFlour ? Math.round(baseFlour * scale) : null;

  // Helpers to update scale from inputs
  const setByPercent = (val) => {
    const p = Math.max(5, Math.min(400, Number(val) || 0));
    setScale(p / 100);
  };
  const setByTargetFlour = (val) => {
    const tg = Math.max(1, Number(val) || 0);
    if (!baseFlour) return;
    setScale(tg / baseFlour);
  };

  const scaledIngredients = useMemo(() => {
    if (!ingredientsRaw?.length) return [];
    return ingredientsRaw.map((ing) => {
      const amt = Number(ing.amount);
      if (!Number.isFinite(amt)) return { ...ing };
      return { ...ing, amount: Math.round(amt * scale * 10) / 10 };
    });
  }, [ingredientsRaw, scale]);

  // Build a nutrition-ready recipe that follows the current scale
  const recipeForNutrition = useMemo(() => {
    return {
      ...recipe,
      ingredients:
        (scaledIngredients?.length ? scaledIngredients : recipe?.ingredients) || [],
    };
  }, [recipe, scaledIngredients]);

  // --- Nutrition for JSON-LD (SEO) ---
  const DEFAULT_BAKE_LOSS = 15; // %
  const DEFAULT_SLICE_GRAMS = 50; // g

  const nut = useMemo(() => {
    try {
      return computeNutrition(recipeForNutrition, {
        bakeLossPct: DEFAULT_BAKE_LOSS,
        sliceGrams: DEFAULT_SLICE_GRAMS,
      });
    } catch {
      return null;
    }
  }, [recipeForNutrition]);

  const nutritionJsonLd = useMemo(() => {
    if (!nut) return undefined;
    return {
      calories: `${round0(nut.perSlice.kcal)} kcal`,
      carbohydrateContent: `${round0(nut.perSlice.carbs)} g`,
      proteinContent: `${round0(nut.perSlice.protein)} g`,
      fatContent: `${round0(nut.perSlice.fat)} g`,
      fiberContent: `${round0(nut.perSlice.fiber)} g`,
      sodiumContent: `${round0(nut.perSlice.sodium_mg)} mg`,
      servingSize: `${DEFAULT_SLICE_GRAMS} g`,
    };
  }, [nut]);

  const user = userId ? { id: userId } : null;

  const ogImage = (images?.[0]?.url || images?.[0]) ?? undefined;
  const json = recipeJsonLd({
    name: title,
    description,
    images: ogImage ? [ogImage] : [],
    ingredients: ingredientsRaw,
    instructions: steps,
    authorName: author?.full_name || author?.username || undefined,
    datePublished: recipe?.created_at,
    totalTime: recipe?.total_time_iso,
    prepTime: recipe?.prep_time_iso,
    cookTime: recipe?.cook_time_iso,
    recipeYield: recipe?.servings ? String(recipe.servings) : undefined,
    nutrition: nutritionJsonLd, // include if available
  });

  // Loading / Error / Empty
  if (loading) {
    return (
      <div className="max-w-5xl mx-auto p-4 md:p-6">
        <div className="h-48 bg-gray-100 dark:bg-slate-800 rounded-xl animate-pulse" />
      </div>
    );
  }
  if (error) {
    return (
      <div className="max-w-5xl mx-auto p-4 md:p-6">
        <ErrorState
          title={t("fetch_error", "Could not load recipe")}
          detail={error}
        />
      </div>
    );
  }
  if (!recipe) {
    return (
      <div className="max-w-5xl mx-auto p-4 md:p-6">
        <EmptyState title={t("no_recipe", "Recipe not found")} />
      </div>
    );
  }

  const canEdit =
    !!userId &&
    (userId ===
      (recipe?.author_id ?? recipe?.created_by ?? recipe?.user_id) ||
      isAdmin);

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-6">
      {/* Quick help links */}
      <div className="my-4 text-sm text-gray-600 dark:text-gray-300 flex flex-wrap gap-3">
        <span className="font-medium">{t("help", "Help")}:</span>
        <Link to="/faq#hydration" className="underline">
          {t("faq.items.hydration.title", "Hydration %")}
        </Link>
        <Link to="/faq#stretch_fold" className="underline">
          {t("faq.items.stretch_fold.title", "Stretch & fold")}
        </Link>
        <Link to="/faq#cold" className="underline">
          {t("faq.items.cold.title", "Cold ferment")}
        </Link>
        <Link to="/faq#scoring" className="underline">
          {t("faq.items.scoring.title", "Scoring")}
        </Link>
      </div>

      <SEO
        title={`${title || t("recipe", "Recipe")} • ${t("recipe", "Recipe")}`}
        description={
          description ||
          t("recipe_description_fallback", "Recipe details and instructions")
        }
        ogImage={ogImage}
        canonical={`https://www.breadcalculator.online/recipe/${id}`}
        jsonLd={json}
        jsonLdId={`recipe-${id}`}
      />

      {/* Breadcrumbs */}
      <div className="text-sm text-gray-500 dark:text-gray-400 mb-3">
        <Link to="/browse" className="hover:underline">
          {t("recipe_library")}
        </Link>
        <span className="px-2">/</span>
        <span className="text-gray-900 dark:text-gray-100">
          {title || t("open_recipe")}
        </span>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl md:text-3xl font-semibold text-gray-900 dark:text-gray-100">
            {title || t("open_recipe")}
          </h1>

          {(author?.username || author?.email || description) && (
            <div className="mt-2 flex items-center gap-4 text-sm text-gray-600 dark:text-gray-300">
              {author?.username || author?.email ? (
                <div className="flex items-center gap-2">
                  <ChefHat className="w-4 h-4" />
                  <span>{author?.username || author?.email}</span>
                </div>
              ) : null}

              {description ? (
                <div className="line-clamp-2">{description}</div>
              ) : null}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto min-w-0">
          {totalTime != null && (
            <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200">
              <Clock className="w-3.5 h-3.5" />
              {`${totalTime} ${t("minutes_short")}`}
            </span>
          )}

          {recipe?.servings != null && (
            <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200">
              <Users className="w-3.5 h-3.5" />
              {recipe.servings}
            </span>
          )}

          <LikeFavoriteBar recipeId={id} userId={userId} t={t} />

          <ShareButton
            title={title}
            text={description}
            onShare={(method) =>
              track("Share Clicked", {
                method,
                url: window.location.href,
                recipe_id: id,
              })
            }
          />

          {canEdit && (
            <Link
              to={`/recipe/${id}/edit`}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md text-sm bg-blue-600 text-white hover:bg-blue-700"
            >
              <Pencil className="w-4 h-4" />
              <span className="hidden sm:inline">{t("edit", "Edit")}</span>
              <span className="sm:hidden" aria-label={t("edit", "Edit")}>
                ✎
              </span>
            </Link>
          )}

          {/* Report issue (header actions) */}
          <ReportIssueLink context="RecipeView" extra={{ recipeId: id }} />
        </div>
      </div>

      {/* HERO CAROUSEL (priority first slide) */}
      <HeroCarousel title={title} items={images} t={t} overlay={null} />

      {/* Tags */}
      {tags?.length > 0 && (
        <div className="mt-6 flex flex-wrap items-center gap-2">
          {tags.map((tag, i) => (
            <span
              key={`${tag}-${i}`}
              className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200"
            >
              # {tag}
            </span>
          ))}
        </div>
      )}

      {/* Two-column layout */}
      <div className="mt-6 grid grid-cols-1 lg:grid-cols-[1.05fr_1.35fr] gap-6">
        {/* Ingredients */}
        <section className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-200 dark:border-slate-700 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              {t("ingredients")}
            </h2>
            <div className="flex items-center gap-2">
              {/* Optional helper */}
              <CopyIngredientsButton title={title} ingredients={scaledIngredients} />
              {/* ✅ Add-to-shopping-list button */}
              <ShoppingListButton title={title} ingredients={scaledIngredients} />
              <button
                onClick={() => setShowScale(true)}
                className="inline-flex items-center gap-1 text-sm px-2.5 py-1.5 rounded-md border border-gray-300 dark:border-slate-600 hover:bg-gray-50 dark:hover:bg-slate-700"
              >
                <Scale className="w-4 h-4" />
                {t("scale_recipe", "Scale")}
              </button>
            </div>
          </div>

          {showScale && !isMobile && (
            <div className="px-4 pt-4 pb-2 border-b border-gray-200 dark:border-slate-700 text-sm space-y-3">
              <div className="flex flex-wrap items-center gap-3">
                <span className="opacity-80">
                  {t("total_flour", "Total flour")}:{" "}
                  <strong>{baseFlour || 0} g</strong>
                </span>
                <span className="opacity-80">
                  {t("target_flour", "Target flour")}:{" "}
                  <strong>{targetFlour ?? "—"} g</strong>
                </span>
                <span className="opacity-80">
                  {t("scale", "Scale")}: <strong>{percent}%</strong>
                </span>
              </div>

              <div className="grid sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-xs opacity-80">
                    {t("target_flour_input", "Target flour (g)")}
                  </label>
                  <input
                    type="number"
                    min="1"
                    disabled={!baseFlour}
                    value={targetFlour ?? ""}
                    onChange={(e) => setByTargetFlour(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white p-2 disabled:opacity-60"
                    placeholder={
                      baseFlour
                        ? String(baseFlour)
                        : t("no_flour_marked", "No flour marked")
                    }
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs opacity-80">
                    {t("percent", "Percent")}
                  </label>
                  <input
                    type="number"
                    min="5"
                    step="5"
                    value={percent}
                    onChange={(e) => setByPercent(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white p-2"
                    placeholder="100"
                  />
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {[50, 75, 100, 150, 200, 300, 400].map((p) => (
                  <button
                    key={p}
                    onClick={() => setByPercent(p)}
                    className={`px-2.5 py-1 rounded-md text-xs border ${
                      percent === p
                        ? "bg-blue-600 text-white border-blue-600"
                        : "border-gray-300 dark:border-slate-600 hover:bg-gray-50 dark:hover:bg-slate-700"
                    }`}
                  >
                    {p}%
                  </button>
                ))}
                <button
                  onClick={() => setScale(1)}
                  className="ml-1 px-2.5 py-1 rounded-md text-xs border border-gray-300 dark:border-slate-600 hover:bg-gray-50 dark:hover:bg-slate-700"
                >
                  {t("reset", "Reset")}
                </button>
              </div>

              {!baseFlour && (
                <p className="text-xs opacity-75">
                  {t(
                    "percent_only_note",
                    "Note: No flour is marked in this recipe. Scaling uses percent only."
                  )}
                </p>
              )}
            </div>
          )}

          <div className="p-4 overflow-x-auto">
            {scaledIngredients?.length ? (
              <ul className="space-y-2">
                {scaledIngredients.map((ing, i) => (
                  <li key={i} className="flex items-center justify-between">
                    <span className="text-gray-800 dark:text-gray-100">
                      {ing.name ?? ""}
                    </span>
                    {ing.amount != null && (
                      <span className="text-gray-600 dark:text-gray-300">
                        {ing.amount} {indentedUnit(ing.unit)}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-sm text-gray-500 dark:text-gray-400">
                {t("no_ingredients_listed")}
              </div>
            )}
          </div>
        </section>

        {/* Instructions */}
        <section className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-200 dark:border-slate-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              {t("instructions")}
            </h2>
          </div>

          {/* Step timers (reads steps with s.time minutes) */}
          <div className="px-4 pt-3">
            <StepTimers steps={steps} />
          </div>

          <div className="p-4">
            {steps?.length ? (
              <ol className="list-decimal pl-5 space-y-2">
                {steps.map((s, i) => (
                  <li key={i} className="text-gray-800 dark:text-gray-100">
                    {s.text ?? String(s ?? "")}
                    {s.time != null && (
                      <span className="ml-2 text-xs px-1.5 py-0.5 rounded bg-gray-100 dark:bg-slate-700">
                        +{s.time} {t("minutes_short")}
                      </span>
                    )}
                  </li>
                ))}
              </ol>
            ) : (
              <div className="text-sm text-gray-500 dark:text-gray-400">
                {t("no_instructions_provided")}
              </div>
            )}
          </div>
        </section>

        {/* Nutrition (right column) */}
        <section className="lg:col-start-2">
          {/* Pass scaled ingredients so Per loaf reacts to scaling */}
          <NutritionCard recipe={recipeForNutrition} />
        </section>

        {/* Comments */}
        {recipe?.id ? (
          <CommentsSection recipeId={recipe.id} user={user} />
        ) : null}
      </div>

      {/* Back link + report issue */}
      <div className="mt-6 flex items-center gap-3">
        <Link
          to="/browse"
          className="inline-block text-sm text-blue-600 dark:text-blue-400 hover:underline"
        >
          ← {t("back_to_recipes")}
        </Link>
        <span className="text-gray-400">•</span>
        <ReportIssueLink context="RecipeView" extra={{ recipeId: id }} />
      </div>

      {/* Mobile scale bottom sheet */}
      {showScale && isMobile && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/50"
            onClick={() => setShowScale(false)}
            aria-label="Close scale sheet"
          />
          <div className="fixed z-50 bottom-0 inset-x-0 rounded-t-2xl bg-white dark:bg-slate-900 shadow-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="font-medium flex items-center gap-2">
                <Scale className="w-4 h-4" /> {t("scale_recipe", "Scale recipe")}
              </div>
              <button
                onClick={() => setShowScale(false)}
                className="px-3 py-1 rounded-md border border-gray-300 dark:border-slate-600 text-xs"
              >
                {t("done", "Done")}
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <span className="opacity-80">
                {t("total_flour", "Total flour")}: <strong>{baseFlour || 0} g</strong>
              </span>
              <span className="opacity-80">
                {t("target_flour", "Target flour")}:{" "}
                <strong>{targetFlour ?? "—"} g</strong>
              </span>
              <span className="opacity-80">
                {t("scale", "Scale")}: <strong>{percent}%</strong>
              </span>
            </div>

            <div className="grid grid-cols-1 gap-3">
              <div className="space-y-1">
                <label className="block text-xs opacity-80">
                  {t("target_flour_input", "Target flour (g)")}
                </label>
                <input
                  type="number"
                  min="1"
                  disabled={!baseFlour}
                  value={targetFlour ?? ""}
                  onChange={(e) => setByTargetFlour(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white p-2 disabled:opacity-60"
                  placeholder={
                    baseFlour ? String(baseFlour) : t("no_flour_marked", "No flour marked")
                  }
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs opacity-80">{t("percent", "Percent")}</label>
                <input
                  type="number"
                  min="5"
                  step="5"
                  value={percent}
                  onChange={(e) => setByPercent(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white p-2"
                  placeholder="100"
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {[50, 75, 100, 150, 200, 300, 400].map((p) => (
                <button
                  key={p}
                  onClick={() => setByPercent(p)}
                  className={`px-2.5 py-1 rounded-md text-xs border ${
                    percent === p
                      ? "bg-blue-600 text-white border-blue-600"
                      : "border-gray-300 dark:border-slate-600 hover:bg-gray-50 dark:hover:bg-slate-700"
                  }`}
                >
                  {p}%
                </button>
              ))}
              <button
                onClick={() => setScale(1)}
                className="ml-1 px-2.5 py-1 rounded-md text-xs border border-gray-300 dark:border-slate-600 hover:bg-gray-50 dark:hover:bg-slate-700"
              >
                {t("reset", "Reset")}
              </button>
            </div>

            {!baseFlour && (
              <p className="text-xs opacity-75">
                {t(
                  "percent_only_note",
                  "Note: No flour is marked in this recipe. Scaling uses percent only."
                )}
              </p>
            )}
          </div>
        </>
      )}
    </div>
  );
}

// small helper to avoid "undefined" in UI
function indentedUnit(unit) {
  return unit ? unit : "";
}
