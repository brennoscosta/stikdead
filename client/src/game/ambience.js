// STIKDEAD :: som ambiente do mundo — vento, brasas, sinos distantes, corvos,
// treino ao fundo e aço longe. Tudo sintetizado (zero arquivos), tudo no canal
// AMBIENCE do AudioManager. Singleton: um mundo só, nunca dois ventos juntos.
import { ensureCtx, getBus } from './audioManager.js';

let playing = false;
let nodes = [];
let embTimer = null;
let evtTimer = null;

function noiseBuffer(ctx, dur = 2) {
  const buf = ctx.createBuffer(1, ctx.sampleRate * dur, ctx.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  return buf;
}

// ===== camadas contínuas =====
function vento(ctx, out) {
  const src = ctx.createBufferSource();
  src.buffer = noiseBuffer(ctx, 2.5); src.loop = true;
  const bp = ctx.createBiquadFilter();
  bp.type = 'bandpass'; bp.frequency.value = 380; bp.Q.value = 0.6;
  const g = ctx.createGain(); g.gain.value = 0.16;
  // o vento respira: LFOs lentos no tom e no fôlego
  const lfo1 = ctx.createOscillator(); const lg1 = ctx.createGain();
  lfo1.frequency.value = 0.07; lg1.gain.value = 160; lfo1.connect(lg1).connect(bp.frequency);
  const lfo2 = ctx.createOscillator(); const lg2 = ctx.createGain();
  lfo2.frequency.value = 0.11; lg2.gain.value = 0.06; lfo2.connect(lg2).connect(g.gain);
  src.connect(bp).connect(g).connect(out);
  src.start(); lfo1.start(); lfo2.start();
  nodes.push(src, lfo1, lfo2);
}

// ===== eventos pontuais =====
function brasa(ctx, out) {
  // estalo minúsculo de fogueira
  const src = ctx.createBufferSource();
  src.buffer = noiseBuffer(ctx, 0.06);
  const hp = ctx.createBiquadFilter();
  hp.type = 'highpass'; hp.frequency.value = 2600 + Math.random() * 2200;
  const g = ctx.createGain();
  const t = ctx.currentTime;
  g.gain.setValueAtTime(0.05 + Math.random() * 0.07, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + 0.05);
  src.connect(hp).connect(g).connect(out);
  src.start(t); src.stop(t + 0.06);
}

function sino(ctx, out, vol = 0.1) {
  const t = ctx.currentTime;
  for (const [f, v] of [[494, vol], [494 * 2.71, vol * 0.3]]) {
    const o = ctx.createOscillator(); const g = ctx.createGain();
    o.type = 'sine'; o.frequency.value = f * (0.98 + Math.random() * 0.04);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(v, t + 0.03);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 4);
    o.connect(g).connect(out); o.start(t); o.stop(t + 4.2);
  }
}

function corvo(ctx, out, vol = 0.12) {
  // dois grasnidos caindo, com formante fechada
  let t = ctx.currentTime;
  for (let i = 0; i < 2; i++) {
    const o = ctx.createOscillator(); const g = ctx.createGain();
    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass'; bp.frequency.value = 1150; bp.Q.value = 4;
    o.type = 'sawtooth';
    o.frequency.setValueAtTime(620 + Math.random() * 80, t);
    o.frequency.exponentialRampToValueAtTime(340, t + 0.16);
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
    o.connect(bp).connect(g).connect(out);
    o.start(t); o.stop(t + 0.2);
    t += 0.24 + Math.random() * 0.1;
  }
}

function aco(ctx, out, vol = 0.07) {
  // espadas/metais longe: ping metálico + arrasto de ar
  const t = ctx.currentTime;
  for (const f of [1240, 1870]) {
    const o = ctx.createOscillator(); const g = ctx.createGain();
    o.type = 'square'; o.frequency.value = f * (0.97 + Math.random() * 0.06);
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.5);
    o.connect(g).connect(out); o.start(t); o.stop(t + 0.55);
  }
}

function treino(ctx, out, vol = 0.12) {
  // thumps surdos de alguém batendo saco ao fundo
  let t = ctx.currentTime;
  const n = 2 + Math.floor(Math.random() * 2);
  for (let i = 0; i < n; i++) {
    const o = ctx.createOscillator(); const g = ctx.createGain();
    o.type = 'sine';
    o.frequency.setValueAtTime(110, t);
    o.frequency.exponentialRampToValueAtTime(55, t + 0.12);
    g.gain.setValueAtTime(vol * (0.7 + Math.random() * 0.3), t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.14);
    o.connect(g).connect(out); o.start(t); o.stop(t + 0.16);
    t += 0.32 + Math.random() * 0.35;
  }
}

const EVENTOS = [sino, corvo, aco, treino];

export function startAmbience() {
  if (playing) return; // nunca dois loops
  const ctx = ensureCtx();
  if (!ctx) return;
  if (ctx.state !== 'running') {
    ctx.resume?.().then(() => { if (ctx.state === 'running') startAmbience(); }).catch(() => {});
    return;
  }
  const out = getBus('ambience');
  playing = true;
  vento(ctx, out);
  embTimer = setInterval(() => { if (Math.random() < 0.65) brasa(ctx, out); }, 460);
  const agenda = () => {
    if (!playing) return;
    EVENTOS[Math.floor(Math.random() * EVENTOS.length)](ctx, out);
    evtTimer = setTimeout(agenda, 9000 + Math.random() * 16000);
  };
  evtTimer = setTimeout(agenda, 4000 + Math.random() * 5000);
}

export function stopAmbience() {
  if (!playing) return;
  playing = false;
  clearInterval(embTimer); embTimer = null;
  clearTimeout(evtTimer); evtTimer = null;
  for (const n of nodes) { try { n.stop(); } catch { /* ok */ } try { n.disconnect(); } catch { /* ok */ } }
  nodes = [];
}

// botão "testar ambiente" das Configurações: um sino + um corvo na hora
export function previewAmbience() {
  const ctx = ensureCtx();
  if (!ctx) return;
  const out = getBus('ambience');
  sino(ctx, out, 0.12);
  setTimeout(() => corvo(ctx, out, 0.13), 700);
}

export const ambiencePlaying = () => playing;
