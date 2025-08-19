import React, { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { computeNutrition, round1, round0 } from "@/utils/nutrition";

export default function NutritionCard({ recipe }) {
  const { t } = useTranslation("common");
  const [bakeLossPct, setBakeLossPct] = useState(15);
  const [sliceGrams, setSliceGrams] = useState(50);
  const [mode, setMode] = useState("per100"); // "loaf" | "per100" | "slice"

  const data = useMemo(
    () => computeNutrition(recipe, { bakeLossPct, sliceGrams }),
    [recipe, bakeLossPct, sliceGrams]
  );
  if (!recipe?.ingredients?.length) return null;

  const row = (label, val) => (
    <div className="flex justify-between py-1">
      <span className="text-gray-700 dark:text-gray-300">{label}</span>
      <span className="font-medium text-gray-900 dark:text-white">{val}</span>
    </div>
  );

  let nums;
  if (mode === "loaf") nums = data.totals;
  else if (mode === "per100") nums = data.per100;
  else nums = data.perSlice;

  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          {t("nutrition", "Nutrition (est.)")}
        </h3>
        <div className="inline-flex rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
          <button
            className={`px-3 py-1 text-sm ${mode==="loaf"?"bg-gray-200 dark:bg-gray-700":""}`}
            onClick={()=>setMode("loaf")}
          >
            {t("per_loaf", "Per loaf")}
          </button>
          <button
            className={`px-3 py-1 text-sm ${mode==="per100"?"bg-gray-200 dark:bg-gray-700":""}`}
            onClick={()=>setMode("per100")}
          >
            {t("per_100g", "Per 100 g")}
          </button>
          <button
            className={`px-3 py-1 text-sm ${mode==="slice"?"bg-gray-200 dark:bg-gray-700":""}`}
            onClick={()=>setMode("slice")}
          >
            {t("per_slice", "Per slice")}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-x-6">
        {row(t("energy","Energy"), `${round0(nums.kcal)} kcal`)}
        {row(t("carbs","Carbs"), `${round1(nums.carbs)} g`)}
        {row(t("protein","Protein"), `${round1(nums.protein)} g`)}
        {row(t("fat","Fat"), `${round1(nums.fat)} g`)}
        {row(t("fiber","Fiber"), `${round1(nums.fiber)} g`)}
        {row(t("sodium","Sodium"), `${round0(nums.sodium_mg)} mg`)}
      </div>

      <div className="mt-4 text-sm text-gray-600 dark:text-gray-400">
        <div className="flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-2">
            <span>{t("bake_loss","Bake loss")}</span>
            <input
              type="number" min={0} max={30} step={1}
              className="w-16 rounded border border-gray-300 bg-transparent px-2 py-1"
              value={bakeLossPct}
              onChange={(e)=>setBakeLossPct(Number(e.target.value)||0)}
            />
            <span>%</span>
          </label>

          <label className="flex items-center gap-2">
            <span>{t("slice","Slice")}</span>
            <input
              type="number" min={5} max={500} step={5}
              className="w-20 rounded border border-gray-300 bg-transparent px-2 py-1"
              value={sliceGrams}
              onChange={(e)=>setSliceGrams(Number(e.target.value)||0)}
            />
            <span>g</span>
          </label>

          <span className="ml-auto">
            {t("baked_weight","Baked weight")} ≈ <strong>{round0(data.bakedWeight)} g</strong>
          </span>
        </div>
        <p className="mt-2 text-xs">
          {t("disclaimer_macros", "Estimates based on standard reference values; actual values vary by flour/brand and fermentation.")}
        </p>
      </div>
    </div>
  );
}
