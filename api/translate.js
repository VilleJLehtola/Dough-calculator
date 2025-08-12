// /api/translate.js
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const { q, source, target, provider: forcedProvider } = req.body || {};
    if (q == null) {
      res.status(400).json({ error: 'Missing q' });
      return;
    }

    const texts = Array.isArray(q) ? q : [q];

    // Choose provider via env or request param
    const provider = forcedProvider || (process.env.TRANSLATE_PROVIDER || 'deepl'); // 'deepl' | 'azure'

    if (source === 'detect') {
      // detection mode
      if (provider === 'azure') {
        const AZURE_KEY = process.env.AZURE_TRANSLATOR_KEY;
        const AZURE_REGION = process.env.AZURE_TRANSLATOR_REGION; // e.g. "westeurope"
        const AZURE_ENDPOINT = process.env.AZURE_TRANSLATOR_ENDPOINT || 'https://api.cognitive.microsofttranslator.com';
        if (!AZURE_KEY || !AZURE_REGION) {
          res.status(500).json({ error: 'Azure Translator not configured' });
          return;
        }
        const r = await fetch(`${AZURE_ENDPOINT}/detect?api-version=3.0`, {
          method: 'POST',
          headers: {
            'Ocp-Apim-Subscription-Key': AZURE_KEY,
            'Ocp-Apim-Subscription-Region': AZURE_REGION,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(texts.map(t => ({ Text: t }))),
        });
        if (!r.ok) {
          const body = await r.text();
          res.status(r.status).json({ error: `azure detect ${r.status}`, body });
          return;
        }
        const json = await r.json();
        const detected = json?.[0]?.language || null;
        res.status(200).json({ translatedText: detected, provider: 'azure' });
        return;
      } else {
        // DeepL detect: use translate with target=en and read detected_source_language
        const DEEPL_KEY = process.env.DEEPL_API_KEY;
        const DEEPL_ENDPOINT = process.env.DEEPL_API_ENDPOINT || 'https://api-free.deepl.com/v2/translate';
        if (!DEEPL_KEY) {
          res.status(500).json({ error: 'DeepL not configured' });
          return;
        }
        // pick a target just for detection call
        const params = new URLSearchParams();
        texts.forEach(t => params.append('text', t));
        params.append('target_lang', 'EN');

        const r = await fetch(DEEPL_ENDPOINT, {
          method: 'POST',
          headers: { Authorization: `DeepL-Auth-Key ${DEEPL_KEY}`, 'Content-Type': 'application/x-www-form-urlencoded' },
          body: params.toString(),
        });
        if (!r.ok) {
          const body = await r.text();
          res.status(r.status).json({ error: `deepl detect ${r.status}`, body });
          return;
        }
        const json = await r.json();
        const detected = json?.translations?.[0]?.detected_source_language?.toLowerCase() || null;
        res.status(200).json({ translatedText: detected, provider: 'deepl' });
        return;
      }
    }

    // Normal translate
    if (!target) {
      res.status(400).json({ error: 'Missing target' });
      return;
    }

    if (provider === 'azure') {
      const AZURE_KEY = process.env.AZURE_TRANSLATOR_KEY;
      const AZURE_REGION = process.env.AZURE_TRANSLATOR_REGION;
      const AZURE_ENDPOINT = process.env.AZURE_TRANSLATOR_ENDPOINT || 'https://api.cognitive.microsofttranslator.com';
      if (!AZURE_KEY || !AZURE_REGION) {
        res.status(500).json({ error: 'Azure Translator not configured' });
        return;
      }

      const params = new URLSearchParams({ 'api-version': '3.0', to: target });
      // If client passes a source lang, include it; otherwise let Azure auto-detect
      if (source && source !== 'detect') params.append('from', source);

      const r = await fetch(`${AZURE_ENDPOINT}/translate?${params.toString()}`, {
        method: 'POST',
        headers: {
          'Ocp-Apim-Subscription-Key': AZURE_KEY,
          'Ocp-Apim-Subscription-Region': AZURE_REGION,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(texts.map(t => ({ Text: t }))),
      });
      const body = await r.text();
      if (!r.ok) {
        res.status(r.status).json({ error: `azure translate ${r.status}`, body });
        return;
      }
      const json = JSON.parse(body);
      const out = json.map(x => x?.translations?.[0]?.text || '');
      res.status(200).json({ translatedText: Array.isArray(q) ? out : out[0], provider: 'azure' });
      return;
    } else {
      const DEEPL_KEY = process.env.DEEPL_API_KEY;
      const DEEPL_ENDPOINT = process.env.DEEPL_API_ENDPOINT || 'https://api-free.deepl.com/v2/translate';
      if (!DEEPL_KEY) {
        res.status(500).json({ error: 'DeepL not configured' });
        return;
      }
      const params = new URLSearchParams();
      texts.forEach(t => params.append('text', t));
      params.append('target_lang', target.toUpperCase());
      if (source && source !== 'detect') params.append('source_lang', source.toUpperCase());

      const r = await fetch(DEEPL_ENDPOINT, {
        method: 'POST',
        headers: { Authorization: `DeepL-Auth-Key ${DEEPL_KEY}`, 'Content-Type': 'application/x-www-form-urlencoded' },
        body: params.toString(),
      });
      const body = await r.text();
      if (!r.ok) {
        res.status(r.status).json({ error: `deepl translate ${r.status}`, body });
        return;
      }
      const json = JSON.parse(body);
      const out = (json.translations || []).map(t => t.text || '');
      res.status(200).json({ translatedText: Array.isArray(q) ? out : out[0], provider: 'deepl' });
    }
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'server error', detail: String(e?.message || e) });
  }
}
