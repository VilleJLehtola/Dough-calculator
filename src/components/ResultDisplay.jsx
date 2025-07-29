import React from 'react';

export default function ResultDisplay({ result }) {
  return (
    <div className="bg-blue-50 dark:bg-gray-700 p-4 rounded-lg border border-blue-200 dark:border-gray-600 text-gray-900 dark:text-white">
      <h2 className="text-lg font-semibold text-blue-700 dark:text-yellow-300 mb-2">
        🍞 Ainesosien määrät:
      </h2>

      <ul className="text-gray-800 space-y-1">
  <li>
    <strong>Vesi:</strong> {result.vesi.toFixed(1)} g
  </li>
  <li>
    <strong>Suola:</strong> {result.suola.toFixed(1)} g
  </li>
  <li>
    <strong>Juuri:</strong> {result.juuri.toFixed(1)} g
  </li>
  {result.öljy > 0 && (
    <li>
      <strong>Öljy:</strong> {result.öljy.toFixed(1)} g
    </li>
  )}
  {result.siemenet > 0 && (
    <li>
      <strong>Siemenet:</strong> {result.siemenet.toFixed(1)} g
    </li>
  )}
  <li>
    <strong>Yhteensä:</strong> {result.yhteensa.toFixed(1)} g
  </li>
</ul>


      <h3 className="mt-4 font-semibold text-gray-800 dark:text-gray-200">Jauhotyypit:</h3>
      <ul className="text-sm text-gray-600 dark:text-gray-300">
        {Object.entries(result.jauhotyypit).map(([type, val]) => (
          <li key={type}>
            {type}: {val.toFixed(1)} g
          </li>
        ))}
      </ul>
    </div>
  );
}
 
