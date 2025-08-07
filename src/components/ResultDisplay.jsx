import React from 'react';

export default function ResultDisplay({ result }) {
  if (!result) return null;

  return (
    <div className="bg-gray-800 text-white p-6 mt-6 rounded-lg w-full max-w-3xl mx-auto shadow">
      <h2 className="text-lg font-semibold mb-4">🧱 Ainesosien määrät</h2>
      <div className="text-sm leading-relaxed">
        <p><strong>Vesi:</strong> {result.vesi.toFixed(1)} g</p>
        <p><strong>Suola:</strong> {result.suola.toFixed(1)} g</p>
        <p><strong>Juuri:</strong> {result.juuri.toFixed(1)} g</p>
        <p><strong>Yhteensä:</strong> {result.yhteensa.toFixed(1)} g</p>
      </div>

      <div className="mt-4">
        <p className="font-semibold">Jauhotyypit:</p>
        <ul className="text-sm list-disc list-inside">
          {Object.entries(result.jauhotyypit).map(([type, amount]) => (
            <li key={type}>
              {type}: {amount.toFixed(1)} g
            </li>
          ))}
        </ul>
      </div>

      {result.siemenet > 0 && (
        <p className="mt-2 text-sm">🌾 Siemenet: {result.siemenet.toFixed(1)} g</p>
      )}
    </div>
  );
}
