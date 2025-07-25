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
      {/* Dough Type Toggle */}
      <div className="flex justify-center space-x-4">
        <button
          onClick={() => setMode('leipa')}
          className={`px-4 py-2 rounded-full font-medium ${
            mode === 'leipa'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-700'
          }`}
        >
          Leipä
        </button>
        <button
          onClick={() => setMode('pizza')}
          className={`px-4 py-2 rounded-full font-medium ${
            mode === 'pizza'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-700'
          }`}
        >
          Pizza
        </button>
      </div>

      {/* Input Field */}
      <input
        type="number"
        value={inputGrams}
        onChange={e => setInputGrams(e.target.value)}
        placeholder="Syötä määrä grammoina"
        className="w-full p-3 border border-blue-300 rounded-lg"
      />

      {/* Input Type Toggle */}
      <div className="flex justify-center space-x-4">
        <button
          onClick={() => setInputType('jauho')}
          className={`px-4 py-2 rounded-full font-medium ${
            inputType === 'jauho'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-700'
          }`}
        >
          Jauho
        </button>
        <button
          onClick={() => setInputType('vesi')}
          className={`px-4 py-2 rounded-full font-medium ${
            inputType === 'vesi'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-700'
          }`}
        >
          Vesi
        </button>
      </div>

      {/* Hydration and Salt Inputs */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium">Hydraatio (%)</label>
          <input
            type="number"
            min={55}
            value={hydration}
            onChange={e => setHydration(e.target.value)}
            className="w-full p-2 mt-1 border border-blue-300 rounded-lg"
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Suolan määrä (%)</label>
          <input
            type="number"
            value={saltPct}
            onChange={e => setSaltPct(e.target.value)}
            className="w-full p-2 mt-1 border border-blue-300 rounded-lg"
          />
        </div>
      </div>

      {/* Additional Options */}
      {mode === 'pizza' && (
        <div className="flex items-center space-x-2">
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
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={useRye}
              onChange={() => setUseRye(!useRye)}
            />
            <label>Käytä ruisjauhoja (20%)</label>
          </div>
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={useSeeds}
              onChange={() => setUseSeeds(!useSeeds)}
            />
            <label>Lisää siemeniä (15%)</label>
          </div>
        </>
      )}
      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          checked={coldFermentation}
          onChange={() => setColdFermentation(!coldFermentation)}
        />
        <label>Kylmäkohotus</label>
      </div>

      {/* Buttons */}
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
