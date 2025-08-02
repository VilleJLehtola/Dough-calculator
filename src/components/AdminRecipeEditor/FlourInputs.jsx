//FlourInputs.jsx

export function FlourInputs({ flours, handleFlourChange, addFlourRow }) {
  return (
    <div>
      <label className="block font-medium mb-1">Jauhot</label>
      {flours.map((f, idx) => (
        <div key={idx} className="flex space-x-2 mb-2">
          <input
            type="text"
            placeholder="Tyyppi"
            value={f.type}
            onChange={e => handleFlourChange(idx, 'type', e.target.value)}
            className="flex-1 border p-1 rounded dark:bg-gray-700 dark:text-white"
            required
          />
          <input
            type="number"
            placeholder="Grammat"
            value={f.grams}
            onChange={e => handleFlourChange(idx, 'grams', e.target.value)}
            className="w-24 border p-1 rounded dark:bg-gray-700 dark:text-white"
            required
          />
        </div>
      ))}
      <button type="button" onClick={addFlourRow} className="text-blue-600 dark:text-blue-300 underline text-sm">
        Lisää jauho
      </button>
    </div>
  );
}
