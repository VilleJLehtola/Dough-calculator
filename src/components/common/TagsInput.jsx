import React, { useEffect, useState } from 'react';
import supabase from '@/supabaseClient';
import { useTranslation } from 'react-i18next';

/** debounce helper */
function useDebounced(value, delay = 180) {
  const [v, setV] = useState(value);
  useEffect(() => { const h = setTimeout(() => setV(value), delay); return () => clearTimeout(h); }, [value, delay]);
  return v;
}

export default function TagsInput({
  recipeId,
  value = [],            // [{ id, name }]
  onChange = () => {},
  inputClassName = '',
  pillClassName = '',
}) {
  const { t } = useTranslation();
  const [q, setQ] = useState('');
  const dq = useDebounced(q);
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let dead = false;
    (async () => {
      setError('');
      const term = (dq || '').trim();
      if (!term) { setSuggestions([]); return; }
      setLoading(true);
      try {
        const { data, error: err } = await supabase
          .from('tags')
          .select('id,name')
          .ilike('name', `%${term}%`)
          .order('name')
          .limit(20);
        if (err) throw err;

        const selected = new Set(value.map(v => v.id));
        const filtered = (data || []).filter(tg => !selected.has(tg.id));
        if (!dead) setSuggestions(filtered);
      } catch (e) {
        if (!dead) setError(e.message || t('search_failed', 'Search failed'));
      } finally {
        if (!dead) setLoading(false);
      }
    })();
    return () => { dead = true; };
  }, [dq, value, t]);

  async function linkTagToRecipe(tag) {
    if (value.some(v => v.id === tag.id)) return;
    const { error: linkErr } = await supabase
      .from('recipe_tags')
      .insert({ recipe_id: recipeId, tag_id: tag.id });
    if (linkErr) {
      setError(linkErr.message || t('cannot_attach_tag', 'Cannot attach tag (permission?)'));
      return;
    }
    onChange([...value, { id: tag.id, name: tag.name }]);
  }

  async function addByName(raw) {
    const name = (raw || '').trim();
    if (!name) return;
    setError('');
    try {
      let tag = null;
      const { data: up, error: upErr } = await supabase
        .from('tags')
        .upsert({ name }, { onConflict: 'name' })
        .select('id,name')
        .single();
      if (upErr) {
        const { data: ex } = await supabase.from('tags').select('id,name').ilike('name', name).maybeSingle();
        if (!ex) throw upErr;
        tag = ex;
      } else {
        tag = up;
      }
      await linkTagToRecipe(tag);
      setQ('');
      setSuggestions([]);
    } catch (e) {
      setError(e.message || t('add_tag_failed', 'Adding tag failed'));
    }
  }

  async function removeTag(id) {
    setError('');
    try {
      const { error: delErr } = await supabase
        .from('recipe_tags')
        .delete()
        .eq('recipe_id', recipeId)
        .eq('tag_id', id);
      if (delErr) throw delErr;
      onChange(value.filter(v => v.id !== id));
    } catch (e) {
      setError(e.message || t('remove_tag_failed', 'Removing tag failed'));
    }
  }

  const onKeyDown = (e) => {
    if (e.key === 'Enter') { e.preventDefault(); if (q.trim()) addByName(q); }
    else if (e.key === 'Escape') { setQ(''); setSuggestions([]); }
    else if (e.key === 'Backspace' && !q) { const last = value[value.length - 1]; if (last) removeTag(last.id); }
  };

  const exactExists = suggestions.some(s => s.name.toLowerCase() === q.trim().toLowerCase());

  return (
    <div className="w-full relative"> {/* relative for the absolute dropdown */}
      {/* pills */}
      <div className="flex flex-wrap gap-2 mb-2">
        {value.map(tag => (
          <span
            key={tag.id}
            className={`inline-flex items-center gap-2 px-2 py-1 rounded-full text-sm bg-gray-100 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 ${pillClassName}`}
          >
            #{tag.name}
            <button type="button" onMouseDown={() => removeTag(tag.id)} title={t('remove','Remove')} className="opacity-70 hover:opacity-100">×</button>
          </span>
        ))}
      </div>

      {/* input */}
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        onKeyDown={onKeyDown}
        className={`w-full rounded-lg border border-gray-300 dark:border-slate-600 text-gray-900 dark:text-white bg-white dark:bg-gray-700 placeholder-gray-400 dark:placeholder-gray-500 p-2 ${inputClassName}`}
        placeholder={t('type_to_search_tags','Type to search or add a tag…')}
      />

      {/* dropdown */}
      {(q && (loading || suggestions.length > 0 || !exactExists)) && (
        <div className="absolute z-50 mt-1 w-full rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow">
          {loading ? (
            <div className="px-3 py-2 text-sm opacity-70">{t('loading','Loading…')}</div>
          ) : (
            <>
              {suggestions.map((s) => (
                <div
                  key={s.id}
                  className="w-full text-left px-3 py-2 hover:bg-gray-50 dark:hover:bg-slate-700 cursor-pointer"
                  onMouseDown={(e) => { e.preventDefault(); linkTagToRecipe(s); setQ(''); setSuggestions([]); }}
                >
                  #{s.name}
                </div>
              ))}

              {!exactExists && (
                <div
                  className="w-full text-left px-3 py-2 border-t border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700 cursor-pointer"
                  onMouseDown={(e) => { e.preventDefault(); addByName(q); }}
                >
                  {t('create_tag_named','Create tag “{{name}}”',{ name: q.trim() })}
                </div>
              )}
            </>
          )}
        </div>
      )}

      {error && <div className="mt-2 text-sm text-red-600 dark:text-red-400">{error}</div>}
      <p className="mt-2 text-xs opacity-70">{t('tags_help','Tags are shared across recipes. You can reuse the same tag on multiple recipes.')}</p>
    </div>
  );
}
