import React, { useState } from 'react';

// Adding checklist component
const RecipeChecklist = ({ steps }) => {
  const [checked, setChecked] = useState(Array(steps.length).fill(false));
  const toggle = (i) => {
    const next = [...checked];
    next[i] = !next[i];
    setChecked(next);
  };
  return (
    <ul className="mt-4 space-y-2">
      {steps.map((step, i) => (
        <li key={i} className="flex items-center">
          <input type="checkbox" checked={checked[i]} onChange={() => toggle(i)} className="mr-2" />
          <span className={checked[i] ? "line-through text-gray-500" : ""}>{step}</span>
        </li>
      ))}
    </ul>
  );
};

export default function App() {
  const [flour, setFlour] = useState('');
  const [water, setWater] = useState('');
  const [steps, setSteps] = useState([]);
  const [show, setShow] = useState(false);

  const calc = () => {
    const f = flour ? parseFloat(flour) : null;
    const w = water ? parseFloat(water) : null;
    if (f && !w) return { flour: f, water: +(f * 0.65).toFixed(1), salt: +(f * 0.02).toFixed(1), starter: +(f * 0.2).toFixed(1) };
    if (w && !f) { const fl = +(w / 0.75).toFixed(1); return { flour: fl, water: w, salt: +(fl * 0.02).toFixed(1), starter: +(fl * 0.2).toFixed(1) }; }
    return null;
  };

  const ing = calc();

  const showRecipe = () => {
    if (!ing) return;
    setSteps([
      `Sekoita ${ing.flour}g jauhoja ja ${ing.water}g vettä.`,
      `Lisää ${ing.salt}g suolaa ja ${ing.starter}g taikinaa.`,
      'Vaivaa taikina.',
      'Anna kohota.',
      'Muotoile ja paista.'
    ]);
    setShow(true);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex justify-center items-start p-4">
      <div className="bg-white p-6 rounded-lg shadow-md w-full max-w-md space-y-4">
        <h1 className="text-xl font-bold text-center">Taikinakalkulaattori</h1>

        <input type="number" placeholder="Jauhot (g)" value={flour} onChange={e => {setFlour(e.target.value); setWater(''); setShow(false)}} className="w-full p-2 border rounded" />
        <input type="number" placeholder="Vesi (g)" value={water} onChange={e => {setWater(e.target.value); setFlour(''); setShow(false)}} className="w-full p-2 border rounded" />

        {ing && (
          <div className="bg-gray-100 p-4 rounded space-y-2">
            <p>Jauhot: {ing.flour}g</p>
            <p>Vesi: {ing.water}g</p>
            <p>Suola: {ing.salt}g</p>
            <p>Starter: {ing.starter}g</p>
          </div>
        )}

        <button onClick={showRecipe} className="w-full bg-blue-600 text-white py-2 rounded">Näytä resepti</button>

        {show && <RecipeChecklist steps={steps} />}
      </div>
    </div>
  );
}
