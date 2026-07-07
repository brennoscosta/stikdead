// STIKDEAD :: fetch-part — baixa uma peça gerada (URL), normaliza e instala
// Uso: node fetch-part.mjs <nome> <url>
// Pipeline: fundo branco -> alfa, trim, quadrado centrado, 512px, webp
import sharp from 'sharp';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { mkdirSync } from 'node:fs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const [, , name, url] = process.argv;
if (!name || !url) { console.error('Uso: node fetch-part.mjs <nome> <url>'); process.exit(1); }

const res = await fetch(url);
if (!res.ok) { console.error('Download falhou:', res.status); process.exit(1); }
const buf = Buffer.from(await res.arrayBuffer());

// 1) branco -> transparente
const { data, info } = await sharp(buf).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
for (let i = 0; i < data.length; i += 4) {
  const [r, g, b] = [data[i], data[i + 1], data[i + 2]];
  if (r > 236 && g > 236 && b > 236) data[i + 3] = 0;
  else if (r > 215 && g > 215 && b > 215) data[i + 3] = Math.round(255 * (1 - (Math.min(r, g, b) - 215) / 40));
}
const cut = await sharp(data, { raw: { width: info.width, height: info.height, channels: 4 } }).png().toBuffer();

// 2) trim das bordas transparentes
const trimmed = await sharp(cut).trim({ threshold: 12 }).png().toBuffer({ resolveWithObject: true });

// 3) enquadramento
mkdirSync(path.join(ROOT, 'client/public/parts'), { recursive: true });
let framed;
if (name === 'head') {
  // cabeça: o quadrado do TOPO (a esfera é o elemento mais alto) + máscara circular
  const w = trimmed.info.width;
  const h = trimmed.info.height;
  const sq = Math.min(w, h);
  const top = await sharp(trimmed.data)
    .extract({ left: Math.floor((w - sq) / 2), top: 0, width: sq, height: sq })
    .png().toBuffer();
  const mask = Buffer.from(
    `<svg width="${sq}" height="${sq}"><circle cx="${sq / 2}" cy="${sq / 2}" r="${sq / 2 - 1}" fill="#fff"/></svg>`
  );
  framed = await sharp(top)
    .composite([{ input: mask, blend: 'dest-in' }])
    .png().toBuffer();
} else {
  const side = Math.max(trimmed.info.width, trimmed.info.height);
  framed = await sharp(trimmed.data)
    .extend({
      top: Math.floor((side - trimmed.info.height) / 2),
      bottom: Math.ceil((side - trimmed.info.height) / 2),
      left: Math.floor((side - trimmed.info.width) / 2),
      right: Math.ceil((side - trimmed.info.width) / 2),
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png().toBuffer();
}
await sharp(framed).resize(512, 512).webp({ quality: 92 }).toFile(path.join(ROOT, 'client/public/parts', `${name}.webp`));
console.log(`✓ peça instalada: client/public/parts/${name}.webp`);
