// src/pages/BakeModePage.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import supabase from "@/supabaseClient";
import StepTimers from "@/components/StepTimers";
import SEO from "@/components/SEO";

export default function BakeModePage() {
  const { t } = useTranslation("common");
  const { id } = useParams();
  const [recipe, setRecipe] = useState(null);
  const [tData, setT] = useState(null);
  const [loading, setLoading] = useState(true);

  // load recipe
  useEffect(() => {
    let live = true;
    (async () => {
      setLoading(true);
      const { data } = await supabase.from("recipes").select("*").eq("id", id).maybeSingle();
      if (!live) return;
      setRecipe(data || null);
      setLoading(false);
    })();
    return () => { live = false; };
  }, [id]);

  // translation (same language logic you use elsewhere)
  const uiLang = localStorage.getItem("lang") || "auto";
  const targetLang = uiLang === "auto" ? "fi" : uiLang;
  useEffect(() => {
    let live = true;
    (async () => {
      if (uiLang === "auto") { setT(null); return; }
      const { data } = await supabase
        .from("recipe_translations")
        .select("title,description,ingredients,steps")
        .eq("recipe_id", id)
        .eq("lang", targetLang)
        .maybeSingle();
      if (!live) return;
      setT(data || null);
    })();
    return () => { live = false; };
  }, [id, uiLang, targetLang]);

  const steps = useMemo(() => {
    const base = tData?.steps ?? recipe?.steps ?? [];
    if (Array.isArray(base)) return base;
    return String(base || "").split("\n").map((l, i) => ({ position: i + 1, text: l.trim() })).filter(s => s.text);
  }, [tData, recipe]);

  const title = tData?.title ?? recipe?.title ?? recipe?.name ?? "";

  if (loading) {
    return <div className="max-w-4xl mx-auto p-4 md:p-6"><div className="h-24 bg-gray-200 dark:bg-slate-800 rounded animate-pulse" /></div>;
  }
  if (!recipe) {
    return <div className="max-w-4xl mx-auto p-4 md:p-6 text-gray-600 dark:text-gray-300">{t("no_recipe", "Recipe not found")}</div>;
  }

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6">
      <SEO title={`${title} • ${t("bake_mode", "Bake mode")}`} canonical={`https://www.breadcalculator.online/recipe/${id}/bake`} />
      <div className="flex items-center justify-between gap-3 mb-3">
        <h1 className="text-2xl md:text-3xl font-semibold text-gray-900 dark:text-gray-100">
          {title} — {t("bake_mode", "Bake mode")}
        </h1>
        <Link to={`/recipe/${id}`} className="text-sm text-blue-600 dark:text-blue-400 hover:underline">
          ← {t("back_to_recipe", "Back to recipe")}
        </Link>
      </div>

      <div className="rounded-xl bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 p-4">
        {/* Make the timers bigger and focused in bake mode */}
        <StepTimers steps={steps} largeControls persistKey={`bake:${id}`} />
      </div>
    </div>
  );
}
