// STIKDEAD :: trilha procedural — atmosferas vivas por arena + tema do menu
// Camadas: drones detunados + cama de vento filtrado + eventos esparsos (sino/tambor).
// Volume próprio (fundo discreto), respeita o mute global do master.
import { getMaster, ensureCtx } from './audio.js';

let cur = null; // { nodes: [], timers: [], gain, theme }

const THEMES = {
  menu: {
    drones: [{ f: 55, type: 'sawtooth', v: 0.05 }, { f: 82.5, type: 'sine', v: 0.05 }],
    wind: { from: 400, to: 900, v: 0.028, q: 0.7 },
    pulse: 0.11,
    event: { every: [6, 12], fn: 'bellLow' },
  },
  dojo: {
    drones: [{ f: 62, type: 'sine', v: 0.055 }, { f: 93, type: 'triangle', v: 0.035 }],
    wind: { from: 500, to: 1100, v: 0.022, q: 0.8 },
    pulse: 0.14,
    event: { every: [4, 9], fn: 'taiko' },
  },
  temple: {
    drones: [{ f: 49, type: 'sine', v: 0.06 }, { f: 98, type: 'sine', v: 0.03 }, { f: 147, type: 'sine', v: 0.018 }],
    wind: { from: 300, to: 700, v: 0.02, q: 0.6 },
    pulse: 0.08,
    event: { every: [7, 14], fn: 'bellHigh' },
  },
  prison: {
    drones: [{ f: 45, type: 'sawtooth', v: 0.05 }],
    wind: { from: 200, to: 500, v: 0.03, q: 0.5 },
    pulse: 0.1,
    event: { every: [5, 11], fn: 'clank' },
  },
  neve: {
    drones: [{ f: 70, type: 'sine', v: 0.04 }, { f: 105, type: 'sine', v: 0.025 }],
    wind: { from: 900, to: 2400, v: 0.045, q: 1.2 },
    pulse: 0.07,
    event: { every: [8, 15], fn: 'bellHigh' },
  },
  deserto: {
    drones: [{ f: 58, type: 'sawtooth', v: 0.045 }, { f: 87, type: 'triangle', v: 0.025 }],
    wind: { from: 600, to: 1600, v: 0.04, q: 0.9 },
    pulse: 0.09,
    event: { every: [6, 13], fn: 'taiko' },
  },
  praia: {
    drones: [{ f: 52, type: 'sine', v: 0.035 }],
    wind: { from: 300, to: 1400, v: 0.06, q: 0.4 }, // ondas
    pulse: 0.05,
    event: { every: [5, 9], fn: 'wave' },
  },
};

function noiseSrc(c, dur = 4) {
  const buf = c.createBuffer(1, c.sampleRate * dur, c.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  const src = c.createBufferSource();
  src.buffer = buf;
  src.loop = true;
  return src;
}

const EVENTS = {
  bellLow(c, out) { evTone(c, out, 220, 2.2, 0.05); evTone(c, out, 330, 1.6, 0.02); },
  bellHigh(c, out) { evTone(c, out, 880, 2.4, 0.03); evTone(c, out, 1318, 1.8, 0.015); },
  taiko(c, out) {
    const o = c.createOscillator(); const g = c.createGain(); const t = c.currentTime;
    o.type = 'sine'; o.frequency.setValueAtTime(80, t); o.frequency.exponentialRampToValueAtTime(38, t + 0.3);
    g.gain.setValueAtTime(0.14, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.4);
    o.connect(g).connect(out); o.start(t); o.stop(t + 0.45);
  },
  clank(c, out) { evTone(c, out, 410, 0.5, 0.035, 'square'); evTone(c, out, 615, 0.35, 0.02, 'square'); },
  wave(c, out) {
    const src = noiseSrc(c, 3); const f = c.createBiquadFilter(); const g = c.createGain(); const t = c.currentTime;
    f.type = 'bandpass'; f.Q.value = 0.5;
    f.frequency.setValueAtTime(300, t); f.frequency.exponentialRampToValueAtTime(1800, t + 1.4);
    f.frequency.exponentialRampToValueAtTime(250, t + 3);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.05, t + 1.2);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 3);
    src.connect(f).connect(g).connect(out); src.start(t); src.stop(t + 3.1);
  },
};

function evTone(c, out, f, dur, v, type = 'sine') {
  const o = c.createOscillator(); const g = c.createGain(); const t = c.currentTime;
  o.type = type; o.frequency.value = f * (0.99 + Math.random() * 0.02);
  g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(out); o.start(t); o.stop(t + dur + 0.05);
}

export function startMusic(themeName) {
  const c = ensureCtx();
  const master = getMaster();
  if (!c || !master) return;
  const name = THEMES[themeName] ? themeName : 'menu';
  if (cur?.theme === name) return;
  stopMusic();

  const theme = THEMES[name];
  const gain = c.createGain();
  gain.gain.setValueAtTime(0.0001, c.currentTime);
  gain.gain.exponentialRampToValueAtTime(1, c.currentTime + 2.5); // fade-in
  gain.connect(master);

  const nodes = [];
  // drones com pulso lento (LFO)
  for (const d of theme.drones) {
    const o = c.createOscillator(); o.type = d.type; o.frequency.value = d.f;
    const g = c.createGain(); g.gain.value = d.v;
    const lfo = c.createOscillator(); lfo.frequency.value = theme.pulse * (0.9 + Math.random() * 0.2);
    const lfoG = c.createGain(); lfoG.gain.value = d.v * 0.45;
    lfo.connect(lfoG).connect(g.gain);
    const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 900;
    o.connect(lp).connect(g).connect(gain);
    o.start(); lfo.start();
    nodes.push(o, lfo);
  }
  // cama de vento
  const w = theme.wind;
  const src = noiseSrc(c, 4);
  const f = c.createBiquadFilter(); f.type = 'bandpass'; f.Q.value = w.q; f.frequency.value = w.from;
  const wg = c.createGain(); wg.gain.value = w.v;
  const wLfo = c.createOscillator(); wLfo.frequency.value = 0.06;
  const wLfoG = c.createGain(); wLfoG.gain.value = (w.to - w.from) / 2;
  wLfo.connect(wLfoG).connect(f.frequency);
  f.frequency.value = (w.from + w.to) / 2;
  src.connect(f).connect(wg).connect(gain);
  src.start(); wLfo.start();
  nodes.push(src, wLfo);

  // eventos esparsos
  const timers = [];
  const schedule = () => {
    const [a, b] = theme.event.every;
    const id = setTimeout(() => {
      try { EVENTS[theme.event.fn]?.(c, gain); } catch { /* ok */ }
      schedule();
    }, (a + Math.random() * (b - a)) * 1000);
    timers.push(id);
  };
  schedule();

  cur = { nodes, timers, gain, theme: name };
}

export function stopMusic() {
  if (!cur) return;
  const c = ensureCtx();
  try {
    cur.gain.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + 0.8);
    const dead = cur;
    setTimeout(() => {
      dead.nodes.forEach((n) => { try { n.stop(); } catch { /* ok */ } });
      try { dead.gain.disconnect(); } catch { /* ok */ }
    }, 900);
  } catch { /* ok */ }
  cur.timers.forEach(clearTimeout);
  cur = null;
}
