// STIKDEAD :: PATENTES — a jornada de Saco de Pancada até a própria MORTE 💀
// Uma patente a cada 2 níveis. Nível máximo: 100. Conquista permanente: nunca desce.

export const MAX_LEVEL = 100;

const N = [
  // ATO I — A RUA (nv 2-20)
  'Saco de Pancada', 'Pé de Chinelo', 'Novato', 'Brigão de Beco', 'Quebra-Galho',
  'Casca Grossa', 'Valentão', 'Cão de Briga', 'Rei da Viela', 'Terror do Bairro',
  // ATO II — O DOJO (nv 22-40)
  'Discípulo', 'Punho de Ferro', 'Perna Voadora', 'Sombra do Mestre', 'Faixa de Sangue',
  'Guardião do Tatame', 'Mão de Pedra', 'Osso Duro', 'Mestre Jovem', 'Senhor do Dojo',
  // ATO III — A ARENA (nv 42-60)
  'Gladiador', 'Duelista', 'Mercenário', 'Quebra-Crânios', 'Carrasco',
  'Demolidor', 'Campeão do Fosso', 'Fera Enjaulada', 'Imbatível', 'Rei da Arena',
  // ATO IV — A LENDA (nv 62-80)
  'Espectro', 'Lâmina Silenciosa', 'Flagelo', 'Pesadelo Ambulante', 'Devorador de Reis',
  'Meio-Demônio', 'Avatar da Fúria', 'Imortal', 'Lenda Viva', 'Mito',
  // ATO V — A MORTE (nv 82-100)
  'Aprendiz do Ceifador', 'Coveiro', 'Mão da Morte', 'Shinigami', 'Ceifador',
  'Senhor dos Ossos', 'Ceifador Supremo', 'Encarnação do Fim', 'A Própria Morte', 'STIKDEAD',
];

const ATOS = ['A RUA', 'O DOJO', 'A ARENA', 'A LENDA', 'A MORTE'];
const EMOJI_FALLBACK = ['🥊', '🥋', '⚔️', '👁️', '💀']; // por ato, enquanto a insígnia não chega

export const PATENTS = N.map((name, i) => ({
  id: i + 1,
  name,
  level: (i + 1) * 2,           // nv 2, 4, 6 ... 100
  ato: ATOS[Math.floor(i / 10)],
  emoji: EMOJI_FALLBACK[Math.floor(i / 10)],
  icon: `/patentes/p${String(i + 1).padStart(2, '0')}.webp`,
}));

// a patente atual de um nível (ou null antes do nv 2)
export const patentFor = (level) => {
  const idx = Math.min(PATENTS.length, Math.floor((level || 0) / 2)) - 1;
  return idx >= 0 ? PATENTS[idx] : null;
};
