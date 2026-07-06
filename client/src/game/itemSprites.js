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
  chapeu_palha: { attach: 'head', len: 30, grip: 0.92, maxW: 54 },
  coroa: { attach: 'head', len: 20, grip: 0.95, maxW: 26 },
  capuz_sombrio: { attach: 'head', len: 38, grip: 0.75, maxW: 40 },
  // ----- rosto (centrado na cabeça) -----
  mascara_caveira: { attach: 'face', len: 26, grip: 0.5, maxW: 24 },
  mascara_oni: { attach: 'face', len: 28, grip: 0.5, maxW: 26 },
  mascara_hockey: { attach: 'face', len: 26, grip: 0.5, maxW: 24 },
  // ----- costas -----
  bainha: { attach: 'back', len: 58, grip: 0.5, rot: 0.6, maxW: 16 },
};

const SPRITE_SLOTS = new Set(['weapon', 'head', 'face', 'back']);

export function createWeaponSprite(container) {
  const active = new Map(); // slot -> { spr, cfg, id }

  const clearSlot = (slot) => {
    const cur = active.get(slot);
    if (cur) { cur.spr.destroy(); active.delete(slot); }
  };

  return {
    async setLoadout(loadout) {
      const wanted = new Map();
      for (const it of loadout || [])
        if (SPRITE_SLOTS.has(it.slot) && CFG[it.id]) wanted.set(it.slot, it.id);

      // remove o que saiu
      for (const slot of [...active.keys()])
        if (wanted.get(slot) !== active.get(slot).id) clearSlot(slot);

      // carrega o que entrou
      for (const [slot, id] of wanted) {
        if (active.has(slot)) continue;
        try {
          const tex = await Assets.load(`/sprites/${id}.webp`);
          const cfg = CFG[id];
          const spr = new Sprite(tex);
          spr.anchor.set(0.5, cfg.grip);
          container.addChild(spr);
          active.set(slot, { spr, cfg, id });
        } catch { /* sem sprite: vetor assume este item */ }
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
          const top = T([sk.head[0], sk.head[1] + RIG.headR * 0.55]);
          spr.position.set(top[0], top[1]);
          spr.rotation = -sk.lean * 0.5 * face;
          spr.scale.x = Math.abs(spr.scale.y) * face;
        } else if (slot === 'face') {
          const c = T([sk.head[0] + 4, sk.head[1] - 1]);
          spr.position.set(c[0], c[1]);
          spr.rotation = -sk.lean * 0.4 * face;
          spr.scale.x = Math.abs(spr.scale.y) * face;
        } else if (slot === 'back') {
          const bk = T([sk.neck[0] - 10, sk.neck[1] - 6]);
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
