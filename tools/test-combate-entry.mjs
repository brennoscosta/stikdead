// STIKDEAD :: teste visual do game-feel de combate (headless)
// Cenas sintéticas: wind-up do pesado, janela ativa com ghosts, hit com combo ×6.
import { createRenderer } from '../client/src/game/renderer.js';

const mk = (state, t, combo = 0) => ({
  phase: 'fight', phaseT: 5, timer: 80, round: 1, wins: [0, 0], suddenDeath: false,
  fighters: [
    { x: -80, y: 0, vy: 0, face: 1, hp: 90, state, t, hitstun: 0, combo, style: 'ronin', skillCd: 3, fury: 0 },
    { x: 70, y: 0, vy: 0, face: -1, hp: 70, state: 'idle', t: 1.2, hitstun: 0, combo: 0, style: 'ronin', skillCd: 3, fury: 0 },
  ],
});

const host = document.createElement('div');
host.style.cssText = 'width:1000px;height:420px';
document.body.style.margin = '0';
document.body.appendChild(host);

const r = await createRenderer(host, 'dojo');
r.setNames('A', 'B');
r.setLoadouts([], []);

window.__cena = (nome) => {
  if (nome === 'windup') r.frame(mk('heavy', 0.15), [], 1 / 60);
  if (nome === 'ativo') r.frame(mk('heavy', 0.27, 6), [], 1 / 60);
  if (nome === 'hit') {
    r.frame(mk('light', 0.1), [{ type: 'hit', x: 40, y: 100, attacker: 0, target: 1, dmg: 12, heavy: true, combo: 6 }], 1 / 60);
    for (let i = 0; i < 5; i++) r.frame(mk('light', 0.12 + i * 0.016, 6), [], 1 / 60);
  }
  if (nome === 'hit8') {
    r.frame(mk('light', 0.1), [{ type: 'hit', x: 40, y: 100, attacker: 0, target: 1, dmg: 14, heavy: true, combo: 8 }], 1 / 60);
    for (let i = 0; i < 4; i++) r.frame(mk('light', 0.12 + i * 0.016, 8), [], 1 / 60);
  }
  window.__ok = nome;
};
window.__pronto = true;
