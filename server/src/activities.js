// STIKDEAD :: feed de atividades — o diário do lutador + megafone do servidor
import { Router } from 'express';
import { q } from './db.js';
import { requireAuth } from './auth.js';

export function logActivity(userId, kind, data = {}) {
  q('INSERT INTO activities (user_id, kind, data) VALUES ($1, $2, $3)', [userId, kind, JSON.stringify(data)])
    .catch((e) => console.error('activity:', e.message));
}

const router = Router();

router.get('/', requireAuth, async (req, res) => {
  const personal = await q(
    `SELECT id, kind, data, created_at FROM activities WHERE user_id = $1 ORDER BY id DESC LIMIT 80`,
    [req.userId]
  );
  const global = await q(
    `SELECT id, body, created_at FROM global_messages ORDER BY id DESC LIMIT 20`
  );
  // pedidos pendentes que ainda podem ser aceitos (para o botão inline)
  const pend = await q(
    `SELECT id FROM friendships WHERE addressee_id = $1 AND status = 'pending'`, [req.userId]
  );
  const pendIds = new Set(pend.rows.map((r) => Number(r.id)));
  res.json({
    personal: personal.rows.map((a) => ({
      ...a,
      actionable: (a.kind === 'friend_request' && pendIds.has(Number(a.data?.requestId))) || a.kind === 'clan_invite',
    })),
    global: global.rows,
  });
});

export default router;
