// src/components/ResultDisplay.jsx
import React from 'react';

export default function ResultDisplay({ result }) {
  if (!result) return null;

  const { jauho, vesi, suola, juuri, öljy, yhteensa, jauhotyypit, siemenet } = result;

  return (
    <div className="p-4 mt-4 rounded bg-gray-100 dark:bg-gray-800 shadow">
      <h3 className="text-lg font-semibold mb-2">🍞 Ainesosien määrät</h3>
      <ul className="text-sm">
        <li><strong>Vesi:</strong> {vesi.toFixed(1)} g</li>
        <li><strong>Suola:</strong> {suola.toFixed(1)} g</li>
        <li><strong>Juuri:</strong> {juuri.toFixed(1)} g</li>
        {öljy > 0 && <li><strong>Öljy:</strong> {öljy.toFixed(1)} g</li>}
        {siemenet > 0 && <li><strong>Siemenet:</strong> {siemenet.toFixed(1)} g</li>}
        <li><strong>Yhteensä:</strong> {yhteensa.toFixed(1)} g</li>
      </ul>

      <h4 className="mt-4 text-md font-semibold">Jauhotyypit:</h4>
      <ul className="text-sm">
        {Object.entries(jauhotyypit).map(([key, val]) => (
          <li key={key}>
            {key}: {val.toFixed(1)} g
          </li>
        ))}
      </ul>
    </div>
  );
}
