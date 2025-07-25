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
  resetAll,
  user,
  handleSaveFavorite
}) {
  const [favoriteName, setFavoriteName] = useState('');

  return (
    <div className="space-y-4">
      <div className="flex justify-center gap-4">
        <button
          onClick={() => setMode('leipa')}
          className={`px-4 py-2 rounded-lg font-medium ${mode === 'leipa' ? 'bg-blue-600 text-white' : 'bg-blue-100 text-blue-800'}`}
        >
          Leipä
        </button>
        <button
          onClick={() => setMode('pizza')}
          className={`px-4 py-2 rounded-lg font-medium ${mode === 'pizza' ? 'bg-blue-600 text-white' : 'bg-blue-100 text-blue-800'}`}
        >
          Pizza
        </button>
      </div>

      <div className="flex justify-center gap-4">
        <button
          onClick={() => setInputType('jauho')}
          className={`px-4 py-2 rounded-lg font-medium ${inputType === 'jauho' ? 'bg-blue-600 text-white' : 'bg-blue-100 text-blue-800'}`}
        >
          Jauhopohjainen
        </button>
        <button
          onClick={() => setInputType('vesi')}
          className={`px-4 py-2 rounded-lg font-medium ${inputType === 'vesi' ? 'bg-blue-600 text-white' : 'bg-blue-100 text-blue-800'}`}
        >
          Vesipohjainen
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

      <div className="space-y-2">
        {mode === 'pizza' && (
          <label className="flex gap-2 items-center">
            <input type="checkbox" checked={useOil} onChange={() => setUseOil(!useOil)} />
            Käytä öljyä (3 %)
          </label>
        )}
        <label className="flex gap-2 items-center">
          <input type="checkbox" checked={coldFermentation} onChange={() => setColdFermentation(!coldFermentation)} />
          Kylmäkohotus
        </label>
        {mode === 'leipa' && (
          <>
            <label className="flex gap-2 items-center">
              <input type="checkbox" checked={useRye} onChange={() => setUseRye(!useRye)} />
              Käytä ruisjauhoja (20 %)
            </label>
            <label className="flex gap-2 items-center">
              <input type="checkbox" checked={useSeeds} onChange={() => setUseSeeds(!useSeeds)} />
              Lisää siemeniä (15 %)
            </label>
          </>
        )}
      </div>

      <button
        onClick={() => setShowRecipe(!showRecipe)}
        className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition"
      >
        {showRecipe ? 'Piilota resepti' : 'Näytä resepti'}
      </button>

      {user && (
        <div className="space-y-2 pt-2">
          <input
            type="text"
            value={favoriteName}
            onChange={(e) => setFavoriteName(e.target.value)}
            placeholder="Suosikin nimi"
            className="w-full p-2 border border-blue-300 rounded-lg"
          />
          <button
            onClick={() => handleSaveFavorite(favoriteName)}
            className="w-full bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600"
          >
            Tallenna suosikiksi
          </button>
        </div>
      )}

      <button
        onClick={resetAll}
        className="w-full bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300"
      >
        Tyhjennä kaikki
      </button>
    </div>
  );
}
