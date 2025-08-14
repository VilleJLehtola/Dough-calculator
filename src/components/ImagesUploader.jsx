// /src/components/ImagesUploader.jsx
import React, { useRef, useState } from 'react'
import supabase from '@/supabaseClient'

const BUCKET = 'recipe-images'

function safeName(name) {
  const dot = name.lastIndexOf('.')
  const base = (dot === -1 ? name : name.slice(0, dot))
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
  const ext = dot === -1 ? '' : name.slice(dot).toLowerCase()
  const ts = Date.now()
  const rand = Math.random().toString(36).slice(2, 7)
  return `${ts}-${rand}-${base || 'image'}${ext || '.jpg'}`
}

export default function ImagesUploader({ recipeId, userId, draftId, onUploaded }) {
  const inputRef = useRef(null)
  const [busy, setBusy] = useState(false)
  const [rows, setRows] = useState([]) // [{name, status: 'ok'|'err'|'up', message?}]

  const choose = () => inputRef.current?.click()

  const handleFiles = async (fileList) => {
    if (!fileList?.length || !recipeId || !userId) return
    setBusy(true)

    const successes = []

    for (const file of fileList) {
      const nice = safeName(file.name || 'image.jpg')
      const path = `recipes/${recipeId}/${nice}`
      setRows((r) => [...r, { name: file.name, status: 'up' }])

      // Upload
      const { error: upErr } = await supabase.storage
        .from(BUCKET)
        .upload(path, file, {
          cacheControl: '3600',
          upsert: true,
          contentType: file.type || 'image/jpeg',
        })

      if (upErr) {
        setRows((r) =>
          r.map((x) => (x.name === file.name && x.status === 'up' ? { ...x, status: 'err', message: upErr.message } : x)),
        )
        continue
      }

      // Public URL
      const { data: pub } = supabase.storage.from(BUCKET).getPublicUrl(path)
      const url = pub?.publicUrl || null
      successes.push({ url, path })

      setRows((r) =>
        r.map((x) => (x.name === file.name && x.status === 'up' ? { ...x, status: 'ok' } : x)),
      )
    }

    // Inform parent (Create/Edit page)
    if (successes.length && typeof onUploaded === 'function') {
      onUploaded(successes)
    }

    setBusy(false)
  }

  return (
    <div className="space-y-2">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={choose}
          disabled={busy || !recipeId || !userId}
          className="px-3 py-2 rounded-lg border border-gray-300 dark:border-slate-600 hover:bg-gray-50 dark:hover:bg-slate-700 disabled:opacity-60"
          title={!recipeId ? 'Draft not ready yet' : undefined}
        >
          {busy ? 'Uploading…' : 'Valitse tiedostot'}
        </button>
        <span className="text-xs opacity-70">
          Tallennus: <code className="opacity-80">recipe-images/recipes/{recipeId}/…</code>
        </span>
      </div>

      {rows.length > 0 && (
        <ul className="text-sm space-y-1">
          {rows.map((r, i) => (
            <li key={`${r.name}-${i}`} className="flex items-center gap-2">
              <span className="truncate">{r.name}</span>
              {r.status === 'up' && <span className="text-blue-600">…</span>}
              {r.status === 'ok' && <span className="text-green-600">OK</span>}
              {r.status === 'err' && (
                <span className="text-red-600">Error: {r.message || 'upload failed'}</span>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
