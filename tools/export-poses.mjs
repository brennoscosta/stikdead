// STIKDEAD :: exporta as poses da simulação para o renderizador 3D (Blender)
// As animações partem da simulação do jogo e ganham uma camada de CINEMA:
// antecipação, snap de impacto e follow-through (só no visual — a sim não muda).
// Uso: node export-poses.mjs > /tmp/poses.json
import { poseFor, skeleton, RIG } from '../client/src/game/rig.js';
import { MOVES } from '../shared/sim.js';

const IDLE_PERIOD = (2 * Math.PI) / 2.4; // respiração do idle
const WALK_PERIOD = (2 * Math.PI) / 11;  // passada da caminhada
const L = MOVES.light;
const PUNCH_TOTAL = L.startup + L.active + L.recover;

const easeIn = (x) => x * x;
const easeOut = (x) => 1 - (1 - x) * (1 - x);

// soco com timing de cinema: antecipação lenta, impacto denso, recuperação suave
const punchT = (i, n) => {
  const u = i / (n - 1);
  let t;
  if (u < 0.4) t = L.startup * easeIn(u / 0.4);
  else if (u < 0.65) t = L.startup + L.active * ((u - 0.4) / 0.25);
  else t = L.startup + L.active + L.recover * easeOut((u - 0.65) / 0.35);
  return Math.min(t, PUNCH_TOTAL * 0.999);
};

// [nome, nº de frames, t(frame)]
const STATES = [
  ['idle', 12, (i, n) => ({ state: 'idle', t: (i / n) * IDLE_PERIOD })],
  ['walk', 12, (i, n) => ({ state: 'walk', t: (i / n) * WALK_PERIOD })],
  ['punch', 16, (i, n) => ({ state: 'light', t: punchT(i, n) })],
];

// camada de cinema por cima da pose da sim
function cinema(nome, f, p) {
  if (nome === 'walk') {
    p.head += 0.05 * Math.sin(f.t * 22);            // bob sutil da cabeça no passo
    p.armB = [p.armB[0] * 1.3, p.armB[1]];          // braço de trás balança mais
    p.lean += 0.02 * Math.sin(f.t * 11);            // torso acompanha a passada
  }
  if (nome === 'punch') {
    if (f.t < L.startup) {
      p.lean -= 0.12 * easeIn(f.t / L.startup);     // ANTECIPAÇÃO: recua antes do golpe
      p.hipY -= 2 * (f.t / L.startup);
    } else if (f.t < L.startup + L.active) {
      p.lean += 0.10;                                // SNAP: joga o corpo no impacto
      p.head += 0.06;
    } else {
      const r = (f.t - L.startup - L.active) / L.recover;
      p.lean += 0.10 * (1 - easeOut(r));             // FOLLOW-THROUGH: assenta de volta
    }
  }
  if (nome === 'idle') {
    p.head += 0.02 * Math.sin(f.t * 2.4 + 1.2);     // micro-vida na cabeça
  }
  return p;
}

const out = { rig: RIG, states: {} };
for (const [nome, n, mk] of STATES) {
  const frames = [];
  for (let i = 0; i < n; i++) {
    const f = { ...mk(i, n), vy: 0, hitstun: 0, combo: 0 };
    const p = cinema(nome, f, poseFor(f, MOVES));
    frames.push(skeleton(p));
  }
  out.states[nome] = frames;
}
process.stdout.write(JSON.stringify(out));
