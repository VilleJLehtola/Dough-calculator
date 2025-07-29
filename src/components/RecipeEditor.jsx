// RecipeEditor.jsx
import { useState } from 'react';

import { supabase } from '../supabaseClient';

export default function RecipeEditor({ user, onRecipeCreated }) {
  const isAdmin = user?.email === 'ville.j.lehtola@gmail.com';
  const [form, setForm] = useState({
    title: '',
    description: '',
    instructions: '',
    tags: '',
    mode: 'leipa',
    hydration: 70,
    salt_pct: 2,
    use_oil: false,
    cold_fermentation: false,
    use_rye: false,
    use_seeds: false,
    flour_amount: '',
    water_amount: '',
    salt_amount: '',
    oil_amount: '',
    juuri_amount: '',
    seeds_amount: '',
    extras: '',
  });
  const [message, setMessage] = useState('');

  useEffect(() => {
    const flour = parseFloat(form.flour_amount);
    const water = parseFloat(form.water_amount);
    const salt = parseFloat(form.salt_amount);

    if (flour > 0 && water > 0) {
      const h = (water / flour) * 100;
      setForm((prev) => ({ ...prev, hydration: Math.round(h) }));
    }

    if (flour > 0 && salt > 0) {
      const s = (salt / flour) * 100;
      setForm((prev) => ({ ...prev, salt_pct: Math.round(s * 10) / 10 }));
    }
  }, [form.flour_amount, form.water_amount, form.salt_amount]);

  if (!isAdmin) return null;

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async () => {
    const { title, description, instructions } = form;
    if (!title || !description || !instructions) {
      setMessage('Täytä kaikki kentät');
      return;
    }

    const { error } = await supabase.from('recipes').insert([
      {
        ...form,
        tags: form.tags.split(',').map((t) => t.trim()),
        created_by: user.id,
      },
    ]);

    if (error) {
      setMessage('Tallennus epäonnistui');
    } else {
      setMessage('Resepti tallennettu!');
      setForm({
        title: '',
        description: '',
        instructions: '',
        tags: '',
        mode: 'leipa',
        hydration: 70,
        salt_pct: 2,
        use_oil: false,
        cold_fermentation: false,
        use_rye: false,
        use_seeds: false,
        flour_amount: '',
        water_amount: '',
        salt_amount: '',
        oil_amount: '',
        juuri_amount: '',
        seeds_amount: '',
        extras: '',
      });
      onRecipeCreated?.();
    }
  };

  return (
    <div className="bg-white p-4 rounded-xl shadow max-w-2xl mx-auto mb-6">
      <h3 className="text-xl font-bold mb-2">Lisää uusi resepti</h3>
      <div className="grid grid-cols-1 gap-2">
        <input name="title" value={form.title} onChange={handleChange} placeholder="Nimi" className="border px-2 py-1 rounded" />
        <input name="description" value={form.description} onChange={handleChange} placeholder="Kuvaus" className="border px-2 py-1 rounded" />
        <textarea name="instructions" value={form.instructions} onChange={handleChange} placeholder="Ohjeet" className="border px-2 py-1 rounded" rows={4} />
        <input name="tags" value={form.tags} onChange={handleChange} placeholder="Tagit (pilkulla eroteltu)" className="border px-2 py-1 rounded" />
        <select name="mode" value={form.mode} onChange={handleChange} className="border px-2 py-1 rounded">
          <option value="leipa">Leipä</option>
          <option value="pizza">Pizza</option>
        </select>
        <input name="hydration" type="number" value={form.hydration} onChange={handleChange} placeholder="Hydraatio %" className="border px-2 py-1 rounded" />
        <input name="salt_pct" type="number" value={form.salt_pct} onChange={handleChange} placeholder="Suola %" className="border px-2 py-1 rounded" />
        <label><input type="checkbox" name="use_oil" checked={form.use_oil} onChange={handleChange} /> Öljy</label>
        <label><input type="checkbox" name="cold_fermentation" checked={form.cold_fermentation} onChange={handleChange} /> Kylmäkohotus</label>
        <label><input type="checkbox" name="use_rye" checked={form.use_rye} onChange={handleChange} /> Ruis</label>
        <label><input type="checkbox" name="use_seeds" checked={form.use_seeds} onChange={handleChange} /> Siemenet</label>

        <input name="flour_amount" type="number" value={form.flour_amount} onChange={handleChange} placeholder="Jauho määrä (g)" className="border px-2 py-1 rounded" />
        <input name="water_amount" type="number" value={form.water_amount} onChange={handleChange} placeholder="Vesi määrä (g)" className="border px-2 py-1 rounded" />
        <input name="salt_amount" type="number" value={form.salt_amount} onChange={handleChange} placeholder="Suola määrä (g)" className="border px-2 py-1 rounded" />
        <input name="oil_amount" type="number" value={form.oil_amount} onChange={handleChange} placeholder="Öljy määrä (g)" className="border px-2 py-1 rounded" />
        <input name="juuri_amount" type="number" value={form.juuri_amount} onChange={handleChange} placeholder="Juuri määrä (g)" className="border px-2 py-1 rounded" />
        <input name="seeds_amount" type="number" value={form.seeds_amount} onChange={handleChange} placeholder="Siemenet määrä (g)" className="border px-2 py-1 rounded" />

        <textarea name="extras" value={form.extras} onChange={handleChange} placeholder="Lisäainesosat (esim. 4 valkosipulinkynttä)" className="border px-2 py-1 rounded" rows={2} />

        <button onClick={handleSubmit} className="bg-green-600 text-white py-2 rounded hover:bg-green-700">Tallenna resepti</button>
        {message && <p className="text-sm text-blue-600 mt-1">{message}</p>}
      </div>
    </div>
  );
}
