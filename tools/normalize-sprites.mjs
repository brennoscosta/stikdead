// STIKDEAD :: normaliza sprites já gerados (sem gastar créditos)
// Re-corta com limiar (mata brilho fantasma) e acolchoa num quadrado centrado,
// deixando o objeto matematicamente no centro do canvas — como a ancoragem espera.
// Uso: node normalize-sprites.mjs
import sharp from 'sharp';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../client/public/sprites');

const files = fs.existsSync(DIR) ? fs.readdirSync(DIR).filter((f) => f.endsWith('.webp')) : [];
if (files.length === 0) {
  console.log(`Nenhum sprite em ${DIR} — gere primeiro com --group=sprites.`);
  process.exit(0);
}

console.log(`Normalizando ${files.length} sprite(s)...\n`);
for (const f of files) {
  const p = path.join(DIR, f);
  try {
    const trimmed = await sharp(p).trim({ threshold: 45 }).png().toBuffer();
    const meta = await sharp(trimmed).metadata();
    const size = Math.max(meta.width, meta.height);
    const padL = Math.floor((size - meta.width) / 2);
    const padT = Math.floor((size - meta.height) / 2);
    await sharp(trimmed)
      .extend({
        top: padT, bottom: size - meta.height - padT,
        left: padL, right: size - meta.width - padL,
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      })
      .resize({ height: 320 })
      .webp({ quality: 88 })
      .toBuffer()
      .then((buf) => fs.writeFileSync(p, buf));
    console.log(`✓ ${f} (${meta.width}x${meta.height} → quadrado centrado)`);
  } catch (err) {
    console.log(`✗ ${f}: ${err.message}`);
  }
}
console.log('\nAgora: cd ../client && npm run build');
