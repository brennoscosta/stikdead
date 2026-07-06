// STIKDEAD :: recompensas e ranking (servidor)
// Toda matemática de valor mora aqui. O cliente nunca calcula nada disso.

export const xpForLevel = (level) => level * 500;

const BASE = { win: { xp: 350, coins: 300 }, loss: { xp: 120, coins: 100 } };

const TIERS = ['BRONZE', 'PRATA', 'OURO', 'PLATINA', 'DIAMANTE', 'MASTER', 'GRANDMASTER'];
const SUB = ['III', 'II', 'I'];

export function tierFor(points) {
  const step = Math.min(TIERS.length * 3 - 1, Math.floor(Math.max(0, points) / 100));
  return `${TIERS[Math.floor(step / 3)]}_${SUB[step % 3]}`;
}

export function computeRewards({ won, stats = {}, winsB = 0, diffMult = 1, factor = 1, streak = 0, training = false }) {
  // derrota: 0 XP; no online, multa fixa de 200 moedas (treino não multa)
  if (!won) return { xp: 0, coins: training ? 0 : -200, bonuses: [] };

  const base = BASE.win;
  let xp = base.xp;
  const bonuses = [];

  if (winsB === 0) { xp += 50; bonuses.push({ label: 'Perfeito', xp: 50 }); }
  if ((stats.maxCombo || 0) >= 8) { xp += 30; bonuses.push({ label: 'Combo insano', xp: 30 }); }
  if (won && stats.finisher) { xp += 20; bonuses.push({ label: 'Finalização', xp: 20 }); }
  if (won && streak >= 2) {
    const b = 50 * Math.min(streak - 1, 3);
    xp += b;
    bonuses.push({ label: `Sequência de ${streak} vitórias`, xp: b });
  }

  xp = Math.round(xp * diffMult * factor);
  const coins = Math.round(base.coins * diffMult * factor);
  return { xp, coins, bonuses };
}

export function applyXp(level, xp, gain) {
  xp += gain;
  let levelsUp = 0;
  while (xp >= xpForLevel(level)) {
    xp -= xpForLevel(level);
    level++;
    levelsUp++;
  }
  return { level, xp, levelsUp };
}

// Pontos de ranking estilo Elo simplificado.
export function rankDelta(winnerPts, loserPts) {
  const diff = Math.max(-250, Math.min(250, loserPts - winnerPts));
  const win = Math.round(25 + diff * 0.04);   // 15..35
  const loss = Math.round(20 + diff * 0.032); // vence quem tem menos: perde menos
  return { win: Math.max(12, win), loss: Math.max(8, loss) };
}
