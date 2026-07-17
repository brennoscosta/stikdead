// STIKDEAD :: trilha sonora dos menus.
// Fase 5: as faixas REAIS da biblioteca ElevenLabs (uma por tela, com
// crossfade na navegação) assumem a frente; o tema procedural antigo
// (drone + sinos + taiko, zero arquivos) vira fallback automático se os
// arquivos não estiverem disponíveis. Singleton: nunca duas trilhas juntas.
import { ensureCtx, getBus } from './audioManager.js';
import {
  playMusic as playFileTrack,
  stopMusic as stopFileTrack,
  musicFileFailed,
  currentMusicId,
  DEFAULT_MUSIC,
} from './audioLibrary.js';

let playing = false;
let nodes = [];   // nós contínuos (drone) p/ desligar no stop
let timer = null; // agendador
let passo = 0;

// lá menor pentatônica, registro de sino distante
const NOTAS = [220, 261.63, 329.63, 392, 440, 523.25];

function bell(ctx, out, freq, when, vol = 0.16) {
  const o = ctx.createOscillator();
  const h = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = 'sine'; o.frequency.value = freq;
  h.type = 'sine'; h.frequency.value = freq * 2.76; // parcial inarmônica = gosto de sino
  const hg = ctx.createGain(); hg.gain.value = 0.35;
  g.gain.setValueAtTime(0.0001, when);
  g.gain.exponentialRampToValueAtTime(vol, when + 0.02);
  g.gain.exponentialRampToValueAtTime(0.0001, when + 3.2);
  o.connect(g); h.connect(hg).connect(g); g.connect(out);
  o.start(when); h.start(when);
  o.stop(when + 3.4); h.stop(when + 3.4);
}

function taiko(ctx, out, when, vol = 0.5) {
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = 'sine';
  o.frequency.setValueAtTime(72, when);
  o.frequency.exponentialRampToValueAtTime(38, when + 0.3);
  g.gain.setValueAtTime(vol, when);
  g.gain.exponentialRampToValueAtTime(0.001, when + 0.42);
  o.connect(g).connect(out);
  o.start(when); o.stop(when + 0.5);
}

function drone(ctx, out) {
  // duas serras desafinadas em lá grave, respirando por um passa-baixa lento
  const lp = ctx.createBiquadFilter();
  lp.type = 'lowpass'; lp.frequency.value = 220; lp.Q.value = 0.7;
  const lfo = ctx.createOscillator();
  const lfoG = ctx.createGain();
  lfo.frequency.value = 0.05; lfoG.gain.value = 90;
  lfo.connect(lfoG).connect(lp.frequency);
  const g = ctx.createGain(); g.gain.value = 0.09;
  for (const det of [-4, 3]) {
    const o = ctx.createOscillator();
    o.type = 'sawtooth'; o.frequency.value = 55; o.detune.value = det;
    o.connect(lp);
    nodes.push(o); o.start();
  }
  lp.connect(g).connect(out);
  nodes.push(lfo); lfo.start();
  nodes.push({ stop: () => { try { g.disconnect(); } catch { /* ok */ } } });
}

// eco longo compartilhado dos sinos — o "salão vazio"
function makeEcho(ctx, out) {
  const d = ctx.createDelay(1.2); d.delayTime.value = 0.46;
  const fb = ctx.createGain(); fb.gain.value = 0.38;
  const mix = ctx.createGain(); mix.gain.value = 0.5;
  d.connect(fb).connect(d); d.connect(mix).connect(out);
  return d;
}

// ===== fachada pública (Fase 5) =====
// Tenta a faixa real da tela; se a biblioteca falhar, cai no tema procedural.
export function startMusic(trackId = null) {
  const ctx = ensureCtx();
  if (!ctx) return;
  if (ctx.state !== 'running') { // autoplay: tenta de novo assim que o navegador liberar
    ctx.resume?.().then(() => { if (ctx.state === 'running') startMusic(trackId); }).catch(() => {});
    return;
  }
  if (!musicFileFailed()) {
    const alvo = trackId || currentMusicId() || DEFAULT_MUSIC;
    const ok = playFileTrack(alvo, { onFail: () => startProceduralMusic() });
    if (ok) { stopProceduralMusic(); return; } // arquivo assumiu: procedural cala
  }
  startProceduralMusic();
}

export function stopMusic() {
  stopFileTrack();
  stopProceduralMusic();
}

export const musicPlaying = () => playing || currentMusicId() != null;

// ===== motor procedural (fallback, intacto) =====
function startProceduralMusic() {
  if (playing) return; // nunca duplica
  const ctx = ensureCtx();
  if (!ctx || ctx.state !== 'running') return;
  const out = getBus('music');
  playing = true;
  passo = 0;
  drone(ctx, out);
  const echo = makeEcho(ctx, out);

  // agendador: pensa 1.2s à frente, acorda 3x por segundo
  let proximo = ctx.currentTime + 0.15;
  timer = setInterval(() => {
    if (!playing) return;
    while (proximo < ctx.currentTime + 1.2) {
      const t = proximo;
      // batida-mãe a cada ~1.05s (~57bpm)
      if (passo % 8 === 0) taiko(ctx, out, t, 0.42);           // taiko no 1 de cada compasso
      if (passo % 8 === 5 && Math.random() < 0.5) taiko(ctx, out, t, 0.2); // eco fraco
      if (passo % 2 === 0 && Math.random() < 0.42) {           // sino esparso, nunca melodia cheia
        const nota = NOTAS[Math.floor(Math.random() * NOTAS.length)];
        bell(ctx, out, nota, t + Math.random() * 0.3, 0.1 + Math.random() * 0.08);
        if (Math.random() < 0.3) bell(ctx, echo, nota / 2, t + 0.5, 0.06);
      }
      proximo += 1.05;
      passo += 1;
    }
  }, 330);
}

function stopProceduralMusic() {
  if (!playing) return;
  playing = false;
  clearInterval(timer); timer = null;
  for (const n of nodes) { try { n.stop(); } catch { /* ok */ } try { n.disconnect?.(); } catch { /* ok */ } }
  nodes = [];
}
