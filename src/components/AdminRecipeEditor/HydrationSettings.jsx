//HydrationSettings.jsx

export function HydrationSettings({ water, setWater, saltPercent, setSaltPercent, oilPercent, setOilPercent, doughType, hydration }) {
  return (
    <>
      <div className="grid grid-cols-2 gap-4">
        <input type="number" placeholder="Vesi (g)" value={water} onChange={e => setWater(e.target.value)} className="border p-2 rounded dark:bg-gray-700 dark:text-white" required />
        <input type="number" placeholder="Suola (%)" value={saltPercent} onChange={e => setSaltPercent(e.target.value)} className="border p-2 rounded dark:bg-gray-700 dark:text-white" required />
        {doughType === 'pizza' && (
          <input type="number" placeholder="Öljy (%)" value={oilPercent} onChange={e => setOilPercent(e.target.value)} className="border p-2 rounded dark:bg-gray-700 dark:text-white" />
        )}
      </div>
      <p className="text-sm">Hydraatio: <strong>{hydration}%</strong></p>
    </>
  );
}
