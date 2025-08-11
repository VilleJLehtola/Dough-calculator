// =============================================
// File: /api/translate.ts  (Vercel Serverless API)
// =============================================
import type { VercelRequest, VercelResponse } from '@vercel/node';

const AZ_KEY = process.env.AZURE_TRANSLATOR_KEY || '';
const AZ_ENDPOINT = (process.env.AZURE_TRANSLATOR_ENDPOINT || '').replace(/\/$/, '');
const AZ_REGION = process.env.AZURE_TRANSLATOR_REGION || '';

const DEEPL_KEY = process.env.DEEPL_API_KEY || '';
const DEEPL_BASE = (process.env.DEEPL_BASE_URL || 'https://api-free.deepl.com').replace(/\/$/, '');

function cors(res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

// --- Azure Translator ---
async function translateViaAzure(qs: string[], source: string | undefined, target: string) {
  if (!AZ_KEY || !AZ_ENDPOINT) throw new Error('azure-missing-config');
  const params = new URLSearchParams({ 'api-version': '3.0', to: target });
  if (source) params.append('from', source);
  const url = `${AZ_ENDPOINT}/translate?${params.toString()}`;

  const headers: Record<string, string> = {
    'Ocp-Apim-Subscription-Key': AZ_KEY,
    'Content-Type': 'application/json',
  };
  if (AZ_REGION) headers['Ocp-Apim-Subscription-Region'] = AZ_REGION;

  const body = JSON.stringify(qs.map((t) => ({ Text: t })));
  const r = await fetch(url, { method: 'POST', headers, body });
  if (!r.ok) throw new Error(`azure-${r.status}`);
  const data: any[] = await r.json();
  const out = data.map((item: any) => item?.translations?.[0]?.text).filter(Boolean);
  if (out.length !== qs.length) throw new Error('azure-empty');
  return out as string[];
}

// --- DeepL ---
async function translateViaDeepL(qs: string[], source: string | undefined, target: string) {
  if (!DEEPL_KEY) throw new Error('deepl-missing-config');
  const url = `${DEEPL_BASE}/v2/translate`;
  const form = new URLSearchParams();
  form.append('auth_key', DEEPL_KEY);
  form.append('target_lang', target.toUpperCase());
  if (source) form.append('source_lang', source.toUpperCase());
  for (const t of qs) form.append('text', t);

  const r = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: form });
  if (!r.ok) throw new Error(`deepl-${r.status}`);
  const data: any = await r.json();
  const out = (data?.translations || []).map((t: any) => t?.text).filter(Boolean);
  if (out.length !== qs.length) throw new Error('deepl-empty');
  return out as string[];
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    if (req.method === 'GET') {
      return res.status(200).json({ ok: true, providerOrder: ['azure', 'deepl'] });
    }
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const { q, source = '', target } = (req.body || {}) as { q: string | string[]; source?: string; target: string };
    if (!q || !target) return res.status(400).json({ error: 'Missing q or target' });

    const qs = Array.isArray(q) ? q : [q];

    // Try Azure first, then DeepL
    try {
      const out = await translateViaAzure(qs, source || undefined, target);
      const result = Array.isArray(q) ? out : out[0];
      return res.status(200).json({ translatedText: result, provider: 'azure' });
    } catch (_e) {
      const out = await translateViaDeepL(qs, source || undefined, target);
      const result = Array.isArray(q) ? out : out[0];
      return res.status(200).json({ translatedText: result, provider: 'deepl' });
    }
  } catch (err: any) {
    return res.status(500).json({ error: err?.message || 'translate-failed' });
  }
}
