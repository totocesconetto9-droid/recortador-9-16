export const config = { maxDuration: 60 };

const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-image:generateContent';
const MAX_SIDE = 4000;

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

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    res.status(500).json({ error: 'Falta configurar GEMINI_API_KEY en las variables de entorno de Vercel.' });
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

  const base64Data = imageBase64.includes(',') ? imageBase64.split(',')[1] : imageBase64;

  const directions = [];
  if (left > 0 || right > 0) directions.push('los lados izquierdo y derecho');
  if (up > 0 || down > 0) directions.push('arriba y abajo');

  let instruction = `Extendé esta foto (outpainting) agregando contenido nuevo, fotorrealista y perfectamente coherente en ${directions.join(' y ')}, de forma que la composición y el sujeto original queden intactos y centrados, sin recortar ni alterar la foto original. Continuá el fondo, la iluminación, los colores y la perspectiva de manera totalmente natural, sin bordes visibles ni costuras. No agregues texto ni marcas de agua.`;
  if (prompt) instruction += ` Contexto adicional para el fondo nuevo: ${String(prompt).slice(0, 500)}.`;

  const requestBody = {
    contents: [{
      parts: [
        { text: instruction },
        { inline_data: { mime_type: 'image/jpeg', data: base64Data } }
      ]
    }]
  };

  try {
    const upstream = await fetch(GEMINI_URL, {
      method: 'POST',
      headers: {
        'x-goog-api-key': apiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    const result = await upstream.json();

    if (!upstream.ok) {
      res.status(upstream.status).json({ error: `Gemini: ${result?.error?.message || JSON.stringify(result)}` });
      return;
    }

    const parts = result?.candidates?.[0]?.content?.parts || [];
    const imagePart = parts.find(p => p.inlineData || p.inline_data);
    const inline = imagePart && (imagePart.inlineData || imagePart.inline_data);

    if (!inline || !inline.data) {
      const textPart = parts.find(p => p.text);
      res.status(502).json({ error: textPart?.text || 'Gemini no devolvió ninguna imagen.' });
      return;
    }

    const mimeType = inline.mimeType || inline.mime_type || 'image/png';
    res.status(200).json({ image: `data:${mimeType};base64,${inline.data}` });
  } catch (err) {
    res.status(500).json({ error: `Error llamando a Gemini: ${err.message}` });
  }
}
