// TimeInputs.jsx
export function TimeInputs({ totalTime, setTotalTime, activeTime, setActiveTime }) {
  return (
    <div className="grid grid-cols-2 gap-4">
      <input
        type="text"
        placeholder="Kokonaisaika"
        value={totalTime}
        onChange={e => setTotalTime(e.target.value)}
        className="border p-2 rounded dark:bg-gray-700 dark:text-white"
      />
      <input
        type="text"
        placeholder="Aktiivinen aika"
        value={activeTime}
        onChange={e => setActiveTime(e.target.value)}
        className="border p-2 rounded dark:bg-gray-700 dark:text-white"
      />
    </div>
  );
}
