// STIKDEAD :: rig do boneco — acabamento glossy (model sheet) + itens equipados
// Proporções: cabeça 1.0x, corpo 3.5x, pés 0.5x.
import { drawItems } from './itemsArt.js';

export const RIG = {
  headR: 24, neck: 5, torso: 39,
  upperArm: 23, foreArm: 23,
  thigh: 28, shin: 28, foot: 14,
  hipH: 54,
  wLimb: 16.5, wLimbLo: 14.5, wLeg: 17.5, wShin: 15.5, wTorso: 25,
};

const P = Math.PI;
const lerp = (a, b, t) => a + (b - a) * t;
const clamp01 = (t) => Math.max(0, Math.min(1, t));
const ease = (t) => t * t * (3 - 2 * t);

// guarda de luta: cotovelo dobra PARA FRENTE (bend positivo) — antebraço sobe
// na frente do corpo e a arma aponta para onde o boneco encara. bend negativo
// hiperestendia o cotovelo e jogava mão + arma para TRÁS do corpo.
const basePose = () => ({
  lean: 0.06, hipY: 0, head: 0,
  armF: [0.45, 1.35], armB: [0.3, 1.25],
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
  windupL: { lean: 0.02, hipY: -2, head: 0, armF: [-0.35, -2.15], armB: [0.4, 1.15], legF: [0.2, -0.15], legB: [-0.2, -0.1] },
  punch: { lean: 0.28, hipY: -3, head: 0.05, armF: [1.55, -0.05], armB: [-0.35, 1.15], legF: [0.45, -0.2], legB: [-0.5, -0.25] },
  windupH: { lean: -0.18, hipY: -6, head: -0.05, armF: [0.1, -1.9], armB: [0.6, -1.6], legF: [0.5, -1.1], legB: [-0.15, -0.35] },
  kick: { lean: -0.32, hipY: 2, head: 0, armF: [-0.5, -0.9], armB: [0.9, -0.7], legF: [1.5, -0.08], legB: [-0.35, -0.3] },
  blockP: { lean: 0.1, hipY: -8, head: 0.12, armF: [0.8, 1.5], armB: [0.65, 1.5], legF: [0.3, -0.35], legB: [-0.3, -0.3] },
  hitP: { lean: -0.42, hipY: -6, head: -0.35, armF: [-0.7, -0.5], armB: [-0.9, -0.6], legF: [0.5, -0.3], legB: [-0.1, -0.45] },
  dashP: { lean: 0.55, hipY: -10, head: 0.1, armF: [1.15, 0.25], armB: [-0.7, -0.5], legF: [0.9, -0.5], legB: [-1.0, -0.9] },
  jumpUp: { lean: 0.12, hipY: 0, head: -0.06, armF: [1.0, 0.9], armB: [-0.9, -0.9], legF: [0.8, -1.5], legB: [-0.3, -1.2] },
  jumpDown: { lean: 0.02, hipY: 0, head: 0.1, armF: [0.7, 1.0], armB: [0.6, -0.5], legF: [0.5, -0.6], legB: [-0.4, -0.5] },
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
      // braços de caminhada: o da arma mantém a guarda À FRENTE (arma apontando
      // para onde o boneco encara), o de trás balança solto com cotovelo natural
      p.armF = [0.5 + 0.1 * s, 1.25];
      p.armB = [-0.05 + 0.45 * s, 0.35];
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
    case 'crouch': {
      const p = { ...POSES.blockP, hipY: -15, lean: 0.1 };
      return p;
    }
    case 'rasteira': {
      const mv = moves.rasteira;
      const slide = { ...POSES.kick, hipY: -16, lean: -0.38 };
      if (t < mv.startup) return mix(POSES.dashP, slide, t / mv.startup);
      if (t < mv.startup + mv.active) return slide;
      return mix(slide, POSES.guard, (t - mv.startup - mv.active) / mv.recover);
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
      // UPDATE 2.8 — idle procedural do lobby: cabeça/torso respondem a
      // campos opcionais (f.look / f.leanFx), sem afetar a simulação da luta
      if (f.look) p.head += f.look;
      if (f.leanFx) p.lean += f.leanFx;
      if (f.armFx) { p.armF[0] += f.armFx; p.armF[1] -= f.armFx * 0.5; }
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

// ===== paleta glossy 2.5D (referência: pôster/vídeo promocional) =====
// o boneco é uma "action figure" de plástico preto: esfera/cilindros com
// sombra própria, luz difusa fria, especular quente e rim light azulada
const OUTLINE = 0x080808;
const BODY = 0x1c1c1c;
const BODY_BACK = 0x101010;
const SHADE = 0x0a0a0c;   // lado na sombra
const CORE = 0x3a3f46;    // luz difusa
const CORE2 = 0x596069;   // miolo da luz
const SPEC = 0xd9dfe6;    // especular "plástico"
const RIM = 0x5d7d9e;     // rim light azulada (cara de render 3D)
const SHADOW = { color: 0x000000, alpha: 0.13 };
const LX = -0.6, LY = -0.8; // direção da luz (alto-esquerda, espaço de tela)

export function drawFighter(g, f, moves, accent, elapsed, loadout = null, opts = {}) {
  const pose = poseFor(f, moves);
  const sk = skeleton(pose);
  const face = f.face;
  const ko = f.state === 'ko';

  g.clear();

  if (!opts.onlyArms) {
    const shW = ko ? 74 : 46 - Math.min(30, f.y * 0.08);
    g.ellipse(f.x, 0, Math.max(14, shW), 7).fill(SHADOW);
  }

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

  // cápsula com shading cilíndrico: sombra no lado oposto à luz, luz difusa,
  // especular curto e rim light — o membro deixa de ser um traço chapado
  const capsule = (a, b, w, body, hi) => {
    const A = T(a), B = T(b);
    const [x1, y1] = A, [x2, y2] = B;
    g.moveTo(x1, y1).lineTo(x2, y2).stroke({ width: w + 5, color: OUTLINE, cap: 'round', join: 'round' });
    g.moveTo(x1, y1).lineTo(x2, y2).stroke({ width: w, color: body, cap: 'round', join: 'round' });
    if (ko) return;
    const ux = x2 - x1, uy = y2 - y1;
    const L = Math.hypot(ux, uy) || 1;
    let nx = -uy / L, ny = ux / L;
    if (nx * LX + ny * LY < 0) { nx = -nx; ny = -ny; } // normal aponta para a luz
    const faixa = (k, t0, t1, wd, color, alpha) => {
      const px = x1 + ux * t0, py = y1 + uy * t0;
      const qx = x1 + ux * t1, qy = y1 + uy * t1;
      g.moveTo(px + nx * k, py + ny * k).lineTo(qx + nx * k, qy + ny * k)
        .stroke({ width: wd, color, alpha, cap: 'round' });
    };
    if (hi) {
      faixa(-w * 0.20, 0.10, 0.92, w * 0.60, SHADE, 0.55);
      faixa(-w * 0.32, 0.16, 0.88, Math.max(2, w * 0.14), RIM, 0.38);
      faixa(w * 0.18, 0.08, 0.72, w * 0.44, CORE, 0.6);
      faixa(w * 0.24, 0.12, 0.40, Math.max(2, w * 0.17), SPEC, 0.7);
    } else {
      faixa(-w * 0.18, 0.12, 0.90, w * 0.55, SHADE, 0.45);
      faixa(w * 0.16, 0.10, 0.60, w * 0.40, 0x2a2d31, 0.5);
    }
  };

  // punho esférico (a referência tem mãos de bola, não membro que termina no pulso)
  const fist = (p, r, front) => {
    const [x, y] = T(p);
    g.circle(x, y, r + 2.4).fill(OUTLINE);
    g.circle(x, y, r).fill(front ? BODY : BODY_BACK);
    if (!ko) {
      g.ellipse(x + r * 0.16, y + r * 0.3, r * 0.72, r * 0.5).fill({ color: SHADE, alpha: front ? 0.5 : 0.4 });
      if (front) {
        g.ellipse(x - r * 0.3, y - r * 0.34, r * 0.44, r * 0.32).fill({ color: CORE, alpha: 0.85 });
        g.ellipse(x - r * 0.36, y - r * 0.44, r * 0.18, r * 0.13).fill({ color: SPEC, alpha: 0.9 });
      }
    }
  };

  // pezinho arredondado apontando para onde o boneco encara
  const foot = (p, front) => {
    const [x, y] = T(p);
    const r = RIG.wShin * 0.5;
    g.ellipse(x + face * 3.5, y - 1, r * 1.5, r).fill(front ? BODY : BODY_BACK).stroke({ width: 2.5, color: OUTLINE });
    if (front && !ko) g.ellipse(x + face * 2, y - r * 0.45, r * 0.7, r * 0.3).fill({ color: CORE, alpha: 0.6 });
  };

  const ctx = { g, T, sk, f, face, elapsed, ko };

  // modo HÍBRIDO: só os braços vetoriais + punhos, para desenhar POR CIMA das
  // peças pintadas (sprite de braço achata quando o antebraço aponta pra frente)
  if (opts.onlyArms) {
    capsule(sk.neck, sk.elbB, RIG.wLimb, BODY_BACK, false);
    capsule(sk.elbB, sk.handB, RIG.wLimbLo, BODY_BACK, false);
    fist(sk.handB, RIG.wLimbLo * 0.68, false);
    capsule(sk.neck, sk.elbF, RIG.wLimb, BODY, true);
    capsule(sk.elbF, sk.handF, RIG.wLimbLo, BODY, true);
    fist(sk.handF, RIG.wLimbLo * 0.72, true);
    return null;
  }

  if (loadout) drawItems(ctx, loadout, 'back');

  if (!opts.skipBody) {
    capsule(sk.neck, sk.elbB, RIG.wLimb, BODY_BACK, false);
    capsule(sk.elbB, sk.handB, RIG.wLimbLo, BODY_BACK, false);
    fist(sk.handB, RIG.wLimbLo * 0.68, false);
    capsule(sk.hip, sk.kneB, RIG.wLeg, BODY_BACK, false);
    capsule(sk.kneB, sk.footB, RIG.wShin, BODY_BACK, false);
    foot(sk.footB, false);
    capsule(sk.hip, sk.neck, RIG.wTorso, BODY, true);
    capsule(sk.hip, sk.kneF, RIG.wLeg, BODY, true);
    capsule(sk.kneF, sk.footF, RIG.wShin, BODY, true);
    foot(sk.footF, true);
    if (loadout) drawItems(ctx, loadout, 'torso'); // armadura: cobre tronco e pernas, atrás do braço da frente
    capsule(sk.neck, sk.elbF, RIG.wLimb, BODY, true);
    capsule(sk.elbF, sk.handF, RIG.wLimbLo, BODY, true);
    fist(sk.handF, RIG.wLimbLo * 0.72, true);
  } else if (!opts.skipBridge) {
    // ponte: braço superior (o kit preto não tem essa peça)
    capsule(sk.neck, sk.elbB, RIG.wLimb, BODY_BACK, false);
    capsule(sk.neck, sk.elbF, RIG.wLimb, BODY, true);
  }

  if (loadout) drawItems(ctx, loadout, 'body');

  const [hx, hy] = T(sk.head);
  const R = RIG.headR;
  if (!opts.skipHead) {
    g.circle(hx, hy, R + 2.6).fill(OUTLINE);
    g.circle(hx, hy, R).fill(BODY);
    if (!ko) {
      // esfera de verdade: sombra embaixo, rim light atrás, luz difusa em camadas e especular quente
      g.ellipse(hx + R * 0.14, hy + R * 0.32, R * 0.8, R * 0.58).fill({ color: SHADE, alpha: 0.5 });
      const a0 = 0.25, a1 = 1.30;
      g.moveTo(hx + Math.cos(a0) * R * 0.86, hy + Math.sin(a0) * R * 0.86)
        .arc(hx, hy, R * 0.86, a0, a1)
        .stroke({ width: Math.max(2.5, R * 0.11), color: RIM, alpha: 0.35, cap: 'round' });
      g.ellipse(hx - R * 0.32, hy - R * 0.38, R * 0.52, R * 0.4).fill({ color: CORE, alpha: 0.75 });
      g.ellipse(hx - R * 0.36, hy - R * 0.44, R * 0.3, R * 0.22).fill({ color: CORE2, alpha: 0.8 });
      g.ellipse(hx - R * 0.4, hy - R * 0.5, R * 0.15, R * 0.1).fill({ color: SPEC, alpha: 0.95 });
    }
    const olhosCobertos = (loadout || []).some((it) => it.slot === 'face' && /eyes/.test(it.id || ''));
    if (!olhosCobertos) drawEyes(g, f, hx, hy, face, ko, elapsed, R / 21);
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

export function drawEyes(g, f, hx, hy, face, ko, elapsed = 0, k = 1) {
  const ey = hy + 2 * k;
  const exF = hx + face * 6 * k;
  const exB = hx - face * 3 * k;
  if (ko) {
    const X = (cx) => {
      g.moveTo(cx - 4 * k, ey - 4 * k).lineTo(cx + 4 * k, ey + 4 * k).stroke({ width: 2.6, color: 0xffffff, cap: 'round' });
      g.moveTo(cx + 4 * k, ey - 4 * k).lineTo(cx - 4 * k, ey + 4 * k).stroke({ width: 2.6, color: 0xffffff, cap: 'round' });
    };
    X(exF); X(exB);
  } else if (f.state === 'hit') {
    g.circle(exF, ey, 5.6 * k).fill(0xffffff);
    g.circle(exB, ey, 4.6 * k).fill(0xffffff);
  } else {
    // olhos ferozes da referência: quadrantes brancos angulados BRILHANDO (bloom)
    const pulse = 0.3 + 0.18 * Math.sin(elapsed * 5.2) + (f.combo >= 3 ? 0.2 : 0);
    const angry = (cx, w0) => {
      const w = w0 * k;
      g.circle(cx, ey - 1.2 * k, w * 1.35).fill({ color: 0xffffff, alpha: 0.10 + pulse * 0.10 }); // bloom
      g.moveTo(cx - w * 1.18, ey + 4 * k).lineTo(cx + w * 0.5, ey - 6.4 * k).lineTo(cx + w * 1.18, ey + 4.4 * k)
        .closePath().fill({ color: 0xffffff, alpha: pulse * 0.45 }); // aura externa pulsante
      g.moveTo(cx - w, ey + 3 * k).lineTo(cx + w * 0.45, ey - 5.2 * k).lineTo(cx + w, ey + 3.4 * k)
        .closePath().fill({ color: 0xffffff, alpha: 0.35 + pulse * 0.3 }); // halo
      g.moveTo(cx - w * 0.82, ey + 2.4 * k).lineTo(cx + w * 0.42, ey - 4.2 * k).lineTo(cx + w * 0.85, ey + 2.8 * k)
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
