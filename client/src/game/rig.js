// STIKDEAD :: rig do boneco — acabamento glossy (model sheet) + itens equipados
// Proporções: cabeça 1.0x, corpo 3.5x, pés 0.5x.
import { drawItems } from './itemsArt.js';

export const RIG = {
  headR: 21, neck: 5, torso: 39,
  upperArm: 24, foreArm: 24,
  thigh: 30, shin: 30, foot: 14,
  hipH: 58,
  wLimb: 15, wLimbLo: 13.5, wLeg: 16, wShin: 14.5, wTorso: 24,
};

const P = Math.PI;
const lerp = (a, b, t) => a + (b - a) * t;
const clamp01 = (t) => Math.max(0, Math.min(1, t));
const ease = (t) => t * t * (3 - 2 * t);

const basePose = () => ({
  lean: 0.06, hipY: 0, head: 0,
  armF: [0.55, -1.3], armB: [0.35, -1.15],
  legF: [0.18, -0.12], legB: [-0.16, -0.1],
});

function mix(a, b, t) {
  t = ease(clamp01(t));
  const m = basePose();
  for (const k of ['lean', 'hipY', 'head']) m[k] = lerp(a[k], b[k], t);
  for (const k of ['armF', 'armB', 'legF', 'legB'])
    m[k] = [lerp(a[k][0], b[k][0], t), lerp(a[k][1], b[k][1], t)];
  return m;
}

const POSES = {
  guard: basePose(),
  windupL: { lean: 0.02, hipY: -2, head: 0, armF: [0.2, -2.0], armB: [0.5, -1.2], legF: [0.2, -0.15], legB: [-0.2, -0.1] },
  punch: { lean: 0.28, hipY: -3, head: 0.05, armF: [1.55, -0.05], armB: [-0.3, -1.4], legF: [0.45, -0.2], legB: [-0.5, -0.25] },
  windupH: { lean: -0.18, hipY: -6, head: -0.05, armF: [0.1, -1.9], armB: [0.6, -1.6], legF: [0.5, -1.1], legB: [-0.15, -0.35] },
  kick: { lean: -0.32, hipY: 2, head: 0, armF: [-0.5, -0.9], armB: [0.9, -0.7], legF: [1.5, -0.08], legB: [-0.35, -0.3] },
  blockP: { lean: 0.1, hipY: -8, head: 0.12, armF: [0.95, -2.2], armB: [0.75, -2.35], legF: [0.3, -0.35], legB: [-0.3, -0.3] },
  hitP: { lean: -0.42, hipY: -6, head: -0.35, armF: [-0.7, -0.5], armB: [-0.9, -0.6], legF: [0.5, -0.3], legB: [-0.1, -0.45] },
  dashP: { lean: 0.55, hipY: -10, head: 0.1, armF: [-0.9, -0.8], armB: [1.1, -0.6], legF: [0.9, -0.5], legB: [-1.0, -0.9] },
  jumpUp: { lean: 0.12, hipY: 0, head: -0.06, armF: [1.4, -0.9], armB: [-0.9, -0.9], legF: [0.8, -1.5], legB: [-0.3, -1.2] },
  jumpDown: { lean: 0.02, hipY: 0, head: 0.1, armF: [0.9, -0.4], armB: [0.6, -0.5], legF: [0.5, -0.6], legB: [-0.4, -0.5] },
  victoryUp: { lean: -0.06, hipY: 0, head: -0.15, armF: [2.4, -0.3], armB: [-0.4, -1.0], legF: [0.15, -0.1], legB: [-0.15, -0.08] },
  victoryDown: { lean: -0.02, hipY: -3, head: -0.05, armF: [2.0, -1.2], armB: [-0.4, -1.0], legF: [0.15, -0.12], legB: [-0.15, -0.1] },
};

export function poseFor(f, moves) {
  const t = f.t;
  switch (f.state) {
    case 'walk': {
      const s = Math.sin(t * 11);
      const p = basePose();
      p.legF = [0.55 * s + 0.1, -0.35 - 0.25 * Math.max(0, s)];
      p.legB = [-0.55 * s - 0.1, -0.35 - 0.25 * Math.max(0, -s)];
      p.armF = [0.45 - 0.35 * s, -1.25];
      p.armB = [0.45 + 0.35 * s, -1.15];
      p.hipY = -2 + 2 * Math.abs(Math.cos(t * 11));
      p.lean = 0.12;
      return p;
    }
    case 'jump':
      return f.vy > 60 ? POSES.jumpUp : f.vy < -60 ? POSES.jumpDown : mix(POSES.jumpUp, POSES.jumpDown, 0.5);
    case 'dash':
      return POSES.dashP;
    case 'block':
      return POSES.blockP;
    case 'light': {
      const mv = moves.light;
      if (t < mv.startup) return mix(POSES.guard, POSES.windupL, t / mv.startup);
      if (t < mv.startup + mv.active) return POSES.punch;
      return mix(POSES.punch, POSES.guard, (t - mv.startup - mv.active) / mv.recover);
    }
    case 'heavy': {
      const mv = moves.heavy;
      if (t < mv.startup) return mix(POSES.guard, POSES.windupH, t / mv.startup);
      if (t < mv.startup + mv.active) return POSES.kick;
      return mix(POSES.kick, POSES.guard, (t - mv.startup - mv.active) / mv.recover);
    }
    case 'hit':
      return mix(POSES.hitP, POSES.guard, t / Math.max(f.hitstun || 0.3, 0.15));
    case 'victory': {
      const s = 0.5 + 0.5 * Math.sin(t * 6);
      return mix(POSES.victoryDown, POSES.victoryUp, s);
    }
    case 'ko':
      return POSES.hitP;
    default: {
      const p = basePose();
      p.hipY = Math.sin(t * 2.4) * 1.6;
      p.armF[0] += Math.sin(t * 2.4) * 0.04;
      return p;
    }
  }
}

const rot = (x, y, a) => [x * Math.cos(a) - y * Math.sin(a), x * Math.sin(a) + y * Math.cos(a)];

export function skeleton(pose) {
  const hip = [0, RIG.hipH + pose.hipY];
  const [tx, ty] = rot(0, RIG.torso, -pose.lean);
  const neck = [hip[0] + tx, hip[1] + ty];
  const [hx, hy] = rot(0, RIG.neck + RIG.headR, -(pose.lean + pose.head));
  const head = [neck[0] + hx, neck[1] + hy];

  const limb = (origin, upLen, loLen, [a, bend]) => {
    const [ux, uy] = rot(0, -upLen, a);
    const mid = [origin[0] + ux, origin[1] + uy];
    const [lx, ly] = rot(0, -loLen, a + bend);
    return [mid, [mid[0] + lx, mid[1] + ly]];
  };

  const [elbF, handF] = limb(neck, RIG.upperArm, RIG.foreArm, pose.armF);
  const [elbB, handB] = limb(neck, RIG.upperArm, RIG.foreArm, pose.armB);
  const [kneF, footF] = limb(hip, RIG.thigh, RIG.shin, pose.legF);
  const [kneB, footB] = limb(hip, RIG.thigh, RIG.shin, pose.legB);

  return { hip, neck, head, elbF, handF, elbB, handB, kneF, footF, kneB, footB, lean: pose.lean };
}

// ===== paleta glossy =====
const OUTLINE = 0x080808;
const BODY = 0x1c1c1c;
const BODY_BACK = 0x101010;
const HI = 0x4a4a4a;
const HI2 = 0x6a6a6a;
const SHADOW = { color: 0x000000, alpha: 0.13 };

export function drawFighter(g, f, moves, accent, elapsed, loadout = null, opts = {}) {
  const pose = poseFor(f, moves);
  const sk = skeleton(pose);
  const face = f.face;
  const ko = f.state === 'ko';

  g.clear();

  const shW = ko ? 74 : 46 - Math.min(30, f.y * 0.08);
  g.ellipse(f.x, 0, Math.max(14, shW), 7).fill(SHADOW);

  const T = (p) => {
    let [x, y] = p;
    if (ko) {
      const k = ease(Math.min(1, f.t * 3.2));
      const [rx, ry] = rotAround([x, y], sk.hip, (P / 2) * k);
      x = rx;
      y = ry - (sk.hip[1] - 13) * k;
    }
    return [f.x + x * face, -(f.y + y)];
  };

  const capsule = (a, b, w, body, hi) => {
    const [x1, y1] = T(a);
    const [x2, y2] = T(b);
    g.moveTo(x1, y1).lineTo(x2, y2).stroke({ width: w + 5, color: OUTLINE, cap: 'round', join: 'round' });
    g.moveTo(x1, y1).lineTo(x2, y2).stroke({ width: w, color: body, cap: 'round', join: 'round' });
    if (hi && !ko) {
      const ux = x2 - x1, uy = y2 - y1;
      const L = Math.hypot(ux, uy) || 1;
      const nx = -uy / L, ny = ux / L;
      const off = w * 0.18;
      g.moveTo(x1 + ux * 0.16 + nx * off, y1 + uy * 0.16 + ny * off)
        .lineTo(x1 + ux * 0.46 + nx * off, y1 + uy * 0.46 + ny * off)
        .stroke({ width: Math.max(3, w * 0.3), color: HI, alpha: 0.8, cap: 'round' });
    }
  };

  const ctx = { g, T, sk, f, face, elapsed, ko };

  if (loadout) drawItems(ctx, loadout, 'back');

  if (!opts.skipBody) {
    capsule(sk.neck, sk.elbB, RIG.wLimb, BODY_BACK, false);
    capsule(sk.elbB, sk.handB, RIG.wLimbLo, BODY_BACK, false);
    capsule(sk.hip, sk.kneB, RIG.wLeg, BODY_BACK, false);
    capsule(sk.kneB, sk.footB, RIG.wShin, BODY_BACK, false);
    capsule(sk.hip, sk.neck, RIG.wTorso, BODY, true);
    capsule(sk.hip, sk.kneF, RIG.wLeg, BODY, true);
    capsule(sk.kneF, sk.footF, RIG.wShin, BODY, true);
    capsule(sk.neck, sk.elbF, RIG.wLimb, BODY, true);
    capsule(sk.elbF, sk.handF, RIG.wLimbLo, BODY, true);
  } else {
    // vetor mínimo para as lacunas ainda sem peça pintada (braço superior, canela)
    capsule(sk.neck, sk.elbB, RIG.wLimb, BODY_BACK, false);
    capsule(sk.kneB, sk.footB, RIG.wShin, BODY_BACK, false);
    capsule(sk.kneF, sk.footF, RIG.wShin, BODY, true);
    capsule(sk.neck, sk.elbF, RIG.wLimb, BODY, true);
  }

  if (loadout) drawItems(ctx, loadout, 'body');

  const [hx, hy] = T(sk.head);
  const R = RIG.headR;
  if (!opts.skipHead) {
    g.circle(hx, hy, R + 2.5).fill(OUTLINE);
    g.circle(hx, hy, R).fill(BODY);
    if (!ko) {
      g.ellipse(hx - R * 0.3, hy - R * 0.42, R * 0.34, R * 0.24).fill({ color: HI, alpha: 0.85 });
      g.ellipse(hx - R * 0.34, hy - R * 0.5, R * 0.16, R * 0.11).fill({ color: HI2, alpha: 0.85 });
    }
    drawEyes(g, f, hx, hy, face, ko, elapsed);
  }

  if (loadout) drawItems(ctx, loadout, 'front');

  const TA = (p) => { let [x, y] = p; x = f.x + x * f.face; y = -y - f.y; return { x, y }; };
  return {
    hx, hy, headR: R, face, ko,
    neck: TA(sk.neck), hip: TA(sk.hip),
    wristF: TA(sk.handF), wristB: TA(sk.handB),
    elbowF: TA(sk.elbF), elbowB: TA(sk.elbB),
    ankleF: TA(sk.footF), ankleB: TA(sk.footB),
    kneeF: TA(sk.kneF), kneeB: TA(sk.kneB),
  };
}

export function drawEyes(g, f, hx, hy, face, ko, elapsed = 0) {
  const ey = hy + 2;
  const exF = hx + face * 6;
  const exB = hx - face * 3;
  if (ko) {
    const X = (cx) => {
      g.moveTo(cx - 4, ey - 4).lineTo(cx + 4, ey + 4).stroke({ width: 2.6, color: 0xffffff, cap: 'round' });
      g.moveTo(cx + 4, ey - 4).lineTo(cx - 4, ey + 4).stroke({ width: 2.6, color: 0xffffff, cap: 'round' });
    };
    X(exF); X(exB);
  } else if (f.state === 'hit') {
    g.circle(exF, ey, 5.6).fill(0xffffff);
    g.circle(exB, ey, 4.6).fill(0xffffff);
  } else {
    // olhos ferozes da referência: quadrantes brancos angulados com brilho
    const pulse = 0.3 + 0.18 * Math.sin(elapsed * 5.2) + (f.combo >= 3 ? 0.2 : 0);
    const angry = (cx, w) => {
      g.moveTo(cx - w * 1.18, ey + 4).lineTo(cx + w * 0.5, ey - 6.4).lineTo(cx + w * 1.18, ey + 4.4)
        .closePath().fill({ color: 0xffffff, alpha: pulse * 0.45 }); // aura externa pulsante
      g.moveTo(cx - w, ey + 3).lineTo(cx + w * 0.45, ey - 5.2).lineTo(cx + w, ey + 3.4)
        .closePath().fill({ color: 0xffffff, alpha: 0.35 + pulse * 0.3 }); // halo
      g.moveTo(cx - w * 0.82, ey + 2.4).lineTo(cx + w * 0.42, ey - 4.2).lineTo(cx + w * 0.85, ey + 2.8)
        .closePath().fill(0xffffff); // núcleo
    };
    angry(exF, 8.5);
    angry(exB, 7);
  }
}

function rotAround(p, c, a) {
  const dx = p[0] - c[0], dy = p[1] - c[1];
  return [c[0] + dx * Math.cos(a) - dy * Math.sin(a), c[1] + dx * Math.sin(a) + dy * Math.cos(a)];
}
