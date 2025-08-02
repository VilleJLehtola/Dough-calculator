// InstructionsEditor.jsx
export function InstructionsEditor({ instructions, setInstructions, foldCount, insertFoldMarker }) {
  return (
    <div>
      <label className="block font-medium mb-1">Valmistusohjeet</label>
      <textarea
        id="instructions"
        value={instructions}
        onChange={e => setInstructions(e.target.value)}
        className="w-full border p-2 rounded h-40 dark:bg-gray-700 dark:text-white"
      />
      <div className="flex flex-wrap gap-2 mt-2">
        {[...Array(foldCount)].map((_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => insertFoldMarker(i + 1)}
            className="text-blue-600 dark:text-blue-300 underline text-sm"
          >
            Lisää [FOLD {i + 1}]
          </button>
        ))}
      </div>
    </div>
  );
}
