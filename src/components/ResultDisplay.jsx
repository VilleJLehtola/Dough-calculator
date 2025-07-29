// src/components/ResultDisplay.jsx

export default function ResultDisplay({ result }) {
  return (
    <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
      <h2 className="text-lg font-semibold text-blue-700 mb-2">
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
      <h3 className="mt-3 font-semibold">Jauhotyypit:</h3>
      <ul>
        {Object.entries(result.jauhotyypit).map(([type, val]) => (
          <li key={type}>
            {type}: {val.toFixed(1)} g
          </li>
        ))}
      </ul>
    </div>
  );
}
