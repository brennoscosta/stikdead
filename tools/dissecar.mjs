// STIKDEAD :: dissecar — corta um render de corpo INTEIRO em peças do rig
// Garante material/luz idênticos em todas as peças (lição da saga: peças
// geradas separadas nunca combinam entre si).
// Uso: node dissecar.mjs <url-do-render-de-corpo-inteiro>
// Pipeline por peça: crop -> rotação (braços diagonais -> verticais) ->
// fundo branco -> alfa -> trim -> quadrado centrado -> 512px webp -> /parts
import sharp from 'sharp';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { mkdirSync } from 'node:fs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'client/public/parts');
const url = process.argv[2];
if (!url) { console.error('Uso: node dissecar.mjs <url>'); process.exit(1); }

// Caixas em pixels do RENDER ORIGINAL (896x1200, A-pose, braços a ~45°).
// rot: graus para deixar a peça VERTICAL apontando para baixo (sharp: horário +).
// split: 'top'/'bottom' extrai metade superior/inferior APÓS rotação+trim.
const PARTS = {
  head: { crop: [258, 60, 384, 400], rot: 0, circle: true },
  torso: { crop: [338, 455, 224, 430], rot: 0 },
  upperarm: { crop: [140, 500, 250, 235], rot: 45, split: 'top' },
  forearm: { crop: [140, 500, 250, 235], rot: 45, split: 'bottom' },
  hand: { crop: [80, 660, 135, 145], rot: 45 },
  thigh: { crop: [336, 878, 100, 158], rot: 4 },
  shin: { crop: [308, 1018, 125, 160], rot: 4, flip: true },
};

const res = await fetch(url);
if (!res.ok) { console.error('Download falhou:', res.status); process.exit(1); }
const full = Buffer.from(await res.arrayBuffer());
mkdirSync(OUT, { recursive: true });

for (const [name, cfg] of Object.entries(PARTS)) {
  const [cx, cy, cw, ch] = cfg.crop;
  let img = sharp(full).extract({ left: cx, top: cy, width: cw, height: ch });
  if (cfg.rot) img = sharp(await img.png().toBuffer()).rotate(cfg.rot, { background: '#ffffff' });
  // branco -> alfa
  const { data, info } = await img.ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  for (let i = 0; i < data.length; i += 4) {
    const [r, g, b] = [data[i], data[i + 1], data[i + 2]];
    if (r > 236 && g > 236 && b > 236) data[i + 3] = 0;
    else if (r > 215 && g > 215 && b > 215) data[i + 3] = Math.round(255 * (1 - (Math.min(r, g, b) - 215) / 40));
  }
  let cut = sharp(data, { raw: { width: info.width, height: info.height, channels: 4 } }).png();
  let t = await cut.trim({ threshold: 12 }).png().toBuffer({ resolveWithObject: true });
  if (cfg.split) {
    const h2 = Math.round(t.info.height * 0.56);
    const top = cfg.split === 'top' ? 0 : t.info.height - h2;
    t = await sharp(t.data)
      .extract({ left: 0, top, width: t.info.width, height: h2 })
      .png().toBuffer({ resolveWithObject: true });
  }
  // enquadra num quadrado centrado
  const side = Math.max(t.info.width, t.info.height);
  let framed = await sharp(t.data)
    .extend({
      top: Math.floor((side - t.info.height) / 2),
      bottom: Math.ceil((side - t.info.height) / 2),
      left: Math.floor((side - t.info.width) / 2),
      right: Math.ceil((side - t.info.width) / 2),
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    }).png().toBuffer();
  if (cfg.circle) {
    const mask = Buffer.from(`<svg width="${side}" height="${side}"><circle cx="${side / 2}" cy="${side / 2}" r="${side / 2 - 1}" fill="#fff"/></svg>`);
    framed = await sharp(framed).composite([{ input: mask, blend: 'dest-in' }]).png().toBuffer();
  }
  const dest = path.join(OUT, `${name}.webp`);
  await (cfg.flip ? sharp(framed).flop() : sharp(framed)).resize(512, 512).webp({ quality: 92 }).toFile(dest);
  console.log(`✓ ${name} instalado (${cfg.crop.join(',')}${cfg.rot ? ` rot ${cfg.rot}` : ''}${cfg.split ? ` ${cfg.split}` : ''})`);
}
console.log('Dissecação completa.');
