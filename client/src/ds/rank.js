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

export const tierBase = (t) => String(t || 'BRONZE').split('_')[0].toUpperCase();
export const rankArte = (t) => ARTE[tierBase(t)] || ARTE.BRONZE;
export const rankCor = (t) => CORES_TIER[tierBase(t)] || '#a9713d';
export const rankNome = (t) => String(t || 'BRONZE_III').replace('_', ' ');
