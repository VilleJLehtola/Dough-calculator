// FoldScheduler.jsx
export function FoldScheduler({ foldCount, setFoldCount, foldTimings, handleFoldTimingChange }) {
  return (
    <div>
      <label className="block font-medium">Taitteluiden määrä: {foldCount}</label>
      <input type="range" min={1} max={6} value={foldCount} onChange={e => setFoldCount(Number(e.target.value))} />
      {[...Array(foldCount)].map((_, i) => (
        <input
          key={i}
          type="number"
          placeholder={`Taitto ${i + 1} (min)`}
          value={foldTimings[i]}
          onChange={e => handleFoldTimingChange(i, e.target.value)}
          className="w-full border p-2 rounded my-1 dark:bg-gray-700 dark:text-white"
        />
      ))}
    </div>
  );
}
