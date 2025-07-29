import React, { useState } from 'react';

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
  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <select
          value={inputType}
          onChange={e => setInputType(e.target.value)}
          className="border rounded p-2"
        >
          <option value="jauho">Jauho</option>
          <option value="vesi">Vesi</option>
        </select>
        <input
          type="number"
          value={inputGrams}
          onChange={e => setInputGrams(e.target.value)}
          placeholder="Grammat"
          className="border rounded p-2 w-full"
        />
      </div>

      <div className="flex gap-2">
        <label className="flex-1">
          Hydration (%)
          <input
            type="number"
            min="55"
            value={hydration}
            onChange={e => setHydration(Number(e.target.value))}
            className="border rounded p-2 w-full"
          />
        </label>
        <label className="flex-1">
          Suola (%)
          <input
            type="number"
            value={saltPct}
            onChange={e => setSaltPct(Number(e.target.value))}
            className="border rounded p-2 w-full"
          />
        </label>
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => setMode('leipa')}
          className={`flex-1 p-2 rounded ${
            mode === 'leipa' ? 'bg-blue-600 text-white' : 'bg-gray-200'
          }`}
        >
          Leipä
        </button>
        <button
          onClick={() => setMode('pizza')}
          className={`flex-1 p-2 rounded ${
            mode === 'pizza' ? 'bg-blue-600 text-white' : 'bg-gray-200'
          }`}
        >
          Pizza
        </button>
      </div>

      {mode === 'pizza' && (
        <label className="block">
          <input
            type="checkbox"
            checked={useOil}
            onChange={e => setUseOil(e.target.checked)}
            className="mr-2"
          />
          Lisää öljyä taikinaan
        </label>
      )}

      {mode === 'leipa' && (
        <>
          <label className="block">
            <input
              type="checkbox"
              checked={useRye}
              onChange={e => setUseRye(e.target.checked)}
              className="mr-2"
            />
            Sisältää 20% ruisjauhoja
          </label>

          <label className="block">
            <input
              type="checkbox"
              checked={useSeeds}
              onChange={e => setUseSeeds(e.target.checked)}
              className="mr-2"
            />
            Lisää siemeniä (15%)
          </label>
        </>
      )}

      <label className="block">
        <input
          type="checkbox"
          checked={coldFermentation}
          onChange={e => setColdFermentation(e.target.checked)}
          className="mr-2"
        />
        Kylmäkohotus
      </label>

      <div className="flex gap-2">
        <button
          onClick={() => setShowRecipe(prev => !prev)}
          className="flex-1 bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition"
        >
          {showRecipe ? 'Piilota resepti' : 'Näytä resepti'}
        </button>
        <button
          onClick={resetAll}
          className="flex-1 bg-gray-300 text-gray-700 py-2 rounded hover:bg-gray-400 transition"
        >
          Tyhjennä
        </button>
      </div>
    </div>
  );
}
