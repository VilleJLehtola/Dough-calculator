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
    <div className="p-4">
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-sm font-medium">Jauho</label>
          <input
            type="number"
            value={inputGrams}
            onChange={(e) => setInputGrams(e.target.value)}
            placeholder="Grammat"
            className="w-full px-3 py-2 rounded border dark:bg-gray-700 dark:text-white"
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Suola (%)</label>
          <input
            type="number"
            value={saltPct}
            onChange={(e) => setSaltPct(Number(e.target.value))}
            className="w-full px-3 py-2 rounded border dark:bg-gray-700 dark:text-white"
          />
        </div>
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium">Hydraatio (%)</label>
        <input
          type="number"
          value={hydration}
          onChange={(e) => setHydration(Number(e.target.value))}
          className="w-full px-3 py-2 rounded border dark:bg-gray-700 dark:text-white"
        />
      </div>

      <div className="flex gap-4 mb-4">
        <button
          onClick={() => setMode('leipa')}
          className={`flex-1 px-4 py-2 rounded ${mode === 'leipa' ? 'bg-blue-600 text-white' : 'bg-gray-300 dark:bg-gray-600'}`}
        >
          Leipä
        </button>
        <button
          onClick={() => setMode('pizza')}
          className={`flex-1 px-4 py-2 rounded ${mode === 'pizza' ? 'bg-blue-600 text-white' : 'bg-gray-300 dark:bg-gray-600'}`}
        >
          Pizza
        </button>
      </div>

      {mode === 'leipa' && (
        <>
          <label className="block">
            <input
              type="checkbox"
              checked={useRye}
              onChange={() => setUseRye(!useRye)}
              className="mr-2"
            />
            Sisältää 20% ruisjauhoja
          </label>
          <label className="block">
            <input
              type="checkbox"
              checked={useSeeds}
              onChange={() => setUseSeeds(!useSeeds)}
              className="mr-2"
            />
            Lisää siemeniä (15%)
          </label>
        </>
      )}

      {mode === 'pizza' && (
        <label className="block">
          <input
            type="checkbox"
            checked={useOil}
            onChange={() => setUseOil(!useOil)}
            className="mr-2"
          />
          Lisää öljyä (3%)
        </label>
      )}

      <label className="block mt-2">
        <input
          type="checkbox"
          checked={coldFermentation}
          onChange={() => setColdFermentation(!coldFermentation)}
          className="mr-2"
        />
        Kylmäkohotus
      </label>

      <div className="flex gap-4 mt-4">
        <button
          onClick={() => setShowRecipe(true)}
          className="flex-1 bg-blue-600 text-white px-4 py-2 rounded"
        >
          Näytä resepti
        </button>
        <button
          onClick={resetAll}
          className="flex-1 bg-gray-400 text-white px-4 py-2 rounded"
        >
          Tyhjennä
        </button>
      </div>
    </div>
  );
}
