// /src/utils/translate.ts
export type TranslateResponse = { translatedText: string | string[]; provider: 'azure' | 'deepl' };

export async function translateText(q: string | string[], source: string, target: string) {
  const r = await fetch('/api/translate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ q, source, target }),
  });
  if (!r.ok) throw new Error(`translate ${r.status}`);
  const data = (await r.json()) as TranslateResponse;
  return data.translatedText;
}

export async function translateArray(texts: string[], source: string, target: string) {
  const r = await fetch('/api/translate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ q: texts, source, target }),
  });
  if (!r.ok) throw new Error(`translate ${r.status}`);
  const data = (await r.json()) as TranslateResponse;
  return data.translatedText as string[];
  
export async function detectLanguage(text: string): Promise<string | null> {
  // Prefer your real provider's language-detect call if available, e.g.:
  // return realProvider.detect(text) // -> 'fi' | 'en' | 'sv' | ...

  // Fallback heuristic (very rough, but avoids build errors)
  if (!text || !text.trim()) return null

  // quick hints for FI/EN/SV — extend as needed
  const fiHints = /[åäöÅÄÖ]|(?:\bja\b|\bettä\b|\bei\b|\bkun\b|\bkuin\b|\bjos\b|\btämä\b|\bsitä\b)/i
  const enHints = /\b(the|and|is|are|with|from|to|of)\b/i
  const svHints = /[åäöÅÄÖ]|(?:\boch\b|\batt\b|\binte\b|\bär\b|\bfrån\b|\btill\b)/i

  if (fiHints.test(text)) return 'fi'
  if (svHints.test(text)) return 'sv'
  if (enHints.test(text)) return 'en'

  // default to Finnish for legacy content; adjust if your corpus is different
  return 'fi'
}
