// src/components/CalculatorForm.jsx
import React from "react";

export default function CalculatorForm({
  mode,
  setMode,
  inputType,
  setInputType,
  inputGrams,
  setInputGrams,
  hydration,
  setHydration,
  saltPct,
  setSaltPct,
  oilPct,
  setOilPct,
  useRye,
  setUseRye,
  useSeeds,
  setUseSeeds,
  coldFermentation,
  setColdFermentation,
  toggleShowRecipe,
  resetAll
}) {
  return (
    <div className="space-y-4">
      <div className="flex justify-center gap-4">
        <button
          onClick={() => setMode("leipa")}
          className={`px-4 py-2 rounded-full border ${
            mode === "leipa" ? "bg-blue-500 text-white" : "bg-white text-blue-500"
          }`}
        >
          Leipä
        </button>
        <button
          onClick={() => setMode("pizza")}
          className={`px-4 py-2 rounded-full border ${
            mode === "pizza" ? "bg-blue-500 text-white" : "bg-white text-blue-500"
          }`}
        >
          Pizza
        </button>
      </div>

      <div className="flex justify-center gap-4">
        <button
          onClick={() => setInputType("jauho")}
          className={`px-4 py-2 rounded-full border ${
            inputType === "jauho" ? "bg-blue-100 text-blue-800" : "bg-white"
          }`}
        >
          Määrä on jauhoja
        </button>
        <button
          onClick={() => setInputType("vesi")}
          className={`px-4 py-2 rounded-full border ${
            inputType === "vesi" ? "bg-blue-100 text-blue-800" : "bg-white"
          }`}
        >
          Määrä on vettä
        </button>
      </div>

      <input
        type="number"
        value={inputGrams}
        onChange={(e) => setInputGrams(e.target.value)}
        placeholder="Syötä määrä grammoina"
        className="w-full p-3 border border-blue-300 rounded-lg"
      />

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium">Hydraatio (%)</label>
          <input
            type="number"
            min={55}
            value={hydration}
            onChange={(e) => setHydration(Math.max(55, Number(e.target.value)))}
            className="w-full p-2 mt-1 border border-blue-300 rounded-lg"
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Suola (%)</label>
          <input
            type="number"
            value={saltPct}
            onChange={(e) => setSaltPct(Number(e.target.value))}
            className="w-full p-2 mt-1 border border-blue-300 rounded-lg"
          />
        </div>
      </div>

      {mode === "pizza" && (
        <div>
          <label className="block text-sm font-medium">Öljy (%)</label>
          <input
            type="number"
            value={oilPct}
            onChange={(e) => setOilPct(Number(e.target.value))}
            className="w-full p-2 mt-1 border border-blue-300 rounded-lg"
          />
        </div>
      )}

      {mode === "leipa" && (
        <div className="space-y-2">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={useRye}
              onChange={(e) => setUseRye(e.target.checked)}
            />
            Käytä ruisjauhoja (20%)
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={useSeeds}
              onChange={(e) => setUseSeeds(e.target.checked)}
            />
            Lisää siemeniä (15%)
          </label>
        </div>
      )}

      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={coldFermentation}
          onChange={(e) => setColdFermentation(e.target.checked)}
        />
        Kylmä fermentointi
      </label>

      <div className="flex flex-col gap-2">
      <button
  onClick={() => setShowRecipe(prev => !prev)}
  className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition"
>
  {showRecipe ? 'Piilota resepti' : 'Näytä resepti'}
</button>

        <button
          onClick={resetAll}
          className="w-full bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300"
        >
          Tyhjennä kaikki
        </button>
      </div>
    </div>
  );
}
