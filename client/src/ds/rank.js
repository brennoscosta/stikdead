// STIKDEAD DS :: emblemas de rank com arte oficial (Fase R)
// Os arquivos vivem em client/public/arte/ — gerados na direção "samurai underground".
const ARTE = {
  BRONZE: '/arte/rank-bronze.png',
  PRATA: '/arte/rank-prata.png',
  OURO: '/arte/rank-ouro.png',
  PLATINA: '/arte/rank-platina.png',
  DIAMANTE: '/arte/rank-diamante.png',
  MESTRE: '/arte/rank-mestre.png',
  GRANDMASTER: '/arte/rank-grandmaster.png',
};

export const CORES_TIER = {
  BRONZE: '#a9713d', PRATA: '#b9c2cc', OURO: '#e0a10b', PLATINA: '#5fd0c5',
  DIAMANTE: '#8b5cf6', MESTRE: '#d90429', GRANDMASTER: '#ff2244',
};

// o servidor grava o tier de MESTRE como "MASTER_x"; alias para não cair no bronze
const ALIAS = { MASTER: 'MESTRE' };
export const tierBase = (t) => {
  const b = String(t || 'BRONZE').split('_')[0].toUpperCase();
  return ALIAS[b] || b;
};
export const rankArte = (t) => ARTE[tierBase(t)] || ARTE.BRONZE;
export const rankCor = (t) => CORES_TIER[tierBase(t)] || '#a9713d';
export const rankNome = (t) => String(t || 'BRONZE_III').replace('MASTER', 'MESTRE').replace('_', ' ');

// ===== ladder do elo (espelha server/src/rewards.js: 100 pts por divisão) =====
const TIER_ORDER = ['BRONZE', 'PRATA', 'OURO', 'PLATINA', 'DIAMANTE', 'MESTRE', 'GRANDMASTER'];
const SUB = ['III', 'II', 'I'];
const MAX_STEP = TIER_ORDER.length * 3 - 1; // 20
export const tierForPoints = (pts) => {
  const step = Math.min(MAX_STEP, Math.floor(Math.max(0, Number(pts) || 0) / 100));
  return `${TIER_ORDER[Math.floor(step / 3)]}_${SUB[step % 3]}`;
};
// nome do próximo elo (ou null se já está no topo)
export const nextTierName = (pts) => {
  const step = Math.floor(Math.max(0, Number(pts) || 0) / 100);
  if (step >= MAX_STEP) return null;
  return tierForPoints((step + 1) * 100);
};
// quantos pontos faltam para subir de divisão
export const ptsToNext = (pts) => 100 - (Math.max(0, Number(pts) || 0) % 100);
