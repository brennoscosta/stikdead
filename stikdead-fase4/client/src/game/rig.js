// STIKDEAD :: rig do boneco — esqueleto, poses procedurais e desenho (PixiJS)
// Proporções do model sheet: cabeça 1.0x, corpo 3.5x, pés 0.5x.

export const RIG = {
  headR: 14, neck: 8, torso: 44,
  upperArm: 26, foreArm: 26,
  thigh: 32, shin: 32, foot: 12,
  hipH: 58, stroke: 9,
};

const P = Math.PI;
const lerp = (a, b, t) => a + (b - a) * t;
const clamp01 = (t) => Math.max(0, Math.min(1, t));
const ease = (t) => t * t * (3 - 2 * t);

// Pose: ângulos em radianos. Braços/pernas: [ombro/quadril, cotovelo/joelho].
// Positivo = para a frente (lado do facing). lean = inclinação do tronco.
const basePose = () => ({
  lean: 0.06, hipY: 0, head: 0,
  armF: [0.55, -1.3], armB: [0.35, -1.15], // guarda
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

// Retorna a pose do frame conforme estado da simulação.
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
      return POSES.hitP; // corpo é rotacionado para o chão no draw
    default: {
      const p = basePose();
      const b = Math.sin(t * 2.4) * 1.6;
      p.hipY = b;
      p.armF[0] += Math.sin(t * 2.4) * 0.04;
      return p;
    }
  }
}

const rot = (x, y, a) => [x * Math.cos(a) - y * Math.sin(a), x * Math.sin(a) + y * Math.cos(a)];

// Calcula os pontos do esqueleto (coordenadas locais, y para cima, facing +1).
export function skeleton(pose) {
  const hip = [0, RIG.hipH + pose.hipY];
  const [tx, ty] = rot(0, RIG.torso, -pose.lean);
  const neck = [hip[0] + tx, hip[1] + ty];
  const [hx, hy] = rot(0, RIG.neck + RIG.headR, -(pose.lean + pose.head));
  const head = [neck[0] + hx, neck[1] + hy];

  const limb = (origin, upLen, loLen, [a, bend]) => {
    // ângulo a: 0 = para baixo; positivo = frente (+x local)
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

const INK = 0x111111;
const PAPERSHADOW = 0x00000022;

// Desenha o lutador num Graphics. accent: 0xd90429 (player) ou 0x8a8a8a (bot).
export function drawFighter(g, f, moves, accent, elapsed) {
  const pose = poseFor(f, moves);
  const sk = skeleton(pose);
  const face = f.face;
  const ko = f.state === 'ko';

  g.clear();

  // sombra no chão
  const shW = ko ? 74 : 46 - Math.min(30, f.y * 0.08);
  g.ellipse(f.x, 0, Math.max(14, shW), 7).fill(PAPERSHADOW);

  const T = (p) => {
    let [x, y] = p;
    if (ko) {
      // deita o corpo: rotaciona 90° em torno do quadril (queda para trás) e desce até o chão
      const k = ease(Math.min(1, f.t * 3.2));
      const [rx, ry] = rotAround([x, y], sk.hip, (P / 2) * k);
      x = rx;
      y = ry - (sk.hip[1] - 13) * k;
    }
    return [f.x + x * face, -(f.y + y)];
  };

  const stroke = { width: RIG.stroke, color: INK, cap: 'round', join: 'round' };
  const line = (a, b) => {
    const [x1, y1] = T(a);
    const [x2, y2] = T(b);
    g.moveTo(x1, y1).lineTo(x2, y2).stroke(stroke);
  };

  // membro de trás primeiro (leve profundidade)
  line(sk.neck, sk.elbB); line(sk.elbB, sk.handB);
  line(sk.hip, sk.kneB); line(sk.kneB, sk.footB);
  // tronco
  line(sk.hip, sk.neck);
  // membros da frente
  line(sk.hip, sk.kneF); line(sk.kneF, sk.footF);
  line(sk.neck, sk.elbF); line(sk.elbF, sk.handF);

  // cabeça
  const [hx, hy] = T(sk.head);
  g.circle(hx, hy, RIG.headR).fill(INK);

  // faixa (accent) com pontas ao vento
  const bandY = hy - 4;
  g.rect(hx - RIG.headR, bandY - 4, RIG.headR * 2, 8).fill(accent);
  const wind = Math.sin(elapsed * 9 + f.x * 0.01) * 5;
  const bx = hx - face * RIG.headR;
  g.moveTo(bx, bandY)
    .lineTo(bx - face * 16, bandY - 5 + wind)
    .lineTo(bx - face * 13, bandY + 3 + wind * 0.5)
    .closePath()
    .fill(accent);
  g.moveTo(bx, bandY + 2)
    .lineTo(bx - face * 13, bandY + 8 - wind * 0.6)
    .lineTo(bx - face * 9, bandY + 11)
    .closePath()
    .fill(accent);

  // olhos
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
    g.circle(exF, ey, 4.4).fill(0xffffff);
    g.circle(exB, ey, 3.6).fill(0xffffff);
  } else {
    const angry = (cx, w) => {
      g.moveTo(cx - w, ey + 2)
        .lineTo(cx + w * face * 0.2 + w * 0.4, ey - 3.4)
        .lineTo(cx + w, ey + 2.4)
        .closePath()
        .fill(0xffffff);
    };
    angry(exF, 6);
    angry(exB, 5);
  }
}

function rotAround(p, c, a) {
  const dx = p[0] - c[0], dy = p[1] - c[1];
  return [c[0] + dx * Math.cos(a) - dy * Math.sin(a), c[1] + dx * Math.sin(a) + dy * Math.cos(a)];
}
