import { poseFor, skeleton } from './rig.js';
import { MOVES } from './sim.js';

const F = (state, t, extra = {}) => ({ state, t, vy: 0, hitstun: 0.4, ...extra });
const cases = [
  ['idle', F('idle', 0.4)],
  ['andar', F('walk', 0.15)],
  ['pulo_subindo', F('jump', 0.1, { vy: 400 })],
  ['pulo_caindo', F('jump', 0.5, { vy: -400 })],
  ['dash', F('dash', 0.05)],
  ['soco_ativo', F('light', MOVES.light.startup + 0.02)],
  ['chute_ativo', F('heavy', MOVES.heavy.startup + 0.03)],
  ['bloqueio', F('block', 0.2)],
  ['tomar_dano', F('hit', 0.04)],
  ['vitoria', F('victory', 0.26)],
];
const out = {};
for (const [name, f] of cases) out[name] = skeleton(poseFor(f, MOVES));
console.log(JSON.stringify(out));
