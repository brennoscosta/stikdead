// STIKDEAD :: fábrica de assets via Higgsfield SDK
// Uso (no VPS, dentro de tools/):
//   npm install
//   HF_CREDENTIALS="KEY_ID:KEY_SECRET" node generate-assets.mjs --group=arenas
// Grupos: arenas | praca | katana | lote2 | lote3 | lote4 | tudo
// Flags: --only=<id>  --force (regenera mesmo se o arquivo existir)
import { HiggsfieldClient } from '@higgsfield/client';
import sharp from 'sharp';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ITEMS_DIR = path.join(ROOT, 'client/public/items');
const ARENAS_DIR = path.join(ROOT, 'client/public/arenas');
const ENDPOINT = '/v1/text2image/soul';
// palavras que podem tropeçar na moderação — retry automático saneado
const SANITIZE = [
  [/blood-red/gi, 'crimson'], [/blood/gi, 'crimson'], [/demonic/gi, 'dark oni'],
  [/sinister/gi, 'ominous'], [/reaper/gi, 'harvest'], [/claw marks/gi, 'slash marks'],
  [/horror/gi, 'grim'], [/dripping/gi, 'glowing'],
];
const sanitize = (p) => SANITIZE.reduce((acc, [re, sub]) => acc.replace(re, sub), p);

const STYLE_ICON = (subject, vign) =>
  `Video game shop item icon for a dark fantasy stick-figure fighting game. ${subject} ` +
  `Floating and perfectly centered. Very dark charcoal black background with ${vign}. ` +
  `Painterly AAA mobile game art style, dramatic rim lighting, high contrast, rich detail. ` +
  `No text, no watermark, no border, no frame.`;

const VIGN = {
  comum: 'a subtle neutral dark vignette, faint gray dust wisps',
  raro: 'a deep cold blue vignette glow, cold blue mist wisps',
  epico: 'a deep purple vignette glow, purple arcane mist wisps',
  lendario: 'a deep red vignette glow, fiery red ember particles and smoke wisps',
};

const STYLE_ARENA = (scene) =>
  `Fighting game arena background, dark fantasy painterly style, cinematic moody lighting, ` +
  `deep shadows, blood-red accents, ink-splatter details. ${scene} ` +
  `The lower third of the image is the fighting ground: a flat, empty strip of VERY DARK stone floor ` +
  `(deep charcoal gray, almost black, subtle red reflections), with no objects on it. ` +
  `The entire image stays dark and moody from top to bottom — absolutely no white or bright areas. ` +
  `No characters, no people, no text, no watermark, no UI.`;

const STYLE_SPRITE = (subject) =>
  `${subject} Single object game sprite. Perfectly VERTICAL orientation: tip pointing straight up, ` +
  `grip/handle at the very bottom. Centered, isolated on a PURE WHITE background (#ffffff). ` +
  `No shadow, no smoke, no mist, no vignette, no ground, no reflections outside the object. ` +
  `Painterly dark fantasy game art, rich detail, dramatic rim lighting. No text, no watermark.`;

const ASSETS = {
  sprites: [
    { id: 'katana', kind: 'sprite', prompt: STYLE_SPRITE('A japanese katana with dark wrapped handle and silver blade.') },
    { id: 'katana_infernal', kind: 'sprite', prompt: STYLE_SPRITE('A legendary japanese katana with glowing crimson red blade and dark handle with red cord.') },
    { id: 'bastao_bo', kind: 'sprite', prompt: STYLE_SPRITE('A wooden bo staff with red cord wrapped at the center.') },
    { id: 'nunchaku', kind: 'sprite', prompt: STYLE_SPRITE('Nunchaku: two dark wooden sticks with steel caps connected by a chain, held vertically aligned.') },
    { id: 'machado', kind: 'sprite', prompt: STYLE_SPRITE('A battle axe with dark wooden handle and cold steel blade with faint blue glow.') },
    { id: 'lanca', kind: 'sprite', prompt: STYLE_SPRITE('A spear with dark wooden shaft and steel leaf-shaped tip with faint cold mist.') },
    { id: 'foice', kind: 'sprite', prompt: STYLE_SPRITE('A scythe with dark handle and curved steel blade at the top.') },
    { id: 'foice_sangrenta', kind: 'sprite', prompt: STYLE_SPRITE('A cursed scythe with black thorned handle and curved blade glowing crimson red.') },
    { id: 'dual_blades', kind: 'sprite', prompt: STYLE_SPRITE('A single short dark dagger blade with purple mist, vertical.') },
    { id: 'arco', kind: 'sprite', prompt: STYLE_SPRITE('A dark curved bow with taut string and faint purple runes, vertical.') },
    { id: 'chapeu_palha', kind: 'sprite', prompt: STYLE_SPRITE('A traditional Asian conical straw hat (kasa), FRONT VIEW, wide brim, woven texture.') },
    { id: 'coroa', kind: 'sprite', prompt: STYLE_SPRITE('A golden royal crown with sharp points and a red gem, FRONT VIEW.') },
    { id: 'capuz_sombrio', kind: 'sprite', prompt: STYLE_SPRITE('A dark assassin hood shell seen from the FRONT, deep shadow inside, tattered edges.') },
    { id: 'mascara_caveira', kind: 'sprite', prompt: STYLE_SPRITE('A white skull face mask, FRONT VIEW, dark eye sockets.') },
    { id: 'mascara_oni', kind: 'sprite', prompt: STYLE_SPRITE('A japanese red oni demon mask with white horns and fierce eyes, FRONT VIEW.') },
    { id: 'mascara_hockey', kind: 'sprite', prompt: STYLE_SPRITE('A worn white hockey mask with air holes and scratches, FRONT VIEW.') },
    { id: 'bainha', kind: 'sprite', prompt: STYLE_SPRITE('A black katana sheath (saya) with red cord wrap, perfectly vertical.') },
  ],
  arenas: [
    { id: 'dojo', kind: 'arena', prompt: STYLE_ARENA('Interior of a sinister Japanese dojo at night: worn dark wooden floor, torn shoji paper walls lit dimly from behind, hanging paper lanterns with faint red glow, a large torn scroll with a red brush circle mark, wooden pillars, faint mist.') },
    { id: 'temple', kind: 'arena', prompt: STYLE_ARENA('Ancient temple courtyard at night: a giant weathered stone Buddha statue looming in the back with a faint red halo, stone columns with red banners, incense smoke curling up, cracked stone floor, embers floating.') },
    { id: 'prison', kind: 'arena', prompt: STYLE_ARENA('Grim prison yard at night: massive stone walls with barred windows, heavy chains hanging, a barred iron gate in the center back, red claw marks on the wall, cold moonlight, cracked concrete floor.') },
  ],
  praca: [
    { id: 'praca', kind: 'arena', prompt: STYLE_ARENA('Wide night plaza of an ancient Japanese temple village under a giant blood-red moon: stone courtyard, pagoda silhouettes on both sides, glowing paper lanterns strung between poles, red banners, drifting embers and mist. The center of the plaza is open and empty.') },
  ],
  katana: [
    { id: 'katana_infernal', kind: 'icon', rarity: 'lendario', prompt: STYLE_ICON('A legendary Japanese katana with a glowing blood-red blade, dark wrapped handle with red cord, floating diagonally.', VIGN.lendario) },
  ],
  lote2: [
    { id: 'faixa_vermelha', kind: 'icon', prompt: STYLE_ICON('A red ninja headband with long flowing tails, fabric texture.', VIGN.comum) },
    { id: 'faixa_branca', kind: 'icon', prompt: STYLE_ICON('A white ninja headband with long flowing tails, fabric texture.', VIGN.comum) },
    { id: 'chapeu_palha', kind: 'icon', prompt: STYLE_ICON('A traditional Asian conical straw hat (kasa), woven texture, slightly worn.', VIGN.raro) },
    { id: 'capuz_sombrio', kind: 'icon', prompt: STYLE_ICON('A dark assassin hood, deep black fabric with heavy shadow inside, tattered edges.', VIGN.epico) },
    { id: 'coroa', kind: 'icon', prompt: STYLE_ICON('A golden royal crown with sharp points and a single red gem in the center.', VIGN.lendario) },
    { id: 'bandana_preta', kind: 'icon', prompt: STYLE_ICON('A black cloth face bandana mask, lower-face cover with tied knot.', VIGN.comum) },
    { id: 'bandana_vermelha', kind: 'icon', prompt: STYLE_ICON('A red cloth face bandana mask, lower-face cover with tied knot.', VIGN.comum) },
    { id: 'olhos_vermelhos', kind: 'icon', prompt: STYLE_ICON('Two glowing angry red eyes floating in darkness, fierce anime style, red energy trails.', VIGN.raro) },
    { id: 'mascara_caveira', kind: 'icon', prompt: STYLE_ICON('A white skull face mask, bone texture, dark eye sockets, sinister.', VIGN.raro) },
    { id: 'mascara_hockey', kind: 'icon', prompt: STYLE_ICON('A worn white hockey mask with air holes, horror style, scratches.', VIGN.raro) },
    { id: 'mascara_oni', kind: 'icon', prompt: STYLE_ICON('A japanese red oni demon mask with white horns, fierce white eyes and grimacing mouth.', VIGN.epico) },
  ],
  lote3: [
    { id: 'cachecol_cinza', kind: 'icon', prompt: STYLE_ICON('A gray fabric scarf with flowing windswept tails.', VIGN.comum) },
    { id: 'cachecol_vermelho', kind: 'icon', prompt: STYLE_ICON('A vivid red fabric scarf with flowing windswept tails.', VIGN.raro) },
    { id: 'colete', kind: 'icon', prompt: STYLE_ICON('A dark leather combat vest with straps and buckles.', VIGN.raro) },
    { id: 'armadura_ronin', kind: 'icon', prompt: STYLE_ICON('A dark red ronin samurai chest armor with lacquered plates and red cords.', VIGN.epico) },
    { id: 'armadura_infernal', kind: 'icon', prompt: STYLE_ICON('A black demonic chest armor with glowing red cracks and ember veins.', VIGN.lendario) },
    { id: 'bainha', kind: 'icon', prompt: STYLE_ICON('A black katana sheath (saya) with red cord wrap, diagonal.', VIGN.comum) },
    { id: 'capa_curta', kind: 'icon', prompt: STYLE_ICON('A short dark gray cape with tattered edge, flowing.', VIGN.raro) },
    { id: 'capa_guerreiro', kind: 'icon', prompt: STYLE_ICON('A deep crimson warrior cape, heavy fabric, flowing dramatically, tattered edge.', VIGN.epico) },
    { id: 'bracadeiras', kind: 'icon', prompt: STYLE_ICON('A pair of dark gray cloth arm wraps / wristbands.', VIGN.comum) },
    { id: 'luvas_combate', kind: 'icon', prompt: STYLE_ICON('A pair of black combat gloves with padded knuckles.', VIGN.raro) },
    { id: 'luvas_vermelhas', kind: 'icon', prompt: STYLE_ICON('A pair of red fighting gloves with dark straps.', VIGN.raro) },
    { id: 'manoplas', kind: 'icon', prompt: STYLE_ICON('A pair of heavy steel gauntlets with red rivets, battle-worn metal.', VIGN.epico) },
  ],
  lote4: [
    { id: 'shorts_treino', kind: 'icon', prompt: STYLE_ICON('Dark training shorts with a thin red waistband stripe.', VIGN.comum) },
    { id: 'calca_ninja', kind: 'icon', prompt: STYLE_ICON('Dark ninja pants with ankle wraps, loose fabric.', VIGN.comum) },
    { id: 'joelheiras', kind: 'icon', prompt: STYLE_ICON('A pair of dark protective knee pads with straps.', VIGN.raro) },
    { id: 'tenis_classico', kind: 'icon', prompt: STYLE_ICON('A pair of classic white sneakers with a red stripe.', VIGN.comum) },
    { id: 'botas', kind: 'icon', prompt: STYLE_ICON('A pair of dark brown leather combat boots, worn.', VIGN.raro) },
    { id: 'botas_sombrias', kind: 'icon', prompt: STYLE_ICON('A pair of black shadow boots with faint purple glow at the soles.', VIGN.epico) },
    { id: 'poeira_pes', kind: 'icon', prompt: STYLE_ICON('Stylized gray dust clouds puffing, motion effect.', VIGN.raro) },
    { id: 'aura_vermelha', kind: 'icon', prompt: STYLE_ICON('A fierce red energy aura flame silhouette rising, particles.', VIGN.epico) },
    { id: 'aura_caos', kind: 'icon', prompt: STYLE_ICON('A violent purple chaos energy aura with lightning wisps rising.', VIGN.lendario) },
  ],
};
ASSETS.tudo = Object.values(ASSETS).flat();

// ===== execução =====
const args = Object.fromEntries(process.argv.slice(2).map((a) => {
  const [k, v] = a.replace(/^--/, '').split('=');
  return [k, v ?? true];
}));

const rawCreds = (process.env.HF_CREDENTIALS
  || (process.env.HF_API_KEY && process.env.HF_API_SECRET
      ? `${process.env.HF_API_KEY}:${process.env.HF_API_SECRET}` : ''))
  .trim().replace(/^["']|["']$/g, ''); // tolera aspas coladas no export
if (!rawCreds.includes(':')) {
  console.error('Defina HF_CREDENTIALS="KEY_ID:KEY_SECRET" (painel de API do Higgsfield).');
  process.exit(1);
}
const [KEY_ID, KEY_SECRET] = [rawCreds.slice(0, rawCreds.indexOf(':')), rawCreds.slice(rawCreds.indexOf(':') + 1)];
const hf = new HiggsfieldClient({ apiKey: KEY_ID, apiSecret: KEY_SECRET, maxPollTime: 240000 });
console.log(`Credenciais: ${KEY_ID.slice(0, 6)}…:•••  ✓`);
const group = ASSETS[args.group];
if (!group) {
  console.error(`--group obrigatório. Opções: ${Object.keys(ASSETS).join(' | ')}`);
  process.exit(1);
}

fs.mkdirSync(ITEMS_DIR, { recursive: true });
fs.mkdirSync(ARENAS_DIR, { recursive: true });

const SPRITES_DIR = path.join(ROOT, 'client/public/sprites');
fs.mkdirSync(SPRITES_DIR, { recursive: true });
const outPath = (a) => a.kind === 'icon'
  ? path.join(ITEMS_DIR, `${a.id}.webp`)
  : a.kind === 'sprite'
    ? path.join(SPRITES_DIR, `${a.id}.webp`)
    : path.join(ARENAS_DIR, `${a.id}.webp`);

const queue = group.filter((a) => (!args.only || a.id === args.only));
console.log(`Gerando ${queue.length} asset(s) do grupo "${args.group}"...\n`);

let ok = 0, skip = 0, fail = 0;
for (const a of queue) {
  const out = outPath(a);
  if (fs.existsSync(out) && !args.force) {
    console.log(`↷ ${a.id} já existe (use --force para regenerar)`);
    skip++; continue;
  }
  try {
    process.stdout.write(`⏳ ${a.id}... `);
    const size = a.kind === 'icon' ? '1536x1536' : '2048x1152';
    const runOnce = (prompt) => hf.generate(ENDPOINT, {
      prompt, width_and_height: size, quality: '1080p', batch_size: 1, enhance_prompt: false,
    }, { withPolling: true });
    let jobSet = await runOnce(a.prompt);
    let url = jobSet.jobs?.[0]?.results?.raw?.url || jobSet.jobs?.[0]?.results?.min?.url;
    const st = () => jobSet.jobs?.[0]?.status ?? 'desconhecido';
    if ((!url) && st() === 'nsfw') {
      process.stdout.write('(moderação, tentando versão saneada) ');
      jobSet = await runOnce(sanitize(a.prompt));
      url = jobSet.jobs?.[0]?.results?.raw?.url || jobSet.jobs?.[0]?.results?.min?.url;
    }
    if (!url) {
      const dump = JSON.stringify(jobSet).slice(0, 500);
      throw new Error(`sem resultado (status=${st()}) :: ${dump}`);
    }
    const buf = Buffer.from(await (await fetch(url)).arrayBuffer());
    const img = sharp(buf);
    if (a.kind === 'icon') await img.resize(256, 256).webp({ quality: 82 }).toFile(out);
    else if (a.kind === 'sprite') {
      // branco puro -> transparente (com banda suave), depois recorta e normaliza
      const { data, info } = await img.ensureAlpha().raw().toBuffer({ resolveWithObject: true });
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i], g2 = data[i + 1], b = data[i + 2];
        const lum = Math.min(r, g2, b);
        if (r > 236 && g2 > 236 && b > 236) data[i + 3] = 0;
        else if (lum > 208 && Math.abs(r - g2) < 14 && Math.abs(g2 - b) < 14)
          data[i + 3] = Math.round(255 * (1 - (lum - 208) / 28));
      }
      await sharp(data, { raw: info }).trim().resize({ height: 320 }).webp({ quality: 88 }).toFile(out);
    }
    else await img.resize({ width: 1920 }).webp({ quality: 80 }).toFile(out);
    const kb = Math.round(fs.statSync(out).size / 1024);
    console.log(`✓ salvo (${kb} KB)`);
    ok++;
  } catch (err) {
    console.log(`✗ FALHOU: ${err.message}`);
    fail++;
  }
}
console.log(`\nResumo: ${ok} gerados, ${skip} pulados, ${fail} falhas.`);
if (ok > 0) console.log('Agora: cd ../client && npm run build   (e commit dos novos assets)');
