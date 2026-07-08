import { Router } from 'express';
import { requireAuth } from './auth.js';
import { q, pool } from './db.js';

// Pool de missões: progride a partir das estatísticas reais das partidas.
const POOL = [
  { id: 'win2',      label: 'Vença 2 partidas',        goal: 2,    coins: 150 },
  { id: 'dmg3000',   label: 'Cause 3.000 de dano',      goal: 3000, coins: 120 },
  { id: 'block10',   label: 'Bloqueie 10 ataques',      goal: 10,   coins: 100 },
  { id: 'hits40',    label: 'Acerte 40 golpes',         goal: 40,   coins: 100 },
  { id: 'combo8',    label: 'Faça um combo de 8+',      goal: 1,    coins: 130 },
  { id: 'finisher1', label: 'Execute 1 finalização',    goal: 1,    coins: 120 },
];

const today = () => new Date().toISOString().slice(0, 10);

// 3 missões do dia, determinísticas por usuário+data.
function pickMissions(userId, day) {
  let h = 0;
  for (const ch of `${userId}:${day}`) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  const idx = [];
  while (idx.length < 3) {
    h = (h * 1103515245 + 12345) >>> 0;
    const i = h % POOL.length;
    if (!idx.includes(i)) idx.push(i);
  }
  return idx.map((i) => ({ ...POOL[i], progress: 0, claimed: false }));
}

async function loadDay(userId) {
  const day = today();
  const { rows } = await q('SELECT missions, chest_claimed FROM daily_missions WHERE user_id = $1 AND day = $2', [userId, day]);
  if (rows[0]) return { day, missions: rows[0].missions, chestClaimed: rows[0].chest_claimed };
  const missions = pickMissions(userId, day);
  await q(
    `INSERT INTO daily_missions (user_id, day, missions) VALUES ($1, $2, $3)
     ON CONFLICT (user_id, day) DO NOTHING`,
    [userId, day, JSON.stringify(missions)]
  );
  return { day, missions, chestClaimed: false };
}

// Chamado após cada partida (treino e online) com as stats sanitizadas.
export async function bumpMissions(userId, stats, won) {
  try {
    const { day, missions } = await loadDay(userId);
    const inc = {
      win2: won ? 1 : 0,
      dmg3000: stats.damage || 0,
      block10: stats.blocked || 0,
      hits40: stats.hits || 0,
      combo8: (stats.maxCombo || 0) >= 8 ? 1 : 0,
      finisher1: stats.finisher ? 1 : 0,
    };
    let changed = false;
    for (const m of missions) {
      if (m.claimed || m.progress >= m.goal) continue;
      const add = inc[m.id] || 0;
      if (add > 0) {
        m.progress = Math.min(m.goal, m.progress + add);
        changed = true;
      }
    }
    if (changed)
      await q('UPDATE daily_missions SET missions = $1 WHERE user_id = $2 AND day = $3', [JSON.stringify(missions), userId, day]);
  } catch (err) {
    console.error('bumpMissions falhou:', err.message);
  }
}

const router = Router();

router.get('/missions', requireAuth, async (req, res) => {
  const data = await loadDay(req.userId);
  res.json(data);
});

router.post('/missions/claim', requireAuth, async (req, res) => {
  const missionId = String(req.body.missionId || '');
  const { day, missions } = await loadDay(req.userId);
  const m = missions.find((x) => x.id === missionId);
  if (!m) return res.status(404).json({ error: 'Missão não encontrada.' });
  if (m.claimed) return res.status(409).json({ error: 'Recompensa já coletada.' });
  if (m.progress < m.goal) return res.status(400).json({ error: 'Missão ainda não concluída.' });
  m.claimed = true;
  await q('UPDATE daily_missions SET missions = $1 WHERE user_id = $2 AND day = $3', [JSON.stringify(missions), req.userId, day]);
  const { rows } = await q(
    'UPDATE profiles SET coins = coins + $1, updated_at = now() WHERE user_id = $2 RETURNING coins',
    [m.coins, req.userId]
  );
  res.json({ ok: true, coins: rows[0].coins, missions });
});

// Baú diário: libera quando as 3 missões foram concluídas e coletadas.
router.post('/missions/chest', requireAuth, async (req, res) => {
  const { day, missions, chestClaimed } = await loadDay(req.userId);
  if (chestClaimed) return res.status(409).json({ error: 'Baú de hoje já aberto.' });
  if (!missions.every((m) => m.claimed))
    return res.status(400).json({ error: 'Complete e colete as 3 missões primeiro.' });

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query('UPDATE daily_missions SET chest_claimed = TRUE WHERE user_id = $1 AND day = $2', [req.userId, day]);
    const { rows } = await client.query(
      `SELECT id, name, rarity FROM items
        WHERE rarity = 'comum'
          AND id NOT IN (SELECT item_id FROM user_items WHERE user_id = $1)
        ORDER BY random() LIMIT 1`,
      [req.userId]
    );
    let item = null;
    let coins = null;
    if (rows[0]) {
      item = rows[0];
      await client.query(`INSERT INTO user_items (user_id, item_id, source) VALUES ($1, $2, 'drop')`, [req.userId, item.id]);
    } else {
      const up = await client.query(
        'UPDATE profiles SET coins = coins + 300, updated_at = now() WHERE user_id = $1 RETURNING coins',
        [req.userId]
      );
      coins = up.rows[0].coins;
    }
    await client.query('COMMIT');
    res.json({ ok: true, item, coins });
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
});

// ===== ranking =====
router.get('/rankings', requireAuth, async (req, res) => {
  const limit = [10, 50, 100].includes(Number(req.query.limit)) ? Number(req.query.limit) : 10;
  const board = String(req.query.board || 'geral');

  // cada placa: SELECT com métrica própria (name, level, tier, wins, losses, metric)
  const BOARDS = {
    geral: `SELECT p.fighter_name AS name, p.level, p.tier, p.wins, p.losses, p.rank_points, p.win_streak, p.rank_points AS metric, p.user_id
              FROM profiles p ORDER BY p.rank_points DESC, p.wins DESC LIMIT ${limit}`,
    insano: `SELECT p.fighter_name AS name, p.level, p.tier, p.wins, p.losses, p.rank_points, p.win_streak, COUNT(*) AS metric, p.user_id
               FROM matches m JOIN profiles p ON p.user_id = m.user_id
              WHERE m.opponent_type = 'bot' AND m.difficulty = 'insano' AND m.won
              GROUP BY p.user_id, p.fighter_name, p.level, p.tier, p.wins, p.losses, p.rank_points, p.win_streak
              ORDER BY metric DESC LIMIT ${limit}`,
    apostas: `SELECT p.fighter_name AS name, p.level, p.tier, p.wins, p.losses, p.rank_points, p.win_streak,
                     COALESCE(SUM(CASE WHEN a.kind = 'bet_win' THEN (a.data->>'amount')::bigint
                                       ELSE -(a.data->>'amount')::bigint END), 0) AS metric, p.user_id
                FROM activities a JOIN profiles p ON p.user_id = a.user_id
               WHERE a.kind IN ('bet_win','bet_loss')
               GROUP BY p.user_id, p.fighter_name, p.level, p.tier, p.wins, p.losses, p.rank_points, p.win_streak
               ORDER BY metric DESC LIMIT ${limit}`,
    bots: `SELECT p.fighter_name AS name, p.level, p.tier, p.wins, p.losses, p.rank_points, p.win_streak, COUNT(*) AS metric, p.user_id
             FROM matches m JOIN profiles p ON p.user_id = m.user_id
            WHERE m.opponent_type = 'bot' AND m.won
            GROUP BY p.user_id, p.fighter_name, p.level, p.tier, p.wins, p.losses, p.rank_points, p.win_streak
            ORDER BY metric DESC LIMIT ${limit}`,
    pvp: `SELECT p.fighter_name AS name, p.level, p.tier, p.wins, p.losses, p.rank_points, p.win_streak, p.wins AS metric, p.user_id
            FROM profiles p WHERE p.wins > 0 ORDER BY p.wins DESC, p.rank_points DESC LIMIT ${limit}`,
  };
  const sql = BOARDS[board] || BOARDS.geral;
  const { rows: top } = await q(sql);
  const { rows: me } = await q('SELECT rank_points FROM profiles WHERE user_id = $1', [req.userId]);
  const { rows: pos } = await q('SELECT 1 + COUNT(*) AS pos FROM profiles WHERE rank_points > $1', [me[0].rank_points]);
  res.json({
    board, limit,
    top: top.map((r, i) => ({ ...r, metric: Number(r.metric), position: i + 1, me: Number(r.user_id) === req.userId, user_id: undefined })),
    myPosition: Number(pos[0].pos),
    myPoints: me[0].rank_points,
  });
});

export default router;
