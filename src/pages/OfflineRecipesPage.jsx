// src/pages/OfflineRecipesPage.jsx
import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import SEO from "@/components/SEO";
import EmptyState from "@/components/states/EmptyState";
import { useTranslation } from "react-i18next";

const OFFLINE_SUFFIX = ":offline";
const RV_PREFIX = "rv:";

export default function OfflineRecipesPage() {
  const { t } = useTranslation("common");
  const [items, setItems] = useState([]);

  // read from localStorage
  useEffect(() => {
    const found = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (!k) continue;
      if (!k.startsWith(RV_PREFIX) || !k.endsWith(OFFLINE_SUFFIX)) continue;
      const rid = k.split(":")[1]; // rv:{id}:offline
      try {
        const parsed = JSON.parse(localStorage.getItem(k) || "{}");
        const recipe = parsed?.recipe || {};
        const tData = parsed?.tData || {};
        const images = parsed?.images || [];
        const title = tData.title || recipe.title || recipe.name || t("recipe", "Recipe");
        const description =
          tData.description || recipe.description || t("recipe_description_fallback", "Recipe");
        const hero = (images?.[0]?.url || images?.[0]) || recipe.cover_image || null;

        found.push({
          id: rid,
          key: k,
          title,
          description,
          hero,
          savedAt: (() => {
            // if we ever store a timestamp, read it; otherwise use localStorage timing
            try {
              const meta = JSON.parse(localStorage.getItem(`${RV_PREFIX}${rid}:meta`) || "{}");
              return meta.savedAt ? new Date(meta.savedAt) : null;
            } catch {
              return null;
            }
          })(),
        });
      } catch {
        // malformed entry, skip
      }
    }
    // newest first if we have timestamps, otherwise leave as-is
    found.sort((a, b) => (b.savedAt?.getTime?.() || 0) - (a.savedAt?.getTime?.() || 0));
    setItems(found);
  }, []);

  const total = useMemo(() => items.length, [items]);

  const removeOne = (key) => {
    localStorage.removeItem(key);
    setItems((s) => s.filter((x) => x.key !== key));
  };

  const clearAll = () => {
    const keys = items.map((x) => x.key);
    keys.forEach((k) => localStorage.removeItem(k));
    setItems([]);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
      <SEO
        title={t("offline_recipes", "Offline recipes")}
        description={t("offline_desc", "Recipes saved for offline use")}
        canonical="https://www.breadcalculator.online/offline"
      />

      <div className="flex items-end justify-between gap-3 mb-4">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          {t("offline_recipes", "Offline recipes")}
        </h1>
        {total > 0 && (
          <button
            onClick={clearAll}
            className="text-sm px-3 py-1.5 rounded-md border border-gray-300 dark:border-slate-600 hover:bg-gray-50 dark:hover:bg-slate-700"
          >
            {t("remove_all", "Remove all")}
          </button>
        )}
      </div>

      {total === 0 ? (
        <EmptyState title={t("nothing_offline", "No recipes saved offline yet.")}>
          {t(
            "offline_help",
            "Open a recipe and use “Save offline” to store it here for flaky connections."
          )}
        </EmptyState>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {items.map((it) => (
            <div
              key={it.key}
              className="rounded-xl overflow-hidden border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800"
            >
              <div className="w-full aspect-[4/3] bg-gray-100 dark:bg-slate-900 overflow-hidden">
                {it.hero ? (
                  <img
                    src={typeof it.hero === "string" ? it.hero : it.hero?.url}
                    alt={it.title}
                    className="w-full h-full object-cover"
                    loading="lazy"
                    decoding="async"
                  />
                ) : null}
              </div>
              <div className="p-3">
                <div className="font-semibold text-gray-900 dark:text-white line-clamp-1">
                  {it.title}
                </div>
                {it.description ? (
                  <div className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2">
                    {it.description}
                  </div>
                ) : null}

                <div className="mt-3 flex items-center justify-between gap-2">
                  <Link
                    to={`/recipe/${it.id}`}
                    className="px-3 py-1.5 rounded-md bg-blue-600 text-white text-sm hover:bg-blue-500"
                  >
                    {t("open", "Open")}
                  </Link>
                  <button
                    onClick={() => removeOne(it.key)}
                    className="px-3 py-1.5 rounded-md text-sm border border-gray-300 dark:border-slate-600 hover:bg-gray-50 dark:hover:bg-slate-700"
                  >
                    {t("remove", "Remove")}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
