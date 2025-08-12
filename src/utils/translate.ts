// =============================
// File: src/utils/translate.ts
// =============================
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
  // Normalized to array
  return Array.isArray(data.translatedText)
    ? (data.translatedText as string[])
    : [data.translatedText as string];
}

// Lightweight heuristic detector. Replace with your provider's detect API when ready.
export async function detectLanguage(text: string): Promise<string | null> {
  if (!text || !text.trim()) return null;
  // Very rough hints for FI/EN/SV
  const fiHints = /[åäöÅÄÖ]|(?:\bja\b|\bettä\b|\bei\b|\bkun\b|\bkuin\b|\bjos\b|\btämä\b|\bsitä\b)/i;
  const svHints = /[åäöÅÄÖ]|(?:\boch\b|\batt\b|\binte\b|\bär\b|\bfrån\b|\btill\b)/i;
  const enHints = /\b(the|and|is|are|with|from|to|of|for|in|on)\b/i;
  if (fiHints.test(text)) return 'fi';
  if (svHints.test(text)) return 'sv';
  if (enHints.test(text)) return 'en';
  return 'fi'; // default for legacy content
}
