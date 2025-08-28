// src/pages/RecipePrintPage.jsx
import React, { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import supabase from "@/supabaseClient";
import { Clock, Printer } from "lucide-react";

export default function RecipePrintPage() {
  const { t } = useTranslation("common");
  const { id } = useParams();

  const [loading, setLoading] = useState(true);
  const [recipe, setRecipe] = useState(null);
  const [author, setAuthor] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const { data: rec, error } = await supabase
        .from("recipes")
        .select("*")
        .eq("id", id)
        .single();

      if (cancelled) return;

      if (error) {
        setRecipe(null);
        setAuthor(null);
        setLoading(false);
        return;
      }

      setRecipe(rec || null);

      const authorId = rec?.author_id ?? rec?.created_by ?? rec?.user_id ?? null;
      if (authorId) {
        const { data: u } = await supabase
          .from("users")
          .select("username, full_name, email")
          .eq("id", authorId)
          .maybeSingle();
        setAuthor(u || null);
      } else {
        setAuthor(null);
      }

      setLoading(false);

      // Give the DOM a tick to render, then open print dialog.
      setTimeout(() => {
        try {
          window.print();
        } catch {}
      }, 300);
    })();
    return () => { cancelled = true; };
  }, [id]);

  const title = recipe?.title || recipe?.name || "";
  const description = recipe?.description || "";
  const totalTime = useMemo(() => {
    const raw = recipe?.prep_time_minutes ?? recipe?.total_time ?? recipe?.time ?? null;
    if (raw == null) return null;
    const n = Number(String(raw).replace(/[^\d.,]/g, "").replace(",", "."));
    return Number.isFinite(n) ? n : null;
  }, [recipe]);

  const ingredients = useMemo(() => {
    const base = recipe?.ingredients ?? [];
    if (Array.isArray(base)) return base;
    return String(base || "")
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean)
      .map((name) => ({ name }));
  }, [recipe]);

  const steps = useMemo(() => {
    const base = recipe?.steps ?? [];
    if (Array.isArray(base)) return base;
    return String(base || "")
      .split("\n")
      .map((l, i) => ({ position: i + 1, text: l.trim() }))
      .filter((s) => s.text);
  }, [recipe]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-600 dark:text-gray-300">
        {t("loading", "Loading…")}
      </div>
    );
  }

  if (!recipe) {
    return (
      <div className="max-w-3xl mx-auto p-6 print:p-0">
        <h1 className="text-2xl font-semibold mb-2">{t("no_recipe", "Recipe not found")}</h1>
        <Link to={`/recipe/${id}`} className="text-blue-600 hover:underline">
          ← {t("back_to_recipes", "Back")}
        </Link>
      </div>
    );
  }

  const hero =
    recipe?.cover_image ||
    (Array.isArray(recipe?.images) && recipe.images.length
      ? (typeof recipe.images[0] === "string" ? recipe.images[0] : recipe.images[0]?.url)
      : null);

  return (
    <div className="print-wrap bg-white text-black">
      {/* On-screen helpers (hidden when printing) */}
      <div className="no-print sticky top-0 z-10 bg-white/90 border-b border-gray-200 px-4 py-2 flex items-center gap-3 justify-between">
        <Link to={`/recipe/${id}`} className="text-blue-600 hover:underline">
          ← {t("back_to_recipes", "Back")}
        </Link>
        <div className="flex items-center gap-2">
          {totalTime != null && (
            <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-800">
              <Clock className="w-3.5 h-3.5" /> {totalTime} {t("minutes_short", "min")}
            </span>
          )}
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md border border-gray-300 hover:bg-gray-50"
          >
            <Printer className="w-4 h-4" /> {t("print", "Print")}
          </button>
        </div>
      </div>

      <main className="mx-auto max-w-[720px] px-6 py-6 print:px-0 print:py-0">
        {/* Title */}
        <h1 className="text-3xl font-bold leading-tight">{title}</h1>

        {/* Meta line */}
        <div className="mt-1 text-sm text-gray-700">
          {author?.full_name || author?.username ? (
            <span>{author.full_name || author.username}</span>
          ) : null}
          {recipe?.servings ? (
            <span className="ml-3">{t("servings", "Servings")}: {recipe.servings}</span>
          ) : null}
          {totalTime != null ? (
            <span className="ml-3">
              {t("total_time", "Total time")}: {totalTime} {t("minutes_short", "min")}
            </span>
          ) : null}
        </div>

        {/* Hero */}
        {hero ? (
          <div className="mt-4">
            {/* plain img for print reliability */}
            <img
              src={hero}
              alt={title}
              className="w-full rounded-lg border border-gray-200 object-cover"
              style={{ aspectRatio: "16/9" }}
            />
          </div>
        ) : null}

        {/* Description */}
        {description ? (
          <p className="mt-4 text-gray-900 leading-relaxed">{description}</p>
        ) : null}

        {/* Two columns for print */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Ingredients */}
          <section>
            <h2 className="text-xl font-semibold mb-2">{t("ingredients", "Ingredients")}</h2>
            {ingredients?.length ? (
              <ul className="space-y-1.5">
                {ingredients.map((ing, i) => (
                  <li key={i} className="flex items-baseline justify-between gap-3">
                    <span className="text-gray-900">{ing.name || ""}</span>
                    <span className="text-gray-700">
                      {ing.amount != null ? ing.amount : ""}{" "}
                      {ing.unit ? ing.unit : ""}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-sm text-gray-600">{t("no_ingredients_listed", "No ingredients listed.")}</div>
            )}
          </section>

          {/* Steps */}
          <section>
            <h2 className="text-xl font-semibold mb-2">{t("instructions", "Instructions")}</h2>
            {steps?.length ? (
              <ol className="list-decimal pl-5 space-y-2">
                {steps.map((s, i) => (
                  <li key={i} className="text-gray-900">
                    {s.text ?? String(s ?? "")}
                    {s.time != null && (
                      <span className="ml-2 text-xs px-1.5 py-0.5 rounded bg-gray-100">
                        +{s.time} {t("minutes_short", "min")}
                      </span>
                    )}
                  </li>
                ))}
              </ol>
            ) : (
              <div className="text-sm text-gray-600">{t("no_instructions_provided", "No instructions provided.")}</div>
            )}
          </section>
        </div>

        {/* Footer note with URL */}
        <div className="mt-8 text-xs text-gray-600">
          {t("printed_from", "Printed from")}: https://www.breadcalculator.online/recipe/{id}
        </div>
      </main>
    </div>
  );
}
