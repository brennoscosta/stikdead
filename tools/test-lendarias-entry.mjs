// STIKDEAD :: teste visual das armas lendárias (headless)
// Renderiza as 4 lendárias + 1 genérica lado a lado, num braço fake, em 3 instantes.
import { Application, Graphics } from 'pixi.js';
import { drawItems } from '../client/src/game/itemsArt.js';

const ARMAS = [
  { id: 'katana_infernal', template: 'katana', rarity: 'lendario', params: { blade: '#2b0a10', glow: '#ff2244', grip: '#520a14' }, nome: 'FOGO' },
  { id: 'foice_sangrenta', template: 'scythe', rarity: 'lendario', params: { blade: '#3a3038', handle: '#1c1416', glow: '#ff2244' }, nome: 'SANGUE' },
  { id: 'katana_void', template: 'katana', rarity: 'lendario', params: { blade: '#1a1a2e', grip: '#0d0d18', glow: '#8b5cf6' }, nome: 'VAZIO' },
  { id: 'arco_fantasma', template: 'bow', rarity: 'lendario', params: { color: '#2b2b3d', glow: '#9fd8ff' }, nome: 'FANTASMA' },
  { id: 'machado_teste', template: 'axe', rarity: 'lendario', params: { blade: '#6a5a30', handle: '#3a2a14', glow: '#ffc36b' }, nome: 'BRASA (genérica)' },
];

// esqueleto fake: braço apontando para a frente/baixo, como na luta
const SK = {
  head: [0, -150], neck: [0, -120], hip: [0, -60],
  elbF: [14, -104], handF: [34, -92], elbB: [-12, -102], handB: [-26, -90],
  kneB: [-8, -30], kneF: [10, -30], footB: [-12, 0], footF: [16, 0],
};

const app = new Application();
await app.init({ width: 1000, height: 260, background: 0x14161c, antialias: true });
document.body.appendChild(app.canvas);
const g = new Graphics();
app.stage.addChild(g);

let elapsed = 0;
window.__setT = (t) => { elapsed = t; desenha(); };

function desenha() {
  g.clear();
  ARMAS.forEach((arma, i) => {
    const ox = 110 + i * 195, oy = 230;
    const ctx = {
      g,
      T: (j) => [j[0] + ox, j[1] + oy],
      sk: SK,
      face: 1,
      elapsed,
      ko: false,
      f: { x: ox, y: 0, state: 'idle', face: 1 },
    };
    // braço de referência (pra ver a arma ancorada)
    const e = ctx.T(SK.elbF), h = ctx.T(SK.handF);
    g.moveTo(e[0], e[1]).lineTo(h[0], h[1]).stroke({ width: 14, color: 0x232323, cap: 'round' });
    drawItems(ctx, [arma], 'front');
  });
  window.__pronto = true;
}
desenha();
