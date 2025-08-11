// =============================================
// File: /src/utils/translate.ts  (Client Helper)
// =============================================
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
  // single roundtrip for arrays
  const r = await fetch('/api/translate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ q: texts, source, target }),
  });
  if (!r.ok) throw new Error(`translate ${r.status}`);
  const data = (await r.json()) as TranslateResponse;
  return data.translatedText as string[];
}
