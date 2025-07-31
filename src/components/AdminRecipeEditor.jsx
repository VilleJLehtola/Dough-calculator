import React, { useState } from 'react';
import { supabase } from '../supabaseClient';

export default function AdminRecipeEditor({ user }) {
  const isAdmin = user?.email === 'ville.j.lehtola@gmail.com';
  if (!isAdmin) return null;

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [tagsInput, setTagsInput] = useState('');
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

  const handleSubmit = async (e) => {
    e.preventDefault();

    const tags = tagsInput
      .split(',')
      .map((tag) => tag.trim())
      .filter((tag) => tag.length > 0);

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
      setTagsInput('');
      setInstructions('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-4 border rounded-lg bg-white dark:bg-gray-800 dark:text-white shadow">
      <h2 className="text-xl font-semibold">Admin Reseptieditori</h2>

      <input
        type="text"
        placeholder="Reseptin nimi"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="w-full border p-2 rounded dark:bg-gray-700 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
        required
      />

      <input
        type="text"
        placeholder="Kuvaus"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        className="w-full border p-2 rounded dark:bg-gray-700 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
      />

      <input
        type="text"
        placeholder="Tagit (pilkulla eroteltuna, esim. leipä, hapanjuuri)"
        value={tagsInput}
        onChange={(e) => setTagsInput(e.target.value)}
        className="w-full border p-2 rounded dark:bg-gray-700 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
      />

      {/* rest of form remains unchanged... */}
