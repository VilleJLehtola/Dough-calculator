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
    <div className="p-4 max-w-4xl mx-auto">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block mb-1">Jauho</label>
          <input
            type="number"
            value={inputType === 'jauho' ? inputGrams : ''}
            onChange={(e) => {
              setInputType('jauho');
              setInputGrams(e.target.value);
            }}
            placeholder="Grammat"
            className="w-full border px-2 py-1"
          />
        </div>
        <div>
          <label className="block mb-1">Vesi</label>
          <input
            type="number"
            value={inputType === 'vesi' ? inputGrams : ''}
            onChange={(e) => {
              setInputType('vesi');
              setInputGrams(e.target.value);
            }}
            placeholder="Millilitrat"
            className="w-full border px-2 py-1"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mt-4">
        <div>
          <label className="block mb-1">Hydraatio (%)</label>
          <input
            type="number"
            value={hydration}
            onChange={(e) => setHydration(Number(e.target.value))}
            className="w-full border px-2 py-1"
          />
        </div>
        <div>
          <label className="block mb-1">Suola (%)</label>
          <input
            type="number"
            value={saltPct}
            onChange={(e) => setSaltPct(Number(e.target.value))}
            className="w-full border px-2 py-1"
          />
        </div>
      </div>

      <div className="flex justify-around mt-4">
        <button
          className={`px-4 py-2 rounded ${mode === 'leipa' ? 'bg-blue-600 text-white' : 'bg-gray-300'}`}
          onClick={() => setMode('leipa')}
        >
          Leipä
        </button>
        <button
          className={`px-4 py-2 rounded ${mode === 'pizza' ? 'bg-blue-600 text-white' : 'bg-gray-300'}`}
          onClick={() => setMode('pizza')}
        >
          Pizza
        </button>
      </div>

      <div className="mt-4 space-y-2">
        {mode === 'leipa' && (
          <>
            <label className="block">
              <input
                type="checkbox"
                checked={useRye}
                onChange={(e) => setUseRye(e.target.checked)}
                className="mr-2"
              />
              Sisältää 20% ruisjauhoja
            </label>
            <label className="block">
              <input
                type="checkbox"
                checked={useSeeds}
                onChange={(e) => setUseSeeds(e.target.checked)}
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
              onChange={(e) => setUseOil(e.target.checked)}
              className="mr-2"
            />
            Lisää öljyä (3%)
          </label>
        )}
        <label className="block">
          <input
            type="checkbox"
            checked={coldFermentation}
            onChange={(e) => setColdFermentation(e.target.checked)}
            className="mr-2"
          />
          Kylmäkohotus
        </label>
      </div>

      <div className="mt-4 flex gap-4">
        <button
          onClick={() => setShowRecipe(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >
          Näytä resepti
        </button>
        <button
          onClick={resetAll}
          className="bg-gray-400 text-white px-4 py-2 rounded"
        >
          Tyhjennä
        </button>
      </div>
    </div>
  );
}
