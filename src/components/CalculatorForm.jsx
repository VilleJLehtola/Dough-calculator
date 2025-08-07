// src/components/CalculatorForm.jsx
import React from 'react';

const CalculatorForm = ({
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
}) => {
  const handleInputTypeToggle = () => {
    setInputType(inputType === 'jauho' ? 'vesi' : 'jauho');
    setInputGrams('');
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white dark:bg-gray-900 rounded-lg shadow space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Jauho</label>
          <input
            type="text"
            value={inputType === 'jauho' ? inputGrams : ''}
            onChange={(e) => setInputGrams(e.target.value)}
            placeholder="Grammat"
            className="w-full rounded px-3 py-2 border bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Vesi</label>
          <input
            type="text"
            value={inputType === 'vesi' ? inputGrams : 'Lasketaan'}
            onChange={(e) => setInputGrams(e.target.value)}
            disabled={inputType !== 'vesi'}
            placeholder="Millilitrat"
            className="w-full rounded px-3 py-2 border bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
          />
        </div>
      </div>

      <div className="text-sm text-center text-blue-600 dark:text-blue-400 underline cursor-pointer" onClick={handleInputTypeToggle}>
        Vaihda syöttötapa: käytä {inputType === 'jauho' ? 'vettä' : 'jauhoja'}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Hydraatio (%)</label>
          <input
            type="number"
            value={hydration}
            onChange={(e) => setHydration(e.target.value)}
            min="55"
            className="w-full rounded px-3 py-2 border bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Suola (%)</label>
          <input
            type="number"
            value={saltPct}
            onChange={(e) => setSaltPct(e.target.value)}
            className="w-full rounded px-3 py-2 border bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
        </div>
      </div>

      <div className="flex space-x-4 justify-center">
        <button
          onClick={() => setMode('leipa')}
          className={`px-4 py-2 rounded ${mode === 'leipa' ? 'bg-blue-600 text-white' : 'bg-gray-300 dark:bg-gray-700 text-black dark:text-white'}`}
        >
          Leipä
        </button>
        <button
          onClick={() => setMode('pizza')}
          className={`px-4 py-2 rounded ${mode === 'pizza' ? 'bg-blue-600 text-white' : 'bg-gray-300 dark:bg-gray-700 text-black dark:text-white'}`}
        >
          Pizza
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-sm text-gray-800 dark:text-gray-100">
        {mode === 'leipa' && (
          <label className="flex items-center space-x-2">
            <input type="checkbox" checked={useRye} onChange={(e) => setUseRye(e.target.checked)} />
            <span>Sisältää 20% ruisjauhoja</span>
          </label>
        )}
        {mode === 'leipa' && (
          <label className="flex items-center space-x-2">
            <input type="checkbox" checked={useSeeds} onChange={(e) => setUseSeeds(e.target.checked)} />
            <span>Lisää siemeniä (15%)</span>
          </label>
        )}
        <label className="flex items-center space-x-2">
          <input type="checkbox" checked={coldFermentation} onChange={(e) => setColdFermentation(e.target.checked)} />
          <span>Kylmäkohotus</span>
        </label>
        {mode === 'pizza' && (
          <label className="flex items-center space-x-2">
            <input type="checkbox" checked={useOil} onChange={(e) => setUseOil(e.target.checked)} />
            <span>Käytä öljyä (3%)</span>
          </label>
        )}
      </div>

      <div className="flex space-x-4 justify-center">
        <button
          onClick={() => setShowRecipe(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded"
        >
          Näytä resepti
        </button>
        <button
          onClick={resetAll}
          className="bg-gray-300 dark:bg-gray-700 text-black dark:text-white font-semibold px-4 py-2 rounded"
        >
          Tyhjennä
        </button>
      </div>
    </div>
  );
};

export default CalculatorForm;
