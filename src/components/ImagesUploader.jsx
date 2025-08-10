import React, { useState } from 'react'
import { supabase } from '@/supabaseClient'
import { v4 as uuidv4 } from 'uuid'

export default function ImagesUploader({ recipeId, userId, onUploaded }) {
  const [files, setFiles] = useState([])
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState(null)

  const handleChange = (e) => {
    setFiles(Array.from(e.target.files || []))
  }

  const uploadAll = async () => {
    if (!recipeId || files.length === 0) return
    setUploading(true)
    setError(null)
    try {
      const bucket = 'recipe-images'
      const uploaded = []
      for (const file of files) {
        const ext = file.name.split('.').pop()
        const path = `${userId || 'anon'}/${recipeId}/${uuidv4()}.${ext}`
        const { error: upErr } = await supabase.storage.from(bucket).upload(path, file, { upsert: false })
        if (upErr) throw upErr
        const { data: pub } = supabase.storage.from(bucket).getPublicUrl(path)
        const url = pub.publicUrl
        const { error: insErr } = await supabase.from('recipe_images').insert({ recipe_id: recipeId, url })
        if (insErr) throw insErr
        uploaded.push(url)
      }
      onUploaded?.(uploaded)
      setFiles([])
    } catch (e) {
      setError(e.message)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium">Kuvat</label>
      <input
        type="file"
        multiple
        accept="image/*"
        onChange={handleChange}
        className="block w-full text-gray-900 dark:text-white bg-white dark:bg-gray-700 placeholder-gray-400 dark:placeholder-gray-500 file:mr-3 file:py-2 file:px-3 file:border-0 file:rounded-xl file:bg-gray-100 dark:file:bg-gray-600"
      />
      <button
        type="button"
        onClick={uploadAll}
        disabled={uploading || files.length === 0 || !recipeId}
        className="px-4 py-2 rounded-2xl shadow bg-black/90 text-white disabled:opacity-50"
      >{uploading ? 'Ladataan…' : 'Lataa kuvat'}</button>
      {error && <p className="text-sm text-red-600">{error}</p>}
      {files.length > 0 && (
        <p className="text-sm opacity-70">Valittu: {files.map(f => f.name).join(', ')}</p>
      )}
    </div>
  )
}
