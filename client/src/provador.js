// STIKDEAD :: PROVADOR OFFLINE — itera o visual do boneco SEM tocar em produção
// Lição registrada nos docs: nunca mais iterar visual direto em produção.
// Fileiras: LEGADO (rigLegacy congelado) · NOVO (rig 2.5D) · PINTADO (peças 3D de /parts/)
import { Application, Container, Graphics, Text, Sprite, Assets } from 'pixi.js';
import { drawFighter as drawNovo } from './game/rig.js';
import { drawFighter as drawLegado } from './game/rigLegacy.js';
import { createFighterParts, updateFighterParts } from './game/bodyParts.js';
import { MOVES } from './game/sim.js';

const POSES = [
  ['parado', (f) => { f.state = 'idle'; }],
  ['andando', (f, el) => { f.state = 'walk'; f.t = el; }],
  ['bloqueio', (f) => { f.state = 'block'; }],
  ['soco', (f, el) => { f.state = 'light'; f.t = el % (MOVES.light.startup + MOVES.light.active + MOVES.light.recover); }],
  ['chute', (f, el) => { f.state = 'heavy'; f.t = el % (MOVES.heavy.startup + MOVES.heavy.active + MOVES.heavy.recover); }],
  ['dash', (f) => { f.state = 'dash'; }],
  ['pulo', (f) => { f.state = 'jump'; f.vy = 100; }],
  ['vitória', (f, el) => { f.state = 'victory'; f.t = el; }],
];

// visual de referência: bandana vermelha + katana (evoca o pôster)
const LOADOUT = [
  { id: 'band_red', slot: 'head', template: 'band', params: { color: '#d90429' } },
  { id: 'katana', slot: 'weapon', template: 'katana', params: {} },
];

const CELL_W = 190;
const CELL_H = 250;
const HERO_SCALE = 1.9;
const HERO_H = 440; // baseline (chão) dos heróis

// carrega as peças pintadas direto (o provador ignora o interruptor de produção)
async function loadParts() {
  const texs = {};
  await Promise.all(
    ['head', 'torso', 'thigh', 'shin', 'boot', 'forearm', 'upperarm'].map(async (n) => {
      try { texs[n] = await Assets.load(`/parts/${n}.webp`); } catch { /* peça ausente */ }
    })
  );
  return texs;
}

async function main() {
  const cols = POSES.length;
  const width = Math.max(cols * CELL_W, 1520);
  const height = HERO_H + 3 * CELL_H + 160;

  const app = new Application();
  await app.init({ background: '#0d0d10', antialias: true, width, height });
  document.getElementById('app').appendChild(app.canvas);

  const partTexs = await loadParts();
  const temParts = Object.keys(partTexs).length > 0;

  const label = (txt, x, y, size = 15, color = 0xd90429) => {
    const t = new Text({ text: txt, style: { fontFamily: 'monospace', fontSize: size, fill: color, fontWeight: 'bold' } });
    t.position.set(x, y);
    app.stage.addChild(t);
  };

  const mkCell = (x, y, scale) => {
    const c = new Container();
    c.position.set(x, y);
    c.scale.set(scale);
    app.stage.addChild(c);
    return c;
  };

  // célula "pintada": vetor com skipBody/skipHead + sprites de peças por cima
  const mkPainted = (c) => {
    const g = new Graphics();
    c.addChild(g);
    const parts = createFighterParts(c);
    const headSpr = new Sprite();
    headSpr.anchor.set(0.5);
    headSpr.visible = false;
    c.addChild(headSpr);
    return { g, parts, headSpr };
  };

  const drawPainted = (cell, f, elapsed) => {
    const opts = { skipBody: !!partTexs.torso, skipHead: !!partTexs.head };
    const pose = drawNovo(cell.g, f, MOVES, null, elapsed, null, opts);
    updateFighterParts(cell.parts, pose, partTexs);
    if (partTexs.head && pose) {
      cell.headSpr.texture = partTexs.head;
      cell.headSpr.visible = true;
      const d = pose.headR * 2.16;
      cell.headSpr.width = d;
      cell.headSpr.height = d;
      cell.headSpr.scale.x = Math.abs(cell.headSpr.scale.x) * (pose.face < 0 ? -1 : 1);
      cell.headSpr.position.set(pose.hx, pose.hy);
    }
  };

  // ===== heróis: LEGADO vs NOVO vs PINTADO, grandes =====
  label('STIKDEAD — PROVADOR DO BONECO', 20, 12, 22, 0xffffff);
  const hx3 = [width / 2 - 480, width / 2, width / 2 + 480];
  label('LEGADO', hx3[0] - 40, 50);
  label('NOVO (2.5D)', hx3[1] - 55, 50, 15, 0x7fd9ff);
  label(temParts ? 'PINTADO (peças 3D)' : 'PINTADO (sem /parts/)', hx3[2] - 90, 50, 15, 0xf2c14e);
  const heroL = new Graphics();
  mkCell(hx3[0], HERO_H, HERO_SCALE).addChild(heroL);
  const heroN = new Graphics();
  mkCell(hx3[1], HERO_H, HERO_SCALE).addChild(heroN);
  const heroP = mkPainted(mkCell(hx3[2], HERO_H, HERO_SCALE));

  // ===== grade de poses =====
  const rows = [
    ['LEGADO', 'vetor-legado', HERO_H + CELL_H + 40],
    ['NOVO', 'vetor-novo', HERO_H + 2 * CELL_H + 60],
    ['PINTADO', 'pintado', HERO_H + 3 * CELL_H + 80],
  ];
  const cells = [];
  for (const [nome, modo, baseY] of rows) {
    label(nome, 8, baseY - CELL_H + 50, 13, modo === 'vetor-novo' ? 0x7fd9ff : modo === 'pintado' ? 0xf2c14e : 0xd90429);
    POSES.forEach(([pnome, setPose], i) => {
      if (modo === 'vetor-legado') label(pnome, i * CELL_W + CELL_W / 2 - pnome.length * 4, baseY + 14, 13, 0x888888);
      const c = mkCell(i * CELL_W + CELL_W / 2, baseY, 0.95);
      if (modo === 'pintado') {
        cells.push({ modo, cell: mkPainted(c), setPose });
      } else {
        const g = new Graphics();
        c.addChild(g);
        cells.push({ modo, g, setPose, drawFn: modo === 'vetor-legado' ? drawLegado : drawNovo });
      }
    });
  }

  const mkFighter = () => ({ x: 0, y: 0, vx: 0, vy: 0, face: 1, hp: 100, state: 'idle', t: 0.3, hitstun: 0, combo: 0 });
  const fHero = mkFighter();
  let elapsed = 0;

  app.ticker.add((tk) => {
    elapsed += tk.deltaMS / 1000;
    fHero.state = 'idle';
    fHero.t = elapsed;
    drawLegado(heroL, fHero, MOVES, null, elapsed, LOADOUT);
    drawNovo(heroN, fHero, MOVES, null, elapsed, LOADOUT);
    drawPainted(heroP, fHero, elapsed);
    for (const item of cells) {
      const f = mkFighter();
      f.t = elapsed;
      item.setPose(f, elapsed);
      if (item.modo === 'pintado') drawPainted(item.cell, f, elapsed);
      else item.drawFn(item.g, f, MOVES, null, elapsed, null);
    }
  });
}

main();
