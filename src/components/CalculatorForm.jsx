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
  const toggleInputType = () => {
    setInputType(inputType === 'jauho' ? 'vesi' : 'jauho');
  };

  return (
    <div className="bg-gray-900 text-white p-6 rounded-lg shadow-md w-full max-w-3xl mx-auto">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-sm font-semibold mb-1">Jauho</label>
          <input
            type="number"
            value={inputType === 'jauho' ? inputGrams : ''}
            onChange={(e) => setInputGrams(e.target.value)}
            placeholder="Grammat"
            className="w-full p-2 rounded bg-gray-800 text-white border border-gray-600"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold mb-1">Vesi</label>
          <input
            type="text"
            value={inputType === 'vesi' ? inputGrams : 'Lasketaan'}
            readOnly
            placeholder="Millilitrat"
            className="w-full p-2 rounded bg-gray-800 text-white border border-gray-600"
          />
        </div>
      </div>

      <div className="text-center mb-4">
        <button onClick={toggleInputType} className="text-blue-400 underline text-sm">
          Vaihda syöttötapa: käytä {inputType === 'jauho' ? 'vettä' : 'jauhoja'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-sm font-semibold mb-1">Hydraatio (%)</label>
          <input
            type="number"
            value={hydration}
            onChange={(e) => setHydration(Number(e.target.value))}
            className="w-full p-2 rounded bg-gray-800 text-white border border-gray-600"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold mb-1">Suola (%)</label>
          <input
            type="number"
            value={saltPct}
            onChange={(e) => setSaltPct(Number(e.target.value))}
            className="w-full p-2 rounded bg-gray-800 text-white border border-gray-600"
          />
        </div>
      </div>

      <div className="flex justify-center gap-4 mb-4">
        <button
          onClick={() => setMode('leipa')}
          className={`px-4 py-2 rounded ${mode === 'leipa' ? 'bg-blue-600' : 'bg-gray-700'}`}
        >
          Leipä
        </button>
        <button
          onClick={() => setMode('pizza')}
          className={`px-4 py-2 rounded ${mode === 'pizza' ? 'bg-blue-600' : 'bg-gray-700'}`}
        >
          Pizza
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm mb-4">
        {mode !== 'pizza' && (
          <label className="flex items-center space-x-2">
            <input type="checkbox" checked={useRye} onChange={() => setUseRye(!useRye)} />
            <span>Sisältää 20% ruisjauhoja</span>
          </label>
        )}
        <label className="flex items-center space-x-2">
          <input type="checkbox" checked={useSeeds} onChange={() => setUseSeeds(!useSeeds)} />
          <span>Lisää siemeniä (15%)</span>
        </label>
        <label className="flex items-center space-x-2">
          <input type="checkbox" checked={coldFermentation} onChange={() => setColdFermentation(!coldFermentation)} />
          <span>Kylmäkohotus</span>
        </label>
      </div>

      <div className="flex justify-center gap-4">
        <button
          onClick={() => setShowRecipe(true)}
          className="bg-blue-600 px-4 py-2 rounded text-white"
        >
          Näytä resepti
        </button>
        <button
          onClick={resetAll}
          className="bg-gray-500 px-4 py-2 rounded text-white"
        >
          Tyhjennä
        </button>
      </div>
    </div>
  );
}
