import { Router } from 'express';
import { requireAuth } from './auth.js';
import { q, pool } from './db.js';
import { bumpMissions } from './missions.js';

// Recompensas calculadas SEMPRE no servidor (cliente nunca envia valores de XP/moeda).
import { computeRewards as computeBase, applyXp, xpForLevel } from './rewards.js';

const TRAINING_FACTOR = 0.25; // treino vs bot rende 25% (cortado pela metade em 07/2026) e não afeta ranking
const DIFFS = new Set(['facil', 'medio', 'dificil', 'insano']);
const DIFF_BONUS = { facil: 0, medio: 0.1, dificil: 0.25, insano: 0.5 };

const computeRewards = ({ won, difficulty, stats, winsB }) =>
  computeBase({
    won, stats, winsB,
    diffMult: 1 + (won ? DIFF_BONUS[difficulty] || 0 : 0),
    factor: TRAINING_FACTOR,
  });

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

  const rewards = computeRewards({ won, difficulty, stats: safeStats, winsB: wins[1], training: true });

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
      `UPDATE profiles SET level = $1, xp = $2, coins = GREATEST(0, coins + $3), updated_at = now()
        WHERE user_id = $4`,
      [lv.level, lv.xp, rewards.coins, req.userId]
    );
    await client.query(
      `INSERT INTO matches (user_id, opponent_type, difficulty, won, wins_a, wins_b, duration_s, stats, xp_gain, coin_gain)
       VALUES ($1, 'bot', $2, $3, $4, $5, $6, $7, $8, $9)`,
      [req.userId, difficulty, won, wins[0], wins[1], dur, safeStats, rewards.xp, rewards.coins]
    );
    await client.query('COMMIT');

    bumpMissions(req.userId, safeStats, !!won);

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
    `SELECT m.opponent_type, m.difficulty, m.won, m.wins_a, m.wins_b, m.duration_s, m.xp_gain, m.coin_gain, m.created_at,
            p.fighter_name AS opponent_name, p.tier AS opponent_tier, p.level AS opponent_level
       FROM matches m
       LEFT JOIN profiles p ON p.user_id = m.opponent_id
      WHERE m.user_id = $1 ORDER BY m.created_at DESC LIMIT 20`,
    [req.userId]
  );
  res.json({ matches: rows });
});

router.get('/all', requireAuth, async (req, res) => {
  const { rows } = await q(
    `SELECT m.opponent_type, m.difficulty, m.won, m.wins_a, m.wins_b, m.duration_s,
            m.xp_gain, m.coin_gain, m.created_at,
            p.fighter_name AS opponent_name
       FROM matches m
       LEFT JOIN profiles p ON p.user_id = m.opponent_id
      WHERE m.user_id = $1
      ORDER BY m.created_at DESC
      LIMIT 300`,
    [req.userId]
  );
  res.json({ matches: rows });
});

router.get('/summary', requireAuth, async (req, res) => {
  const { rows } = await q(
    `SELECT COUNT(*)::int AS partidas,
            COALESCE(SUM(duration_s), 0)::int AS tempo_s,
            COALESCE(SUM((stats->>'damage')::int), 0)::int AS dano,
            COALESCE(SUM((stats->>'hits')::int), 0)::int AS golpes,
            COALESCE(SUM((stats->>'blocked')::int), 0)::int AS bloqueios,
            COALESCE(MAX((stats->>'maxCombo')::int), 0)::int AS combo_max,
            COALESCE(SUM(CASE WHEN (stats->>'finisher')::boolean THEN 1 ELSE 0 END), 0)::int AS finalizacoes
       FROM matches WHERE user_id = $1`,
    [req.userId]
  );
  res.json(rows[0]);
});


// ===== A CARREIRA COMPLETA DO LUTADOR =====
router.get('/career', requireAuth, async (req, res) => {
  const uid = req.userId;
  const [prof, pos, semana, insano, bots, apostas, recentes] = await Promise.all([
    q('SELECT p.fighter_name, p.level, p.xp, p.coins, p.diamonds, p.rank_points, p.tier, p.wins, p.losses, p.win_streak, u.created_at FROM profiles p JOIN users u ON u.id = p.user_id WHERE p.user_id = $1', [uid]),
    q('SELECT COUNT(*) + 1 AS pos FROM profiles WHERE rank_points > (SELECT rank_points FROM profiles WHERE user_id = $1)', [uid]),
    q(`SELECT COUNT(*) FILTER (WHERE won) AS w, COUNT(*) FILTER (WHERE NOT won) AS l
         FROM matches WHERE user_id = $1 AND opponent_type = 'player' AND created_at > now() - interval '7 days'`, [uid]),
    q(`SELECT COUNT(*) FILTER (WHERE won) AS w, COUNT(*) FILTER (WHERE NOT won) AS l
         FROM matches WHERE user_id = $1 AND opponent_type = 'bot' AND difficulty = 'insano'`, [uid]),
    q(`SELECT COUNT(*) FILTER (WHERE won) AS w, COUNT(*) FILTER (WHERE NOT won) AS l
         FROM matches WHERE user_id = $1 AND opponent_type = 'bot'`, [uid]),
    q(`SELECT kind, COUNT(*) AS n, COALESCE(SUM((data->>'amount')::bigint), 0) AS total
         FROM activities WHERE user_id = $1 AND kind IN ('bet_win','bet_loss') GROUP BY kind`, [uid]),
    q(`SELECT opponent_type, difficulty, won, wins_a, wins_b, xp_gain, coin_gain, created_at
         FROM matches WHERE user_id = $1 ORDER BY id DESC LIMIT 10`, [uid]),
  ]);
  const bw = apostas.rows.find((r) => r.kind === 'bet_win') || { n: 0, total: 0 };
  const bl = apostas.rows.find((r) => r.kind === 'bet_loss') || { n: 0, total: 0 };
  res.json({
    profile: prof.rows[0],
    rankGlobal: Number(pos.rows[0]?.pos || 0),
    semana: { wins: Number(semana.rows[0]?.w || 0), losses: Number(semana.rows[0]?.l || 0) },
    insano: { wins: Number(insano.rows[0]?.w || 0), losses: Number(insano.rows[0]?.l || 0) },
    bots: { wins: Number(bots.rows[0]?.w || 0), losses: Number(bots.rows[0]?.l || 0) },
    apostas: { ganhas: Number(bw.n), perdidas: Number(bl.n), totalGanho: Number(bw.total), totalPerdido: Number(bl.total) },
    recentes: recentes.rows,
  });
});

export default router;
