// STIKDEAD :: exporta as poses da simulação para o renderizador 3D (Blender)
// As animações do render 3D são AS MESMAS do jogo — zero divergência.
// Uso: node export-poses.mjs > /tmp/poses.json
import { poseFor, skeleton, RIG } from '../client/src/game/rig.js';
import { MOVES } from '../shared/sim.js';

const IDLE_PERIOD = (2 * Math.PI) / 2.4; // respiração do idle
const WALK_PERIOD = (2 * Math.PI) / 11;  // passada da caminhada
const L = MOVES.light;
const PUNCH_TOTAL = L.startup + L.active + L.recover;

// [nome, nº de frames, t(frame)]
const STATES = [
  ['idle', 10, (i, n) => ({ state: 'idle', t: (i / n) * IDLE_PERIOD })],
  ['walk', 10, (i, n) => ({ state: 'walk', t: (i / n) * WALK_PERIOD })],
  ['punch', 12, (i, n) => ({ state: 'light', t: (i / (n - 1)) * PUNCH_TOTAL * 0.999 })],
];

const out = { rig: RIG, states: {} };
for (const [nome, n, mk] of STATES) {
  const frames = [];
  for (let i = 0; i < n; i++) {
    const f = { ...mk(i, n), vy: 0, hitstun: 0, combo: 0 };
    const sk = skeleton(poseFor(f, MOVES));
    frames.push(sk); // {hip,neck,head,elbF,handF,elbB,handB,kneF,footF,kneB,footB,lean}
  }
  out.states[nome] = frames;
}
process.stdout.write(JSON.stringify(out));
