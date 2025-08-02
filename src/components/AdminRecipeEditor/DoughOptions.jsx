// DoughOptions.jsx

export function DoughOptions({ doughType, setDoughType, coldFerment, setColdFerment, rye, setRye, seeds, setSeeds }) {
  return (
    <>
      <div className="flex items-center space-x-4">
        <label className="flex items-center space-x-2"><input type="radio" checked={doughType === 'bread'} onChange={() => setDoughType('bread')} /> <span>Leipä</span></label>
        <label className="flex items-center space-x-2"><input type="radio" checked={doughType === 'pizza'} onChange={() => setDoughType('pizza')} /> <span>Pizza</span></label>
        <label className="flex items-center space-x-2"><input type="checkbox" checked={coldFerment} onChange={e => setColdFerment(e.target.checked)} /> <span>Kylmäkohotus</span></label>
      </div>
      {doughType === 'bread' && (
        <div className="flex items-center space-x-4">
          <label className="flex items-center space-x-2"><input type="checkbox" checked={rye} onChange={e => setRye(e.target.checked)} /> <span>Ruis (20%)</span></label>
          <label className="flex items-center space-x-2"><input type="checkbox" checked={seeds} onChange={e => setSeeds(e.target.checked)} /> <span>Siemenet (15%)</span></label>
        </div>
      )}
    </>
  );
}
