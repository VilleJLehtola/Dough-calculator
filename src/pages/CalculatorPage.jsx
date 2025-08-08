import React from 'react';

const CalculatorForm = ({
  inputType,
  setInputType,
  flour,
  setFlour,
  water,
  setWater,
  hydration,
  setHydration,
  salt,
  setSalt,
  mode,
  setMode,
  includeSeeds,
  setIncludeSeeds,
  includeRye,
  setIncludeRye,
  coldFermentation,
  setColdFermentation,
  includeOil,
  setIncludeOil,
  handleCalculate,
  handleReset,
}) => {
  return (
    <div className="bg-gray-800 p-6 rounded-lg shadow-md w-full max-w-4xl mx-auto mb-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-white">Jauho</label>
          <input
            type="number"
            value={flour}
            onChange={(e) => setFlour(e.target.value)}
            className="w-full p-2 rounded bg-gray-700 text-white"
            placeholder="Grammat"
          />
        </div>
        <div>
          <label className="block text-white">Vesi</label>
          <input
            type="text"
            value={inputType === 'flour' ? 'Lasketaan' : water}
            onChange={(e) => setWater(e.target.value)}
            disabled={inputType === 'flour'}
            className="w-full p-2 rounded bg-gray-700 text-white"
            placeholder="Millilitrat"
          />
        </div>

        <div className="md:col-span-2 text-center">
          <button
            onClick={() =>
              setInputType((prev) => (prev === 'flour' ? 'water' : 'flour'))
            }
            className="text-blue-400 underline text-sm mt-1"
          >
            {inputType === 'flour'
              ? 'Vaihda syöttötapa: käytä vettä'
              : 'Vaihda syöttötapa: käytä jauhoja'}
          </button>
        </div>

        <div>
          <label className="block text-white">Hydraatio (%)</label>
          <input
            type="number"
            value={hydration}
            onChange={(e) => setHydration(e.target.value)}
            className="w-full p-2 rounded bg-gray-700 text-white"
          />
        </div>
        <div>
          <label className="block text-white">Suola (%)</label>
          <input
            type="number"
            value={salt}
            onChange={(e) => setSalt(e.target.value)}
            className="w-full p-2 rounded bg-gray-700 text-white"
          />
        </div>
      </div>

      <div className="flex justify-center space-x-4 mt-4">
        <button
          onClick={() => setMode('bread')}
          className={`px-4 py-2 rounded ${
            mode === 'bread'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-600 text-white'
          }`}
        >
          Leipä
        </button>
        <button
          onClick={() => setMode('pizza')}
          className={`px-4 py-2 rounded ${
            mode === 'pizza'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-600 text-white'
          }`}
        >
          Pizza
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 text-white text-sm">
        {mode === 'bread' && (
          <>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={includeRye}
                onChange={() => setIncludeRye(!includeRye)}
              />
              <label>Sisältää 20% ruisjauhoja</label>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={includeSeeds}
                onChange={() => setIncludeSeeds(!includeSeeds)}
              />
              <label>Lisää siemeniä (15%)</label>
            </div>
          </>
        )}

        {mode === 'pizza' && (
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={includeOil}
              onChange={() => setIncludeOil(!includeOil)}
            />
            <label>Sisältää öljyä (3%)</label>
          </div>
        )}

        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            checked={coldFermentation}
            onChange={() => setColdFermentation(!coldFermentation)}
          />
          <label>Kylmäkohotus</label>
        </div>
      </div>

      <div className="flex justify-center mt-6 space-x-4">
        <button
          onClick={handleCalculate}
          className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
        >
          Näytä resepti
        </button>
        <button
          onClick={handleReset}
          className="bg-gray-400 text-black px-6 py-2 rounded hover:bg-gray-500"
        >
          Tyhjennä
        </button>
      </div>
    </div>
  );
};

export default CalculatorForm;
