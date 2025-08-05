import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { TitleAndTags } from './AdminRecipeEditor/TitleAndTags';
import { FlourInputs } from './AdminRecipeEditor/FlourInputs';
import { HydrationSettings } from './AdminRecipeEditor/HydrationSettings';
import { DoughOptions } from './AdminRecipeEditor/DoughOptions';
import { TimeInputs } from './AdminRecipeEditor/TimeInputs';
import { FoldScheduler } from './AdminRecipeEditor/FoldScheduler';
import { InstructionsEditor } from './AdminRecipeEditor/InstructionsEditor';

export default function AdminRecipeEditor({ user, existingRecipe }) {
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

  const [imageFiles, setImageFiles] = useState([]);
  const [previewUrls, setPreviewUrls] = useState([]);

  const isEditMode = !!existingRecipe;

  // Prefill data if editing
  useEffect(() => {
    if (existingRecipe) {
      setTitle(existingRecipe.title || '');
      setDescription(existingRecipe.description || '');
      setSelectedTags((existingRecipe.tags || []).map(tag => ({ label: tag, value: tag })));
      setFlours(existingRecipe.flours || [{ type: '', grams: '' }]);
      setWater(existingRecipe.water?.toString() || '');
      setSaltPercent(existingRecipe.salt_percent?.toString() || '');
      setOilPercent(existingRecipe.oil_percent?.toString() || '');
      setDoughType(existingRecipe.dough_type || 'bread');
      setMode(existingRecipe.mode || 'manual');
      setColdFerment(existingRecipe.cold_ferment || false);
      setRye(existingRecipe.rye || false);
      setSeeds(existingRecipe.seeds || false);
      setExtraIngredients(existingRecipe.extra_ingredients || '');
      setTotalTime(existingRecipe.total_time || '');
      setActiveTime(existingRecipe.active_time || '');
      setFoldCount(existingRecipe.fold_count || 4);
      setFoldTimings(existingRecipe.fold_timings || ['', '', '', '', '', '']);
      setInstructions(existingRecipe.instructions || '');
    }
  }, [existingRecipe]);

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

  const handleImageSelect = (e) => {
    const files = Array.from(e.target.files);
    setImageFiles(files);
    const previews = files.map(file => URL.createObjectURL(file));
    setPreviewUrls(previews);
  };

  const uploadImages = async (recipeId) => {
    for (const file of imageFiles) {
      const ext = file.name.split('.').pop();
      const filename = `${Date.now()}-${file.name}`;
      const path = `${recipeId}/${filename}`;

      const { error: uploadError } = await supabase.storage
        .from('recipes')
        .upload(path, file, {
          contentType: file.type
        });

      if (uploadError) {
        console.error('Image upload failed:', uploadError);
        continue;
      }

      const { data } = supabase.storage.from('recipes').getPublicUrl(path);

      await supabase.from('recipe_images').insert({
        recipe_id: recipeId,
        url: data.publicUrl
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    const tags = selectedTags.map(tag => tag.value);

    const recipeData = {
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
    };

    let recipeId = existingRecipe?.id;

    if (isEditMode) {
      const { error } = await supabase
        .from('recipes')
        .update(recipeData)
        .eq('id', existingRecipe.id);

      if (error) {
        console.error(error);
        setMessage('Päivitys epäonnistui');
        return;
      }
    } else {
      const { data, error } = await supabase
        .from('recipes')
        .insert([recipeData])
        .select();

      if (error || !data?.[0]) {
        console.error(error);
        setMessage('Tallennus epäonnistui');
        return;
      }
      recipeId = data[0].id;
    }

    await uploadImages(recipeId);
    setMessage('Resepti tallennettu!');
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-4 border rounded-lg bg-white dark:bg-gray-800 dark:text-white shadow">
      <h2 className="text-xl font-semibold">{isEditMode ? 'Muokkaa reseptiä' : 'Luo uusi resepti'}</h2>

      <TitleAndTags
        title={title}
        setTitle={setTitle}
        description={description}
        setDescription={setDescription}
        selectedTags={selectedTags}
        setSelectedTags={setSelectedTags}
        tagOptions={tagOptions}
      />

      <FlourInputs
        flours={flours}
        handleFlourChange={handleFlourChange}
        addFlourRow={addFlourRow}
      />

      <HydrationSettings
        water={water}
        setWater={setWater}
        saltPercent={saltPercent}
        setSaltPercent={setSaltPercent}
        oilPercent={oilPercent}
        setOilPercent={setOilPercent}
        doughType={doughType}
        hydration={hydration}
      />

      <DoughOptions
        doughType={doughType}
        setDoughType={setDoughType}
        coldFerment={coldFerment}
        setColdFerment={setColdFerment}
        rye={rye}
        setRye={setRye}
        seeds={seeds}
        setSeeds={setSeeds}
      />

      <textarea
        placeholder="Extra ainekset"
        value={extraIngredients}
        onChange={e => setExtraIngredients(e.target.value)}
        className="w-full border p-2 rounded dark:bg-gray-700 dark:text-white"
      />

      <div>
        <label className="block mb-1 font-medium">Reseptikuvat</label>
        <input
          type="file"
          multiple
          accept="image/*"
          onChange={handleImageSelect}
          className="mb-2"
        />
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-2">
          {previewUrls.map((url, idx) => (
            <img
              key={idx}
              src={url}
              alt={`Kuva ${idx + 1}`}
              className="rounded shadow object-cover w-full h-40"
            />
          ))}
        </div>
      </div>

      <TimeInputs
        totalTime={totalTime}
        setTotalTime={setTotalTime}
        activeTime={activeTime}
        setActiveTime={setActiveTime}
      />

      <FoldScheduler
        foldCount={foldCount}
        setFoldCount={setFoldCount}
        foldTimings={foldTimings}
        handleFoldTimingChange={handleFoldTimingChange}
      />

      <InstructionsEditor
        instructions={instructions}
        setInstructions={setInstructions}
        foldCount={foldCount}
        insertFoldMarker={insertFoldMarker}
      />

      <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">
        {isEditMode ? 'Päivitä resepti' : 'Tallenna resepti'}
      </button>

      {message && <p className="text-sm text-green-700 dark:text-green-400 mt-2">{message}</p>}
    </form>
  );
}
