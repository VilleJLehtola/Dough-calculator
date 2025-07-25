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
  resetAll
}) {
  return (
    <div className="space-y-4">
      {/* Dough type switch */}
      <div className="flex gap-2 justify-center">
        <button
          onClick={() => setMode('leipa')}
          className={`px-4 py-2 rounded-full border ${
            mode === 'leipa'
              ? 'bg-blue-500 text-white'
              : 'bg-white text-blue-500 border-blue-500'
          }`}
        >
          Leipä
        </button>
        <button
          onClick={() => setMode('pizza')}
          className={`px-4 py-2 rounded-full border ${
            mode === 'pizza'
              ? 'bg-blue-500 text-white'
              : 'bg-white text-blue-500 border-blue-500'
          }`}
        >
          Pizza
        </button>
      </div>

      {/* Input grams and type toggle */}
      <div className="flex gap-2 items-center">
        <input
          type="number"
          value={inputGrams}
          onChange={e => setInputGrams(e.target.value)}
          placeholder="Määrä grammoina"
          className="flex-1 p-2 border border-blue-300 rounded"
        />
        <select
          value={inputType}
          onChange={e => setInputType(e.target.value)}
          className="p-2 border border-blue-300 rounded"
        >
          <option value="jauho">Jauho</option>
          <option value="vesi">Vesi</option>
        </select>
      </div>

      {/* Hydration and salt */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium text-gray-700">Hydraatio (%)</label>
          <input
            type="number"
            min="55"
            value={hydration}
            onChange={e => setHydration(e.target.value)}
            className="w-full p-2 border border-blue-300 rounded"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700">Suola (%)</label>
          <input
            type="number"
            value={saltPct}
            onChange={e => setSaltPct(e.target.value)}
            className="w-full p-2 border border-blue-300 rounded"
          />
        </div>
      </div>

      {/* Optional options */}
      {mode === 'pizza' && (
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={useOil}
            onChange={() => setUseOil(!useOil)}
          />
          <label>Lisää öljyä (3%)</label>
        </div>
      )}

      {mode === 'leipa' && (
        <>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={useRye}
              onChange={() => setUseRye(!useRye)}
            />
            <label>Käytä ruisjauhoja (20%)</label>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={useSeeds}
              onChange={() => setUseSeeds(!useSeeds)}
            />
            <label>Lisää siemeniä (15%)</label>
          </div>
        </>
      )}

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={coldFermentation}
          onChange={() => setColdFermentation(!coldFermentation)}
        />
        <label>Kylmäkohotus</label>
      </div>

      {/* Buttons */}
      <div className="flex flex-col gap-2 mt-4">
        <button
          onClick={() => setShowRecipe(prev => !prev)}
          className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition"
        >
          {showRecipe ? 'Piilota resepti' : 'Näytä resepti'}
        </button>
{user && (
  <div className="mt-2">
    <input
      type="text"
      placeholder="Suosikin nimi"
      value={favoriteName}
      onChange={(e) => setFavoriteName(e.target.value)}
      className="w-full p-2 mb-2 border border-blue-300 rounded-lg"
    />
    <button
      onClick={handleSaveFavorite}
      className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition"
    >
      Tallenna suosikiksi
    </button>
  </div>
)}

        <button
          onClick={resetAll}
          className="w-full bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300"
        >
          Tyhjennä
        </button>
      </div>
    </div>
  );
}
