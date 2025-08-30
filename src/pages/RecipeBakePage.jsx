// src/pages/RecipeBakePage.jsx
import React, { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Timer, Maximize2, Minimize2, ChefHat, Clock } from "lucide-react";
import { useTranslation } from "react-i18next";
import supabase from "@/supabaseClient";
import StepTimers from "@/components/StepTimers";
import ErrorState from "@/components/states/ErrorState";
import EmptyState from "@/components/states/EmptyState";

export default function RecipeBakePage() {
  const { id } = useParams();
  const { t } = useTranslation("common");

  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState("");
  const [recipe, setRecipe] = useState(null);
  const [author, setAuthor] = useState(null);

  // i18n for steps/title/desc
  const [tData, setT] = useState(null);
  const [uiLang, setUiLang] = useState(localStorage.getItem("lang") || "auto");
  const targetLang = useMemo(() => (uiLang === "auto" ? "fi" : uiLang), [uiLang]);
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

  // load base recipe
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!id) return;
      setLoading(true);
      setError("");
      try {
        const { data: rec, error: recErr } = await supabase
          .from("recipes")
          .select("*")
          .eq("id", id)
          .single();
        if (recErr) throw recErr;
        if (cancelled) return;
        setRecipe(rec);

        const authorId = rec?.author_id ?? rec?.created_by ?? rec?.user_id ?? null;
        if (authorId) {
          const { data: authRow } = await supabase
            .from("users")
            .select("id, username, full_name, email")
            .eq("id", authorId)
            .maybeSingle();
          if (!cancelled) setAuthor(authRow || null);
        } else {
          setAuthor(null);
        }
      } catch (e) {
        if (!cancelled) {
          setRecipe(null);
          setError(e?.message || "Failed to load recipe");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  // translation payload
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!id) return;
      if (uiLang === "auto") {
        setT(null);
        return;
      }
      try {
        const { data: tr } = await supabase
          .from("recipe_translations")
          .select("title,description,ingredients,steps")
          .eq("recipe_id", id)
          .eq("lang", targetLang)
          .maybeSingle();
        if (!cancelled) {
          setT(
            tr
              ? {
                  title: tr.title ?? undefined,
                  description: tr.description ?? undefined,
                  ingredients: Array.isArray(tr.ingredients) ? tr.ingredients : undefined,
                  steps: Array.isArray(tr.steps) ? tr.steps : undefined,
                }
              : null
          );
        }
      } catch {
        if (!cancelled) setT(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id, uiLang, targetLang]);

  const title = tData?.title ?? recipe?.title ?? recipe?.name ?? "";
  const description = tData?.description ?? recipe?.description ?? "";

  // normalize steps to array of {text, time?}
  const steps = useMemo(() => {
    const base = tData?.steps ?? recipe?.steps ?? [];
    if (Array.isArray(base)) return base;
    return String(base || "")
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean)
      .map((text, i) => ({ position: i + 1, text }));
  }, [tData, recipe]);

  const totalTime = useMemo(() => {
    const raw =
      recipe?.prep_time_minutes ?? recipe?.total_time ?? recipe?.time ?? null;
    if (raw == null) return null;
    const n = Number(String(raw).replace(/[^\d.,]/g, "").replace(",", "."));
    return Number.isFinite(n) ? n : null;
  }, [recipe]);

  // fullscreen helpers
  const [fs, setFs] = useState(!!document.fullscreenElement);
  useEffect(() => {
    const onFs = () => setFs(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onFs);
    return () => document.removeEventListener("fullscreenchange", onFs);
  }, []);
  const enterFs = () => document.documentElement.requestFullscreen?.().catch(() => {});
  const exitFs = () => document.exitFullscreen?.().catch(() => {});

  // states
  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-4 md:p-6">
        <div className="h-32 bg-gray-100 dark:bg-slate-800 rounded-xl animate-pulse" />
      </div>
    );
  }
  if (error) {
    return (
      <div className="max-w-4xl mx-auto p-4 md:p-6">
        <ErrorState title={t("fetch_error", "Could not load recipe")} detail={error} />
      </div>
    );
  }
  if (!recipe) {
    return (
      <div className="max-w-4xl mx-auto p-4 md:p-6">
        <EmptyState title={t("no_recipe", "Recipe not found")} />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6">
      {/* Sticky top bar for quick controls */}
      <div className="sticky top-0 z-20 -mx-4 md:-mx-6 px-4 md:px-6 py-3 mb-4 border-b border-gray-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-2">
              <Link to={`/recipe/${id}`} className="hover:underline">
                ← {t("back_to_recipes", "Back to recipes")}
              </Link>
              <span className="hidden sm:inline text-gray-300">•</span>
              <span className="hidden sm:inline-flex items-center gap-1">
                <ChefHat className="w-3.5 h-3.5" />
                {author?.username || author?.full_name || author?.email || "—"}
              </span>
              {totalTime != null && (
                <>
                  <span className="hidden sm:inline text-gray-300">•</span>
                  <span className="hidden sm:inline-flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    {totalTime} {t("minutes_short", "min")}
                  </span>
                </>
              )}
            </div>
            <h1 className="text-xl md:text-2xl font-semibold leading-tight mt-0.5 text-gray-900 dark:text-gray-100 truncate">
              <span className="inline-flex items-center gap-2">
                <Timer className="w-5 h-5" />
                {title || t("open_recipe", "Recipe")}
              </span>
            </h1>
            {description ? (
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-300 line-clamp-2">
                {description}
              </p>
            ) : null}
          </div>

          <div className="shrink-0">
            {fs ? (
              <button
                onClick={exitFs}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md text-sm border border-gray-300 dark:border-slate-600 hover:bg-gray-50 dark:hover:bg-slate-700"
                title={t("exit_fullscreen", "Exit full screen")}
              >
                <Minimize2 className="w-4 h-4" />
                {t("exit_fullscreen", "Exit full screen")}
              </button>
            ) : (
              <button
                onClick={enterFs}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md text-sm border border-gray-300 dark:border-slate-600 hover:bg-gray-50 dark:hover:bg-slate-700"
                title={t("full_screen", "Full screen")}
              >
                <Maximize2 className="w-4 h-4" />
                {t("full_screen", "Full screen")}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Timers — same component, but it already supports keep-awake & notifications */}
      <div className="rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-3 sm:p-4">
        <StepTimers steps={steps} storageKey={`timers:recipe:${id}`} />
      </div>

      <p className="mt-4 text-xs text-gray-500 dark:text-gray-400">
        {t(
          "bake_mode_tip",
          "Bake mode keeps things clean and readable. Timers will continue even if the screen sleeps; they catch up when you return. Enable notifications for alerts."
        )}
      </p>
    </div>
  );
}
