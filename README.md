# Recortador 9:16 / 4:5

Recortador de fotos en batch para Stories/Reels (9:16) y Feed (4:5). Corre principalmente en el navegador: drag & drop, efectos de color, reposicionamiento de recorte, mejora de nitidez con canvas, export en ZIP, y **relleno generativo con IA** (extiende los bordes de la foto en vez de recortar contenido) vía una función serverless que llama a Gemini (Google AI).

## Relleno generativo (Extender con IA)

El botón **✨ Extender con IA** usa el modelo de edición de imágenes de Gemini (`gemini-3.1-flash-image`) para generar contenido nuevo y coherente en los bordes que quedarían vacíos al encajar la foto completa (sin recortar) en el marco 9:16/4:5.

### Configuración de la API key

Importante: una suscripción a **Gemini Advanced** (la app de gemini.google.com) no da acceso a la API — hace falta una API key de desarrollador aparte:

1. Entrá a [aistudio.google.com/apikey](https://aistudio.google.com/apikey) y generá una API key (la creación es gratis; el uso del modelo de imágenes puede requerir tener facturación habilitada en el proyecto de Google Cloud asociado).
2. En el proyecto de Vercel: **Settings → Environment Variables**, agregá:
   - `GEMINI_API_KEY` = tu key
3. Redeployá el proyecto para que la variable quede disponible.

La key nunca se expone en el navegador — solo la usa la función serverless en `api/outpaint.js`.

## Uso local

Como el proyecto ahora tiene una función serverless (`api/outpaint.js`), para probar el fill con IA en local hace falta la Vercel CLI (no solo un servidor estático):

```bash
npm i -g vercel
vercel dev
```

Si solo querés probar el recorte/efectos/export (sin el fill de IA), alcanza con abrir `index.html` directo en el navegador o:

```bash
npx serve .
```

## Deploy en Vercel

Importá el repo en [vercel.com/new](https://vercel.com/new) — Vercel detecta automáticamente el `index.html` estático y la función en `api/outpaint.js` sin configuración extra. No te olvides de configurar `GEMINI_API_KEY` en las variables de entorno (ver arriba) antes de usar el fill con IA.
