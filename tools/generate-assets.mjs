// STIKDEAD :: fábrica de assets via Higgsfield SDK
// Uso (no VPS, dentro de tools/):
//   npm install
//   HF_CREDENTIALS="KEY_ID:KEY_SECRET" node generate-assets.mjs --group=arenas
// Grupos: arenas | praca | katana | lote2 | lote3 | lote4 | lote5 | sprites | tudo
// Flags: --only=<id>  --force (regenera mesmo se o arquivo existir)
import { HiggsfieldClient } from '@higgsfield/client';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
const execFileP = promisify(execFile);
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

// ===== BÍBLIA VISUAL: fonte da verdade (01_BIBLE/bible.json) =====
import { readFileSync } from 'node:fs';
const BIBLE = JSON.parse(readFileSync(path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../01_BIBLE/bible.json'), 'utf8'));

const STYLE_ICON = (subject, vign) =>
  `Video game shop item icon for a dark fantasy stick-figure fighting game. ${subject} ` +
  `Floating and perfectly centered. ${BIBLE.itens.fundo_icone} background with ${vign}. ` +
  `${BIBLE.itens.estilo}. ` +
  `No ${BIBLE.itens.proibido.join(', no ')}.`;

const VIGN = BIBLE.itens.vinheta_por_raridade;

const STYLE_ARENA = (scene) =>
  `Fighting game arena background, ${BIBLE.cenarios.estilo}. ${scene} ` +
  `The lower third of the image is the fighting ground: ${BIBLE.cenarios.regra_do_chao} ` +
  `${BIBLE.cenarios.regra_global}. ` +
  `No ${BIBLE.cenarios.proibido.join(', no ')}.`;

const STYLE_SPRITE = (subject) =>
  `${subject} Single object game sprite. Perfectly VERTICAL orientation: tip pointing straight up, ` +
  `grip/handle at the very bottom. Centered, isolated on a PURE WHITE background (#ffffff). ` +
  `No shadow, no smoke, no mist, no vignette, no ground, no reflections outside the object. ` +
  `Painterly dark fantasy game art, rich detail, dramatic rim lighting. No text, no watermark.`;

// ===== NANO BANANA PRO: catálogo completo pelo NOME =====
const NB_ENDPOINTS = ['/v1/text2image/nano-banana-2', '/v1/text2image/nano-banana', '/v1/image2image/nano-banana-2'];
const SLOT_DESC = {
  weapon: 'a single melee weapon, held by no one, oriented diagonally',
  head: 'a single piece of headgear (helmet, crown, hood or headband)',
  face: 'a single face accessory (mask, bandana or face piece), front view',
  body: 'a single torso garment (vest, armor chest piece or scarf)',
  arms: 'a single pair of arm equipment (gloves, gauntlets or arm wraps)',
  legs: 'a single pair of leg garments (pants, shorts or knee guards)',
  feet: 'a single pair of footwear',
  back: 'a single back piece (cape, wings or sheath), spread open',
  effect: 'a magical visual effect essence (glowing orb of energy with particles)',
  style: 'an ornate circular martial arts emblem seal',
};
const RAR_FLAIR = {
  comum: 'simple worn materials',
  raro: 'blue-steel accents, quality craftsmanship',
  epico: 'violet arcane energy accents, ornate details',
  lendario: 'golden ornate details, radiant highlights',
  diamante: 'crystalline translucent material, glowing gem facets',
};
const NB_PROMPT = (item) =>
  `Video game inventory item icon: "${item.name}" — ${SLOT_DESC[item.slot] || 'a single item'}. ` +
  `${RAR_FLAIR[item.rarity] || ''}. Painterly dark fantasy game art, rich detail, dramatic rim lighting, ` +
  `perfectly centered, isolated on a PURE WHITE background (#ffffff), no shadow on the ground, ` +
  `no smoke outside the object, no character, no text, no watermark, no frame, no border.`;

const CATALOGO = JSON.parse(readFileSync(path.join(path.dirname(fileURLToPath(import.meta.url)), 'items-catalog.json'), 'utf8'))
  .map((it) => ({ id: it.id, kind: 'nbicon', prompt: NB_PROMPT(it) }));

const ASSETS = {
  catalogo: CATALOGO,
  lote5: [
    { id: 'estilo_shinobi', kind: 'icon', rarity: 'lendario', prompt: STYLE_ICON('A mystical circular seal emblem of the Shinobi fighting style: a shadowy ninja silhouette mid-dash leaving purple smoke trails, inside a ring of dark violet energy with japanese brush strokes.', VIGN.lendario) },
    { id: 'estilo_monge', kind: 'icon', rarity: 'lendario', prompt: STYLE_ICON('A mystical circular seal emblem of the Monk fighting style: two open palms releasing a radiant golden ki shockwave, inside a ring of amber energy with zen brush circles.', VIGN.lendario) },
    { id: 'estilo_berserker', kind: 'icon', rarity: 'lendario', prompt: STYLE_ICON('A mystical circular seal emblem of the Berserker fighting style: a roaring demonic face wreathed in crimson flames, inside a ring of blood-red fire and cracked steel.', VIGN.lendario) },
    { id: 'estilo_espectro', kind: 'icon', rarity: 'lendario', prompt: STYLE_ICON('A mystical circular seal emblem of the Specter fighting style: a ghostly figure descending from above like a comet with ice-blue trails, inside a ring of pale spectral light.', VIGN.lendario) },
    { id: 'katana_jade', kind: 'icon', rarity: 'raro', prompt: STYLE_ICON('A japanese katana with a polished jade-green blade with flowing white veins like precious stone, dark green wrapped handle, floating diagonally.', VIGN.raro) },
    { id: 'katana_void', kind: 'icon', rarity: 'lendario', prompt: STYLE_ICON('A legendary katana forged from the void: pitch-black blade that seems to swallow light, cracks of glowing purple energy running through it, dark handle with violet cord, floating diagonally with purple mist.', VIGN.lendario) },
    { id: 'machado_carrasco', kind: 'icon', rarity: 'epico', prompt: STYLE_ICON('A massive executioner\'s battle axe with a brutal scarred steel blade, dark oak handle wrapped in worn leather straps, faint red glint on the edge.', VIGN.epico) },
    { id: 'lanca_relampago', kind: 'icon', rarity: 'epico', prompt: STYLE_ICON('A storm spear with a steel tip crackling with golden lightning arcs, dark shaft wrapped in charged copper wire, sparks flying.', VIGN.epico) },
    { id: 'foice_gelida', kind: 'icon', rarity: 'raro', prompt: STYLE_ICON('A frost scythe with a curved blade of translucent blue ice, frozen mist dripping from the edge, dark frosted handle.', VIGN.raro) },
    { id: 'bo_dragao', kind: 'icon', rarity: 'raro', prompt: STYLE_ICON('A dragon bo staff of deep red lacquered wood carved with a golden dragon spiraling around it, golden caps.', VIGN.raro) },
    { id: 'nunchaku_aco', kind: 'icon', rarity: 'comum', prompt: STYLE_ICON('Steel nunchaku with brushed metal sticks connected by a heavy chain, simple and deadly.', VIGN.comum) },
    { id: 'dual_gemeas', kind: 'icon', rarity: 'epico', prompt: STYLE_ICON('Twin blood daggers with crimson blades dripping dark energy, black handles with red tassels, crossed in an X.', VIGN.epico) },
    { id: 'arco_fantasma', kind: 'icon', rarity: 'lendario', prompt: STYLE_ICON('A phantom bow of dark spectral wood with a string made of pale blue ghost-light, ethereal wisps rising from the limbs, glowing runes.', VIGN.lendario) },
    { id: 'katana_dourada', kind: 'icon', rarity: 'epico', prompt: STYLE_ICON('A golden katana with a radiant gold blade polished to a mirror shine, ornate golden guard, dark handle with gold cord, floating diagonally.', VIGN.epico) },
    { id: 'faixa_negra', kind: 'icon', rarity: 'comum', prompt: STYLE_ICON('A black martial arts headband with flowing tails, matte fabric with subtle weave texture.', VIGN.comum) },
    { id: 'faixa_dourada', kind: 'icon', rarity: 'raro', prompt: STYLE_ICON('A golden silk martial arts headband with shimmering flowing tails and an embroidered sun emblem.', VIGN.raro) },
    { id: 'chapeu_kasa_negro', kind: 'icon', rarity: 'raro', prompt: STYLE_ICON('A black conical straw kasa hat with a blood-red silk ribbon, worn samurai style, subtle sheen on the weave.', VIGN.raro) },
    { id: 'coroa_sombria', kind: 'icon', rarity: 'lendario', prompt: STYLE_ICON('A shadow king\'s crown of blackened steel with sharp jagged points, a glowing violet gem at the center pulsing with dark energy, purple mist.', VIGN.lendario) },
    { id: 'capuz_sangue', kind: 'icon', rarity: 'epico', prompt: STYLE_ICON('A deep blood-red assassin hood with tattered edges, dark shadow inside hiding the face, faint red glow from within.', VIGN.epico) },
    { id: 'faixa_ki', kind: 'icon', rarity: 'epico', prompt: STYLE_ICON('A radiant amber ki headband glowing with inner energy, golden light particles rising from the flowing tails.', VIGN.epico) },
    { id: 'elmo_ronin', kind: 'icon', rarity: 'epico', prompt: STYLE_ICON('A weathered ronin battle helmet of dark steel with ice-blue accents and a crescent moon crest.', VIGN.epico) },
    { id: 'capuz_cinzas', kind: 'icon', rarity: 'raro', prompt: STYLE_ICON('An ash-gray hood with burnt tattered edges, embers still glowing faintly on the fabric.', VIGN.raro) },
    { id: 'coroa_espinhos', kind: 'icon', rarity: 'epico', prompt: STYLE_ICON('A crown of black iron thorns with a blood-red gem, drops of crimson on the spikes.', VIGN.epico) },
    { id: 'faixa_branca_2', kind: 'icon', rarity: 'comum', prompt: STYLE_ICON('A pure snow-white martial arts headband with clean flowing tails, minimal and elegant.', VIGN.comum) },
    { id: 'mascara_kitsune', kind: 'icon', rarity: 'epico', prompt: STYLE_ICON('A japanese kitsune fox mask in polished white porcelain with elegant blood-red markings, golden eyes, subtle shine.', VIGN.epico) },
    { id: 'mascara_vazio', kind: 'icon', rarity: 'lendario', prompt: STYLE_ICON('A void skull mask of pitch-black material with glowing purple eye sockets, cracks leaking violet energy, dark mist.', VIGN.lendario) },
    { id: 'bandana_azul', kind: 'icon', rarity: 'comum', prompt: STYLE_ICON('A deep navy blue bandana tied over the face, soft fabric folds.', VIGN.comum) },
    { id: 'bandana_dourada', kind: 'icon', rarity: 'raro', prompt: STYLE_ICON('A golden silk bandana with shimmering thread and subtle embroidered pattern.', VIGN.raro) },
    { id: 'olhos_gelo', kind: 'icon', rarity: 'epico', prompt: STYLE_ICON('A pair of glowing ice-blue eyes floating in darkness, frost crystals forming around them, cold mist.', VIGN.epico) },
    { id: 'olhos_ouro', kind: 'icon', rarity: 'epico', prompt: STYLE_ICON('A pair of blazing golden eyes floating in darkness, radiant like twin suns, light rays.', VIGN.epico) },
    { id: 'mascara_teatro', kind: 'icon', rarity: 'raro', prompt: STYLE_ICON('An antique cracked theater mask in aged ivory porcelain, one side smiling, dark empty eyes.', VIGN.raro) },
    { id: 'bandana_caveira', kind: 'icon', rarity: 'raro', prompt: STYLE_ICON('A black bandana with a white skull jaw print covering the lower face, worn fabric.', VIGN.raro) },
    { id: 'mascara_gas', kind: 'icon', rarity: 'epico', prompt: STYLE_ICON('A toxic gas mask in dark military green with glowing acid-green lens filters, faint poison vapor.', VIGN.epico) },
    { id: 'olhos_void', kind: 'icon', rarity: 'lendario', prompt: STYLE_ICON('A pair of void eyes glowing deep violet in darkness, reality warping around them, purple energy tendrils.', VIGN.lendario) },
    { id: 'cachecol_negro', kind: 'icon', rarity: 'comum', prompt: STYLE_ICON('A black ninja scarf with long flowing ends, matte fabric catching faint light.', VIGN.comum) },
    { id: 'cachecol_dourado', kind: 'icon', rarity: 'raro', prompt: STYLE_ICON('A golden silk scarf flowing dramatically, shimmering with woven metallic thread.', VIGN.raro) },
    { id: 'colete_couro', kind: 'icon', rarity: 'comum', prompt: STYLE_ICON('A rugged brown leather fighting vest with stitched seams and a worn buckle.', VIGN.comum) },
    { id: 'armadura_gelo', kind: 'icon', rarity: 'epico', prompt: STYLE_ICON('A frost armor chestplate of dark steel plated with glowing blue ice crystals, cold mist rolling off the plates.', VIGN.epico) },
    { id: 'armadura_ouro', kind: 'icon', rarity: 'lendario', prompt: STYLE_ICON('A majestic golden armor chestplate with ornate engravings, radiant polished shine, ruby inlays at the collar.', VIGN.lendario) },
    { id: 'cachecol_ki', kind: 'icon', rarity: 'epico', prompt: STYLE_ICON('An amber ki scarf glowing with inner energy, golden light particles trailing from the flowing ends.', VIGN.epico) },
    { id: 'colete_tatico', kind: 'icon', rarity: 'raro', prompt: STYLE_ICON('A dark tactical combat vest with blue-steel plates and utility straps, modern and clean.', VIGN.raro) },
    { id: 'cachecol_gelo', kind: 'icon', rarity: 'raro', prompt: STYLE_ICON('An ice-blue scarf with frost crystals forming on the fabric, cold vapor trailing.', VIGN.raro) },
    { id: 'armadura_vazio', kind: 'icon', rarity: 'lendario', prompt: STYLE_ICON('A void armor chestplate of pitch-black metal with glowing purple energy veins between the plates, dark mist.', VIGN.lendario) },
    { id: 'colete_ronin_2', kind: 'icon', rarity: 'raro', prompt: STYLE_ICON('A wandering ronin\'s worn kimono vest in earthy brown with a blood-red sash, weathered but dignified.', VIGN.raro) },
    { id: 'capa_negra', kind: 'icon', rarity: 'raro', prompt: STYLE_ICON('A dramatic black cape flowing in the wind, deep shadow folds with subtle red inner lining.', VIGN.raro) },
    { id: 'capa_dourada', kind: 'icon', rarity: 'epico', prompt: STYLE_ICON('A royal golden cape of shimmering silk flowing dramatically, ornate clasp, radiant highlights.', VIGN.epico) },
    { id: 'capa_gelo', kind: 'icon', rarity: 'epico', prompt: STYLE_ICON('A frost cape of icy blue fabric with frozen crystalline edges, snow particles drifting off.', VIGN.epico) },
    { id: 'capa_void', kind: 'icon', rarity: 'lendario', prompt: STYLE_ICON('A void cape of living darkness with glowing purple runes along the edge, dissolving into violet mist at the bottom.', VIGN.lendario) },
    { id: 'bainha_dupla', kind: 'icon', rarity: 'raro', prompt: STYLE_ICON('Twin black katana sheaths crossed on the back, red cord wrapping, subtle lacquer shine.', VIGN.raro) },
    { id: 'bainha_ouro', kind: 'icon', rarity: 'epico', prompt: STYLE_ICON('An ornate golden katana sheath with engraved dragons and golden cord, radiant lacquer.', VIGN.epico) },
    { id: 'aura_gelo', kind: 'icon', rarity: 'lendario', prompt: STYLE_ICON('A swirling aura of ice-blue energy and frost crystals orbiting in a vertical halo, cold light.', VIGN.lendario) },
    { id: 'aura_ouro', kind: 'icon', rarity: 'lendario', prompt: STYLE_ICON('A blazing golden aura of radiant light rays and floating embers in a vertical halo, divine glow.', VIGN.lendario) },
    { id: 'aura_void', kind: 'icon', rarity: 'lendario', prompt: STYLE_ICON('A dark void aura of purple energy tendrils and floating dark particles in a vertical halo, reality distortion.', VIGN.lendario) },
    { id: 'capa_rubra_2', kind: 'icon', rarity: 'raro', prompt: STYLE_ICON('A crimson battle cape with battle-torn edges, deep red fabric flowing like blood in water.', VIGN.raro) },
    { id: 'luvas_negras', kind: 'icon', rarity: 'comum', prompt: STYLE_ICON('A pair of black fighting gloves with reinforced knuckles, matte finish.', VIGN.comum) },
    { id: 'luvas_ouro', kind: 'icon', rarity: 'raro', prompt: STYLE_ICON('A pair of golden fighting gloves with polished knuckle plates, radiant shine.', VIGN.raro) },
    { id: 'manoplas_gelo', kind: 'icon', rarity: 'epico', prompt: STYLE_ICON('Heavy frost gauntlets of dark steel with glowing ice-blue studs, frost creeping up the fingers.', VIGN.epico) },
    { id: 'manoplas_void', kind: 'icon', rarity: 'lendario', prompt: STYLE_ICON('Void gauntlets of black metal with glowing purple energy between armored plates, dark mist rising.', VIGN.lendario) },
    { id: 'bracadeiras_rubras', kind: 'icon', rarity: 'comum', prompt: STYLE_ICON('A pair of crimson forearm wraps with tight bandage texture.', VIGN.comum) },
    { id: 'bracadeiras_ki', kind: 'icon', rarity: 'raro', prompt: STYLE_ICON('Amber ki forearm wraps glowing with inner golden energy, light particles.', VIGN.raro) },
    { id: 'luvas_gelo', kind: 'icon', rarity: 'raro', prompt: STYLE_ICON('A pair of ice-blue gloves with frost patterns and cold vapor trailing off.', VIGN.raro) },
    { id: 'manoplas_carrasco', kind: 'icon', rarity: 'epico', prompt: STYLE_ICON('Brutal executioner gauntlets of scarred dark steel with blood-red studs and rivets.', VIGN.epico) },
    { id: 'luvas_void', kind: 'icon', rarity: 'epico', prompt: STYLE_ICON('A pair of void gloves in pitch black with purple energy seeping between the fingers.', VIGN.epico) },
    { id: 'bracadeiras_neve', kind: 'icon', rarity: 'comum', prompt: STYLE_ICON('A pair of clean snow-white forearm wraps, crisp bandage folds.', VIGN.comum) },
    { id: 'shorts_negro', kind: 'icon', rarity: 'comum', prompt: STYLE_ICON('Black fighting shorts with a dark gray waistband, clean athletic cut.', VIGN.comum) },
    { id: 'shorts_ouro', kind: 'icon', rarity: 'raro', prompt: STYLE_ICON('Golden fighting shorts with shimmering fabric and ornate waistband.', VIGN.raro) },
    { id: 'calca_ronin', kind: 'icon', rarity: 'raro', prompt: STYLE_ICON('Traditional ronin hakama pants in earthy brown with a blood-red ankle cord.', VIGN.raro) },
    { id: 'calca_gelo', kind: 'icon', rarity: 'epico', prompt: STYLE_ICON('Frost combat pants in dark blue with glowing ice-crystal patterns at the cuffs, cold mist.', VIGN.epico) },
    { id: 'calca_void', kind: 'icon', rarity: 'lendario', prompt: STYLE_ICON('Void pants of dark fabric with glowing purple rune stitching, violet mist at the cuffs.', VIGN.lendario) },
    { id: 'joelheiras_aco', kind: 'icon', rarity: 'comum', prompt: STYLE_ICON('A pair of brushed steel kneepads with rivets and worn straps.', VIGN.comum) },
    { id: 'joelheiras_ouro', kind: 'icon', rarity: 'raro', prompt: STYLE_ICON('A pair of polished golden kneepads with radiant dome shine.', VIGN.raro) },
    { id: 'shorts_ki', kind: 'icon', rarity: 'epico', prompt: STYLE_ICON('Amber ki fighting shorts glowing with golden energy seams, light particles rising.', VIGN.epico) },
    { id: 'calca_sangue', kind: 'icon', rarity: 'epico', prompt: STYLE_ICON('Blood-soaked combat pants in deep crimson with dark red dripping stains at the cuffs.', VIGN.epico) },
    { id: 'joelheiras_void', kind: 'icon', rarity: 'epico', prompt: STYLE_ICON('A pair of void kneepads in black metal with a glowing purple core in each dome.', VIGN.epico) },
    { id: 'tenis_negro', kind: 'icon', rarity: 'comum', prompt: STYLE_ICON('A pair of sleek black fighting sneakers with dark gray sole, clean profile view.', VIGN.comum) },
    { id: 'tenis_ouro', kind: 'icon', rarity: 'raro', prompt: STYLE_ICON('A pair of golden sneakers with radiant metallic shine and white sole, profile view.', VIGN.raro) },
    { id: 'botas_gelo', kind: 'icon', rarity: 'epico', prompt: STYLE_ICON('Heavy frost combat boots of dark leather with glowing ice-blue soles, frost creeping up, cold mist.', VIGN.epico) },
    { id: 'botas_void', kind: 'icon', rarity: 'lendario', prompt: STYLE_ICON('Void combat boots of black leather with glowing purple soles leaving violet energy wisps.', VIGN.lendario) },
    { id: 'botas_carrasco', kind: 'icon', rarity: 'epico', prompt: STYLE_ICON('Brutal executioner boots of scarred dark leather with blood-red glowing soles and steel toe caps.', VIGN.epico) },
    { id: 'tenis_gelo', kind: 'icon', rarity: 'raro', prompt: STYLE_ICON('A pair of ice-blue sneakers with frost patterns and pale blue glow from the sole.', VIGN.raro) },
    { id: 'tenis_sangue', kind: 'icon', rarity: 'raro', prompt: STYLE_ICON('A pair of deep crimson sneakers with blood-red accents and dark laces.', VIGN.raro) },
    { id: 'botas_ouro', kind: 'icon', rarity: 'lendario', prompt: STYLE_ICON('Majestic golden boots with ornate engravings and radiant glowing soles, divine shine.', VIGN.lendario) },
    { id: 'tenis_void', kind: 'icon', rarity: 'epico', prompt: STYLE_ICON('A pair of void sneakers in pitch black with purple energy glowing from the seams.', VIGN.epico) },
    { id: 'botas_neve', kind: 'icon', rarity: 'raro', prompt: STYLE_ICON('A pair of snow-white winter combat boots with fur trim and clean laces.', VIGN.raro) },
    { id: 'poeira_ouro', kind: 'icon', rarity: 'epico', prompt: STYLE_ICON('A magical burst of golden dust and light particles swirling upward from the ground, radiant sparkles.', VIGN.epico) },
    { id: 'poeira_gelo', kind: 'icon', rarity: 'epico', prompt: STYLE_ICON('A burst of ice-blue frost particles and snowflakes swirling upward, cold crystalline sparkle.', VIGN.epico) },
    { id: 'poeira_void', kind: 'icon', rarity: 'lendario', prompt: STYLE_ICON('A burst of dark violet void particles and purple energy wisps swirling upward, reality distortion.', VIGN.lendario) },
    { id: 'poeira_sangue', kind: 'icon', rarity: 'raro', prompt: STYLE_ICON('A burst of crimson particles and dark red droplets swirling upward like a blood mist.', VIGN.raro) },
    { id: 'poeira_neve', kind: 'icon', rarity: 'raro', prompt: STYLE_ICON('A gentle burst of white snow particles swirling upward, soft and clean.', VIGN.raro) },
    { id: 'poeira_veneno', kind: 'icon', rarity: 'epico', prompt: STYLE_ICON('A burst of toxic acid-green vapor and poison bubbles swirling upward, sickly glow.', VIGN.epico) },
    { id: 'poeira_cinzas', kind: 'icon', rarity: 'comum', prompt: STYLE_ICON('A burst of gray ash and smoke particles swirling upward with faint embers.', VIGN.comum) },
    { id: 'poeira_rosa', kind: 'icon', rarity: 'raro', prompt: STYLE_ICON('A burst of pink sakura petals and soft rose particles swirling upward, delicate and beautiful.', VIGN.raro) },
    { id: 'poeira_abissal', kind: 'icon', rarity: 'lendario', prompt: STYLE_ICON('A burst of deep ocean-blue abyssal particles with glowing plankton-like lights swirling upward.', VIGN.lendario) },
    { id: 'poeira_solar', kind: 'icon', rarity: 'lendario', prompt: STYLE_ICON('A blazing burst of solar fire particles and golden flares swirling upward like a miniature sun.', VIGN.lendario) },
  ],
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
    { id: 'neve', kind: 'arena', prompt: STYLE_ARENA('Frozen mountain shrine at night in a snowstorm: dark pine trees heavy with snow, a small torii gate half-buried, falling snowflakes, a giant pale-red moon behind clouds, icy wind streaks. The ground strip is very dark frozen stone with thin snow patches.') },
    { id: 'deserto', kind: 'arena', prompt: STYLE_ARENA('Desert ruins at night: massive half-buried ancient statues and broken columns in dark dunes, a giant blood-red moon low on the horizon, drifting sand haze, distant torch flames. The ground strip is very dark packed sand and cracked stone.') },
    { id: 'praia', kind: 'arena', prompt: STYLE_ARENA('Moonlit beach at night: dark ocean with red moonlight reflecting on the waves, black rocks, a wrecked wooden boat, palm silhouettes at the sides, drifting mist. The ground strip is very dark wet sand.') },
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

// credenciais do SDK: exigidas só para grupos que usam o motor SDK (o catalogo usa a CLI)
const needsSdk = (args.group !== 'catalogo');
let hf = null;
if (needsSdk) {
  const rawCreds = (process.env.HF_CREDENTIALS || '').trim();
  const [KEY_ID, KEY_SECRET] = rawCreds.split(':');
  if (!KEY_ID || !KEY_SECRET) {
    console.error('Defina HF_CREDENTIALS="KEY_ID:KEY_SECRET" (painel de API do Higgsfield).');
    process.exit(1);
  }
  console.log(`Credenciais: ${KEY_ID.slice(0, 6)}…:•••  ✓`);
  hf = new HiggsfieldClient({ apiKey: KEY_ID, apiSecret: KEY_SECRET, maxPollTime: 240000 });
} else {
  console.log('Motor: CLI oficial higgsfield (sessão do auth login) ✓');
}
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

const onlySet = args.only ? new Set(String(args.only).split(',')) : null;
let queue = group.filter((a) => (!onlySet || onlySet.has(a.id)));
const off = Number(args.offset || 0), lim = Number(args.limit || 0);
if (off) queue = queue.slice(off);
if (lim) queue = queue.slice(0, lim);
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
    const engineNano = a.kind === 'nbicon';
    // nano banana via CLI oficial (higgsfield auth login uma vez; sem adivinhação de endpoint)
    const nanoCli = async (prompt) => {
      const { stdout } = await execFileP('higgsfield', [
        'generate', 'create', 'nano_banana_2',
        '--prompt', prompt, '--aspect_ratio', '1:1', '--resolution', '1k',
        '--wait', '--json',
      ], { timeout: 300000, maxBuffer: 8 * 1024 * 1024 });
      // procura result_url em qualquer profundidade do JSON (ou uma URL de imagem no texto)
      const deep = (o) => {
        if (!o || typeof o !== 'object') return null;
        if (typeof o.result_url === 'string') return o.result_url;
        for (const v of Object.values(o)) { const r = deep(v); if (r) return r; }
        return null;
      };
      let url = null;
      try { url = deep(JSON.parse(stdout)); } catch { /* segue para o regex */ }
      if (!url) url = (stdout.match(/https?:\/\/\S+\.(png|jpe?g|webp)\S*/i) || [])[0] || null;
      if (!url) throw new Error(`CLI sem result_url :: ${stdout.slice(0, 300)}`);
      return { jobs: [{ status: 'completed', results: { raw: { url } } }] };
    };
    const runOnce = (prompt) => engineNano
      ? nanoCli(prompt)
      : hf.generate(ENDPOINT, {
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
    else if (a.kind === 'nbicon') {
      // transparência real: inundação a partir das bordas (só o fundo conectado some)
      const { data, info } = await img.ensureAlpha().raw().toBuffer({ resolveWithObject: true });
      const W = info.width, H = info.height;
      const seen = new Uint8Array(W * H);
      const stack = [];
      for (let x = 0; x < W; x++) { stack.push(x, 0, x, H - 1); }
      for (let y = 0; y < H; y++) { stack.push(0, y, W - 1, y); }
      while (stack.length) {
        const y = stack.pop(), x = stack.pop();
        if (x < 0 || y < 0 || x >= W || y >= H) continue;
        const i = y * W + x;
        if (seen[i]) continue;
        seen[i] = 1;
        const p = i * 4;
        if (Math.min(data[p], data[p + 1], data[p + 2]) < 214) continue;
        data[p + 3] = 0;
        stack.push(x + 1, y, x - 1, y, x, y + 1, x, y - 1);
      }
      const trimmed = await sharp(data, { raw: info }).trim({ threshold: 25 }).png().toBuffer();
      const meta = await sharp(trimmed).metadata();
      const side = Math.max(meta.width, meta.height);
      await sharp(trimmed)
        .extend({
          top: Math.floor((side - meta.height) / 2), bottom: Math.ceil((side - meta.height) / 2),
          left: Math.floor((side - meta.width) / 2), right: Math.ceil((side - meta.width) / 2),
          background: { r: 0, g: 0, b: 0, alpha: 0 },
        })
        .resize(256, 256)
        .webp({ quality: 86 })
        .toFile(out);
    }
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
      const trimmed = await sharp(data, { raw: info }).trim({ threshold: 45 }).png().toBuffer();
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
        .toFile(out);
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
