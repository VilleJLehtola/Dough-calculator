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
    <div className="max-w-4xl mx-auto px-4 py-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-sm font-medium mb-1">
            {inputType === 'jauho' ? 'Jauho' : 'Vesi'}
          </label>
          <input
            type="number"
            className="w-full px-3 py-2 border border-gray-300 rounded dark:bg-gray-700 dark:text-white dark:border-gray-600"
            value={inputGrams}
            onChange={(e) => setInputGrams(e.target.value)}
            placeholder="Grammat"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            {inputType === 'jauho' ? 'Vesi' : 'Jauho'}
          </label>
          <input
            type="text"
            className="w-full px-3 py-2 border border-gray-200 bg-gray-100 rounded text-gray-400 dark:bg-gray-800 dark:text-gray-500"
            value=""
            disabled
            placeholder={inputType === 'jauho' ? 'Lasketaan' : 'Lasketaan'}
          />
        </div>
      </div>

      <div className="flex justify-center mb-4">
        <button
          onClick={handleInputTypeToggle}
          className="text-sm text-blue-600 dark:text-blue-400 underline"
        >
          Vaihda syöttötapa: {inputType === 'jauho' ? 'käytä vettä' : 'käytä jauhoa'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-sm font-medium mb-1">Hydraatio (%)</label>
          <input
            type="number"
            value={hydration}
            onChange={(e) => setHydration(e.target.value)}
            min={55}
            max={100}
            className="w-full px-3 py-2 border border-gray-300 rounded dark:bg-gray-700 dark:text-white dark:border-gray-600"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Suola (%)</label>
          <input
            type="number"
            value={saltPct}
            onChange={(e) => setSaltPct(e.target.value)}
            min={0}
            max={5}
            className="w-full px-3 py-2 border border-gray-300 rounded dark:bg-gray-700 dark:text-white dark:border-gray-600"
          />
        </div>
      </div>

      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setMode('leipa')}
          className={`px-4 py-2 rounded font-semibold ${
            mode === 'leipa'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-300 text-gray-800 dark:bg-gray-600 dark:text-white'
          }`}
        >
          Leipä
        </button>
        <button
          onClick={() => setMode('pizza')}
          className={`px-4 py-2 rounded font-semibold ${
            mode === 'pizza'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-300 text-gray-800 dark:bg-gray-600 dark:text-white'
          }`}
        >
          Pizza
        </button>
      </div>

      <div className="space-y-2 mb-4">
        {mode === 'leipa' && (
          <div className="flex items-center">
            <input
              id="rye"
              type="checkbox"
              checked={useRye}
              onChange={(e) => setUseRye(e.target.checked)}
              className="mr-2"
            />
            <label htmlFor="rye">Sisältää 20% ruisjauhoja</label>
          </div>
        )}

        {mode === 'leipa' && (
          <div className="flex items-center">
            <input
              id="seeds"
              type="checkbox"
              checked={useSeeds}
              onChange={(e) => setUseSeeds(e.target.checked)}
              className="mr-2"
            />
            <label htmlFor="seeds">Lisää siemeniä (15%)</label>
          </div>
        )}

        <div className="flex items-center">
          <input
            id="cold"
            type="checkbox"
            checked={coldFermentation}
            onChange={(e) => setColdFermentation(e.target.checked)}
            className="mr-2"
          />
          <label htmlFor="cold">Kylmäkohotus</label>
        </div>

        {mode === 'pizza' && (
          <div className="flex items-center">
            <input
              id="oil"
              type="checkbox"
              checked={useOil}
              onChange={(e) => setUseOil(e.target.checked)}
              className="mr-2"
            />
            <label htmlFor="oil">Lisää öljyä (3%)</label>
          </div>
        )}
      </div>

      <div className="flex gap-4">
        <button
          onClick={() => setShowRecipe(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
        >
          Näytä resepti
        </button>
        <button
          onClick={resetAll}
          className="bg-gray-400 hover:bg-gray-500 text-white px-4 py-2 rounded"
        >
          Tyhjennä
        </button>
      </div>
    </div>
  );
};

export default CalculatorForm;
