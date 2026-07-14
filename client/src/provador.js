// STIKDEAD :: PROVADOR OFFLINE — itera o visual do boneco SEM tocar em produção
// Lição registrada nos docs: nunca mais iterar visual direto em produção.
// Linha de cima: rig LEGADO (congelado em rigLegacy.js). Linha de baixo: rig NOVO.
import { Application, Container, Graphics, Text } from 'pixi.js';
import { drawFighter as drawNovo } from './game/rig.js';
import { drawFighter as drawLegado } from './game/rigLegacy.js';
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
const HERO_SCALE = 2.1;
const HERO_H = 470; // baseline (chão) dos heróis

async function main() {
  const cols = POSES.length;
  const width = Math.max(cols * CELL_W, 1520);
  const height = HERO_H + 3 * CELL_H + 120;

  const app = new Application();
  await app.init({ background: '#0d0d10', antialias: true, width, height });
  document.getElementById('app').appendChild(app.canvas);

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
    const g = new Graphics();
    c.addChild(g);
    return g;
  };

  // ===== herói: LEGADO vs NOVO lado a lado, grandes, com bandana + katana =====
  label('STIKDEAD — PROVADOR DO BONECO', 20, 12, 22, 0xffffff);
  label('LEGADO', width / 2 - 420, 50);
  label('NOVO (2.5D)', width / 2 + 160, 50, 15, 0x7fd9ff);
  const heroL = mkCell(width / 2 - 300, HERO_H, HERO_SCALE);
  const heroN = mkCell(width / 2 + 300, HERO_H, HERO_SCALE);

  // ===== grade de poses =====
  const rows = [
    ['LEGADO', drawLegado, HERO_H + CELL_H + 40],
    ['NOVO', drawNovo, HERO_H + 2 * CELL_H + 60],
  ];
  const cells = [];
  for (const [nome, drawFn, baseY] of rows) {
    label(nome, 8, baseY - CELL_H + 50, 13, nome === 'NOVO' ? 0x7fd9ff : 0xd90429);
    POSES.forEach(([pnome, setPose], i) => {
      if (nome === 'LEGADO') label(pnome, i * CELL_W + CELL_W / 2 - pnome.length * 4, baseY + 14, 13, 0x888888);
      const g = mkCell(i * CELL_W + CELL_W / 2, baseY, 0.95);
      cells.push({ g, drawFn, setPose });
    });
  }

  const mkFighter = () => ({ x: 0, y: 0, vx: 0, vy: 0, face: 1, hp: 100, state: 'idle', t: 0.3, hitstun: 0, combo: 0 });
  const fHero = mkFighter();
  let elapsed = 0;

  app.ticker.add((tk) => {
    elapsed += tk.deltaMS / 1000;
    // herói parado respirando, com loadout de referência
    fHero.state = 'idle';
    fHero.t = elapsed;
    drawLegado(heroL, fHero, MOVES, null, elapsed, LOADOUT);
    drawNovo(heroN, fHero, MOVES, null, elapsed, LOADOUT);
    // grade
    for (const { g, drawFn, setPose } of cells) {
      const f = mkFighter();
      f.t = elapsed;
      setPose(f, elapsed);
      drawFn(g, f, MOVES, null, elapsed, null);
    }
  });
}

main();
