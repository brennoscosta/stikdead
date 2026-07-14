// STIKDEAD :: monta os frames renderizados em sprite sheets (strips horizontais)
// Uso: node montar-sheet.mjs /tmp/frames
import sharp from 'sharp';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const IN = process.argv[2] || '/tmp/frames';
const OUT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../client/public/parts');
const files = fs.readdirSync(IN).filter((f) => f.endsWith('.png')).sort();
const grupos = {};
for (const f of files) {
  const nome = f.replace(/_\d+\.png$/, '');
  (grupos[nome] ||= []).push(path.join(IN, f));
}
const meta = {};
for (const [nome, fr] of Object.entries(grupos)) {
  const m0 = await sharp(fr[0]).metadata();
  const fw = m0.width, fh = m0.height;
  const strip = sharp({
    create: { width: fw * fr.length, height: fh, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } },
  }).composite(fr.map((p, i) => ({ input: p, left: i * fw, top: 0 })));
  await strip.webp({ quality: 90 }).toFile(path.join(OUT, `render_${nome}.webp`));
  meta[nome] = { frames: fr.length, fw, fh };
  console.log(`✓ render_${nome}.webp (${fr.length} frames ${fw}x${fh})`);
}
fs.writeFileSync(path.join(OUT, 'render_meta.json'), JSON.stringify(meta));
console.log('SHEETS_OK');
