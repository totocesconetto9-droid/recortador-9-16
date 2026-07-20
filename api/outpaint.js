export const config = { maxDuration: 60 };

const STABILITY_URL = 'https://api.stability.ai/v2beta/stable-image/edit/outpaint';
const MAX_SIDE = 2000;

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', chunk => { data += chunk; });
    req.on('end', () => {
      try { resolve(data ? JSON.parse(data) : {}); }
      catch (err) { reject(err); }
    });
    req.on('error', reject);
  });
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const apiKey = process.env.STABILITY_API_KEY;
  if (!apiKey) {
    res.status(500).json({ error: 'Falta configurar STABILITY_API_KEY en las variables de entorno de Vercel.' });
    return;
  }

  let body;
  try {
    body = await readJsonBody(req);
  } catch {
    res.status(400).json({ error: 'Body inválido.' });
    return;
  }

  const { imageBase64, left = 0, right = 0, up = 0, down = 0, prompt = '' } = body || {};
  if (!imageBase64) {
    res.status(400).json({ error: 'Falta imageBase64.' });
    return;
  }

  const sides = { left, right, up, down };
  for (const [k, v] of Object.entries(sides)) {
    if (typeof v !== 'number' || v < 0 || v > MAX_SIDE || !Number.isFinite(v)) {
      res.status(400).json({ error: `Valor inválido para "${k}".` });
      return;
    }
  }
  if (left + right + up + down === 0) {
    res.status(400).json({ error: 'Hay que extender al menos un lado.' });
    return;
  }

  let imageBuffer;
  try {
    const base64Data = imageBase64.includes(',') ? imageBase64.split(',')[1] : imageBase64;
    imageBuffer = Buffer.from(base64Data, 'base64');
  } catch {
    res.status(400).json({ error: 'No se pudo decodificar la imagen.' });
    return;
  }

  const form = new FormData();
  form.append('image', new Blob([imageBuffer], { type: 'image/jpeg' }), 'image.jpg');
  form.append('left', String(Math.round(left)));
  form.append('right', String(Math.round(right)));
  form.append('up', String(Math.round(up)));
  form.append('down', String(Math.round(down)));
  form.append('output_format', 'png');
  if (prompt) form.append('prompt', String(prompt).slice(0, 2000));

  try {
    const upstream = await fetch(STABILITY_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        Accept: 'application/json'
      },
      body: form
    });

    const contentType = upstream.headers.get('content-type') || '';
    if (!upstream.ok) {
      const errText = contentType.includes('application/json')
        ? JSON.stringify(await upstream.json())
        : await upstream.text();
      res.status(upstream.status).json({ error: `Stability AI: ${errText}` });
      return;
    }

    const result = await upstream.json();
    if (!result.image) {
      res.status(502).json({ error: 'Respuesta inesperada de Stability AI.' });
      return;
    }

    res.status(200).json({ image: `data:image/png;base64,${result.image}` });
  } catch (err) {
    res.status(500).json({ error: `Error llamando a Stability AI: ${err.message}` });
  }
}
