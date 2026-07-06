// STIKDEAD :: armas pintadas na luta — a MESMA arte da loja presa na mão do boneco
// Sprite recortado (fundo removido) posicionado no punho e rotacionado com o antebraço.
// Fallback automático: sem sprite disponível, o vetor glossy continua.
import { Sprite, Assets } from 'pixi.js';
import { poseFor, skeleton } from './rig.js';

// comprimento alvo (unidades de mundo) e âncora do punho por arma
const CFG = {
  katana: { len: 66, grip: 0.86 },
  katana_infernal: { len: 68, grip: 0.86 },
  bastao_bo: { len: 82, grip: 0.5 },
  nunchaku: { len: 48, grip: 0.7 },
  machado: { len: 58, grip: 0.88 },
  lanca: { len: 88, grip: 0.72 },
  foice: { len: 74, grip: 0.9 },
  foice_sangrenta: { len: 76, grip: 0.9 },
  dual_blades: { len: 46, grip: 0.85 },
  arco: { len: 66, grip: 0.5 },
};

export function createWeaponSprite(container) {
  let spr = null;
  let ready = false;
  let currentId = null;
  let cfg = null;

  const clear = () => {
    if (spr) { spr.destroy(); spr = null; }
    ready = false;
    currentId = null;
  };

  return {
    async setLoadout(loadout) {
      const item = (loadout || []).find((it) => it.slot === 'weapon');
      const id = item?.id || null;
      if (id === currentId) return;
      clear();
      currentId = id;
      if (!id || !CFG[id]) return;
      try {
        const tex = await Assets.load(`/sprites/${id}.webp`);
        if (currentId !== id) return; // trocou enquanto carregava
        cfg = CFG[id];
        spr = new Sprite(tex);
        spr.anchor.set(0.5, cfg.grip);
        container.addChild(spr);
        ready = true;
      } catch {
        ready = false; // sem sprite: vetor assume
      }
    },
    hasSprite: () => ready,
    update(f, moves) {
      if (!spr) return;
      if (f.state === 'ko') { spr.visible = false; return; }
      const sk = skeleton(poseFor(f, moves));
      const face = f.face;
      const T = (p) => [f.x + p[0] * face, -(f.y + p[1])];
      const e = T(sk.elbF);
      const h = T(sk.handF);
      let dx = h[0] - e[0];
      let dy = h[1] - e[1];
      const L = Math.hypot(dx, dy) || 1;
      dx /= L; dy /= L;
      spr.visible = true;
      spr.position.set(h[0], h[1]);
      spr.rotation = Math.atan2(dx, -dy); // arte aponta para cima; alinha ao antebraço
      spr.scale.set(cfg.len / spr.texture.height);
    },
    destroy: clear,
  };
}

// remove a arma do loadout vetorial quando o sprite pintado está ativo
export function filterForVector(loadout, weaponMgr) {
  if (!weaponMgr?.hasSprite()) return loadout;
  return (loadout || []).filter((it) => it.slot !== 'weapon');
}
