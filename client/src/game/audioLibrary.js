// STIKDEAD :: Biblioteca de áudio real (Fase 5) — toca os MP3 gerados pela
// ElevenLabs (client/public/audio/**) pelos canais do AudioManager.
// Convive com os motores procedurais: se um arquivo não carregar (offline,
// deploy incompleto), quem chamou recebe `false`/callback e usa o fallback
// sintetizado. NADA aqui toca fora dos barramentos do AudioManager.
import { ensureCtx, getBus } from './audioManager.js';

// ---------------------------------------------------------------- catálogo ----
// Espelho 1:1 do audio-manifest.json (55 itens aprovados). url é relativa ao
// site (Vite copia client/public/** pra raiz do dist). ch = canal do mixer.
export const AUDIO_FILES = {
  ui_hover_soft_01: { url: '/audio/ui/buttons/ui_hover_soft_01.mp3', ch: 'ui' },
  ui_hover_soft_02: { url: '/audio/ui/buttons/ui_hover_soft_02.mp3', ch: 'ui' },
  ui_click_primary_01: { url: '/audio/ui/buttons/ui_click_primary_01.mp3', ch: 'ui' },
  ui_click_secondary_01: { url: '/audio/ui/buttons/ui_click_secondary_01.mp3', ch: 'ui' },
  ui_confirm_01: { url: '/audio/ui/buttons/ui_confirm_01.mp3', ch: 'ui' },
  ui_cancel_01: { url: '/audio/ui/buttons/ui_cancel_01.mp3', ch: 'ui' },
  ui_error_01: { url: '/audio/ui/errors/ui_error_01.mp3', ch: 'ui' },
  ui_panel_open_01: { url: '/audio/ui/modal/ui_panel_open_01.mp3', ch: 'ui' },
  ui_panel_close_01: { url: '/audio/ui/modal/ui_panel_close_01.mp3', ch: 'ui' },
  ui_tab_switch_01: { url: '/audio/ui/navigation/ui_tab_switch_01.mp3', ch: 'ui' },
  ui_pagination_01: { url: '/audio/ui/navigation/ui_pagination_01.mp3', ch: 'ui' },
  ui_modal_impact_01: { url: '/audio/ui/navigation/ui_modal_impact_01.mp3', ch: 'ui' },
  ui_nav_header_01: { url: '/audio/ui/navigation/ui_nav_header_01.mp3', ch: 'ui' },
  ui_notification_01: { url: '/audio/ui/notifications/ui_notification_01.mp3', ch: 'ui' },
  ui_chat_message_01: { url: '/audio/ui/notifications/ui_chat_message_01.mp3', ch: 'ui' },
  matchmaking_found_01: { url: '/audio/ui/notifications/matchmaking_found_01.mp3', ch: 'ui' },
  style_ronin_select_01: { url: '/audio/styles/ronin/style_ronin_select_01.mp3', ch: 'ui' },
  style_shinobi_select_01: { url: '/audio/styles/shinobi/style_shinobi_select_01.mp3', ch: 'ui' },
  style_monk_select_01: { url: '/audio/styles/monk/style_monk_select_01.mp3', ch: 'ui' },
  style_berserker_select_01: { url: '/audio/styles/berserker/style_berserker_select_01.mp3', ch: 'ui' },
  style_reaper_select_01: { url: '/audio/styles/reaper/style_reaper_select_01.mp3', ch: 'ui' },
  bot_easy_select_01: { url: '/audio/bots/easy/bot_easy_select_01.mp3', ch: 'ui' },
  bot_medium_select_01: { url: '/audio/bots/medium/bot_medium_select_01.mp3', ch: 'ui' },
  bot_hard_select_01: { url: '/audio/bots/hard/bot_hard_select_01.mp3', ch: 'ui' },
  bot_insane_select_01: { url: '/audio/bots/insane/bot_insane_select_01.mp3', ch: 'ui' },
  reward_coin_01: { url: '/audio/rewards/reward_coin_01.mp3', ch: 'ui' },
  reward_coin_02: { url: '/audio/rewards/reward_coin_02.mp3', ch: 'ui' },
  reward_coin_03: { url: '/audio/rewards/reward_coin_03.mp3', ch: 'ui' },
  reward_diamond_01: { url: '/audio/rewards/reward_diamond_01.mp3', ch: 'ui' },
  reward_achievement_01: { url: '/audio/rewards/reward_achievement_01.mp3', ch: 'ui' },
  reward_xp_01: { url: '/audio/rewards/reward_xp_01.mp3', ch: 'ui' },
  reward_item_common_01: { url: '/audio/rewards/reward_item_common_01.mp3', ch: 'ui' },
  reward_item_rare_01: { url: '/audio/rewards/reward_item_rare_01.mp3', ch: 'ui' },
  reward_item_epic_01: { url: '/audio/rewards/reward_item_epic_01.mp3', ch: 'ui' },
  reward_item_legendary_01: { url: '/audio/rewards/reward_item_legendary_01.mp3', ch: 'ui' },
  reward_levelup_01: { url: '/audio/rewards/reward_levelup_01.mp3', ch: 'ui' },
  reward_rank_up_01: { url: '/audio/rewards/reward_rank_up_01.mp3', ch: 'ui' },
  amb_lobby_wind_v01: { url: '/audio/ambience/lobby/amb_lobby_wind_v01.mp3', ch: 'ambience' },
  amb_lobby_embers_v01: { url: '/audio/ambience/lobby/amb_lobby_embers_v01.mp3', ch: 'ambience' },
  amb_lobby_lanterns_v01: { url: '/audio/ambience/lobby/amb_lobby_lanterns_v01.mp3', ch: 'ambience' },
  amb_lobby_footsteps_v01: { url: '/audio/ambience/lobby/amb_lobby_footsteps_v01.mp3', ch: 'ambience' },
  amb_lobby_training_v01: { url: '/audio/ambience/lobby/amb_lobby_training_v01.mp3', ch: 'ambience' },
  amb_lobby_gong_v01: { url: '/audio/ambience/lobby/amb_lobby_gong_v01.mp3', ch: 'ambience' },
  amb_lobby_crow_v01: { url: '/audio/ambience/lobby/amb_lobby_crow_v01.mp3', ch: 'ambience' },
  amb_lobby_crowd_v01: { url: '/audio/ambience/lobby/amb_lobby_crowd_v01.mp3', ch: 'ambience' },
  amb_lobby_flags_v01: { url: '/audio/ambience/lobby/amb_lobby_flags_v01.mp3', ch: 'ambience' },
  music_lobby_v01: { url: '/audio/music/lobby/music_lobby_v01.mp3', ch: 'music' },
  music_home_v01: { url: '/audio/music/home/music_home_v01.mp3', ch: 'music' },
  music_profile_v01: { url: '/audio/music/profile/music_profile_v01.mp3', ch: 'music' },
  music_inventory_v01: { url: '/audio/music/inventory/music_inventory_v01.mp3', ch: 'music' },
  music_shop_v01: { url: '/audio/music/shop/music_shop_v01.mp3', ch: 'music' },
  music_ranking_v01: { url: '/audio/music/ranking/music_ranking_v01.mp3', ch: 'music' },
  music_matchmaking_v01: { url: '/audio/music/matchmaking/music_matchmaking_v01.mp3', ch: 'music' },
  music_victory_stinger_v01: { url: '/audio/music/results/music_victory_stinger_v01.mp3', ch: 'music' },
  music_defeat_stinger_v01: { url: '/audio/music/results/music_defeat_stinger_v01.mp3', ch: 'music' },
  // Fase 10 — narrador (voz "Lucas", grave, pt-BR)
  voice_battle_start_01: { url: '/audio/voice/voice_battle_start_01.mp3', ch: 'voice' },
  voice_round_first_01: { url: '/audio/voice/voice_round_first_01.mp3', ch: 'voice' },
  voice_round_final_01: { url: '/audio/voice/voice_round_final_01.mp3', ch: 'voice' },
  voice_sudden_death_01: { url: '/audio/voice/voice_sudden_death_01.mp3', ch: 'voice' },
  voice_opponent_found_01: { url: '/audio/voice/voice_opponent_found_01.mp3', ch: 'voice' },
  voice_victory_01: { url: '/audio/voice/voice_victory_01.mp3', ch: 'voice' },
  voice_defeat_01: { url: '/audio/voice/voice_defeat_01.mp3', ch: 'voice' },
  voice_item_unlocked_01: { url: '/audio/voice/voice_item_unlocked_01.mp3', ch: 'voice' },
  voice_level_up_01: { url: '/audio/voice/voice_level_up_01.mp3', ch: 'voice' },
  voice_rank_up_01: { url: '/audio/voice/voice_rank_up_01.mp3', ch: 'voice' },
  voice_tournament_01: { url: '/audio/voice/voice_tournament_01.mp3', ch: 'voice' },
  // Lote 4 — combate (canal gameplay; variações pra nunca soar metralhadora)
  combat_punch_01: { url: '/audio/combat/combat_punch_01.mp3', ch: 'gameplay' },
  combat_punch_02: { url: '/audio/combat/combat_punch_02.mp3', ch: 'gameplay' },
  combat_punch_03: { url: '/audio/combat/combat_punch_03.mp3', ch: 'gameplay' },
  combat_heavy_01: { url: '/audio/combat/combat_heavy_01.mp3', ch: 'gameplay' },
  combat_heavy_02: { url: '/audio/combat/combat_heavy_02.mp3', ch: 'gameplay' },
  combat_block_01: { url: '/audio/combat/combat_block_01.mp3', ch: 'gameplay' },
  combat_block_02: { url: '/audio/combat/combat_block_02.mp3', ch: 'gameplay' },
  combat_hurt_01: { url: '/audio/combat/combat_hurt_01.mp3', ch: 'gameplay' },
  combat_hurt_02: { url: '/audio/combat/combat_hurt_02.mp3', ch: 'gameplay' },
  combat_dash_01: { url: '/audio/combat/combat_dash_01.mp3', ch: 'gameplay' },
  combat_ko_01: { url: '/audio/combat/combat_ko_01.mp3', ch: 'gameplay' },
  combat_skill_01: { url: '/audio/combat/combat_skill_01.mp3', ch: 'gameplay' },
  combat_skill_02: { url: '/audio/combat/combat_skill_02.mp3', ch: 'gameplay' },
  combat_skill_heavy_01: { url: '/audio/combat/combat_skill_heavy_01.mp3', ch: 'gameplay' },
  // Lote 5 — ambiente próprio de cada arena (toca SÓ durante a luta)
  amb_arena_dojo_v01: { url: '/audio/ambience/arenas/amb_arena_dojo_v01.mp3', ch: 'ambience' },
  amb_arena_temple_v01: { url: '/audio/ambience/arenas/amb_arena_temple_v01.mp3', ch: 'ambience' },
  amb_arena_prison_v01: { url: '/audio/ambience/arenas/amb_arena_prison_v01.mp3', ch: 'ambience' },
  amb_arena_neve_v01: { url: '/audio/ambience/arenas/amb_arena_neve_v01.mp3', ch: 'ambience' },
  amb_arena_deserto_v01: { url: '/audio/ambience/arenas/amb_arena_deserto_v01.mp3', ch: 'ambience' },
  amb_arena_praia_v01: { url: '/audio/ambience/arenas/amb_arena_praia_v01.mp3', ch: 'ambience' },
  amb_arena_cidade_rio_v01: { url: '/audio/ambience/arenas/amb_arena_cidade_rio_v01.mp3', ch: 'ambience' },
  amb_arena_cemiterio_v01: { url: '/audio/ambience/arenas/amb_arena_cemiterio_v01.mp3', ch: 'ambience' },
};

// arena do jogo → id do loop de ambiente correspondente
export const ARENA_AMBIENCE = {
  dojo: 'amb_arena_dojo_v01',
  temple: 'amb_arena_temple_v01',
  prison: 'amb_arena_prison_v01',
  neve: 'amb_arena_neve_v01',
  deserto: 'amb_arena_deserto_v01',
  praia: 'amb_arena_praia_v01',
  cidade_rio: 'amb_arena_cidade_rio_v01',
  cemiterio: 'amb_arena_cemiterio_v01',
};

// trilha por rota (bíblia, seção 3). Rotas não mapeadas caem no tema Home.
export const MUSIC_BY_PATH = {
  '/lobby': 'music_lobby_v01',
  '/perfil': 'music_profile_v01',
  '/carreira': 'music_profile_v01',
  '/inventario': 'music_inventory_v01',
  '/loja': 'music_shop_v01',
  '/rankings': 'music_ranking_v01',
};
export const DEFAULT_MUSIC = 'music_home_v01';
export const musicForPath = (p) => MUSIC_BY_PATH[p] || DEFAULT_MUSIC;

// ----------------------------------------------- SFX por buffer (curtos) ----
// Limites de simultaneidade (bíblia: "Limites de simultaneidade"):
const COOLDOWN_MS = 70;        // hover/click nunca metralham (60–100ms)
const MAX_POR_ID = 3;          // mesmo som, no máx. 3 sobrepostos
const MAX_POR_CANAL = 10;      // teto de vozes simultâneas por canal

const buffers = new Map();     // id -> AudioBuffer | Promise | 'failed'
const ultimaVez = new Map();   // id -> timestamp do último disparo
const ativos = { ui: 0, gameplay: 0, voice: 0, music: 0, ambience: 0 };
const ativosPorId = new Map();

function carregarBuffer(id) {
  const item = AUDIO_FILES[id];
  if (!item) return Promise.resolve(null);
  const cached = buffers.get(id);
  if (cached === 'failed') return Promise.resolve(null);
  if (cached) return cached instanceof Promise ? cached : Promise.resolve(cached);
  const ctx = ensureCtx();
  if (!ctx) return Promise.resolve(null);
  const p = fetch(item.url)
    .then((r) => { if (!r.ok) throw new Error(String(r.status)); return r.arrayBuffer(); })
    .then((ab) => ctx.decodeAudioData(ab))
    .then((buf) => { buffers.set(id, buf); return buf; })
    .catch(() => { buffers.set(id, 'failed'); return null; });
  buffers.set(id, p);
  return p;
}

/** Pré-carrega uma lista de ids (fire-and-forget, custo zero de reprodução). */
export function preload(ids) { for (const id of ids || []) carregarBuffer(id); }

function tocarBuffer(id, canal, { volume = 1, cooldownMs = COOLDOWN_MS } = {}) {
  const ctx = ensureCtx();
  if (!ctx || ctx.state !== 'running') return false;
  const agora = performance.now();
  if (agora - (ultimaVez.get(id) || 0) < cooldownMs) return true; // dentro do cooldown: "tocou" (silêncio proposital)
  const buf = buffers.get(id);
  if (!buf || buf instanceof Promise || buf === 'failed') {
    carregarBuffer(id); // aquece pro próximo disparo
    return false;       // quem chamou usa o fallback procedural desta vez
  }
  if (ativos[canal] >= MAX_POR_CANAL || (ativosPorId.get(id) || 0) >= MAX_POR_ID) return true;
  const out = getBus(canal) || getBus('sfx');
  if (!out) return false;
  const src = ctx.createBufferSource();
  src.buffer = buf;
  const g = ctx.createGain();
  g.gain.value = volume;
  src.connect(g).connect(out);
  ativos[canal] += 1;
  ativosPorId.set(id, (ativosPorId.get(id) || 0) + 1);
  src.onended = () => {
    ativos[canal] = Math.max(0, ativos[canal] - 1);
    ativosPorId.set(id, Math.max(0, (ativosPorId.get(id) || 0) - 1));
    try { g.disconnect(); } catch { /* ok */ }
  };
  ultimaVez.set(id, agora);
  src.start();
  return true;
}

/** Som de interface. opts.fallback roda se o arquivo ainda não estiver pronto. */
export function playUi(id, opts = {}) {
  const ok = tocarBuffer(id, 'ui', opts);
  if (!ok && typeof opts.fallback === 'function') opts.fallback();
  return ok;
}
/** Som de gameplay (combate/habilidades) — mesmo contrato do playUi. */
export function playGameplay(id, opts = {}) {
  const ok = tocarBuffer(id, 'gameplay', opts);
  if (!ok && typeof opts.fallback === 'function') opts.fallback();
  return ok;
}
/** Voz do narrador (Fase 10) — canal próprio, sem cooldown agressivo. */
export function playVoice(id, opts = {}) {
  const ok = tocarBuffer(id, 'voice', { cooldownMs: 250, ...opts });
  if (!ok && typeof opts.fallback === 'function') opts.fallback();
  return ok;
}
/** Stinger musical curto (vitória/derrota/conquista grande) — sai pelo canal MUSIC. */
export function playStinger(id, opts = {}) {
  const ok = tocarBuffer(id, 'music', { cooldownMs: 800, ...opts });
  if (!ok && typeof opts.fallback === 'function') opts.fallback();
  return ok;
}

// --------------------------------------- faixas longas (música/ambiente) ----
// HTMLAudioElement (streaming, sem decodificar 2min inteiros na memória),
// roteado pro canal certo via MediaElementSource. Crossfade por GainNode.
function criarFaixa(id, canal, { loop = true, volume = 1 } = {}) {
  const item = AUDIO_FILES[id];
  const ctx = ensureCtx();
  if (!item || !ctx) return null;
  const el = new Audio(item.url);
  el.loop = loop;
  el.crossOrigin = 'anonymous';
  el.preload = 'auto';
  const src = ctx.createMediaElementSource(el);
  const g = ctx.createGain();
  g.gain.value = 0; // nasce em silêncio; o fade-in é de quem chamou
  src.connect(g).connect(getBus(canal));
  return { id, el, gain: g, volume };
}

function fade(gainNode, alvo, seg = 0.9) {
  const ctx = ensureCtx();
  if (!ctx || !gainNode) return;
  gainNode.gain.cancelScheduledValues(ctx.currentTime);
  gainNode.gain.setTargetAtTime(alvo, ctx.currentTime, Math.max(0.02, seg / 3));
}

function matarFaixa(faixa, seg = 0.9) {
  if (!faixa) return;
  fade(faixa.gain, 0, seg);
  setTimeout(() => {
    try { faixa.el.pause(); faixa.el.src = ''; } catch { /* ok */ }
    try { faixa.gain.disconnect(); } catch { /* ok */ }
  }, seg * 1000 + 250);
}

// ===== música (uma faixa por vez, crossfade na troca de tela) =====
let musicaAtual = null;   // { id, el, gain }
let musicaFalhou = false; // true => o fallback procedural assume nesta sessão

export const musicFileFailed = () => musicaFalhou;
export const currentMusicId = () => (musicaAtual ? musicaAtual.id : null);

/**
 * Toca (ou troca com crossfade) a trilha de uma tela.
 * @returns {boolean} false se a biblioteca não pôde assumir (usar procedural).
 */
export function playMusic(id, { fadeSeg = 1.1, onFail } = {}) {
  const ctx = ensureCtx();
  if (!ctx || !AUDIO_FILES[id] || musicaFalhou) { onFail?.(); return false; }
  if (musicaAtual?.id === id) {
    if (musicaAtual.el.paused) {
      // autoplay tinha sido bloqueado: agora (gesto do jogador) toca e faz o fade-in
      const f = musicaAtual;
      f.el.play().then(() => fade(f.gain, 1, fadeSeg)).catch(() => {});
    }
    return true; // mesma faixa: nunca reinicia
  }
  const nova = criarFaixa(id, 'music', { loop: true });
  if (!nova) { onFail?.(); return false; }
  nova.el.addEventListener('error', () => {
    // arquivo indisponível: derruba a biblioteca de música e avisa o fallback
    musicaFalhou = true;
    if (musicaAtual?.id === id) musicaAtual = null;
    matarFaixa(nova, 0.1);
    onFail?.();
  }, { once: true });
  const antiga = musicaAtual;
  musicaAtual = nova;
  nova.el.play().then(() => {
    fade(nova.gain, 1, fadeSeg);
    if (antiga) matarFaixa(antiga, fadeSeg);
  }).catch(() => {
    // autoplay bloqueado: mantém pendente; próximo gesto (AudioMood) tenta de novo
    if (antiga) matarFaixa(antiga, fadeSeg);
  });
  return true;
}

export function stopMusic({ fadeSeg = 0.7 } = {}) {
  if (!musicaAtual) return;
  matarFaixa(musicaAtual, fadeSeg);
  musicaAtual = null;
}

// ===== ambiente (camadas contínuas + eventos raros com cooldown) =====
// Volumes relativos por camada (bíblia: nada distrai; eventos são raros).
const AMB_LOOPS = [
  { id: 'amb_lobby_wind_v01', vol: 0.75 },
  { id: 'amb_lobby_embers_v01', vol: 0.55 },
  { id: 'amb_lobby_lanterns_v01', vol: 0.45 },
  { id: 'amb_lobby_crowd_v01', vol: 0.30 },
  { id: 'amb_lobby_flags_v01', vol: 0.40 },
  { id: 'amb_lobby_footsteps_v01', vol: 0.35 },
  { id: 'amb_lobby_training_v01', vol: 0.35 },
];
const AMB_EVENTOS = [
  { id: 'amb_lobby_gong_v01', vol: 0.5, minGapMs: 45000, chance: 0.5 },
  { id: 'amb_lobby_crow_v01', vol: 0.5, minGapMs: 25000, chance: 0.6 },
];

let ambCamadas = [];       // faixas em loop
let ambTimer = null;       // agendador de eventos raros
let ambFalhou = false;
const ambUltimoEvento = new Map();

export const ambienceFileFailed = () => ambFalhou;
export const ambiencePlayingFile = () => ambCamadas.length > 0;

export function playAmbience({ fadeSeg = 1.4, onFail } = {}) {
  const ctx = ensureCtx();
  if (!ctx || ambFalhou) { onFail?.(); return false; }
  if (ambCamadas.length) {
    ambCamadas.forEach((f, i) => {
      if (f.el.paused) f.el.play().then(() => fade(f.gain, AMB_LOOPS[i]?.vol ?? 0.4, fadeSeg)).catch(() => {});
    });
    return true; // nunca dois mundos
  }
  let erros = 0;
  for (const cfg of AMB_LOOPS) {
    const f = criarFaixa(cfg.id, 'ambience', { loop: true });
    if (!f) { erros += 1; continue; }
    f.el.addEventListener('error', () => {
      erros += 1;
      if (erros >= AMB_LOOPS.length) { // só desiste se NENHUMA camada carregar
        ambFalhou = true;
        stopAmbience({ fadeSeg: 0.1 });
        onFail?.();
      }
    }, { once: true });
    ambCamadas.push(f);
    f.el.play().then(() => fade(f.gain, cfg.vol, fadeSeg)).catch(() => {});
  }
  if (!ambCamadas.length) { ambFalhou = true; onFail?.(); return false; }
  // eventos raros: gongo/corvo por buffer, com cooldown próprio (nunca seguidos)
  preload(AMB_EVENTOS.map((e) => e.id));
  const agenda = () => {
    ambTimer = setTimeout(() => {
      if (!ambCamadas.length) return;
      const e = AMB_EVENTOS[Math.floor(Math.random() * AMB_EVENTOS.length)];
      const agora = Date.now();
      if (Math.random() < e.chance && agora - (ambUltimoEvento.get(e.id) || 0) > e.minGapMs) {
        ambUltimoEvento.set(e.id, agora);
        tocarBuffer(e.id, 'ambience', { volume: e.vol, cooldownMs: 1000 });
      }
      agenda();
    }, 12000 + Math.random() * 18000);
  };
  agenda();
  return true;
}

export function stopAmbience({ fadeSeg = 0.8 } = {}) {
  clearTimeout(ambTimer); ambTimer = null;
  for (const f of ambCamadas) matarFaixa(f, fadeSeg);
  ambCamadas = [];
}

// ===== ambiente de ARENA (Lote 5) — um loop por luta, independente do lobby =====
// "Cada arena tem um som; quando termina a luta, termina o som."
let arenaFaixa = null;

export function playArenaAmbience(arenaKey, { fadeSeg = 1.2, volume = 0.45 } = {}) {
  const id = ARENA_AMBIENCE[arenaKey] || ARENA_AMBIENCE.dojo;
  const ctx = ensureCtx();
  if (!ctx || !AUDIO_FILES[id]) return false;
  if (arenaFaixa?.id === id) return true; // mesma arena: não reinicia
  stopArenaAmbience({ fadeSeg: 0.4 });
  const f = criarFaixa(id, 'ambience', { loop: true });
  if (!f) return false;
  f.el.addEventListener('error', () => { if (arenaFaixa === f) arenaFaixa = null; matarFaixa(f, 0.1); }, { once: true });
  arenaFaixa = f;
  f.el.play().then(() => fade(f.gain, volume, fadeSeg)).catch(() => {});
  return true;
}

export function stopArenaAmbience({ fadeSeg = 1.0 } = {}) {
  if (!arenaFaixa) return;
  matarFaixa(arenaFaixa, fadeSeg);
  arenaFaixa = null;
}

// sons de interface mais comuns: aquecer assim que o áudio destravar
export const PRELOAD_UI = [
  'ui_hover_soft_01', 'ui_click_primary_01', 'ui_click_secondary_01',
  'ui_confirm_01', 'ui_cancel_01', 'ui_error_01',
  'ui_panel_open_01', 'ui_panel_close_01', 'ui_tab_switch_01',
  'reward_coin_01', 'reward_item_common_01',
];

// combate: aquecer junto (14 arquivos curtos, ~250KB) — a luta não espera fetch
export const PRELOAD_COMBAT = [
  'combat_punch_01', 'combat_punch_02', 'combat_punch_03',
  'combat_heavy_01', 'combat_heavy_02', 'combat_block_01', 'combat_block_02',
  'combat_hurt_01', 'combat_hurt_02', 'combat_dash_01', 'combat_ko_01',
  'combat_skill_01', 'combat_skill_02', 'combat_skill_heavy_01',
];
