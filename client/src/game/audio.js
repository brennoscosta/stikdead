// STIKDEAD :: motor de som — 100% sintetizado (WebAudio), zero arquivos
// Estética seca: thumps graves, whooshes de ar, estalos de bloqueio, sino de KO.
let ctx = null;
let master = null;
let muted = false;
try { muted = localStorage.getItem('stikdead:muted') === '1'; } catch { /* ok */ }

function ensure() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = muted ? 0 : 0.5;
    master.connect(ctx.destination);
  }
  if (ctx.state === 'suspended') ctx.resume().catch(() => {});
  return ctx;
}

// destrava o áudio no primeiro gesto (política dos navegadores)
export function unlockAudio() { ensure(); }

export function toggleMute() {
  muted = !muted;
  try { localStorage.setItem('stikdead:muted', muted ? '1' : '0'); } catch { /* ok */ }
  if (master) master.gain.value = muted ? 0 : 0.5;
  return muted;
}
export const isMuted = () => muted;

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

// ===== SFX do jogo =====
export const sfx = {
  punch() { thump(120, 0.12, 0.9); noise({ dur: 0.07, from: 2400, to: 500, vol: 0.35 }); },
  heavy() {
    noise({ dur: 0.14, from: 900, to: 4200, vol: 0.3 });            // whoosh
    thump(70, 0.24, 1.1, 0.05);                                      // impacto
    noise({ dur: 0.1, from: 3800, to: 700, vol: 0.5, when: 0.05 }); // estalo
  },
  block() {
    tone(520, 0.08, 0.35, 'square');
    noise({ dur: 0.06, from: 5200, to: 2400, vol: 0.25 });
  },
  hurt() { thump(150, 0.09, 0.5); },
  dash() { noise({ dur: 0.18, from: 500, to: 3200, vol: 0.3, q: 2 }); },
  ko() {
    thump(55, 0.6, 1.3);
    noise({ dur: 0.3, from: 2000, to: 200, vol: 0.5 });
    tone(880, 1.6, 0.16, 'sine', 0.12);   // sino
    tone(1318, 1.2, 0.08, 'sine', 0.12);
  },
  firstblood() { tone(220, 0.12, 0.3, 'sawtooth'); tone(330, 0.2, 0.3, 'sawtooth', 0.1); },
  round() { thump(90, 0.2, 0.7); thump(90, 0.2, 0.7, 0.22); },
  victory() { [440, 554, 659, 880].forEach((f, i) => tone(f, 0.34, 0.22, 'triangle', i * 0.12)); },
  defeat() { [330, 262, 196].forEach((f, i) => tone(f, 0.42, 0.2, 'triangle', i * 0.16)); },
  drop() { [660, 880, 1108].forEach((f, i) => tone(f, 0.2, 0.18, 'sine', i * 0.08)); },
  click() { noise({ dur: 0.04, from: 3000, to: 1500, vol: 0.15 }); },
};

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
    case 'fightstart': sfx.round(); break;
    case 'suddendeath': sfx.firstblood(); break;
    case 'matchend':
      if (mySide != null) (e.winner === mySide ? sfx.victory() : sfx.defeat());
      else sfx.victory();
      break;
    default: break;
  }
}
