// STIKDEAD :: itens pintados em jogo — a arte da loja presa ao esqueleto do boneco
// Slots rígidos (arma, cabeça, rosto, costas) usam o sprite recortado; panos,
// pares (luvas/botas) e energias continuam no vetor glossy animado.
import { Sprite, Assets } from 'pixi.js';
import { poseFor, skeleton, RIG } from './rig.js';

// attach: hand = punho rotacionando com o antebraço | head = topo da cabeça
//         face = centro do rosto | back = costas na altura do peito
const CFG = {
  // ----- armas (attach: hand) -----
  katana: { attach: 'hand', len: 66, grip: 0.86 },
  katana_infernal: { attach: 'hand', len: 68, grip: 0.86 },
  bastao_bo: { attach: 'hand', len: 82, grip: 0.5 },
  nunchaku: { attach: 'hand', len: 48, grip: 0.7 },
  machado: { attach: 'hand', len: 58, grip: 0.88 },
  lanca: { attach: 'hand', len: 88, grip: 0.72 },
  foice: { attach: 'hand', len: 74, grip: 0.9 },
  foice_sangrenta: { attach: 'hand', len: 76, grip: 0.9 },
  dual_blades: { attach: 'hand', len: 46, grip: 0.85 },
  arco: { attach: 'hand', len: 66, grip: 0.5 },
  // ----- cabeça (assenta no topo) -----
  chapeu_palha: { attach: 'head', len: 36, maxW: 74, overlap: 12 },
  coroa: { attach: 'head', len: 26, maxW: 36, overlap: 7 },
  capuz_sombrio: { attach: 'head', len: 54, maxW: 54, overlap: 34 },
  // ----- rosto (centrado na cabeça) -----
  mascara_caveira: { attach: 'face', len: 36, maxW: 34 },
  mascara_oni: { attach: 'face', len: 38, maxW: 36 },
  mascara_hockey: { attach: 'face', len: 36, maxW: 34 },
  // ----- costas -----
  bainha: { attach: 'back', len: 58, grip: 0.5, rot: 0.6, maxW: 16 },
  // ----- armas de cristal (arte IA original, recortada) -----
  dia_katana_gelo: { attach: 'hand', len: 66, grip: 0.86 },
  dia_foice_glacial: { attach: 'hand', len: 76, grip: 0.9 },
  dia_lancas_cristal: { attach: 'hand', len: 88, grip: 0.72 },
  dia_machado_abismo: { attach: 'hand', len: 58, grip: 0.88 },
  esm_weapon_katana: { attach: 'hand', len: 66, grip: 0.86 },
  esm_weapon_spear: { attach: 'hand', len: 88, grip: 0.72 },
  esm_weapon_axe: { attach: 'hand', len: 58, grip: 0.88 },
  esm_weapon_scythe: { attach: 'hand', len: 76, grip: 0.9 },
  esm_weapon_bow: { attach: 'hand', len: 66, grip: 0.5 },
};

// itens que usam sprite MESMO com o interruptor mestre desligado
const SPRITE_WHITELIST = new Set([
  'dia_katana_gelo', 'dia_foice_glacial', 'dia_lancas_cristal', 'dia_machado_abismo',
  'esm_weapon_katana', 'esm_weapon_spear', 'esm_weapon_axe', 'esm_weapon_scythe', 'esm_weapon_bow',
]);

// ============================================================
// INTERRUPTOR MESTRE: sprites pintados no boneco (experimental).
// false = todo o visual em jogo usa o vetor glossy (estável).
// Para reativar no futuro: true + rodar tools/normalize-sprites.mjs no VPS.
// ============================================================
const SPRITES_ENABLED = false;

const SPRITE_SLOTS = new Set(['weapon', 'head', 'face', 'back', 'body']);

export function createWeaponSprite(container, behindOf = null) {
  const active = new Map(); // slot -> { spr, cfg, id }

  const clearSlot = (slot) => {
    const cur = active.get(slot);
    if (cur) { cur.spr.destroy(); active.delete(slot); }
  };

  return {
    async setLoadout(loadout) {
      const wanted = new Map();
      for (const it of loadout || []) {
        const liberado = SPRITES_ENABLED || SPRITE_WHITELIST.has(it.id);
        if (liberado && SPRITE_SLOTS.has(it.slot) && CFG[it.id]) wanted.set(it.slot, it.id);
        else if (SPRITES_ENABLED && SPRITE_SLOTS.has(it.slot) && it.id)
          console.log(`[stikdead] ${it.slot}=${it.id}: sem sprite configurado, vetor assume`);
      }

      // remove o que saiu
      for (const slot of [...active.keys()])
        if (wanted.get(slot) !== active.get(slot).id) clearSlot(slot);

      // carrega o que entrou
      for (const [slot, id] of wanted) {
        if (active.has(slot)) continue;
        try {
          const tex = await Assets.load(CFG[id].src || `/sprites/${id}.webp`);
          const cfg = CFG[id];
          const spr = new Sprite(tex);
          spr.anchor.set(0.5, cfg.grip);
          // torso: entra ATRÁS do desenho do lutador (braços e pernas cobrem a armadura)
          if (cfg.attach === 'torso' && behindOf && behindOf.parent === container) {
            container.addChildAt(spr, container.getChildIndex(behindOf));
          } else {
            container.addChild(spr);
          }
          active.set(slot, { spr, cfg, id });
          console.log(`[stikdead] sprite pintado ativo: ${slot}=${id} (${tex.width}x${tex.height})`);
        } catch (err) {
          console.warn(`[stikdead] sprite ${id} indisponível (${err.message}) — usando vetor`);
        }
      }
    },
    hasSprite: (slot = 'weapon') => active.has(slot),
    activeSlots: () => new Set(active.keys()),
    update(f, moves) {
      if (active.size === 0) return;
      const sk = skeleton(poseFor(f, moves));
      const face = f.face;
      const ko = f.state === 'ko';
      const T = (p) => [f.x + p[0] * face, -(f.y + p[1])];

      for (const [slot, { spr, cfg }] of active) {
        if (ko) { spr.visible = false; continue; }
        spr.visible = true;
        let s = cfg.len / spr.texture.height;
        if (cfg.maxW) s = Math.min(s, cfg.maxW / spr.texture.width);
        spr.scale.set(s);

        if (slot === 'weapon') {
          const e = T(sk.elbF);
          const h = T(sk.handF);
          let dx = h[0] - e[0];
          let dy = h[1] - e[1];
          const L = Math.hypot(dx, dy) || 1;
          dx /= L; dy /= L;
          spr.position.set(h[0], h[1]);
          spr.rotation = Math.atan2(dx, -dy);
        } else if (slot === 'head') {
          // assenta a base do objeto no topo da cabeça (com leve sobreposição)
          spr.anchor.set(0.5, 0.5);
          const s2 = Math.abs(spr.scale.y);
          const worldH = spr.texture.height * s2;
          const attach = [sk.head[0], sk.head[1] + RIG.headR * 0.72 + worldH / 2 - (cfg.overlap ?? 6)];
          const c = T(attach);
          spr.position.set(c[0], c[1]);
          spr.rotation = -sk.lean * 0.4 * face;
          spr.scale.x = s2 * face;
        } else if (slot === 'body') {
          // torso: centrado entre pescoço e quadril, girando com a inclinação do tronco
          spr.anchor.set(0.5, 0.5);
          const n = sk.neck, hp = sk.hip;
          const c = T([(n[0] + hp[0]) / 2, (n[1] + hp[1]) / 2 - 1]);
          spr.position.set(c[0], c[1]);
          const nT = T(n), hT = T(hp);
          spr.rotation = Math.atan2(hT[0] - nT[0], hT[1] - nT[1]) * -1;
          spr.scale.x = Math.abs(spr.scale.y) * face;
        } else if (slot === 'face') {
          // centro exato da cabeça, levemente à frente
          spr.anchor.set(0.5, 0.5);
          const c = T([sk.head[0] + 2, sk.head[1]]);
          spr.position.set(c[0], c[1]);
          spr.rotation = -sk.lean * 0.35 * face;
          spr.scale.x = Math.abs(spr.scale.y) * face;
        } else if (slot === 'back') {
          spr.anchor.set(0.5, 0.5);
          const bk = T([sk.neck[0] - 11, sk.neck[1] - 8]);
          spr.position.set(bk[0], bk[1]);
          spr.rotation = (cfg.rot || 0.6) * face;
          spr.scale.x = Math.abs(spr.scale.y) * face;
        }
      }
    },
    destroy() { for (const slot of [...active.keys()]) clearSlot(slot); },
  };
}

// remove do vetor os itens cujo sprite pintado está ativo
export function filterForVector(loadout, mgr) {
  const slots = mgr?.activeSlots?.();
  if (!slots || slots.size === 0) return loadout;
  return (loadout || []).filter((it) => !slots.has(it.slot));
}
