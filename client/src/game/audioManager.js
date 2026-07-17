// STIKDEAD :: AudioManager — a mesa de som central do jogo (Fase 5: global).
// Canais: master → music / sfx (→ ui / gameplay) / ambience / voice.
// ui e gameplay são FILHOS de sfx: as preferências antigas (Efeitos) seguem
// valendo pros dois; os volumes novos são multiplicadores aditivos por canal.
// Preferências persistentes (backend por usuário + localStorage) e mudo em
// segundo plano. NADA no jogo toca som fora desses barramentos.
import { api, getToken } from '../lib/api.js';

const LS_KEY = 'stikdead:audio';
const DEFAULTS = {
  masterEnabled: true,
  // 40% por padrão: o som marca presença sem ensurdecer — clima samurai
  // tenso porém leve (usuários com preferência salva mantêm o valor deles).
  masterVolume: 0.4,
  musicEnabled: true,
  musicVolume: 0.65,
  sfxEnabled: true,
  sfxVolume: 0.8,
  ambienceEnabled: true,
  ambienceVolume: 0.45,
  muteOnBlur: true,
  // Fase 5 (aditivos — perfis antigos sem estes campos caem nos defaults):
  uiVolume: 1,        // multiplicador dentro do canal Efeitos
  gameplayVolume: 1,  // multiplicador dentro do canal Efeitos
  voiceEnabled: true,
  voiceVolume: 0.75,  // volume inicial do narrador (bíblia: 75%)
};

// trims internos: equilibram os canais entre si (o jogador só vê 0–100%)
const TRIM = { music: 0.4, sfx: 0.62, ambience: 0.55, voice: 0.7 };

const clamp01 = (v) => Math.min(1, Math.max(0, Number(v) || 0));
const sane = (raw) => {
  const s = { ...DEFAULTS };
  if (raw && typeof raw === 'object') {
    for (const k of Object.keys(DEFAULTS)) {
      if (k.endsWith('Volume')) { if (typeof raw[k] === 'number') s[k] = clamp01(raw[k]); }
      else if (typeof raw[k] === 'boolean') s[k] = raw[k];
    }
  }
  return s;
};

// carrega ANTES de qualquer som: localStorage primeiro, backend depois (merge)
let settings = (() => {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) return sane(JSON.parse(raw));
    // migração do mudo antigo (botão 🔊 da luta)
    if (localStorage.getItem('stikdead:muted') === '1') return { ...DEFAULTS, masterEnabled: false };
  } catch { /* ok */ }
  return { ...DEFAULTS };
})();

let ctx = null;
let masterGain = null;
const bus = { music: null, sfx: null, ambience: null, voice: null, ui: null, gameplay: null };
let blurDucked = false; // aba em segundo plano (não mexe nas preferências)

const masterTarget = () => (settings.masterEnabled && !blurDucked ? settings.masterVolume : 0);
const busTarget = (ch) => {
  if (ch === 'ui') return clamp01(settings.uiVolume);             // relativo ao pai (sfx)
  if (ch === 'gameplay') return clamp01(settings.gameplayVolume); // relativo ao pai (sfx)
  return settings[`${ch}Enabled`] ? settings[`${ch}Volume`] * TRIM[ch] : 0;
};

function ramp(node, value, tc = 0.06) {
  if (!node || !ctx) return;
  node.gain.cancelScheduledValues(ctx.currentTime);
  node.gain.setTargetAtTime(value, ctx.currentTime, tc);
}

export function ensureCtx() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    masterGain = ctx.createGain();
    masterGain.gain.value = masterTarget(); // preferências valem desde o 1º sample
    masterGain.connect(ctx.destination);
    for (const ch of ['music', 'sfx', 'ambience', 'voice']) {
      bus[ch] = ctx.createGain();
      bus[ch].gain.value = busTarget(ch);
      bus[ch].connect(masterGain);
    }
    for (const ch of ['ui', 'gameplay']) { // sub-canais dos Efeitos
      bus[ch] = ctx.createGain();
      bus[ch].gain.value = busTarget(ch);
      bus[ch].connect(bus.sfx);
    }
  }
  if (ctx.state === 'suspended') ctx.resume().catch(() => {});
  return ctx;
}
export const getBus = (ch) => { ensureCtx(); return bus[ch]; };

// ===== persistência =====
let saveTimer = null;
function persist() {
  try { localStorage.setItem(LS_KEY, JSON.stringify(settings)); } catch { /* ok */ }
  try { localStorage.setItem('stikdead:muted', settings.masterEnabled ? '0' : '1'); } catch { /* ok */ }
  if (!getToken()) return;
  clearTimeout(saveTimer); // backend: 1 PATCH por rajada de ajustes
  saveTimer = setTimeout(() => {
    api('/api/auth/me', { method: 'PATCH', body: { audioSettings: settings } }).catch(() => {});
  }, 900);
}

// preferências vindas do perfil (backend vence o localStorage)
export function applyRemoteSettings(remote) {
  if (!remote || typeof remote !== 'object') return;
  settings = sane(remote);
  try { localStorage.setItem(LS_KEY, JSON.stringify(settings)); } catch { /* ok */ }
  refreshGains();
  emit();
}

// ===== estado → ganhos =====
const listeners = new Set();
const emit = () => listeners.forEach((f) => f(getAudioSettings()));
export const onAudioChange = (f) => { listeners.add(f); return () => listeners.delete(f); };
export const getAudioSettings = () => ({ ...settings });

function refreshGains() {
  if (!ctx) return;
  ramp(masterGain, masterTarget());
  for (const ch of ['music', 'sfx', 'ambience', 'voice', 'ui', 'gameplay']) ramp(bus[ch], busTarget(ch));
}

function set(patch) {
  settings = { ...settings, ...patch };
  refreshGains();
  persist();
  emit();
}

// ===== API pública (a tela de Configurações SÓ fala com estes métodos) =====
export const setMasterEnabled = (v) => set({ masterEnabled: !!v });     // desligar NÃO zera os volumes salvos
export const setMasterVolume = (v) => set({ masterVolume: clamp01(v) });
export const setMusicEnabled = (v) => set({ musicEnabled: !!v });
export const setMusicVolume = (v) => set({ musicVolume: clamp01(v) });
export const setSfxEnabled = (v) => set({ sfxEnabled: !!v });
export const setSfxVolume = (v) => set({ sfxVolume: clamp01(v) });
export const setAmbienceEnabled = (v) => set({ ambienceEnabled: !!v });
export const setAmbienceVolume = (v) => set({ ambienceVolume: clamp01(v) });
export const setVoiceEnabled = (v) => set({ voiceEnabled: !!v });
export const setVoiceVolume = (v) => set({ voiceVolume: clamp01(v) });
export const setMuteOnBlur = (v) => { set({ muteOnBlur: !!v }); if (!v && blurDucked) { blurDucked = false; refreshGains(); } };

// canal → campo de settings (API genérica do prompt mestre)
export function setChannelVolume(channel, value) {
  const mapa = {
    master: 'masterVolume', music: 'musicVolume', sfx: 'sfxVolume',
    ambience: 'ambienceVolume', voice: 'voiceVolume',
    ui: 'uiVolume', gameplay: 'gameplayVolume',
  };
  const campo = mapa[channel];
  if (campo) set({ [campo]: clamp01(value) });
}

// compat: botão 🔊/🔇 da luta continua funcionando, agora como Som Geral
export const isMuted = () => !settings.masterEnabled;
export function toggleMute() { setMasterEnabled(!settings.masterEnabled); return isMuted(); }

// ===== silenciar em segundo plano =====
function duck(hidden) {
  if (!settings.muteOnBlur) return;
  blurDucked = hidden;
  if (!ctx) return;
  ramp(masterGain, masterTarget(), hidden ? 0.12 : 0.35); // sai rápido, volta suave
}
if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', () => duck(document.hidden));
  window.addEventListener('blur', () => duck(true));
  window.addEventListener('focus', () => duck(document.hidden));
}

// ===== Fase 5: reprodução de arquivos reais (biblioteca ElevenLabs) =====
// A implementação vive em audioLibrary.js (buffers, pooling, cooldown,
// crossfade); aqui só re-exportamos pra API global do prompt mestre.
export { playUi, playGameplay, playVoice, preload, AUDIO_FILES, musicForPath } from './audioLibrary.js';

// espia de QA (somente leitura): estado dos canais p/ inspecionar no console
if (typeof window !== 'undefined') {
  window.__sdAudio = {
    settings: getAudioSettings,
    gains: () => (ctx ? {
      state: ctx.state,
      master: +masterGain.gain.value.toFixed(3),
      music: +bus.music.gain.value.toFixed(3),
      sfx: +bus.sfx.gain.value.toFixed(3),
      ambience: +bus.ambience.gain.value.toFixed(3),
      voice: +bus.voice.gain.value.toFixed(3),
      ui: +bus.ui.gain.value.toFixed(3),
      gameplay: +bus.gameplay.gain.value.toFixed(3),
    } : null),
  };
}
