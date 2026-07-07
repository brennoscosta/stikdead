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

// 3) quadrado centrado + 512 + webp
const side = Math.max(trimmed.info.width, trimmed.info.height);
mkdirSync(path.join(ROOT, 'client/public/parts'), { recursive: true });
await sharp(trimmed.data)
  .extend({
    top: Math.floor((side - trimmed.info.height) / 2),
    bottom: Math.ceil((side - trimmed.info.height) / 2),
    left: Math.floor((side - trimmed.info.width) / 2),
    right: Math.ceil((side - trimmed.info.width) / 2),
    background: { r: 0, g: 0, b: 0, alpha: 0 },
  })
  .resize(512, 512)
  .webp({ quality: 92 })
  .toFile(path.join(ROOT, 'client/public/parts', `${name}.webp`));
console.log(`✓ peça instalada: client/public/parts/${name}.webp`);
