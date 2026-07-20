# Recortador 9:16 / 4:5

Recortador de fotos en batch para Stories/Reels (9:16) y Feed (4:5). Corre 100% en el navegador (sin backend, sin APIs externas, sin costo): drag & drop, efectos de color, reposicionamiento de recorte, mejora de nitidez con canvas, relleno de marco con blur/zoom, y export en ZIP.

## Completar marco (sin IA)

El botón **🪄 Completar marco** aparece cuando la foto no llena el marco 9:16/4:5 sin recortar contenido. En vez de cortar la imagen, rellena los bordes vacíos con una versión difuminada y ampliada de la misma foto (la técnica típica del fondo de Instagram Stories cuando subís una foto panorámica). Todo se genera con canvas en el navegador — sin modelos de IA, sin llamadas de red, sin API key, sin costo.

## Uso local

Es un sitio estático (un solo `index.html`), así que alcanza con abrirlo directo en el navegador o:

```bash
npx serve .
```

## Deploy en Vercel

Importá el repo en [vercel.com/new](https://vercel.com/new) — Vercel detecta automáticamente el `index.html` estático, sin configuración ni variables de entorno.
