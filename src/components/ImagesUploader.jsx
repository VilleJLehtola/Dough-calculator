// /src/components/ImagesUploader.jsx
import React, { useRef, useState } from 'react'
import supabase from '@/supabaseClient'

const BUCKET = 'recipe-images'

// ---------- helpers ----------
function safeName(name, forcedExt) {
  const dot = name.lastIndexOf('.')
  const base = (dot === -1 ? name : name.slice(0, dot))
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
  const ext = forcedExt || (dot === -1 ? '.jpg' : name.slice(dot).toLowerCase())
  const ts = Date.now()
  const rand = Math.random().toString(36).slice(2, 7)
  return `${ts}-${rand}-${base || 'image'}${ext}`
}

// Load a File into an ImageBitmap (fast path) or HTMLImageElement (fallback)
async function fileToBitmap(file) {
  try {
    // Most modern browsers
    return await createImageBitmap(file)
  } catch {
    // Fallback via <img>
    const url = URL.createObjectURL(file)
    try {
      const img = await new Promise((res, rej) => {
        const el = new Image()
        el.onload = () => res(el)
        el.onerror = rej
        el.src = url
      })
      // Convert to bitmap for consistent drawImage path
      return await createImageBitmap(img)
    } finally {
      URL.revokeObjectURL(url)
    }
  }
}

function drawDownscaled(bitmap, maxSide = 1600) {
  const { width, height } = bitmap
  const scale = Math.min(1, maxSide / Math.max(width, height))
  const w = Math.max(1, Math.round(width * scale))
  const h = Math.max(1, Math.round(height * scale))
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d', { alpha: false })
  ctx.drawImage(bitmap, 0, 0, w, h)
  return canvas
}

async function canvasToBlob(canvas, type, quality) {
  return new Promise((resolve) => {
    canvas.toBlob(
      (blob) => resolve(blob || null),
      type,
      quality
    )
  })
}

/**
 * Convert to AVIF (preferred) or WebP (fallback).
 * - Downscales to maxSide px
 * - Returns { blob, ext } or null if conversion failed
 */
async function convertToOptimized(file, opts = {}) {
  const {
    maxSide = 1600,
    webpQuality = 0.8,
    avifQuality = 0.7,
    preferAvif = true,
  } = opts

  // Skip non-images quickly
  if (!file.type.startsWith('image/')) return null

  let bitmap
  try {
    bitmap = await fileToBitmap(file)
  } catch {
    return null
  }
  const canvas = drawDownscaled(bitmap, maxSide)

  // Try AVIF first (if preferred)
  if (preferAvif) {
    const avif = await canvasToBlob(canvas, 'image/avif', avifQuality)
    if (avif && avif.type === 'image/avif') {
      return { blob: avif, ext: '.avif' }
    }
  }

  // Fallback to WebP
  const webp = await canvasToBlob(canvas, 'image/webp', webpQuality)
  if (webp && webp.type === 'image/webp') {
    return { blob: webp, ext: '.webp' }
  }

  // Final fallback: just use original file (no conversion)
  return { blob: file, ext: (file.name.match(/\.\w+$/)?.[0] || '.jpg').toLowerCase() }
}

// ---------- component ----------
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
      // Add row as "uploading"
      setRows((r) => [...r, { name: file.name, status: 'up' }])

      // Convert to AVIF/WebP (downscale + compress)
      let converted
      try {
        converted = await convertToOptimized(file, {
          maxSide: 1600,
          webpQuality: 0.8,
          avifQuality: 0.7,
          preferAvif: true,
        })
      } catch (e) {
        converted = null
      }

      if (!converted || !converted.blob) {
        setRows((r) =>
          r.map((x) =>
            x.name === file.name && x.status === 'up'
              ? { ...x, status: 'err', message: 'Image conversion failed' }
              : x
          )
        )
        continue
      }

      const { blob, ext } = converted
      const nice = safeName(file.name || 'image.jpg', ext)
      const path = `recipes/${recipeId}/${nice}`

      // Upload to Supabase Storage
      const { error: upErr } = await supabase.storage
        .from(BUCKET)
        .upload(path, blob, {
          cacheControl: '31536000', // 1 year; images are content-addressed by name
          upsert: true,
          contentType: blob.type || (ext === '.avif' ? 'image/avif' : 'image/webp'),
        })

      if (upErr) {
        setRows((r) =>
          r.map((x) =>
            x.name === file.name && x.status === 'up'
              ? { ...x, status: 'err', message: upErr.message }
              : x
          )
        )
        continue
      }

      // Public URL
      const { data: pub } = supabase.storage.from(BUCKET).getPublicUrl(path)
      const url = pub?.publicUrl || null
      successes.push({ url, path })

      setRows((r) =>
        r.map((x) =>
          x.name === file.name && x.status === 'up'
            ? { ...x, status: 'ok' }
            : x
        )
      )
    }

    // Inform parent
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
