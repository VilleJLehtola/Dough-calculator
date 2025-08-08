import React, { useEffect, useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import supabase from '@/supabaseClient';
import { Clock, Users, ChefHat } from 'lucide-react';

export default function RecipeViewPage() {
  const { id } = useParams();
  const [recipe, setRecipe] = useState(null);
  const [ingredients, setIngredients] = useState([]);
  const [steps, setSteps] = useState([]);
  const [images, setImages] = useState([]);
  const [author, setAuthor] = useState(null);
  const [loading, setLoading] = useState(true);

  // --- Helpers to accept multiple shapes ---
  const normalizeIngredients = (ingRaw) => {
    if (!ingRaw) return [];
    // If already in [{name, amount, bakers_pct}] form
    if (Array.isArray(ingRaw)) return ingRaw;

    // If provided as newline text "name;amount;bakers"
    if (typeof ingRaw === 'string') {
      return ingRaw
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean)
        .map((line) => {
          const [name, amount, bakers] = line.split(';').map((s) => s?.trim());
          return {
            name: name || '',
            amount: amount || '',
            bakers_pct: bakers || '',
          };
        });
    }
    return [];
  };

  const normalizeSteps = (stepsRaw) => {
    if (!stepsRaw) return [];
    if (Array.isArray(stepsRaw)) return stepsRaw.map((t, i) => ({ position: i + 1, text: t }));
    if (typeof stepsRaw === 'string') {
      return stepsRaw
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean)
        .map((text, idx) => ({ position: idx + 1, text }));
    }
    return [];
  };

  useEffect(() => {
    let isMounted = true;

    async function load() {
      setLoading(true);

      // 1) Base recipe
      const { data: rcp, error: rErr } = await supabase
        .from('recipes')
        .select('*')
        .eq('id', id)
        .single();

      if (rErr) {
        console.error('Recipe fetch error:', rErr.message);
        if (isMounted) setLoading(false);
        return;
      }

      // 2) Try child tables (if they exist). If they error because tables don't exist, just ignore.
      let ing = [];
      try {
        const { data } = await supabase
          .from('recipe_ingredients')
          .select('name, amount, bakers_pct, position')
          .eq('recipe_id', id)
          .order('position', { ascending: true });
        if (data?.length) ing = data;
      } catch (_) {}

      let st = [];
      try {
        const { data } = await supabase
          .from('recipe_steps')
          .select('text, position')
          .eq('recipe_id', id)
          .order('position', { ascending: true });
        if (data?.length) st = data;
      } catch (_) {}

      let img = [];
      try {
        const { data } = await supabase
          .from('recipe_images')
          .select('url, position')
          .eq('recipe_id', id)
          .order('position', { ascending: true });
        if (data?.length) img = data;
      } catch (_) {}

      // 3) Fallback to inline JSON fields if child tables are empty
      if (!ing?.length) ing = normalizeIngredients(rcp.ingredients);
      if (!st?.length) st = normalizeSteps(rcp.instructions || rcp.steps);
      if (!img?.length && rcp.hero_image_url) img = [{ url: rcp.hero_image_url }];

      // 4) Author (if you store user_id on recipes)
      let profile = null;
      try {
        const userId = rcp.user_id || rcp.author_id || rcp.created_by;
        if (userId) {
          // You said you have a 'users' table you insert into on sign-up.
          const { data: u } = await supabase
            .from('users')
            .select('id, email, username, avatar_url')
            .eq('id', userId)
            .single();
          profile = u || null;
        }
      } catch (_) {}

      if (isMounted) {
        setRecipe(rcp);
        setIngredients(ing || []);
        setSteps(st || []);
        setImages(img || []);
        setAuthor(profile);
        setLoading(false);
      }
    }

    load();
    return () => {
      isMounted = false;
    };
  }, [id]);

  const heroUrl = images?.[0]?.url || '';
  const title = recipe?.title || 'Resepti';
  const description = recipe?.description || '';
  const servings = recipe?.servings;
  const totalTime = recipe?.total_time || recipe?.bake_time || recipe?.time_total;
  const difficulty = recipe?.difficulty;

  const hasAnyStats = !!(servings || totalTime || difficulty);

  const statChips = useMemo(
    () =>
      [
        servings ? { icon: Users, label: `${servings} annosta` } : null,
        totalTime ? { icon: Clock, label: `${totalTime} min` } : null,
        difficulty ? { icon: ChefHat, label: difficulty } : null,
      ].filter(Boolean),
    [servings, totalTime, difficulty]
  );

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-48 rounded-xl bg-gray-200 dark:bg-gray-800" />
          <div className="h-6 w-1/3 bg-gray-200 dark:bg-gray-800 rounded" />
          <div className="h-4 w-2/3 bg-gray-200 dark:bg-gray-800 rounded" />
        </div>
      </div>
    );
  }

  if (!recipe) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <p className="text-gray-700 dark:text-gray-300">Recipe not found.</p>
        <Link to="/browse" className="text-blue-600 dark:text-blue-400 underline">
          ← Back to recipes
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6">
      {/* Title */}
      <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">{title}</h1>

      {/* Hero */}
      <div className="mt-4 relative rounded-xl overflow-hidden">
        {/* Keep aspect ratio consistent */}
        <div className="w-full aspect-[21/9] bg-gray-100 dark:bg-gray-800">
          {heroUrl ? (
            <img
              src={heroUrl}
              alt={title}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          ) : null}
        </div>

        {/* Overlay author */}
        {(author?.username || author?.email || description) && (
          <div className="absolute right-4 bottom-4 bg-black/50 text-white rounded-lg px-3 py-2 backdrop-blur-sm">
            <div className="flex items-center gap-3">
              {author?.avatar_url ? (
                <img
                  src={author.avatar_url}
                  alt={author.username || author.email}
                  className="w-8 h-8 rounded-full object-cover"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-white/30 flex items-center justify-center text-xs">
                  {((author?.username || author?.email || 'U') ?? 'U')
                    .slice(0, 1)
                    .toUpperCase()}
                </div>
              )}
              <div className="text-sm leading-tight">
                <div className="font-semibold">
                  {author?.username || author?.email || 'Unknown author'}
                </div>
                {description ? (
                  <div className="opacity-90 line-clamp-1">{description}</div>
                ) : null}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Stats chips */}
      {hasAnyStats && (
        <div className="mt-4 flex flex-wrap items-center gap-2">
          {statChips.map(({ icon: Icon, label }, i) => (
            <div
              key={i}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 shadow-sm text-sm text-gray-700 dark:text-gray-200"
            >
              <Icon className="w-4 h-4" />
              {label}
            </div>
          ))}
        </div>
      )}

      {/* Grid: Ingredients / Instructions */}
      <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Ingredients */}
        <section className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl shadow-sm">
          <div className="px-4 py-3 border-b border-gray-200 dark:border-slate-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Ingredients</h2>
          </div>
          <div className="p-4 overflow-x-auto">
            {ingredients?.length ? (
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-500 dark:text-gray-400">
                    <th className="py-2 pr-4 font-medium">Name</th>
                    <th className="py-2 pr-4 font-medium text-right">Amount</th>
                    <th className="py-2 font-medium text-right">Baker&apos;s %</th>
                  </tr>
                </thead>
                <tbody>
                  {ingredients.map((row, idx) => (
                    <tr
                      key={idx}
                      className={idx % 2 ? 'bg-gray-50 dark:bg-slate-900/40' : 'bg-transparent'}
                    >
                      <td className="py-2 pr-4 text-gray-800 dark:text-gray-200">
                        {row.name ?? ''}
                      </td>
                      <td className="py-2 pr-4 text-gray-800 dark:text-gray-200 text-right">
                        {row.amount ?? ''}
                      </td>
                      <td className="py-2 text-gray-800 dark:text-gray-200 text-right">
                        {row.bakers_pct ?? ''}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="text-gray-600 dark:text-gray-300">No ingredients listed.</p>
            )}
          </div>
        </section>

        {/* Instructions */}
        <section className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl shadow-sm">
          <div className="px-4 py-3 border-b border-gray-200 dark:border-slate-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Instructions</h2>
          </div>
          <div className="p-4">
            {steps?.length ? (
              <ol className="space-y-2 list-decimal pl-5 marker:text-gray-500 dark:marker:text-gray-400">
                {steps.map((s, i) => (
                  <li key={i} className="text-gray-800 dark:text-gray-200">
                    {s.text || s}
                  </li>
                ))}
              </ol>
            ) : (
              <p className="text-gray-600 dark:text-gray-300">No instructions provided.</p>
            )}
          </div>
        </section>
      </div>

      {/* Back link */}
      <div className="mt-6">
        <Link
          to="/browse"
          className="inline-block text-sm text-blue-600 dark:text-blue-400 hover:underline"
        >
          ← Back to recipes
        </Link>
      </div>
    </div>
  );
}
