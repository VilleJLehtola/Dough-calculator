// CalculatorForm.jsx

import React from 'react';
import { useTranslation } from 'react-i18next';

export default function CalculatorForm({
  inputGrams,
  setInputGrams,
  inputType,
  setInputType,
  hydration,
  setHydration,
  saltPct,
  setSaltPct,
  mode,
  setMode,
  useOil,
  setUseOil,
  coldFermentation,
  setColdFermentation,
  useRye,
  setUseRye,
  useSeeds,
  setUseSeeds,
  showRecipe,
  setShowRecipe,
  resetAll
}) {
  const { t } = useTranslation();

  return (
    <div className="space-y-4">
      {/* Type + Input */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-2">
        {/* Dropdown */}
        <div className="sm:w-32 w-full">
          <select
            value={inputType}
            onChange={(e) => setInputType(e.target.value)}
            title={t("Input type tooltip")}
            className="w-full border rounded px-3 h-[44px] text-sm appearance-none dark:bg-gray-800 dark:text-white"
          >
            <option value="jauho">{t("Flour")}</option>
            <option value="vesi">{t("Water")}</option>
          </select>
        </div>

        {/* Input with unit */}
        <div className="flex-1 relative">
          <input
            type="number"
            placeholder={t("Grams")}
            value={inputGrams}
            onChange={(e) => setInputGrams(e.target.value)}
            title={t("Input amount tooltip")}
            className="w-full border rounded px-3 h-[44px] pr-10 text-sm dark:bg-gray-800 dark:text-white dark:placeholder-gray-400"
          />
          <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm pointer-events-none">
            {inputType === 'jauho' ? 'g' : 'ml'}
          </span>
        </div>
      </div>

      {/* Hydration + Salt */}
      <div className="flex space-x-2">
        <div className="flex-1">
          <label className="block text-sm dark:text-gray-200">{t("Hydration")} (%)</label>
          <input
            type="number"
            value={hydration}
            onChange={(e) => setHydration(e.target.value)}
            className="w-full border rounded px-3 py-2 dark:bg-gray-800 dark:text-white dark:placeholder-gray-400"
            title={t("Hydration tooltip")}
          />
        </div>
        <div className="flex-1">
          <label className="block text-sm dark:text-gray-200">{t("Salt")} (%)</label>
          <input
            type="number"
            value={saltPct}
            onChange={(e) => setSaltPct(e.target.value)}
            className="w-full border rounded px-3 py-2 dark:bg-gray-800 dark:text-white dark:placeholder-gray-400"
            title={t("Salt tooltip")}
          />
        </div>
      </div>

      {/* Mode switch */}
      <div className="flex space-x-2">
        <button
          type="button"
          onClick={() => setMode('leipa')}
          className={`flex-1 px-4 py-2 rounded font-semibold ${
            mode === 'leipa'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 dark:bg-gray-600 dark:text-white'
          }`}
        >
          {t("Bread")}
        </button>
        <button
          type="button"
          onClick={() => setMode('pizza')}
          className={`flex-1 px-4 py-2 rounded font-semibold ${
            mode === 'pizza'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 dark:bg-gray-600 dark:text-white'
          }`}
        >
          {t("Pizza")}
        </button>
      </div>

      {/* Options - checkboxes */}
      <div className="space-y-2">
        {mode === 'leipa' && (
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="rye"
              checked={useRye}
              onChange={() => setUseRye(!useRye)}
              className="h-4 w-4"
            />
            <label htmlFor="rye" className="text-sm dark:text-gray-200">
              {t("Include Rye Flour")}
            </label>
          </div>
        )}

        {mode === 'leipa' && (
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="seeds"
              checked={useSeeds}
              onChange={() => setUseSeeds(!useSeeds)}
              className="h-4 w-4"
            />
            <label htmlFor="seeds" className="text-sm dark:text-gray-200">
              {t("Include Seeds")}
            </label>
          </div>
        )}

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="cold"
            checked={coldFermentation}
            onChange={() => setColdFermentation(!coldFermentation)}
            className="h-4 w-4"
          />
          <label htmlFor="cold" className="text-sm dark:text-gray-200">
            {t("Cold Fermentation")}
          </label>
        </div>

        {mode === 'pizza' && (
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="oil"
              checked={useOil}
              onChange={() => setUseOil(!useOil)}
              className="h-4 w-4"
            />
            <label htmlFor="oil" className="text-sm dark:text-gray-200">
              {t("Include Oil")}
            </label>
          </div>
        )}
      </div>

      {/* Buttons */}
      <div className="flex space-x-2">
        <button
          type="button"
          onClick={() => setShowRecipe(true)}
          className="flex-1 bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
        >
          {t("Show Recipe")}
        </button>
        <button
          type="button"
          onClick={resetAll}
          className="flex-1 bg-gray-300 text-black dark:bg-gray-500 dark:text-white py-2 rounded hover:bg-gray-400"
        >
          {t("Clear")}
        </button>
      </div>
    </div>
  );
}
