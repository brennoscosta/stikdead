// STIKDEAD :: motor de SFX — 100% sintetizado (WebAudio), zero arquivos
// Estética seca: thumps graves, whooshes de ar, estalos de bloqueio, sino de KO.
// Desde o sistema de áudio: tudo sai pelo canal SFX do AudioManager central.
import { ensureCtx as amEnsure, getBus, toggleMute, isMuted } from './audioManager.js';
import { playUi, playStinger, playVoice, playGameplay } from './audioLibrary.js';

// LOTE 4: golpes reais com variação — sorteia entre as gravações do mesmo
// golpe (bíblia: "variações aleatórias… evitar repetição mecânica") e cai no
// sintetizado se o arquivo ainda não carregou. Cooldown curto: luta é rápida.
function hit(vars, fallback, cooldownMs = 45) {
  const id = vars[Math.floor(Math.random() * vars.length)];
  playGameplay(id, { cooldownMs, fallback });
}

let ctx = null;
let master = null; // = canal SFX do AudioManager (nome mantido p/ o motor abaixo)

function ensure() {
  const c = amEnsure();
  if (!c) return null;
  ctx = c;
  // Fase 5: o motor procedural de luta sai pelo sub-canal GAMEPLAY
  // (filho de Efeitos — as preferências antigas seguem valendo).
  master = getBus('gameplay') || getBus('sfx');
  return ctx;
}

// destrava o áudio no primeiro gesto (política dos navegadores)
export function unlockAudio() { ensure(); }
export const ensureCtx = () => ensure();
export const getMaster = () => master;

// compat: mudo geral agora vive no AudioManager (Som Geral)
export { toggleMute, isMuted };

// ===== blocos de construção =====
function noiseBuffer(dur = 0.3) {
  const c = ensure();
  const buf = c.createBuffer(1, c.sampleRate * dur, c.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  return buf;
}

function thump(freq = 90, dur = 0.16, vol = 1, when = 0) {
  const c = ensure(); if (!c) return;
  const t = c.currentTime + when;
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = 'sine';
  o.frequency.setValueAtTime(freq, t);
  o.frequency.exponentialRampToValueAtTime(Math.max(30, freq * 0.35), t + dur);
  g.gain.setValueAtTime(vol, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + dur);
  o.connect(g).connect(master);
  o.start(t); o.stop(t + dur + 0.02);
}

function noise({ dur = 0.12, from = 3000, to = 800, vol = 0.5, type = 'bandpass', q = 1, when = 0 }) {
  const c = ensure(); if (!c) return;
  const t = c.currentTime + when;
  const src = c.createBufferSource();
  src.buffer = noiseBuffer(dur + 0.05);
  const f = c.createBiquadFilter();
  f.type = type; f.Q.value = q;
  f.frequency.setValueAtTime(from, t);
  f.frequency.exponentialRampToValueAtTime(Math.max(80, to), t + dur);
  const g = c.createGain();
  g.gain.setValueAtTime(vol, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + dur);
  src.connect(f).connect(g).connect(master);
  src.start(t); src.stop(t + dur + 0.05);
}

function tone(freq, dur = 0.3, vol = 0.3, type = 'triangle', when = 0, slideTo = null) {
  const c = ensure(); if (!c) return;
  const t = c.currentTime + when;
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, t);
  if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
  g.gain.setValueAtTime(vol, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + dur);
  o.connect(g).connect(master);
  o.start(t); o.stop(t + dur + 0.02);
}

// ===== SFX do jogo (v2: camadas + variação orgânica) =====
// cada golpe varia ±8% de tom para nunca soar metralhadora
const vary = () => 0.92 + Math.random() * 0.16;

export const sfx = {
  punch() { hit(['combat_punch_01', 'combat_punch_02', 'combat_punch_03'], punchProc); },
  heavy() { hit(['combat_heavy_01', 'combat_heavy_02'], heavyProc, 90); },
  block() { hit(['combat_block_01', 'combat_block_02'], blockProc); },
  hurt() { hit(['combat_hurt_01', 'combat_hurt_02'], hurtProc); },
  dash() { hit(['combat_dash_01'], dashProc, 120); },
  ko() { hit(['combat_ko_01'], koProc, 800); },
  firstblood() { tone(220, 0.12, 0.3, 'sawtooth'); tone(330, 0.2, 0.3, 'sawtooth', 0.1); },
  round() { thump(90, 0.2, 0.7); thump(90, 0.2, 0.7, 0.22); },
  dark() {
    // drone sombrio: grave descendo + sopro de vento + sino distante
    tone(66, 2.2, 0.16, 'sawtooth', 0, 48);
    noise({ dur: 2.4, from: 900, to: 180, vol: 0.14, q: 0.8 });
    tone(392, 1.4, 0.05, 'sine', 0.5, 388);
  },
  // FASE 7: os quatro sons de interface mais usados tentam o arquivo real
  // da biblioteca ElevenLabs primeiro; o sintetizado é o fallback automático.
  victory() { playStinger('music_victory_stinger_v01', { fallback: () => [440, 554, 659, 880].forEach((f, i) => tone(f, 0.34, 0.22, 'triangle', i * 0.12)) }); },
  defeat() { playStinger('music_defeat_stinger_v01', { fallback: () => [330, 262, 196].forEach((f, i) => tone(f, 0.42, 0.2, 'triangle', i * 0.16)) }); },
  drop() { playUi('reward_item_common_01', { fallback: () => [660, 880, 1108].forEach((f, i) => tone(f, 0.2, 0.18, 'sine', i * 0.08)) }); },
  click() { playUi('ui_click_secondary_01', { fallback: () => noise({ dur: 0.04, from: 3000, to: 1500, vol: 0.15 }) }); },
  skill() { hit(['combat_skill_01', 'combat_skill_02'], skillProc, 150); },
  skillHeavy() { hit(['combat_skill_heavy_01'], skillHeavyProc, 250); },
};

// ===== motores procedurais do combate (fallback golpe a golpe, intactos) =====
function punchProc() {
  const v = vary();
  tone(1900 * v, 0.02, 0.22, 'square');                              // transiente seco (o "crack")
  thump(135 * v, 0.11, 0.95);                                        // corpo do impacto
  noise({ dur: 0.06, from: 2600 * v, to: 480, vol: 0.4 });           // tapa de ar
}
function heavyProc() {
  const v = vary();
  noise({ dur: 0.16, from: 700, to: 4600, vol: 0.32, q: 1.6 });      // whoosh de antecipação
  tone(1400 * v, 0.025, 0.28, 'square', 0.05);                       // crack
  thump(85 * v, 0.22, 1.1, 0.05);                                    // impacto médio
  thump(48, 0.34, 1.0, 0.06);                                        // SUB: o peso no peito
  noise({ dur: 0.12, from: 4200, to: 600, vol: 0.55, when: 0.05 });  // estilhaço
}
function blockProc() {
  const v = vary();
  tone(540 * v, 0.09, 0.3, 'square');                                // clang
  tone(810 * v, 0.07, 0.2, 'square');                                // harmônico metálico
  noise({ dur: 0.09, from: 6200, to: 3000, vol: 0.3, q: 3 });        // ping de aço
  thump(160, 0.06, 0.35);                                            // encosto
}
function hurtProc() { const v = vary(); thump(150 * v, 0.09, 0.5); noise({ dur: 0.05, from: 1200, to: 400, vol: 0.2 }); }
function dashProc() { noise({ dur: 0.2, from: 420, to: 3600, vol: 0.32, q: 2.6 }); }
function koProc() {
  thump(52, 0.7, 1.35);                                              // terremoto
  thump(38, 0.9, 0.8, 0.08);                                         // réplica sub
  noise({ dur: 0.34, from: 2200, to: 160, vol: 0.55 });              // desabamento
  noise({ dur: 0.5, from: 900, to: 5000, vol: 0.12, when: 0.15, q: 0.7 }); // poeira subindo
  tone(880, 1.7, 0.15, 'sine', 0.14);                                // sino do fim
  tone(1318, 1.3, 0.07, 'sine', 0.14);
}
function skillProc() {
  noise({ dur: 0.22, from: 400, to: 4600, vol: 0.4, q: 3 });         // energia subindo
  tone(220, 0.3, 0.25, 'sawtooth', 0.02, 660);
}
function skillHeavyProc() { thump(60, 0.4, 1.2); noise({ dur: 0.25, from: 2400, to: 300, vol: 0.5 }); }

// roteia eventos da simulação para os sons certos
export function playEvent(e, mySide = null) {
  switch (e.type) {
    case 'hit':
      if (e.blocked) sfx.block();
      else if (e.heavy) sfx.heavy();
      else sfx.punch();
      break;
    case 'dash': sfx.dash(); break;
    case 'ko': sfx.ko(); break;
    case 'firstblood': sfx.firstblood(); break;
    case 'roundstart': sfx.round(); break;
    case 'fightstart':
      sfx.round();
      setTimeout(() => playVoice('voice_battle_start_01'), 350); // FASE 10: "A batalha começou."
      break;
    case 'suddendeath':
      sfx.firstblood();
      setTimeout(() => playVoice('voice_sudden_death_01'), 300); // FASE 10: "Morte súbita."
      break;
    case 'skill': sfx.skill(); break;
    case 'skillwave': sfx.skillHeavy(); break;
    case 'skillslam': sfx.skillHeavy(); break;
    case 'matchend': {
      const ganhou = mySide == null || e.winner === mySide;
      (ganhou ? sfx.victory() : sfx.defeat());
      // FASE 10: o narrador anuncia depois do impacto do stinger
      setTimeout(() => playVoice(ganhou ? 'voice_victory_01' : 'voice_defeat_01'), 900);
      break;
    }
    default: break;
  }
}
