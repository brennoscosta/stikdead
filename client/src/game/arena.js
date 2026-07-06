// STIKDEAD :: arenas (Dojo, Templo, Prisão) + efeitos (sangue, faíscas, tremor)
import { Container, Graphics } from 'pixi.js';

export const WORLD = { left: -450, right: 450, width: 900, skyH: 420 };

export const ARENAS = {
  dojo: { label: 'Dojo', desc: 'Tradição e disciplina.' },
  temple: { label: 'Templo', desc: 'Equilíbrio e poder espiritual.' },
  prison: { label: 'Prisão', desc: 'Sem regras. Sem piedade.' },
};

export function buildArena(theme = 'dojo') {
  if (theme === 'temple') return buildTemple();
  if (theme === 'prison') return buildPrison();
  return buildDojo();
}

// Dojo em estilo nanquim claro: papel, madeira, shoji e pergaminho com marca vermelha.
export function buildDojo() {
  const c = new Container();
  const g = new Graphics();

  // parede de papel
  g.rect(WORLD.left - 200, -WORLD.skyH, WORLD.width + 400, WORLD.skyH).fill(0xece5d6);

  // faixa de sombra no topo (tinta diluída)
  g.rect(WORLD.left - 200, -WORLD.skyH, WORLD.width + 400, 46).fill({ color: 0x1a1a1a, alpha: 0.07 });

  // janelas shoji
  for (const wx of [-330, 250]) {
    g.rect(wx, -330, 150, 200).fill(0xf7f2e7).stroke({ width: 6, color: 0x2b2620 });
    for (let i = 1; i < 3; i++) {
      g.moveTo(wx + (150 / 3) * i, -330).lineTo(wx + (150 / 3) * i, -130).stroke({ width: 3, color: 0x2b2620 });
      g.moveTo(wx, -330 + (200 / 3) * i).lineTo(wx + 150, -330 + (200 / 3) * i).stroke({ width: 3, color: 0x2b2620 });
    }
  }

  // pergaminho central com marca de pincel vermelha
  g.rect(-55, -360, 110, 240).fill(0xf5efe2).stroke({ width: 4, color: 0x22201c });
  g.rect(-55, -360, 110, 16).fill(0x22201c);
  g.rect(-55, -136, 110, 16).fill(0x22201c);
  g.circle(0, -250, 34).stroke({ width: 9, color: 0xb0031f });
  g.moveTo(-18, -232).lineTo(20, -268).stroke({ width: 8, color: 0xb0031f, cap: 'round' });

  // pilares laterais
  g.rect(WORLD.left - 40, -WORLD.skyH, 34, WORLD.skyH).fill(0x3a3129);
  g.rect(WORLD.right + 6, -WORLD.skyH, 34, WORLD.skyH).fill(0x3a3129);

  // piso de madeira
  g.rect(WORLD.left - 200, 0, WORLD.width + 400, 220).fill(0xcdb891);
  for (let i = 0; i < 10; i++) {
    const y = 8 + i * 22;
    g.moveTo(WORLD.left - 200, y).lineTo(WORLD.right + 200, y).stroke({ width: 2, color: 0xb09a72 });
  }
  // respingos de tinta no chão
  const seeds = [-380, -260, -120, 40, 170, 300, 390];
  seeds.forEach((x, i) => {
    g.circle(x, 30 + (i % 4) * 34, 4 + (i % 3) * 2).fill({ color: 0x1a1a1a, alpha: 0.08 });
  });
  g.moveTo(WORLD.left - 200, 0).lineTo(WORLD.right + 200, 0).stroke({ width: 5, color: 0x6d5a3c });

  c.addChild(g);
  return c;
}


// Templo: estátua em tinta, colunas com faixas vermelhas, incenso e pedra clara.
export function buildTemple() {
  const c = new Container();
  const g = new Graphics();

  g.rect(WORLD.left - 200, -WORLD.skyH, WORLD.width + 400, WORLD.skyH).fill(0xe9e0cd);
  g.rect(WORLD.left - 200, -WORLD.skyH, WORLD.width + 400, 60).fill({ color: 0x1a1a1a, alpha: 0.09 });

  // estátua sentada ao fundo (silhueta de tinta)
  g.ellipse(0, -180, 64, 74).fill({ color: 0x2b2620, alpha: 0.9 });      // corpo
  g.circle(0, -272, 34).fill({ color: 0x2b2620, alpha: 0.9 });           // cabeça
  g.ellipse(0, -128, 96, 26).fill({ color: 0x2b2620, alpha: 0.9 });      // pernas cruzadas
  g.ellipse(-58, -186, 14, 40).fill({ color: 0x2b2620, alpha: 0.9 });
  g.ellipse(58, -186, 14, 40).fill({ color: 0x2b2620, alpha: 0.9 });
  g.circle(0, -272, 46).stroke({ width: 5, color: 0xb0031f, alpha: 0.5 }); // auréola
  // pedestal
  g.rect(-120, -110, 240, 26).fill(0xcfc2a4).stroke({ width: 4, color: 0x22201c });

  // colunas com faixas
  for (const wx of [-350, 310]) {
    g.rect(wx, -WORLD.skyH, 40, WORLD.skyH).fill(0xb8a887).stroke({ width: 4, color: 0x2b2620 });
    g.rect(wx + 4, -300, 32, 120).fill(0xb0031f);
    g.circle(wx + 20, -262, 11).stroke({ width: 4, color: 0xf5efe2 });
  }

  // fumaça de incenso (curvas de tinta diluída)
  for (const ix of [-160, 170]) {
    g.rect(ix - 8, -34, 16, 34).fill(0x5a4a38);
    g.moveTo(ix, -40).quadraticCurveTo(ix - 16, -90, ix + 4, -140)
      .quadraticCurveTo(ix + 20, -180, ix - 6, -230)
      .stroke({ width: 5, color: 0x8a8377, alpha: 0.4, cap: 'round' });
  }

  // piso de pedra
  g.rect(WORLD.left - 200, 0, WORLD.width + 400, 220).fill(0xd6cab0);
  for (let i = 0; i < 6; i++) {
    const y = 12 + i * 34;
    g.moveTo(WORLD.left - 200, y).lineTo(WORLD.right + 200, y).stroke({ width: 2, color: 0xbcae8f });
    for (let j = 0; j < 7; j++)
      g.moveTo(WORLD.left - 80 + j * 130 + (i % 2) * 60, y - 34).lineTo(WORLD.left - 80 + j * 130 + (i % 2) * 60, y).stroke({ width: 2, color: 0xbcae8f });
  }
  g.moveTo(WORLD.left - 200, 0).lineTo(WORLD.right + 200, 0).stroke({ width: 5, color: 0x77653f });

  c.addChild(g);
  return c;
}

// Prisão: pedra fria, grades, correntes e rachaduras.
export function buildPrison() {
  const c = new Container();
  const g = new Graphics();

  g.rect(WORLD.left - 200, -WORLD.skyH, WORLD.width + 400, WORLD.skyH).fill(0xd9d5cc);
  g.rect(WORLD.left - 200, -WORLD.skyH, WORLD.width + 400, 80).fill({ color: 0x1a1a1a, alpha: 0.14 });

  // blocos de pedra da parede
  for (let r = 0; r < 5; r++) {
    const y = -WORLD.skyH + 80 + r * 68;
    g.moveTo(WORLD.left - 200, y).lineTo(WORLD.right + 200, y).stroke({ width: 3, color: 0xb5b0a5 });
    for (let j = 0; j < 8; j++)
      g.moveTo(WORLD.left - 120 + j * 120 + (r % 2) * 60, y).lineTo(WORLD.left - 120 + j * 120 + (r % 2) * 60, y + 68).stroke({ width: 3, color: 0xb5b0a5 });
  }

  // janelas com grades
  for (const wx of [-320, 240]) {
    g.rect(wx, -320, 120, 160).fill(0x3a3733).stroke({ width: 6, color: 0x22201c });
    for (let i = 1; i < 4; i++)
      g.moveTo(wx + 30 * i, -320).lineTo(wx + 30 * i, -160).stroke({ width: 5, color: 0x8a8377 });
  }

  // portão central gradeado
  g.rect(-90, -300, 180, 300).fill(0x2f2c28).stroke({ width: 6, color: 0x22201c });
  for (let i = 1; i < 6; i++)
    g.moveTo(-90 + 30 * i, -300).lineTo(-90 + 30 * i, 0).stroke({ width: 5, color: 0x8a8377 });
  g.rect(-90, -170, 180, 12).fill(0x8a8377);

  // correntes penduradas
  for (const cx of [-180, 150]) {
    for (let i = 0; i < 7; i++)
      g.ellipse(cx + Math.sin(i * 1.3) * 4, -WORLD.skyH + 60 + i * 22, 7, 11).stroke({ width: 4, color: 0x55524c });
  }

  // marca vermelha de garra na parede
  for (let i = 0; i < 3; i++)
    g.moveTo(60 + i * 16, -260).lineTo(90 + i * 16, -180).stroke({ width: 6, color: 0xb0031f, alpha: 0.55, cap: 'round' });

  // piso de concreto rachado
  g.rect(WORLD.left - 200, 0, WORLD.width + 400, 220).fill(0xbdb8ac);
  g.moveTo(-260, 26).lineTo(-180, 60).lineTo(-120, 44).stroke({ width: 3, color: 0x8f8a7e });
  g.moveTo(120, 30).lineTo(210, 74).stroke({ width: 3, color: 0x8f8a7e });
  g.moveTo(320, 20).lineTo(380, 52).lineTo(360, 90).stroke({ width: 3, color: 0x8f8a7e });
  g.moveTo(WORLD.left - 200, 0).lineTo(WORLD.right + 200, 0).stroke({ width: 5, color: 0x6b675e });

  c.addChild(g);
  return c;
}

// ===== FX =====
export function createFx(stage) {
  const layer = new Graphics();
  stage.addChild(layer);
  return { layer, parts: [], rings: [], lines: [], sparks: [], shake: 0, flash: 0, flashRed: 0, kick: 0 };
}

export function fxHit(fx, x, y, dir, { blocked, heavy }) {
  if (blocked) {
    for (let i = 0; i < 8; i++) spawn(fx, x, y, dir, 0xffffff, 180, 0.25);
    fx.sparks.push({ x, y, life: 0.16, maxLife: 0.16, size: 16, color: 0x9fd8ff });
    fx.rings.push({ x, y, r: 6, vr: 260, life: 0.22, maxLife: 0.22, color: 0x9fd8ff, w: 3 });
    fx.shake = Math.max(fx.shake, 3);
    return;
  }
  const n = heavy ? 26 : 13;
  for (let i = 0; i < n; i++) spawn(fx, x, y, dir, 0xb0031f, heavy ? 420 : 280, heavy ? 0.7 : 0.45);
  // estrela de impacto (clarão em cruz)
  fx.sparks.push({ x, y, life: heavy ? 0.22 : 0.14, maxLife: heavy ? 0.22 : 0.14, size: heavy ? 34 : 20, color: 0xffffff });
  // anel de choque expandindo
  fx.rings.push({ x, y, r: 8, vr: heavy ? 620 : 380, life: heavy ? 0.3 : 0.2, maxLife: heavy ? 0.3 : 0.2, color: heavy ? 0xff2244 : 0xffffff, w: heavy ? 5 : 3 });
  // linhas de velocidade na direção do golpe
  const nl = heavy ? 7 : 4;
  for (let i = 0; i < nl; i++) {
    const spread = (Math.random() - 0.5) * 50;
    fx.lines.push({
      x, y: y + spread * 0.6, dir, len: 30 + Math.random() * (heavy ? 60 : 34),
      v: (heavy ? 900 : 620) * (0.7 + Math.random() * 0.5),
      life: 0.18, maxLife: 0.18, w: 2 + Math.random() * 2,
    });
  }
  if (heavy) fx.kick = Math.max(fx.kick, 0.05);
  fx.flash = 0.06;
  fx.shake = Math.max(fx.shake, heavy ? 11 : 5);
}

export function fxKo(fx, x, y, dir) {
  fx.sparks.push({ x, y, life: 0.35, maxLife: 0.35, size: 60, color: 0xffffff });
  fx.rings.push({ x, y, r: 10, vr: 900, life: 0.5, maxLife: 0.5, color: 0xff2244, w: 7 });
  fx.rings.push({ x, y, r: 4, vr: 500, life: 0.42, maxLife: 0.42, color: 0xffffff, w: 3 });
  fx.flashRed = 0.35;
  fx.kick = Math.max(fx.kick, 0.07);
  for (let i = 0; i < 46; i++) spawn(fx, x, y, dir, 0xb0031f, 560, 1.1);
  fx.shake = 16;
  fx.flash = 0.1;
}

export function fxDash(fx, x) {
  for (let i = 0; i < 6; i++) spawn(fx, x, 8, 0, 0x999080, 120, 0.3);
}

function spawn(fx, x, y, dir, color, power, life) {
  const a = Math.random() * Math.PI - Math.PI / 2;
  const sp = power * (0.35 + Math.random() * 0.65);
  fx.parts.push({
    x, y,
    vx: Math.cos(a) * sp * (dir || (Math.random() < 0.5 ? -1 : 1)),
    vy: Math.abs(Math.sin(a)) * sp * 0.9 + 60,
    r: 2 + Math.random() * (power > 400 ? 4.5 : 3),
    color, life, maxLife: life,
  });
}

export function fxStep(fx, dt) {
  fx.shake = Math.max(0, fx.shake - dt * 34);
  fx.flash = Math.max(0, fx.flash - dt);
  fx.flashRed = Math.max(0, fx.flashRed - dt * 1.6);
  fx.kick = Math.max(0, fx.kick - dt * 0.35);
  const g = fx.layer;
  g.clear();

  // anéis de choque
  fx.rings = fx.rings.filter((r) => {
    r.life -= dt;
    if (r.life <= 0) return false;
    r.r += r.vr * dt;
    const alpha = (r.life / r.maxLife) * 0.9;
    g.circle(r.x, -r.y, r.r).stroke({ width: r.w * (r.life / r.maxLife) + 1, color: r.color, alpha });
    return true;
  });

  // estrelas de impacto (cruz de clarão)
  fx.sparks = fx.sparks.filter((s) => {
    s.life -= dt;
    if (s.life <= 0) return false;
    const k = s.life / s.maxLife;
    const R = s.size * (1.6 - k * 0.6);
    for (const [ax, ay] of [[1, 0], [0, 1], [0.7, 0.7], [-0.7, 0.7]]) {
      g.moveTo(s.x - ax * R, -(s.y + ay * R)).lineTo(s.x + ax * R, -(s.y - ay * R))
        .stroke({ width: 3.5 * k + 0.6, color: s.color, alpha: k });
    }
    g.circle(s.x, -s.y, 5 * k + 1).fill({ color: 0xffffff, alpha: k });
    return true;
  });

  // linhas de velocidade
  fx.lines = fx.lines.filter((l) => {
    l.life -= dt;
    if (l.life <= 0) return false;
    l.x += l.dir * l.v * dt;
    const k = l.life / l.maxLife;
    g.moveTo(l.x, -l.y).lineTo(l.x - l.dir * l.len, -l.y)
      .stroke({ width: l.w * k, color: 0xffffff, alpha: k * 0.7, cap: 'round' });
    return true;
  });
  fx.parts = fx.parts.filter((p) => {
    p.life -= dt;
    if (p.life <= 0) return false;
    p.vy -= 1500 * dt;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    if (p.y < 2) { p.y = 2; p.vy *= -0.25; p.vx *= 0.6; }
    const alpha = Math.min(1, (p.life / p.maxLife) * 1.6);
    g.circle(p.x, -p.y, p.r).fill({ color: p.color, alpha });
    return true;
  });
}
