import React, { useState } from 'react';

export default function App() {
  const [flour, setFlour] = useState('');
  const [water, setWater] = useState('');
  const [doughType, setDoughType] = useState('pizza');

  const calculateHydration = () => {
    const f = parseFloat(flour);
    const w = parseFloat(water);
    if (isNaN(f) || isNaN(w) || f === 0) return '–';
    return ((w / f) * 100).toFixed(1) + '%';
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-6 max-w-md w-full space-y-4">
        <h1 className="text-2xl font-bold text-center">Dough Calculator</h1>

        {/* Dough Type Switch */}
        <div className="flex justify-center space-x-4">
          <button
            className={`px-4 py-2 rounded-full ${
              doughType === 'pizza' ? 'bg-blue-600 text-white' : 'bg-gray-200'
            }`}
            onClick={() => setDoughType('pizza')}
          >
            Pizza
          </button>
          <button
            className={`px-4 py-2 rounded-full ${
              doughType === 'bread' ? 'bg-green-600 text-white' : 'bg-gray-200'
            }`}
            onClick={() => setDoughType('bread')}
          >
            Bread
          </button>
        </div>

        {/* Inputs */}
        <div>
          <label className="block text-sm font-medium">Flour (g)</label>
          <input
            type="number"
            value={flour}
            onChange={(e) => setFlour(e.target.value)}
            className="w-full p-2 border rounded-xl mt-1"
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Water (g)</label>
          <input
            type="number"
            value={water}
            onChange={(e) => setWater(e.target.value)}
            className="w-full p-2 border rounded-xl mt-1"
          />
        </div>

        {/* Output */}
        <div className="text-center mt-4">
          <p className="text-lg">
            Hydration: <span className="font-bold">{calculateHydration()}</span>
          </p>
          <p className="text-sm text-gray-500">Dough type: {doughType}</p>
        </div>
      </div>
    </div>
  );
}
