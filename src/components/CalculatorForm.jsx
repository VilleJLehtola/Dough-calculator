// src/components/CalculatorForm.jsx
import React from "react";

export default function CalculatorForm({
  inputGrams,
  setInputGrams,
  inputType,
  setInputType,
  hydration,
  setHydration,
  saltPct,
  setSaltPct,
  oilPct,
  setOilPct,
  useOil,
  setUseOil,
  mode,
  setMode,
  useRye,
  setUseRye,
  useSeeds,
  setUseSeeds,
  coldFermentation,
  setColdFermentation,
  onCalculate,
  onReset,
  showRecipe,
  setShowRecipe,
}) {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center gap-2">
        <label className="font-medium">Tyyppi:</label>
        <div className="flex gap-2">
          <button
            onClick={() => setMode("leipa")}
            className={`px-4 py-2 rounded-lg ${
              mode === "leipa"
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-800"
            }`}
          >
            Leipä
          </button>
          <button
            onClick={() => setMode("pizza")}
            className={`px-4 py-2 rounded-lg ${
              mode === "pizza"
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-800"
            }`}
          >
            Pizza
          </button>
        </div>
      </div>

      <div className="flex gap-2 justify-center">
        <button
          className={`px-4 py-2 rounded-lg ${
            inputType === "jauho"
              ? "bg-blue-500 text-white"
              : "bg-gray-100 text-gray-700"
          }`}
          onClick={() => setInputType("jauho")}
        >
          Jauhopohjainen
        </button>
        <button
          className={`px-4 py-2 rounded-lg ${
            inputType === "vesi"
              ? "bg-blue-500 text-white"
              : "bg-gray-100 text-gray-700"
          }`}
          onClick={() => setInputType("vesi")}
        >
          Vesipohjainen
        </button>
      </div>

      <input
        type="number"
        value={inputGrams}
        onChange={(e) => setInputGrams(e.target.value)}
        placeholder={`Syötä ${inputType === "jauho" ? "jauhojen" : "veden"} määrä grammoina`}
        className="w-full p-3 border border-gray-300 rounded-lg"
      />

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium">Hydraatio (%)</label>
          <input
            type="number"
            min="55"
            value={hydration}
            onChange={(e) => setHydration(Math.max(55, parseFloat(e.target.value) || 0))}
            className="w-full p-2 mt-1 border border-gray-300 rounded-lg"
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Suolan määrä (%)</label>
          <input
            type="number"
            value={saltPct}
            onChange={(e) => setSaltPct(parseFloat(e.target.value))}
            className="w-full p-2 mt-1 border border-gray-300 rounded-lg"
          />
        </div>
      </div>

      {mode === "pizza" && (
        <div>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={useOil}
              onChange={() => setUseOil(!useOil)}
            />
            Käytä öljyä (2%)
          </label>
        </div>
      )}

      {mode === "leipa" && (
        <>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={useRye}
              onChange={() => setUseRye(!useRye)}
            />
            Käytä ruisjauhoja (20%)
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={useSeeds}
              onChange={() => setUseSeeds(!useSeeds)}
            />
            Lisää siemeniä (15%)
          </label>
        </>
      )}

      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={coldFermentation}
          onChange={() => setColdFermentation(!coldFermentation)}
        />
        Kylmäfermentointi
      </label>

      <div className="flex flex-col gap-2 pt-2">
        <button
          onClick={() => setShowRecipe(!showRecipe)}
          className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition"
        >
          {showRecipe ? "Piilota resepti" : "Näytä resepti"}
        </button>
        <button
          onClick={onReset}
          className="w-full bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300"
        >
          Tyhjennä kaikki
        </button>
      </div>
    </div>
  );
}
