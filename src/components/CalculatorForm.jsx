// src/components/CalculatorForm.jsx
import React from 'react';

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
  resetAll,
}) {
  return (
    <div className="space-y-4">
      <div className="flex gap-4">
        <button
          onClick={() => setMode('leipa')}
          className={`flex-1 py-2 rounded-lg text-sm ${
            mode === 'leipa'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          Leipä
        </button>
        <button
          onClick={() => setMode('pizza')}
          className={`flex-1 py-2 rounded-lg text-sm ${
            mode === 'pizza'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          Pizza
        </button>
      </div>

      <div className="flex gap-2">
        <input
          type="number"
          value={inputGrams}
          onChange={(e) => setInputGrams(e.target.value)}
          placeholder={`Syötä ${inputType === 'jauho' ? 'jauhojen' : 'veden'} määrä grammoina`}
          className="flex-1 border rounded px-3 py-2"
        />
        <select
          value={inputType}
          onChange={(e) => setInputType(e.target.value)}
          className="border rounded px-2 py-2 text-sm"
        >
          <option value="jauho">Jauho</option>
          <option value="vesi">Vesi</option>
        </select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Hydraatio (%)</label>
          <input
            type="number"
            value={hydration}
            min={55}
            max={100}
            onChange={(e) => setHydration(Number(e.target.value))}
            className="w-full border rounded px-3 py-2"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Suola (%)</label>
          <input
            type="number"
            value={saltPct}
            onChange={(e) => setSaltPct(Number(e.target.value))}
            className="w-full border rounded px-3 py-2"
          />
        </div>
      </div>

      {mode === 'pizza' && (
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={useOil}
            onChange={() => setUseOil(!useOil)}
          />
          <label className="text-sm">Käytä öljyä (3%)</label>
        </div>
      )}

      <div className="flex flex-col gap-2">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={coldFermentation}
            onChange={() => setColdFermentation(!coldFermentation)}
          />
          Kylmäfermentointi (jääkaapissa yön yli)
        </label>

        {mode === 'leipa' && (
          <>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={useRye}
                onChange={() => setUseRye(!useRye)}
              />
              Käytä ruisjauhoja (20%)
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={useSeeds}
                onChange={() => setUseSeeds(!useSeeds)}
              />
              Lisää siemeniä (15%)
            </label>
          </>
        )}
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => setShowRecipe(!showRecipe)}
          className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition"
        >
          {showRecipe ? 'Piilota resepti' : 'Näytä resepti'}
        </button>
        <button
          onClick={resetAll}
          className="flex-1 bg-gray-300 text-gray-800 py-2 rounded-lg hover:bg-gray-400 transition"
        >
          Tyhjennä
        </button>
      </div>
    </div>
  );
}
