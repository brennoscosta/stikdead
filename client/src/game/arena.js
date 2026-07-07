// STIKDEAD :: arenas (Dojo, Templo, Prisão) + efeitos (sangue, faíscas, tremor)
import { Container, Graphics } from 'pixi.js';

export const WORLD = { left: -450, right: 450, width: 900, skyH: 420 };

export const ARENAS = {
  dojo: { label: 'Dojo', desc: 'Tradição e disciplina.' },
  temple: { label: 'Templo', desc: 'Equilíbrio e poder espiritual.' },
  prison: { label: 'Prisão', desc: 'Sem regras. Sem piedade.' },
  neve: { label: 'Neve', desc: 'Frio que morde antes do golpe.' },
  deserto: { label: 'Deserto', desc: 'Só os fortes atravessam.' },
  praia: { label: 'Praia', desc: 'Maré vermelha ao luar.' },
  cidade_rio: { label: 'Cidade do Rio', desc: 'A cidade viva assiste da outra margem.' },
};
export const ARENA_KEYS = Object.keys(ARENAS);

export function buildArena(theme = 'dojo') {
  if (theme === 'temple') return buildTemple();
  if (theme === 'prison') return buildPrison();
  if (theme === 'cidade_rio') return buildCidadeRio();
  return buildDojo();
}

// ===== CIDADE DO RIO — cena VIVA (animada por tick) =====
function buildCidadeRio() {
  const c = new Container();
  const L = WORLD.left - 240, R = WORLD.right + 240, W = R - L;
  const SKY = -WORLD.skyH;

  // céu golden hour (faixas)
  const sky = new Graphics();
  const bands = [0xffe9b8, 0xffd894, 0xf8bd7a, 0xe89a6a];
  bands.forEach((col, i) => {
    sky.rect(L, SKY + (i * WORLD.skyH) / 6, W, WORLD.skyH / 6 + 2).fill(col);
  });
  sky.rect(L, SKY + (4 * WORLD.skyH) / 6, W, (2 * WORLD.skyH) / 6).fill(0xd98a60);
  // sol baixo com halo
  sky.circle(180, SKY + 118, 56).fill({ color: 0xfff3cf, alpha: 0.9 });
  sky.circle(180, SKY + 118, 34).fill(0xfffbe8);
  c.addChild(sky);

  // nuvens à deriva
  const clouds = [];
  for (let i = 0; i < 4; i++) {
    const cl = new Graphics();
    cl.ellipse(0, 0, 70 + i * 18, 16 + i * 3).fill({ color: 0xfff6e0, alpha: 0.55 });
    cl.ellipse(40, -8, 44, 12).fill({ color: 0xfff6e0, alpha: 0.45 });
    cl.x = L + (i * 0.27 + 0.1) * W;
    cl.y = SKY + 60 + i * 34;
    clouds.push(cl);
    c.addChild(cl);
  }

  // cidade na outra margem — clara, viva, detalhada
  const cityY = -196; // linha de base dos prédios
  const city = new Graphics();
  const windows = []; // {x, y, w, h, phase}
  let x = L + 10;
  let bi = 0;
  const palette = [0xf3d9b0, 0xeac393, 0xf7e3c2, 0xdfb489, 0xf0cd9e];
  while (x < R - 10) {
    const bw = 54 + ((bi * 37) % 60);
    const bh = 90 + ((bi * 53) % 150);
    const col = palette[bi % palette.length];
    city.rect(x, cityY - bh, bw, bh).fill(col);
    city.rect(x, cityY - bh, bw, 6).fill({ color: 0x8a5a3a, alpha: 0.5 }); // cornija
    // janelas (algumas piscam à noceite dourada)
    for (let wy = cityY - bh + 14; wy < cityY - 14; wy += 22) {
      for (let wx = x + 8; wx < x + bw - 12; wx += 16) {
        windows.push({ x: wx, y: wy, w: 8, h: 11, phase: (wx * 7 + wy * 13) % 100 });
      }
    }
    // telhado d'água ou antena de vez em quando
    if (bi % 3 === 0) city.rect(x + bw / 2 - 2, cityY - bh - 16, 4, 16).fill(0x7a4a30);
    x += bw + 8;
    bi++;
  }
  c.addChild(city);
  const winG = new Graphics();
  c.addChild(winG);

  // pássaros
  const birds = [];
  for (let i = 0; i < 3; i++) birds.push({ x: L + i * 300, y: SKY + 150 + i * 40, s: 0.6 + i * 0.25 });
  const birdG = new Graphics();
  c.addChild(birdG);

  // RIO — faixa entre a cidade e a grama, com correnteza animada
  const riverTop = cityY, riverBot = -44;
  const riverBase = new Graphics();
  riverBase.rect(L, riverTop, W, riverBot - riverTop).fill(0x7fb4c9);
  riverBase.rect(L, riverTop, W, 26).fill({ color: 0xf2d5a8, alpha: 0.55 }); // reflexo quente da cidade
  c.addChild(riverBase);
  const waterG = new Graphics();
  c.addChild(waterG);

  // margem de GRAMA (o palco da luta)
  const grass = new Graphics();
  grass.rect(L, riverBot, W, 30).fill(0x8a9a4e);       // barranco
  grass.rect(L, riverBot + 22, W, 400).fill(0x9db35a); // gramado
  grass.rect(L, riverBot + 22, W, 8).fill({ color: 0xc7d689, alpha: 0.8 });
  c.addChild(grass);
  const bladesG = new Graphics(); // lâminas de capim balançando
  c.addChild(bladesG);
  const blades = [];
  for (let i = 0; i < 60; i++) {
    blades.push({ x: L + (i / 60) * W + ((i * 31) % 13), y: riverBot + 26 + ((i * 17) % 46), h: 8 + ((i * 7) % 9), ph: (i * 0.61) % 6.28 });
  }

  // ===== o pulso da cena =====
  let t = 0;
  c.tick = (dtMs) => {
    t += dtMs / 1000;
    // nuvens à deriva (loop)
    for (let i = 0; i < clouds.length; i++) {
      clouds[i].x += (4 + i * 2) * (dtMs / 1000);
      if (clouds[i].x > R + 90) clouds[i].x = L - 90;
    }
    // janelas piscando (cidade viva)
    winG.clear();
    for (const w of windows) {
      const on = Math.sin(t * 0.7 + w.phase) > (w.phase % 2 === 0 ? 0.2 : 0.75);
      if (on) winG.rect(w.x, w.y, w.w, w.h).fill({ color: 0xffd76a, alpha: 0.9 });
      else winG.rect(w.x, w.y, w.w, w.h).fill({ color: 0x6a4a35, alpha: 0.5 });
    }
    // pássaros cruzando
    birdG.clear();
    for (const b of birds) {
      b.x += 34 * b.s * (dtMs / 1000);
      if (b.x > R + 40) { b.x = L - 40; b.y = SKY + 120 + Math.random() * 90; }
      const flap = Math.sin(t * 9 + b.x * 0.05) * 4;
      birdG.moveTo(b.x - 7, b.y - flap).lineTo(b.x, b.y).lineTo(b.x + 7, b.y - flap).stroke({ width: 2, color: 0x5a3a2a });
    }
    // ÁGUA CORRENTE: ondulações deslizando + brilhos
    waterG.clear();
    const rh = riverBot - riverTop;
    for (let li = 0; li < 9; li++) {
      const y = riverTop + 8 + (li / 9) * (rh - 14);
      const speed = 26 + li * 7;                 // mais perto = mais rápido (paralaxe)
      const dash = 34 + li * 6, gap = 26 + li * 4;
      const off = (t * speed) % (dash + gap);
      for (let px = L - dash + off; px < R; px += dash + gap) {
        const bob = Math.sin(t * 2 + li * 1.7 + px * 0.02) * 1.6;
        waterG.moveTo(px, y + bob).lineTo(px + dash * 0.62, y + bob)
          .stroke({ width: 2, color: li % 3 === 0 ? 0xeef7f2 : 0xa8d4e2, alpha: 0.5 + (li % 3) * 0.14 });
      }
    }
    // faíscas de sol na água
    for (let si = 0; si < 12; si++) {
      const sx = L + ((si * 173 + t * 40) % W);
      const sy = riverTop + 14 + ((si * 97) % (rh - 20));
      const a = (Math.sin(t * 3 + si * 2.4) + 1) / 2;
      if (a > 0.62) waterG.circle(sx, sy, 1.6).fill({ color: 0xfff6d8, alpha: a });
    }
    // capim balançando na brisa
    bladesG.clear();
    for (const bl of blades) {
      const sway = Math.sin(t * 1.6 + bl.ph) * 2.6;
      bladesG.moveTo(bl.x, bl.y).lineTo(bl.x + sway, bl.y - bl.h).stroke({ width: 1.6, color: 0x7e9440, alpha: 0.85 });
    }
  };

  return c;
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
