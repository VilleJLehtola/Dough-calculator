// src/components/common/TagsInput.jsx
import React, { useEffect, useMemo, useRef, useState } from 'react';
import supabase from '@/supabaseClient';
import { useTranslation } from 'react-i18next';

function normalizeValue(value) {
  // Accept [{id,name}] or ['name'] → always [{id?, name}]
  if (!Array.isArray(value)) return [];
  return value
    .map(v => (typeof v === 'string' ? { name: v } : v))
    .filter(v => v && typeof v.name === 'string' && v.name.trim() !== '')
    .map(v => ({ id: v.id || null, name: v.name.trim() }));
}

function useDebounced(value, delay = 180) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return v;
}

export default function TagsInput({
  value = [],
  onChange,
  recipeId = null,               // if provided, component will persist links (recipe_tags)
  className = '',
  inputClassName = '',
  maxSuggestions = 10,
}) {
  const { t } = useTranslation();
  const [tags, setTags] = useState(() => normalizeValue(value));
  const [q, setQ] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const debouncedQ = useDebounced(q, 180);
  const wrapperRef = useRef(null);

  // keep internal tags in sync with parent
  useEffect(() => setTags(normalizeValue(value)), [value]);

  const namesLower = useMemo(() => new Set(tags.map(tg => tg.name.toLowerCase())), [tags]);
  const hasName = (name) => namesLower.has((name || '').toLowerCase());
  const normalized = (s) => (s || '').trim().replace(/\s+/g, ' ');

  // Suggest tags from DB
  useEffect(() => {
    let alive = true;
    const run = async () => {
      const term = normalized(debouncedQ);
      if (!term) { if (alive) setSuggestions([]); return; }
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('tags')
          .select('id,name')
          .ilike('name', `%${term}%`)
          .order('name', { ascending: true })
          .limit(maxSuggestions);

        if (!alive) return;
        if (error || !Array.isArray(data)) {
          setSuggestions([]);
        } else {
          const taken = namesLower;
          setSuggestions(data.filter(d => !taken.has(d.name.toLowerCase())));
        }
      } finally {
        if (alive) setLoading(false);
      }
    };
    run();
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedQ, maxSuggestions, namesLower]);

  const bumpRecipeUpdatedAt = async () => {
    if (!recipeId) return;
    try {
      await supabase.from('recipes')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', recipeId);
    } catch { /* ignore */ }
  };

  // Add tag by name (creates tag if needed; links when recipeId present)
  const addByName = async (raw) => {
    const name = normalized(raw);
    if (!name || hasName(name)) { setQ(''); setSuggestions([]); return; }

    let nextTag = { id: null, name };

    if (recipeId) {
      // 1) Upsert tag
      const { data: tagRow, error: tagErr } = await supabase
        .from('tags')
        .upsert([{ name }], { onConflict: 'name' })
        .select('id,name')
        .single();
      if (tagErr || !tagRow?.id) return;

      nextTag = { id: tagRow.id, name: tagRow.name };

      // 2) Link tag to recipe
      const { error: linkErr } = await supabase
        .from('recipe_tags')
        .upsert([{ recipe_id: recipeId, tag_id: nextTag.id }], { onConflict: 'recipe_id,tag_id' });

      if (linkErr) return;

      await bumpRecipeUpdatedAt();
    }

    const next = [...tags, nextTag];
    setTags(next);
    onChange && onChange(next);
    setQ('');
    setSuggestions([]);
  };

  // Remove tag (and unlink when recipeId present)
  const removeTag = async (tg) => {
    if (recipeId && tg?.id) {
      const { error } = await supabase
        .from('recipe_tags')
        .delete()
        .eq('recipe_id', recipeId)
        .eq('tag_id', tg.id);
      if (error) return;
      await bumpRecipeUpdatedAt();
    }
    const next = tags.filter(x => (x.id ? x.id !== tg.id : x.name.toLowerCase() !== tg.name.toLowerCase()));
    setTags(next);
    onChange && onChange(next);
  };

  // click-outside to close suggestions
  useEffect(() => {
    const onDocClick = (e) => {
      if (!wrapperRef.current) return;
      if (!wrapperRef.current.contains(e.target)) setSuggestions([]);
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  return (
    <div ref={wrapperRef} className={className}>
      {/* Chips */}
      <div className="flex flex-wrap gap-2 mb-2">
        {tags.length === 0 ? (
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {t('no_tags_yet','No tags yet')}
          </span>
        ) : (
          tags.map((tg) => (
            <span
              key={tg.id || tg.name}
              className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-100 border border-gray-200 dark:border-gray-600"
            >
              #{tg.name}
              <button
                type="button"
                className="ml-1 rounded p-0.5 hover:bg-gray-200 dark:hover:bg-gray-600"
                title={t('remove_tag','Remove tag')}
                onClick={() => removeTag(tg)}
              >
                ×
              </button>
            </span>
          ))
        )}
      </div>

      {/* Input */}
      <div className="relative max-w-md">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              addByName(q);
            }
          })}
          className={`w-full rounded-lg border border-gray-300 dark:border-slate-600 text-gray-900 dark:text-white bg-white dark:bg-gray-700 placeholder-gray-400 dark:placeholder-gray-500 p-2 ${inputClassName}`}
          placeholder={t('type_to_search_tags','Type to search or add a tag…')}
        />

        {/* Suggestions */}
        {(q.trim() || loading) && (suggestions.length > 0 || loading) && (
          <div className="absolute z-10 mt-1 w-full rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow">
            {loading ? (
              <div className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400">
                {t('loading','Loading…')}
              </div>
            ) : (
              suggestions.map(s => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => addByName(s.name)}
                  className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-slate-700"
                >
                  #{s.name}
                </button>
              ))
            )}

            {/* Create new tag */}
            {!loading && q.trim() && !hasName(q) && (
              <button
                type="button"
                onClick={() => addByName(q)}
                className="w-full text-left px-3 py-2 text-sm border-t border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700"
              >
                {t('create_tag','Create tag')}: “{normalized(q)}”
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
