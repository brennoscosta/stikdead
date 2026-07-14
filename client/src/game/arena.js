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
  cemiterio: { label: 'Cemitério', desc: 'Os mortos não descansam — assistem.' },
};
export const ARENA_KEYS = Object.keys(ARENAS);

export function buildArena(theme = 'dojo') {
  if (theme === 'temple') return buildTemploVivo();
  if (theme === 'prison') return buildPrisaoViva();
  if (theme === 'cidade_rio') return buildCidadeRio();
  if (theme === 'neve') return buildNeveViva();
  if (theme === 'deserto') return buildDesertoVivo();
  if (theme === 'praia') return buildPraiaViva();
  if (theme === 'cemiterio') return buildCemiterio();
  return buildDojoVivo();
}

// ===== utilidades das cenas vivas =====
function vSky(g, L, W, SKY, H, cols) {
  const n = cols.length;
  cols.forEach((col, i) => g.rect(L, SKY + (i * H) / n, W, H / n + 2).fill(col));
}
function vClouds(c, L, R, SKY, n, alpha = 0.6) {
  const arr = [];
  for (let i = 0; i < n; i++) {
    const cl = new Graphics();
    cl.ellipse(0, 0, 60 + i * 16, 14 + i * 3).fill({ color: 0xffffff, alpha });
    cl.ellipse(36, -7, 40, 11).fill({ color: 0xffffff, alpha: alpha * 0.8 });
    cl.x = L + ((i + 0.3) / n) * (R - L);
    cl.y = SKY + 46 + i * 30;
    arr.push(cl);
    c.addChild(cl);
  }
  return arr;
}
function vDrift(clouds, dt, L, R, base = 5) {
  for (let i = 0; i < clouds.length; i++) {
    clouds[i].x += (base + i * 1.6) * (dt / 1000);
    if (clouds[i].x > R + 90) clouds[i].x = L - 90;
  }
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
  return { layer, parts: [], rings: [], lines: [], sparks: [], splats: [], embers: [], radial: [], shake: 0, shakeDir: 0, flash: 0, flashRed: 0, kick: 0, focusX: 0, focusK: 0 };
}

export function fxHit(fx, x, y, dir, { blocked, heavy }) {
  if (blocked) {
    // bloqueio: faíscas METÁLICAS estalando (aço no aço)
    for (let i = 0; i < 8; i++) spawn(fx, x, y, dir, 0xffffff, 180, 0.25);
    for (let i = 0; i < 12; i++) ember(fx, x, y, dir, 0xffd77a, 520);
    fx.sparks.push({ x, y, life: 0.16, maxLife: 0.16, size: 16, color: 0x9fd8ff });
    fx.rings.push({ x, y, r: 6, vr: 260, life: 0.22, maxLife: 0.22, color: 0x9fd8ff, w: 3 });
    fx.shake = Math.max(fx.shake, 4.5);
    fx.shakeDir = dir;
    return;
  }
  // sangue: gotas alongadas na direção do golpe (metade vira mancha no chão)
  const n = heavy ? 34 : 16;
  for (let i = 0; i < n; i++) spawn(fx, x, y, dir, 0xb0031f, heavy ? 460 : 300, heavy ? 0.75 : 0.5, true);
  for (let i = 0; i < (heavy ? 10 : 5); i++) ember(fx, x, y, dir, 0xffffff, heavy ? 700 : 480);
  if (heavy) fx.radial.push({ x, y, life: 0.18, maxLife: 0.18, n: 10, r0: 34, r1: 96 });
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
  fx.kick = Math.max(fx.kick, heavy ? 0.09 : 0.035);
  fx.shake = Math.max(fx.shake, heavy ? 14 : 6);
  fx.shakeDir = dir;
  // punch-in: a câmera mergulha no ponto do impacto
  fx.focusX = x;
  fx.focusK = Math.max(fx.focusK, heavy ? 0.22 : 0.1);
}

export function fxKo(fx, x, y, dir) {
  fx.sparks.push({ x, y, life: 0.35, maxLife: 0.35, size: 60, color: 0xffffff });
  fx.rings.push({ x, y, r: 10, vr: 900, life: 0.5, maxLife: 0.5, color: 0xff2244, w: 7 });
  fx.rings.push({ x, y, r: 4, vr: 500, life: 0.42, maxLife: 0.42, color: 0xffffff, w: 3 });
  fx.radial.push({ x, y, life: 0.38, maxLife: 0.38, n: 18, r0: 44, r1: 150 }); // explosão radial anime
  fx.flashRed = 0.4;
  fx.kick = Math.max(fx.kick, 0.16);
  fx.focusX = x;
  fx.focusK = 0.45; // a câmera crava no nocaute (a sim já entra em slow-mo)
  for (let i = 0; i < 60; i++) spawn(fx, x, y, dir, 0xb0031f, 620, 1.2, true);
  for (let i = 0; i < 14; i++) ember(fx, x, y, dir, 0xffffff, 800);
  fx.shake = 22;
  fx.shakeDir = dir;
  fx.flash = 0.12;
}

export function fxDash(fx, x) {
  for (let i = 0; i < 6; i++) spawn(fx, x, 8, 0, 0x999080, 120, 0.3);
}

function spawn(fx, x, y, dir, color, power, life, drop = false) {
  const a = Math.random() * Math.PI - Math.PI / 2;
  const sp = power * (0.35 + Math.random() * 0.65);
  fx.parts.push({
    x, y,
    vx: Math.cos(a) * sp * (dir || (Math.random() < 0.5 ? -1 : 1)),
    vy: Math.abs(Math.sin(a)) * sp * 0.9 + 60,
    r: 2 + Math.random() * (power > 400 ? 4.5 : 3),
    color, life, maxLife: life, drop,
  });
}

// faísca-risco: um traço quente e rápido (metal, brasas do impacto)
function ember(fx, x, y, dir, color, power) {
  const a = Math.random() * Math.PI * 2;
  const sp = power * (0.4 + Math.random() * 0.6);
  fx.embers.push({
    x, y,
    vx: Math.cos(a) * sp + (dir || 0) * power * 0.3,
    vy: Math.sin(a) * sp * 0.6 + 120,
    life: 0.22 + Math.random() * 0.14, maxLife: 0.36, color,
  });
}

export function fxStep(fx, dt) {
  fx.shake = Math.max(0, fx.shake - dt * 34);
  fx.shakeDir *= Math.max(0, 1 - dt * 8);
  fx.flash = Math.max(0, fx.flash - dt);
  fx.flashRed = Math.max(0, fx.flashRed - dt * 1.6);
  fx.kick = Math.max(0, fx.kick - dt * 0.5);
  fx.focusK = Math.max(0, fx.focusK - dt * 0.45);
  const g = fx.layer;
  g.clear();

  // manchas de sangue GRUDADAS no chão (memória da luta, esvaindo devagar)
  fx.splats = fx.splats.filter((sp) => {
    sp.life -= dt;
    if (sp.life <= 0) return false;
    const k = Math.min(1, sp.life / sp.maxLife * 1.6);
    g.ellipse(sp.x, -1.5, sp.r * 1.7, sp.r * 0.4).fill({ color: 0x7d0217, alpha: 0.5 * k });
    return true;
  });

  // explosão radial (linhas de impacto estilo anime)
  fx.radial = fx.radial.filter((r) => {
    r.life -= dt;
    if (r.life <= 0) return false;
    const k = r.life / r.maxLife;
    const grow = 1 + (1 - k) * 0.6;
    for (let i = 0; i < r.n; i++) {
      const a = (i / r.n) * Math.PI * 2 + (i % 2) * 0.13;
      const c = Math.cos(a), sn = Math.sin(a);
      g.moveTo(r.x + c * r.r0 * grow, -(r.y + sn * r.r0 * grow))
        .lineTo(r.x + c * r.r1 * grow, -(r.y + sn * r.r1 * grow))
        .stroke({ width: 3.5 * k + 0.5, color: 0xffffff, alpha: k * 0.85, cap: 'round' });
    }
    return true;
  });

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
  // brasas/faíscas-risco
  fx.embers = fx.embers.filter((e) => {
    e.life -= dt;
    if (e.life <= 0) return false;
    e.vy -= 1100 * dt;
    e.x += e.vx * dt;
    e.y += e.vy * dt;
    const k = e.life / e.maxLife;
    g.moveTo(e.x, -e.y).lineTo(e.x - e.vx * 0.028, -(e.y - e.vy * 0.028))
      .stroke({ width: 1.8 * k + 0.4, color: e.color, alpha: Math.min(1, k * 1.4), cap: 'round' });
    return true;
  });

  fx.parts = fx.parts.filter((p) => {
    p.life -= dt;
    if (p.life <= 0) return false;
    p.vy -= 1500 * dt;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    if (p.y < 2) {
      // sangue tocou o chão: parte vira mancha permanente
      if (p.drop && p.vy < -60 && fx.splats.length < 36 && Math.random() < 0.55) {
        fx.splats.push({ x: p.x, r: p.r * 2 + 2, life: 6, maxLife: 6 });
      }
      p.y = 2; p.vy *= -0.25; p.vx *= 0.6;
    }
    const alpha = Math.min(1, (p.life / p.maxLife) * 1.6);
    if (p.drop) {
      // gota alongada pela velocidade (leitura de respingo, não bolinha)
      const vx = p.vx * 0.016, vy = p.vy * 0.016;
      g.moveTo(p.x - vx, -(p.y - vy)).lineTo(p.x + vx * 0.4, -(p.y + vy * 0.4))
        .stroke({ width: p.r * 1.5, color: p.color, alpha, cap: 'round' });
    } else {
      g.circle(p.x, -p.y, p.r).fill({ color: p.color, alpha });
    }
    return true;
  });
}


// ===== DOJO VIVO — manhã de treino: pétalas, incenso e poeira na luz =====
function buildDojoVivo() {
  const c = new Container();
  const L = WORLD.left - 240, R = WORLD.right + 240, W = R - L, SKY = -WORLD.skyH;
  const g = new Graphics();
  g.rect(L, SKY, W, WORLD.skyH).fill(0xf4ecd8);                       // parede de papel clara
  for (let px = L; px < R; px += 130) g.rect(px, SKY, 6, WORLD.skyH).fill(0xc9b98f); // ripas
  g.rect(L, SKY, W, 40).fill({ color: 0x8a6a3a, alpha: 0.25 });
  // janelão shoji com dia lá fora
  g.rect(-140, -360, 280, 210).fill(0xcfe8f5).stroke({ width: 8, color: 0x6a5230 });
  g.moveTo(0, -360).lineTo(0, -150).stroke({ width: 5, color: 0x6a5230 });
  g.moveTo(-140, -255).lineTo(140, -255).stroke({ width: 5, color: 0x6a5230 });
  g.circle(70, -320, 22).fill({ color: 0xfff3c0, alpha: 0.9 });        // sol pela janela
  // piso de tábuas quentes
  g.rect(L, -44, W, 30).fill(0xa8834f);
  g.rect(L, -22, W, 420).fill(0xbf9a5f);
  for (let px = L; px < R; px += 90) g.rect(px, -22, 3, 420).fill({ color: 0x8a6a3a, alpha: 0.4 });
  c.addChild(g);
  const dyn = new Graphics(); c.addChild(dyn);
  // lanterna pendurada
  const lant = new Graphics();
  lant.moveTo(0, 0).lineTo(0, 36).stroke({ width: 3, color: 0x3a2a1a });
  lant.roundRect(-16, 36, 32, 42, 8).fill(0xe86a4a).stroke({ width: 3, color: 0x3a2a1a });
  lant.rect(-9, 46, 18, 22).fill({ color: 0xffe9a8, alpha: 0.95 });
  lant.x = 300; lant.y = SKY + 6; lant.pivot.set(0, 0);
  c.addChild(lant);
  const pet = []; for (let i = 0; i < 16; i++) pet.push({ x: L + Math.random() * W, y: SKY + Math.random() * 380, vx: 14 + Math.random() * 12, ph: Math.random() * 6.28 });
  const motes = []; for (let i = 0; i < 14; i++) motes.push({ x: -120 + Math.random() * 240, y: -350 + Math.random() * 300, ph: Math.random() * 6.28 });
  let t = 0;
  c.tick = (dt) => {
    t += dt / 1000;
    lant.rotation = Math.sin(t * 1.1) * 0.08;
    dyn.clear();
    // incenso: fumaça serpenteando
    for (let i = 0; i < 26; i++) {
      const yy = -60 - i * 9;
      dyn.circle(-350 + Math.sin(t * 1.4 + i * 0.5) * (4 + i * 0.8), yy, 2 + i * 0.16).fill({ color: 0xffffff, alpha: 0.30 - i * 0.01 });
    }
    dyn.rect(-354, -58, 8, 14).fill(0x4a3a2a);
    // pétalas de cerejeira atravessando
    for (const p of pet) {
      p.x += p.vx * (dt / 1000); p.ph += dt / 400;
      if (p.x > R + 10) { p.x = L - 10; p.y = SKY + Math.random() * 380; }
      const py = p.y + Math.sin(p.ph) * 8;
      dyn.ellipse(p.x, py, 4, 2.4).fill({ color: 0xffc4d0, alpha: 0.9 });
    }
    // poeira dançando no feixe da janela
    for (const m of motes) {
      const a = (Math.sin(t * 1.2 + m.ph) + 1) / 2;
      dyn.circle(m.x + Math.sin(t * 0.6 + m.ph) * 6, m.y + Math.cos(t * 0.5 + m.ph) * 5, 1.3).fill({ color: 0xfff3c0, alpha: 0.25 + a * 0.3 });
    }
  };
  return c;
}

// ===== TEMPLO VIVO — montanha clara: bandeiras de oração e folhas =====
function buildTemploVivo() {
  const c = new Container();
  const L = WORLD.left - 240, R = WORLD.right + 240, W = R - L, SKY = -WORLD.skyH;
  const g = new Graphics();
  vSky(g, L, W, SKY, WORLD.skyH, [0xbfe3f2, 0xcdeaf3, 0xdff1ef, 0xeef6e8]);
  g.circle(-260, SKY + 96, 44).fill({ color: 0xfffbe0, alpha: 0.95 });
  // montanhas
  g.moveTo(L, -200).lineTo(L + W * 0.22, SKY + 150).lineTo(L + W * 0.45, -200).closePath().fill({ color: 0x9db8c9, alpha: 0.8 });
  g.moveTo(L + W * 0.35, -200).lineTo(L + W * 0.62, SKY + 110).lineTo(L + W * 0.9, -200).closePath().fill({ color: 0x87a6ba, alpha: 0.9 });
  g.moveTo(L + W * 0.52, SKY + 128).lineTo(L + W * 0.62, SKY + 110).lineTo(L + W * 0.72, SKY + 128).closePath().fill(0xffffff);
  // torii vermelho ao fundo
  g.rect(-210, -330, 18, 140).fill(0xd0483a); g.rect(192, -330, 18, 140).fill(0xd0483a);
  g.rect(-240, -344, 480, 20).fill(0xd0483a); g.rect(-224, -312, 448, 12).fill(0xb83a2e);
  // plataforma de pedra
  g.rect(L, -44, W, 30).fill(0xb9c2bb);
  g.rect(L, -22, W, 420).fill(0xcfd6cd);
  for (let px = L; px < R; px += 110) g.rect(px, -22, 2, 420).fill({ color: 0x8a958c, alpha: 0.5 });
  c.addChild(g);
  const clouds = vClouds(c, L, R, SKY, 4, 0.75);
  const dyn = new Graphics(); c.addChild(dyn);
  const FLAG_COLS = [0x5aa9e6, 0xf2c14e, 0xe4572e, 0x76b041, 0xf5f0e1];
  const leaves = []; for (let i = 0; i < 12; i++) leaves.push({ x: L + Math.random() * W, y: SKY + 120 + Math.random() * 300, vx: 18 + Math.random() * 14, ph: Math.random() * 6.28 });
  let t = 0;
  c.tick = (dt) => {
    t += dt / 1000;
    vDrift(clouds, dt, L, R, 4);
    dyn.clear();
    // varais de bandeiras de oração ondulando
    for (const [x1, y1, x2, y2] of [[-420, -300, -40, -350], [40, -350, 420, -290]]) {
      dyn.moveTo(x1, y1).lineTo(x2, y2).stroke({ width: 2, color: 0x5a4a3a });
      for (let i = 0; i < 9; i++) {
        const fx = x1 + ((x2 - x1) * i) / 9, fy = y1 + ((y2 - y1) * i) / 9;
        const wob = Math.sin(t * 3 + i * 0.9) * 5;
        dyn.moveTo(fx, fy).lineTo(fx + 9 + wob * 0.4, fy + 14 + wob).lineTo(fx + 20, fy).closePath().fill({ color: FLAG_COLS[i % 5], alpha: 0.95 });
      }
    }
    // folhas voando
    for (const lf of leaves) {
      lf.x += lf.vx * (dt / 1000); lf.ph += dt / 350;
      if (lf.x > R + 10) { lf.x = L - 10; lf.y = SKY + 120 + Math.random() * 300; }
      dyn.ellipse(lf.x, lf.y + Math.sin(lf.ph) * 10, 4, 2).fill({ color: 0x8fbf5a, alpha: 0.9 });
    }
  };
  return c;
}

// ===== PRISÃO CLARA — pátio ao meio-dia: correntes, pombos e arame =====
function buildPrisaoViva() {
  const c = new Container();
  const L = WORLD.left - 240, R = WORLD.right + 240, W = R - L, SKY = -WORLD.skyH;
  const g = new Graphics();
  vSky(g, L, W, SKY, WORLD.skyH * 0.45, [0xcfe6f2, 0xdcedf5]);
  // muro alto de concreto claro
  g.rect(L, SKY + WORLD.skyH * 0.42, W, WORLD.skyH * 0.58).fill(0xd7d2c8);
  for (let px = L; px < R; px += 150) g.rect(px, SKY + WORLD.skyH * 0.42, 3, WORLD.skyH * 0.58).fill({ color: 0x9a948a, alpha: 0.5 });
  g.rect(L, -160, W, 8).fill({ color: 0x9a948a, alpha: 0.6 });
  // torre de vigia
  g.rect(-330, SKY + 60, 90, 150).fill(0xc9c4ba).stroke({ width: 4, color: 0x8a857b });
  g.rect(-318, SKY + 80, 66, 40).fill(0x9fc4d8);
  g.rect(-345, SKY + 40, 120, 22).fill(0x8a857b);
  // janelas gradeadas
  for (const wx of [-100, 120, 300]) {
    g.rect(wx, -300, 80, 90).fill(0xb8c9d4).stroke({ width: 5, color: 0x6a655b });
    for (let bx = wx + 14; bx < wx + 76; bx += 16) g.rect(bx, -300, 4, 90).fill(0x6a655b);
  }
  // pátio de concreto
  g.rect(L, -44, W, 30).fill(0xa8a49a);
  g.rect(L, -22, W, 420).fill(0xbcb8ae);
  g.moveTo(L + 60, 60).lineTo(L + 260, 140).stroke({ width: 2, color: 0x8a857b });
  c.addChild(g);
  const dyn = new Graphics(); c.addChild(dyn);
  const pombos = [{ x: -40, y: -168, hop: 0 }, { x: 210, y: -168, hop: 2.4 }];
  let t = 0;
  c.tick = (dt) => {
    t += dt / 1000;
    dyn.clear();
    // arame farpado ondulando de leve no vento
    for (let px = L; px < R; px += 26) {
      const wob = Math.sin(t * 2 + px * 0.05) * 1.6;
      dyn.circle(px, -172 + wob, 7).stroke({ width: 2, color: 0x6a655b });
    }
    // corrente pendurada balançando
    const sw = Math.sin(t * 1.3) * 10;
    for (let i = 0; i < 9; i++) dyn.circle(340 + sw * (i / 9), -300 + i * 13, 4).stroke({ width: 2.5, color: 0x7a756b });
    // pombos do pátio: pulinhos e voo ocasional
    for (const p of pombos) {
      p.hop += dt / 1000;
      const jump = Math.abs(Math.sin(p.hop * 3)) * 4;
      p.x += Math.sin(p.hop * 0.6) * 0.3;
      dyn.ellipse(p.x, p.y - jump, 7, 5).fill(0x9aa3ad);
      dyn.circle(p.x + 6, p.y - jump - 3, 3).fill(0x9aa3ad);
    }
    // poeira quente subindo
    for (let i = 0; i < 8; i++) {
      const a = (Math.sin(t * 1.5 + i * 2.1) + 1) / 2;
      dyn.circle(L + ((i * 211 + t * 12) % W), -30 - a * 26, 1.6).fill({ color: 0xd7d2c8, alpha: 0.3 * a });
    }
  };
  return c;
}

// ===== NEVE VIVA — dia claro de inverno: nevasca mansa e chaminé =====
function buildNeveViva() {
  const c = new Container();
  const L = WORLD.left - 240, R = WORLD.right + 240, W = R - L, SKY = -WORLD.skyH;
  const g = new Graphics();
  vSky(g, L, W, SKY, WORLD.skyH, [0xd8ecf7, 0xe2f0f8, 0xecf5fa, 0xf4f9fc]);
  g.circle(220, SKY + 90, 40).fill({ color: 0xfffef2, alpha: 0.95 });
  // pinheiros nevados
  for (const [px, sc] of [[-380, 1], [-300, 0.7], [330, 0.9], [410, 0.65]]) {
    for (let i = 0; i < 3; i++) {
      const wdt = (70 - i * 16) * sc, y0 = -120 - i * 42 * sc;
      g.moveTo(px - wdt, y0).lineTo(px, y0 - 60 * sc).lineTo(px + wdt, y0).closePath().fill(0x4a7a5a);
      g.moveTo(px - wdt * 0.8, y0 - 6).lineTo(px, y0 - 50 * sc).lineTo(px + wdt * 0.8, y0 - 6).closePath().fill({ color: 0xffffff, alpha: 0.85 });
    }
  }
  // cabana com chaminé
  g.rect(-80, -240, 190, 120).fill(0x8a5a3a).stroke({ width: 4, color: 0x5a3a24 });
  g.moveTo(-100, -240).lineTo(15, -310).lineTo(130, -240).closePath().fill(0xf4f9fc).stroke({ width: 4, color: 0x5a3a24 });
  g.rect(60, -300, 22, 50).fill(0x6a4a34);
  g.rect(-40, -210, 40, 40).fill({ color: 0xffe9a8, alpha: 0.95 }).stroke({ width: 4, color: 0x5a3a24 });
  // manto de neve
  g.rect(L, -44, W, 30).fill(0xe8f2f8);
  g.rect(L, -22, W, 420).fill(0xf6fafd);
  c.addChild(g);
  const dyn = new Graphics(); c.addChild(dyn);
  const flakes = []; for (let i = 0; i < 60; i++) flakes.push({ x: L + Math.random() * W, y: SKY + Math.random() * (WORLD.skyH + 100), v: 18 + Math.random() * 26, ph: Math.random() * 6.28, r: 1.2 + Math.random() * 1.8 });
  let t = 0;
  c.tick = (dt) => {
    t += dt / 1000;
    dyn.clear();
    // fumaça da chaminé
    for (let i = 0; i < 10; i++) {
      const yy = -310 - i * 14;
      dyn.circle(71 + Math.sin(t * 1.1 + i * 0.7) * (3 + i), yy, 4 + i * 0.9).fill({ color: 0xffffff, alpha: 0.35 - i * 0.028 });
    }
    // nevasca mansa com vento
    const wind = Math.sin(t * 0.4) * 14;
    for (const f of flakes) {
      f.y += f.v * (dt / 1000); f.ph += dt / 600;
      f.x += (wind + Math.sin(f.ph) * 8) * (dt / 1000);
      if (f.y > 40) { f.y = SKY - 10; f.x = L + Math.random() * W; }
      if (f.x > R) f.x = L; if (f.x < L) f.x = R;
      dyn.circle(f.x, f.y, f.r).fill({ color: 0xffffff, alpha: 0.9 });
    }
    // brilhos no manto
    for (let i = 0; i < 10; i++) {
      const a = (Math.sin(t * 2.4 + i * 2.7) + 1) / 2;
      if (a > 0.7) dyn.circle(L + ((i * 197) % W), -10 + ((i * 53) % 60), 1.4).fill({ color: 0xdff3ff, alpha: a });
    }
  };
  return c;
}

// ===== DESERTO VIVO — sol a pino: miragem, urubus e a bola de feno =====
function buildDesertoVivo() {
  const c = new Container();
  const L = WORLD.left - 240, R = WORLD.right + 240, W = R - L, SKY = -WORLD.skyH;
  const g = new Graphics();
  vSky(g, L, W, SKY, WORLD.skyH, [0xffe9b0, 0xffdf9a, 0xfad489, 0xf2c377]);
  g.circle(0, SKY + 92, 52).fill(0xfff6d0); g.circle(0, SKY + 92, 74).fill({ color: 0xfff6d0, alpha: 0.35 });
  // dunas em camadas
  g.moveTo(L, -150).quadraticCurveTo(L + W * 0.3, -220, L + W * 0.6, -150).quadraticCurveTo(L + W * 0.8, -110, R, -150).lineTo(R, -100).lineTo(L, -100).closePath().fill(0xe8b56a);
  g.moveTo(L, -110).quadraticCurveTo(L + W * 0.45, -60, R, -120).lineTo(R, -40).lineTo(L, -40).closePath().fill(0xdca55c);
  // cactos
  for (const cx of [-340, 360]) {
    g.roundRect(cx - 8, -190, 16, 90, 8).fill(0x6a8a4a);
    g.roundRect(cx - 34, -170, 12, 40, 6).fill(0x6a8a4a); g.roundRect(cx - 34, -140, 30, 12, 6).fill(0x6a8a4a);
    g.roundRect(cx + 22, -160, 12, 34, 6).fill(0x6a8a4a); g.roundRect(cx + 6, -136, 28, 12, 6).fill(0x6a8a4a);
  }
  // areia do palco
  g.rect(L, -44, W, 30).fill(0xd9a95e);
  g.rect(L, -22, W, 420).fill(0xe6bd74);
  c.addChild(g);
  const dyn = new Graphics(); c.addChild(dyn);
  const vults = [{ a: 0, r: 90, cx: -180, cy: SKY + 150 }, { a: 2.4, r: 60, cx: 220, cy: SKY + 190 }];
  let tw = { x: L - 30, spin: 0 };
  let t = 0;
  c.tick = (dt) => {
    t += dt / 1000;
    dyn.clear();
    // miragem: calor tremendo no horizonte
    for (let i = 0; i < 5; i++) {
      const y = -104 + i * 5;
      dyn.moveTo(L, y);
      for (let px = L; px <= R; px += 40) dyn.lineTo(px, y + Math.sin(t * 4 + px * 0.06 + i) * 2.2);
      dyn.stroke({ width: 2, color: 0xfff0c8, alpha: 0.22 });
    }
    // urubus circulando
    for (const v of vults) {
      v.a += dt / 1600;
      const vx = v.cx + Math.cos(v.a) * v.r, vy = v.cy + Math.sin(v.a) * v.r * 0.35;
      const flap = Math.sin(t * 7 + v.a) * 3;
      dyn.moveTo(vx - 8, vy - flap).lineTo(vx, vy).lineTo(vx + 8, vy - flap).stroke({ width: 2.4, color: 0x5a4a3a });
    }
    // bola de feno rolando (a estrela do faroeste)
    tw.x += 46 * (dt / 1000); tw.spin += dt / 220;
    if (tw.x > R + 40) tw.x = L - 40;
    const ty = -30 - Math.abs(Math.sin(tw.spin * 1.4)) * 9;
    dyn.circle(tw.x, ty, 13).stroke({ width: 2, color: 0x9a7a4a });
    for (let i = 0; i < 5; i++) {
      const aa = tw.spin + (i * 6.28) / 5;
      dyn.moveTo(tw.x - Math.cos(aa) * 12, ty - Math.sin(aa) * 12).lineTo(tw.x + Math.cos(aa) * 12, ty + Math.sin(aa) * 12).stroke({ width: 1.5, color: 0x9a7a4a, alpha: 0.8 });
    }
    // areia levantando
    for (let i = 0; i < 8; i++) {
      const sx = L + ((i * 223 + t * 60) % W);
      dyn.circle(sx, -26 - ((i * 13) % 10), 1.4).fill({ color: 0xf2d9a0, alpha: 0.5 });
    }
  };
  return c;
}

// ===== PRAIA VIVA — dia aberto: ondas rolando, coqueiro e gaivotas =====
function buildPraiaViva() {
  const c = new Container();
  const L = WORLD.left - 240, R = WORLD.right + 240, W = R - L, SKY = -WORLD.skyH;
  const g = new Graphics();
  vSky(g, L, W, SKY, WORLD.skyH * 0.55, [0x9fd4ef, 0xb5def2, 0xcdeaf5]);
  g.circle(-240, SKY + 84, 42).fill({ color: 0xfff9dc, alpha: 0.95 });
  // mar
  const seaTop = SKY + WORLD.skyH * 0.55, seaBot = -60;
  g.rect(L, seaTop, W, seaBot - seaTop).fill(0x4fa7c9);
  g.rect(L, seaTop, W, 14).fill({ color: 0x8fd0e8, alpha: 0.8 });
  // veleiro longe
  g.moveTo(260, seaTop + 26).lineTo(300, seaTop + 26).lineTo(292, seaTop + 32).lineTo(268, seaTop + 32).closePath().fill(0xffffff);
  g.moveTo(281, seaTop + 26).lineTo(281, seaTop + 4).lineTo(296, seaTop + 22).closePath().fill(0xf4f4f4);
  // areia do palco
  g.rect(L, -44, W, 30).fill(0xf0dca8);
  g.rect(L, -22, W, 420).fill(0xf7e7bb);
  c.addChild(g);
  const clouds = vClouds(c, L, R, SKY, 3, 0.85);
  const dyn = new Graphics(); c.addChild(dyn);
  // coqueiro
  const palm = new Graphics();
  palm.moveTo(0, 0).quadraticCurveTo(18, -70, 8, -140).stroke({ width: 12, color: 0x8a6a3a });
  palm.x = -380; palm.y = -30;
  c.addChild(palm);
  const palmTop = new Graphics(); palmTop.x = -372; palmTop.y = -170; c.addChild(palmTop);
  const gulls = [{ x: L, y: SKY + 120, s: 1 }, { x: L + 300, y: SKY + 170, s: 0.7 }];
  let t = 0;
  c.tick = (dt) => {
    t += dt / 1000;
    vDrift(clouds, dt, L, R, 6);
    dyn.clear();
    // ONDAS: linhas de espuma avançando e recuando
    const swell = Math.sin(t * 0.8);
    for (let li = 0; li < 5; li++) {
      const y = seaTop + 30 + li * ((seaBot - seaTop - 36) / 5) + swell * (2 + li * 1.5);
      dyn.moveTo(L, y);
      for (let px = L; px <= R; px += 34) dyn.lineTo(px, y + Math.sin(t * 2.2 + px * 0.045 + li * 1.3) * 3);
      dyn.stroke({ width: 2.4, color: 0xeafaff, alpha: 0.55 + li * 0.08 });
    }
    // espuma na beira (respiração do mar sobre a areia)
    const edge = seaBot + 6 + swell * 7;
    dyn.moveTo(L, edge);
    for (let px = L; px <= R; px += 26) dyn.lineTo(px, edge + Math.sin(t * 2 + px * 0.08) * 3.4);
    dyn.lineTo(R, seaBot - 8).lineTo(L, seaBot - 8).closePath().fill({ color: 0xffffff, alpha: 0.5 });
    // brilhos de sol no mar
    for (let i = 0; i < 10; i++) {
      const a = (Math.sin(t * 3 + i * 2.2) + 1) / 2;
      if (a > 0.65) dyn.circle(L + ((i * 177 + t * 26) % W), seaTop + 20 + ((i * 71) % (seaBot - seaTop - 30)), 1.6).fill({ color: 0xfff6d0, alpha: a });
    }
    // folhas do coqueiro balançando
    palmTop.clear();
    for (let i = 0; i < 6; i++) {
      const base = (i / 6) * 6.28;
      const sway = Math.sin(t * 1.5 + i) * 0.12;
      const aa = base + sway;
      palmTop.moveTo(0, 0).quadraticCurveTo(Math.cos(aa) * 40, Math.sin(aa) * 26 - 16, Math.cos(aa) * 78, Math.sin(aa) * 44).stroke({ width: 7, color: 0x4a8a4a });
    }
    // gaivotas
    for (const gl of gulls) {
      gl.x += 30 * gl.s * (dt / 1000);
      if (gl.x > R + 30) { gl.x = L - 30; gl.y = SKY + 100 + Math.random() * 100; }
      const flap = Math.sin(t * 8 + gl.x * 0.04) * 4;
      dyn.moveTo(gl.x - 7, gl.y - flap).lineTo(gl.x, gl.y).lineTo(gl.x + 7, gl.y - flap).stroke({ width: 2, color: 0xf4f4f4 });
    }
  };
  return c;
}

// ===== CEMITÉRIO — crepúsculo assombrado: zumbis rastejando entre caveiras =====
function buildCemiterio() {
  const c = new Container();
  const L = WORLD.left - 240, R = WORLD.right + 240, W = R - L, SKY = -WORLD.skyH;
  const g = new Graphics();
  vSky(g, L, W, SKY, WORLD.skyH, [0x2a2440, 0x3a3054, 0x4a3a60, 0x5a4668]);
  // lua enorme com halo
  g.circle(240, SKY + 110, 64).fill({ color: 0xf4ecd0, alpha: 0.28 });
  g.circle(240, SKY + 110, 46).fill(0xf4ecd0);
  g.circle(226, SKY + 96, 8).fill({ color: 0xd8ceac, alpha: 0.7 });
  g.circle(256, SKY + 124, 5).fill({ color: 0xd8ceac, alpha: 0.7 });
  // árvore morta
  g.moveTo(-370, -40).quadraticCurveTo(-360, -170, -390, -260).stroke({ width: 14, color: 0x1a1420 });
  g.moveTo(-378, -190).quadraticCurveTo(-330, -230, -310, -280).stroke({ width: 7, color: 0x1a1420 });
  g.moveTo(-384, -230).quadraticCurveTo(-420, -260, -440, -300).stroke({ width: 6, color: 0x1a1420 });
  // fileira de lápides e cruzes
  const tombs = [-300, -210, -120, 40, 130, 230, 330];
  tombs.forEach((tx, i) => {
    if (i % 3 === 2) {
      g.rect(tx - 4, -150, 8, 70).fill(0x8a8496); g.rect(tx - 20, -132, 40, 8).fill(0x8a8496);
    } else {
      g.roundRect(tx - 22, -128, 44, 58, 10).fill(0x9a94a6).stroke({ width: 3, color: 0x5a5468 });
      g.moveTo(tx - 12, -108).lineTo(tx + 12, -108).stroke({ width: 2, color: 0x6a6478 });
      g.moveTo(tx - 12, -98).lineTo(tx + 8, -98).stroke({ width: 2, color: 0x6a6478 });
    }
  });
  // terra do palco
  g.rect(L, -44, W, 30).fill(0x4a4054);
  g.rect(L, -22, W, 420).fill(0x5a5064);
  // caveiras espalhadas na terra
  for (const [sx, sy] of [[-260, 6], [-40, 26], [180, 12], [340, 30], [80, 48]]) {
    g.circle(sx, sy, 9).fill(0xd8d2c0);
    g.circle(sx - 3.5, sy - 1, 2.4).fill(0x3a3444); g.circle(sx + 3.5, sy - 1, 2.4).fill(0x3a3444);
    g.rect(sx - 5, sy + 5, 10, 4).fill(0xd8d2c0);
    g.moveTo(sx - 4, sy + 6).lineTo(sx - 4, sy + 9).stroke({ width: 1.2, color: 0x3a3444 });
    g.moveTo(sx, sy + 6).lineTo(sx, sy + 9).stroke({ width: 1.2, color: 0x3a3444 });
    g.moveTo(sx + 4, sy + 6).lineTo(sx + 4, sy + 9).stroke({ width: 1.2, color: 0x3a3444 });
  }
  c.addChild(g);
  const dyn = new Graphics(); c.addChild(dyn);
  // zumbis rastejando atrás das lápides
  const zumbis = [
    { x: L - 40, y: -96, v: 9, ph: 0 },
    { x: L - 300, y: -84, v: 6.5, ph: 2.2 },
  ];
  const wisps = []; for (let i = 0; i < 7; i++) wisps.push({ x: L + Math.random() * W, y: -70 - Math.random() * 60, ph: Math.random() * 6.28 });
  const crow = { x: 132, y: -132, fly: 0 };
  let t = 0;
  c.tick = (dt) => {
    t += dt / 1000;
    dyn.clear();
    // névoa rasteira em bancos deslizando
    for (let i = 0; i < 4; i++) {
      const fx = L + ((i * 271 + t * 14) % (W + 200)) - 100;
      dyn.ellipse(fx, -52 + Math.sin(t * 0.7 + i) * 4, 130, 18).fill({ color: 0x9a94b6, alpha: 0.14 });
    }
    // ZUMBIS rastejando: corpo arrastado + braço alcançando em ciclo
    for (const z of zumbis) {
      z.ph += dt / 1000;
      const drag = Math.max(0, Math.sin(z.ph * 2.4));       // puxão intermitente
      z.x += z.v * drag * (dt / 1000) * 3;
      if (z.x > R + 50) z.x = L - 60;
      const bob = Math.sin(z.ph * 2.4) * 1.5;
      // corpo rastejante
      dyn.ellipse(z.x - 16, z.y + 4 + bob * 0.4, 16, 6).fill(0x4a6650);
      dyn.circle(z.x + 2, z.y + bob, 7).fill(0x5a7a5e);      // cabeça
      dyn.circle(z.x + 4.5, z.y - 2 + bob, 1.6).fill(0xc0ff9a); // olho brilhando
      // braço estendendo e cravando
      const reach = 10 + drag * 10;
      dyn.moveTo(z.x + 4, z.y + 3 + bob).lineTo(z.x + reach, z.y - 4).lineTo(z.x + reach + 6, z.y + 2).stroke({ width: 3.5, color: 0x5a7a5e });
      // perna morta arrastando
      dyn.moveTo(z.x - 28, z.y + 8).lineTo(z.x - 40, z.y + 10).stroke({ width: 3, color: 0x40584a });
    }
    // fogos-fátuos (almas) flutuando
    for (const wp of wisps) {
      wp.ph += dt / 900;
      const a = (Math.sin(wp.ph * 2) + 1) / 2;
      dyn.circle(wp.x + Math.sin(wp.ph) * 12, wp.y + Math.cos(wp.ph * 0.8) * 8, 2.4).fill({ color: 0x9affc0, alpha: 0.25 + a * 0.5 });
    }
    // corvo na lápide: bate asa de vez em quando e voa
    crow.fly = Math.sin(t * 0.35) > 0.97 ? crow.fly + dt / 1000 : Math.max(0, crow.fly - dt / 500);
    const cy = crow.y - crow.fly * 60;
    const flap = crow.fly > 0 ? Math.sin(t * 12) * 4 : Math.sin(t * 2) * 1;
    dyn.ellipse(crow.x, cy, 6, 4).fill(0x14101c);
    dyn.circle(crow.x + 5, cy - 3, 2.6).fill(0x14101c);
    dyn.moveTo(crow.x - 5, cy - flap).lineTo(crow.x - 12, cy - 4 - flap).stroke({ width: 2, color: 0x14101c });
    // velas tremulando junto às lápides
    for (const vx of [-206, 44, 234]) {
      const fl = 0.7 + Math.sin(t * 9 + vx) * 0.3;
      dyn.rect(vx, -78, 4, 8).fill(0xe8e2d0);
      dyn.circle(vx + 2, -82, 2.4 * fl).fill({ color: 0xffc46a, alpha: 0.95 });
      dyn.circle(vx + 2, -82, 5 * fl).fill({ color: 0xffc46a, alpha: 0.2 });
    }
  };
  return c;
}
