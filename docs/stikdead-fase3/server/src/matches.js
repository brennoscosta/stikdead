import { Router } from 'express';
import { requireAuth } from './auth.js';
import { q, pool } from './db.js';

// Recompensas calculadas SEMPRE no servidor (cliente nunca envia valores de XP/moeda).
const BASE = { win: { xp: 350, coins: 300 }, loss: { xp: 120, coins: 100 } };
const TRAINING_FACTOR = 0.5; // treino vs bot rende 50% e não afeta ranking/registro
const DIFFS = new Set(['facil', 'medio', 'dificil', 'insano']);
const DIFF_BONUS = { facil: 0, medio: 0.1, dificil: 0.25, insano: 0.5 };

export const xpForLevel = (level) => level * 500;

function computeRewards({ won, difficulty, stats, winsB }) {
  const base = won ? BASE.win : BASE.loss;
  let xp = base.xp;
  const bonuses = [];

  if (won && winsB === 0) { xp += 50; bonuses.push({ label: 'Perfeito', xp: 50 }); }
  if ((stats.maxCombo || 0) >= 8) { xp += 30; bonuses.push({ label: 'Combo insano', xp: 30 }); }
  if (won && stats.finisher) { xp += 20; bonuses.push({ label: 'Finalização', xp: 20 }); }

  const diffMult = 1 + (won ? DIFF_BONUS[difficulty] || 0 : 0);
  xp = Math.round(xp * diffMult * TRAINING_FACTOR);
  const coins = Math.round(base.coins * diffMult * TRAINING_FACTOR);
  return { xp, coins, bonuses };
}

function applyXp(level, xp, gain) {
  xp += gain;
  let levelsUp = 0;
  while (xp >= xpForLevel(level)) {
    xp -= xpForLevel(level);
    level++;
    levelsUp++;
  }
  return { level, xp, levelsUp };
}

const router = Router();

router.post('/training', requireAuth, async (req, res) => {
  const { difficulty, won, wins, duration, stats = {} } = req.body || {};

  if (!DIFFS.has(difficulty)) return res.status(400).json({ error: 'Dificuldade inválida.' });
  if (typeof won !== 'boolean') return res.status(400).json({ error: 'Resultado inválido.' });
  if (!Array.isArray(wins) || wins.length !== 2 || wins.some((w) => !Number.isInteger(w) || w < 0 || w > 2))
    return res.status(400).json({ error: 'Placar inválido.' });
  const dur = Math.round(Number(duration));
  if (!Number.isFinite(dur) || dur < 8 || dur > 1800)
    return res.status(400).json({ error: 'Duração inválida.' });

  const safeStats = {
    damage: Math.max(0, Math.min(2000, Math.round(Number(stats.damage) || 0))),
    hits: Math.max(0, Math.min(500, Math.round(Number(stats.hits) || 0))),
    maxCombo: Math.max(0, Math.min(60, Math.round(Number(stats.maxCombo) || 0))),
    blocked: Math.max(0, Math.min(500, Math.round(Number(stats.blocked) || 0))),
    finisher: !!stats.finisher,
  };

  const rewards = computeRewards({ won, difficulty, stats: safeStats, winsB: wins[1] });

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { rows } = await client.query(
      'SELECT level, xp, coins FROM profiles WHERE user_id = $1 FOR UPDATE',
      [req.userId]
    );
    const p = rows[0];
    const lv = applyXp(p.level, p.xp, rewards.xp);
    await client.query(
      `UPDATE profiles SET level = $1, xp = $2, coins = coins + $3, updated_at = now()
        WHERE user_id = $4`,
      [lv.level, lv.xp, rewards.coins, req.userId]
    );
    await client.query(
      `INSERT INTO matches (user_id, opponent_type, difficulty, won, wins_a, wins_b, duration_s, stats, xp_gain, coin_gain)
       VALUES ($1, 'bot', $2, $3, $4, $5, $6, $7, $8, $9)`,
      [req.userId, difficulty, won, wins[0], wins[1], dur, safeStats, rewards.xp, rewards.coins]
    );
    await client.query('COMMIT');

    res.json({
      rewards: { ...rewards, levelsUp: lv.levelsUp },
      profile: {
        level: lv.level,
        xp: lv.xp,
        xpNext: xpForLevel(lv.level),
        coins: p.coins + rewards.coins,
      },
    });
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
});

router.get('/history', requireAuth, async (req, res) => {
  const { rows } = await q(
    `SELECT opponent_type, difficulty, won, wins_a, wins_b, duration_s, xp_gain, coin_gain, created_at
       FROM matches WHERE user_id = $1 ORDER BY created_at DESC LIMIT 20`,
    [req.userId]
  );
  res.json({ matches: rows });
});

export default router;
