import React, { useEffect, useState } from 'react'

const FLAGS = [
  { code: 'auto', label: 'Auto', emoji: '🌐' },
  { code: 'fi',   label: 'Suomi', emoji: '🇫🇮' },
  { code: 'en',   label: 'English', emoji: '🇬🇧' }, // or 🇺🇸
  { code: 'sv',   label: 'Svenska', emoji: '🇸🇪' },
]

export default function LanguageSwitcher() {
  const [lang, setLang] = useState(localStorage.getItem('lang') || 'auto')

  useEffect(() => {
    // notify other tabs/pages
    localStorage.setItem('lang', lang)
    window.dispatchEvent(new StorageEvent('storage', { key: 'lang', newValue: lang }))
  }, [lang])

  return (
    <div className="flex gap-2 items-center">
      {FLAGS.map(f => (
        <button
          key={f.code}
          onClick={() => setLang(f.code)}
          className={`px-2 py-1 rounded-lg border transition ${
            lang === f.code ? 'bg-white/10 border-white/40' : 'border-transparent hover:bg-white/5'
          }`}
          title={f.label}
          aria-label={f.label}
        >
          <span className="text-lg leading-none">{f.emoji}</span>
        </button>
      ))}
    </div>
  )
}
