import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import CreatableSelect from 'react-select/creatable';

export default function AdminRecipeEditor({ user }) {
  const isAdmin = user?.email === 'ville.j.lehtola@gmail.com';
  if (!isAdmin) return null;

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [tagOptions, setTagOptions] = useState([
    { label: 'leipä', value: 'leipä' },
    { label: 'pizza', value: 'pizza' },
    { label: 'juuri', value: 'juuri' },
    { label: 'hapanjuuri', value: 'hapanjuuri' }
  ]);
  const [selectedTags, setSelectedTags] = useState([]);
  const [flours, setFlours] = useState([{ type: '', grams: '' }]);
  const [water, setWater] = useState('');
  const [saltPercent, setSaltPercent] = useState('');
  const [oilPercent, setOilPercent] = useState('');
  const [doughType, setDoughType] = useState('bread');
  const [mode, setMode] = useState('manual');
  const [coldFerment, setColdFerment] = useState(false);
  const [rye, setRye] = useState(false);
  const [seeds, setSeeds] = useState(false);
  const [extraIngredients, setExtraIngredients] = useState('');
  const [totalTime, setTotalTime] = useState('');
  const [activeTime, setActiveTime] = useState('');
  const [foldCount, setFoldCount] = useState(4);
  const [foldTimings, setFoldTimings] = useState(['', '', '', '', '', '']);
  const [instructions, setInstructions] = useState('');
  const [message, setMessage] = useState('');

  const totalFlour = flours.reduce((sum, f) => sum + Number(f.grams || 0), 0);
  const hydration = totalFlour > 0 ? ((Number(water) / totalFlour) * 100).toFixed(1) : 0;

  const handleFlourChange = (index, field, value) => {
    const updated = [...flours];
    updated[index][field] = value;
    setFlours(updated);
  };

  const addFlourRow = () => setFlours([...flours, { type: '', grams: '' }]);

  const handleFoldTimingChange = (index, value) => {
    const updated = [...foldTimings];
    updated[index] = value;
    setFoldTimings(updated);
  };

  const insertFoldMarker = (foldNumber) => {
    const marker = `[FOLD ${foldNumber}]`;
    const textarea = document.getElementById('instructions');
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const before = instructions.substring(0, start);
    const after = instructions.substring(end);
    setInstructions(before + marker + after);
  };

  const handleTagChange = (selected) => {
    setSelectedTags(selected || []);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const tags = selectedTags.map(tag => tag.value);

    const { error } = await supabase.from('recipes').insert([{
      created_by: user.id,
      title,
      description,
      tags,
      flours,
      water: Number(water),
      salt_percent: Number(saltPercent),
      oil_percent: Number(oilPercent) || 0,
      dough_type: doughType,
      cold_ferment: coldFerment,
      rye,
      seeds,
      extra_ingredients: extraIngredients,
      hydration: Number(hydration),
      total_time: totalTime,
      active_time: activeTime,
      fold_count: foldCount,
      fold_timings: foldTimings.slice(0, foldCount),
      instructions,
      mode
    }]);

    if (error) {
      setMessage('Virhe tallennuksessa');
      console.error(error);
    } else {
      setMessage('Resepti tallennettu!');
      setTitle('');
      setDescription('');
      setSelectedTags([]);
      setInstructions('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-4 border rounded-lg bg-white dark:bg-gray-800 dark:text-white shadow">
      <h2 className="text-xl font-semibold">Admin Reseptieditori</h2>

      <input type="text" placeholder="Reseptin nimi" value={title} onChange={(e) => setTitle(e.target.value)} className="w-full border p-2 rounded dark:bg-gray-700 dark:text-white placeholder-gray-400 dark:placeholder-gray-500" required />
      <input type="text" placeholder="Kuvaus" value={description} onChange={(e) => setDescription(e.target.value)} className="w-full border p-2 rounded dark:bg-gray-700 dark:text-white placeholder-gray-400 dark:placeholder-gray-500" />

      <div>
        <label className="block mb-1">Tagit</label>
        <CreatableSelect
          isMulti
          options={tagOptions}
          value={selectedTags}
          onChange={handleTagChange}
          className="text-black dark:text-white"
          classNamePrefix="react-select"
          placeholder="Valitse tai kirjoita tagit..."
        />
        <div className="flex flex-wrap gap-2 mt-2">
          {selectedTags.map((tag) => (
            <span key={tag.value} className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-sm dark:bg-blue-900 dark:text-white">
              {tag.label}
            </span>
          ))}
        </div>
      </div>

      <div>
        <label className="block font-medium mb-1">Jauhot</label>
        {flours.map((f, idx) => (
          <div key={idx} className="flex space-x-2 mb-2">
            <input type="text" placeholder="Tyyppi" value={f.type} onChange={e => handleFlourChange(idx, 'type', e.target.value)} className="flex-1 border p-1 rounded dark:bg-gray-700 dark:text-white" required />
            <input type="number" placeholder="Grammat" value={f.grams} onChange={e => handleFlourChange(idx, 'grams', e.target.value)} className="w-24 border p-1 rounded dark:bg-gray-700 dark:text-white" required />
          </div>
        ))}
        <button type="button" onClick={addFlourRow} className="text-blue-600 dark:text-blue-300 underline text-sm">Lisää jauho</button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <input type="number" placeholder="Vesi (g)" value={water} onChange={e => setWater(e.target.value)} className="border p-2 rounded dark:bg-gray-700 dark:text-white" required />
        <input type="number" placeholder="Suola (%)" value={saltPercent} onChange={e => setSaltPercent(e.target.value)} className="border p-2 rounded dark:bg-gray-700 dark:text-white" required />
        {doughType === 'pizza' && (
          <input type="number" placeholder="Öljy (%)" value={oilPercent} onChange={e => setOilPercent(e.target.value)} className="border p-2 rounded dark:bg-gray-700 dark:text-white" />
        )}
      </div>

      <p className="text-sm">Hydraatio: <strong>{hydration}%</strong></p>

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

      <textarea placeholder="Extra ainekset" value={extraIngredients} onChange={e => setExtraIngredients(e.target.value)} className="w-full border p-2 rounded dark:bg-gray-700 dark:text-white" />

      <div className="grid grid-cols-2 gap-4">
        <input type="text" placeholder="Kokonaisaika" value={totalTime} onChange={e => setTotalTime(e.target.value)} className="border p-2 rounded dark:bg-gray-700 dark:text-white" />
        <input type="text" placeholder="Aktiivinen aika" value={activeTime} onChange={e => setActiveTime(e.target.value)} className="border p-2 rounded dark:bg-gray-700 dark:text-white" />
      </div>

      <div>
        <label className="block font-medium">Taitteluiden määrä: {foldCount}</label>
        <input type="range" min={1} max={6} value={foldCount} onChange={e => setFoldCount(Number(e.target.value))} />
        {[...Array(foldCount)].map((_, i) => (
          <input key={i} type="number" placeholder={`Taitto ${i + 1} (min)`} value={foldTimings[i]} onChange={e => handleFoldTimingChange(i, e.target.value)} className="w-full border p-2 rounded my-1 dark:bg-gray-700 dark:text-white" />
        ))}
      </div>

      <div>
        <label className="block font-medium mb-1">Valmistusohjeet</label>
        <textarea id="instructions" value={instructions} onChange={e => setInstructions(e.target.value)} className="w-full border p-2 rounded h-40 dark:bg-gray-700 dark:text-white" />
        <div className="flex flex-wrap gap-2 mt-2">
          {[...Array(foldCount)].map((_, i) => (
            <button key={i} type="button" onClick={() => insertFoldMarker(i + 1)} className="text-blue-600 dark:text-blue-300 underline text-sm">
              Lisää [FOLD {i + 1}]
            </button>
          ))}
        </div>
      </div>

      <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">
        Tallenna resepti
      </button>

      {message && <p className="text-sm text-green-700 dark:text-green-400 mt-2">{message}</p>}
    </form>
  );
}
