// STIKDEAD :: social — cartão público de jogador, amizades e chat entre amigos
import { Router } from 'express';
import { q } from './db.js';
import { requireAuth } from './auth.js';
import { getLoadout } from './shop.js';
import { getOnlineIds, getClanIds, getAwayIds, notifyUser } from './online.js';

const router = Router();

// ===== cartão público (a vitrine do ego) =====
router.get('/players/by-name/:name', requireAuth, async (req, res) => {
  const { rows } = await q(
    `SELECT u.id, p.fighter_name, p.style, p.level, p.tier, p.rank_points,
            p.wins, p.losses, p.win_streak, p.title, p.last_seen, p.clan_id,
            c.name AS clan_name
       FROM profiles p JOIN users u ON u.id = p.user_id
       LEFT JOIN clans c ON c.id = p.clan_id
      WHERE lower(p.fighter_name) = lower($1)`,
    [String(req.params.name || '')]
  );
  const p = rows[0];
  if (!p) return res.status(404).json({ error: 'Lutador não encontrado.' });

  const loadout = await getLoadout(p.id);
  const matches = await q(
    'SELECT COUNT(*) FROM matches WHERE user_id = $1', [p.id]
  ).then((r) => Number(r.rows[0].count)).catch(() => p.wins + p.losses);
  const insano = await q(
    `SELECT COUNT(*) FILTER (WHERE won) AS w, COUNT(*) FILTER (WHERE NOT won) AS l
       FROM matches WHERE user_id = $1 AND opponent_type = 'bot' AND difficulty = 'insano'`,
    [p.id]
  ).then((r) => ({ w: Number(r.rows[0].w), l: Number(r.rows[0].l) })).catch(() => ({ w: 0, l: 0 }));

  // relação com quem está olhando
  let friendship = 'none';
  let requestId = null;
  if (p.id !== req.userId) {
    const f = await q(
      `SELECT id, requester_id, status FROM friendships
        WHERE (requester_id = $1 AND addressee_id = $2) OR (requester_id = $2 AND addressee_id = $1)`,
      [req.userId, p.id]
    );
    if (f.rows[0]) {
      requestId = f.rows[0].id;
      friendship = f.rows[0].status === 'accepted' ? 'friends'
        : (f.rows[0].requester_id === req.userId ? 'pending_out' : 'pending_in');
    }
  } else friendship = 'self';

  const { rows: hist } = await q(
    `SELECT clan_id, clan_name, joined_at, left_at FROM clan_history
      WHERE user_id = $1 ORDER BY joined_at DESC LIMIT 8`, [p.id]);
  res.json({
    userId: p.id,
    name: p.fighter_name,
    style: p.style,
    level: p.level,
    tier: p.tier,
    clan: p.clan_id ? { id: Number(p.clan_id), name: p.clan_name } : null,
    clanHistory: hist.map((h) => ({ id: h.clan_id ? Number(h.clan_id) : null, name: h.clan_name, atual: !h.left_at })),
    trophies: p.rank_points,
    wins: p.wins,
    losses: p.losses,
    matches,
    winRate: matches ? Math.round((p.wins / Math.max(1, p.wins + p.losses)) * 100) : 0,
    winStreak: p.win_streak,
    insano,
    title: p.title,
    online: getOnlineIds().has(p.id),
    away: getAwayIds().has(p.id),
    loadout,
    friendship,
    requestId,
  });
});

// ===== amizades =====
router.post('/friends/request', requireAuth, async (req, res) => {
  const name = String(req.body?.name || '').trim();
  const { rows } = await q('SELECT user_id, fighter_name FROM profiles WHERE lower(fighter_name) = lower($1)', [name]);
  const target = rows[0]?.user_id;
  const targetName = rows[0]?.fighter_name;
  if (!target) return res.status(404).json({ error: 'Lutador não encontrado.' });
  if (target === req.userId) return res.status(400).json({ error: 'Você já é seu melhor amigo.' });
  if (!getOnlineIds().has(Number(target))) {
    return res.status(400).json({ error: `${targetName} não está online — só dá para pedir amizade a quem está na área.` });
  }
  // disciplina: 5 recusas -> 7 dias de espera
  const den = await q(
    'SELECT count, last_at FROM friend_denials WHERE requester_id = $1 AND addressee_id = $2',
    [req.userId, target]
  );
  if (den.rows[0]) {
    const d = den.rows[0];
    const seteDias = 7 * 24 * 3600 * 1000;
    const desde = Date.now() - new Date(d.last_at).getTime();
    if (d.count >= 3 && desde < seteDias) {
      const dias = Math.ceil((seteDias - desde) / (24 * 3600 * 1000));
      return res.status(429).json({ error: `Limite de 3 pedidos atingido. Tente novamente em ${dias} dia${dias === 1 ? '' : 's'}.` });
    }
    if (d.count >= 3 && desde >= seteDias) {
      await q('DELETE FROM friend_denials WHERE requester_id = $1 AND addressee_id = $2', [req.userId, target]);
    }
  }
  const existing = await q(
    `SELECT id, status, requester_id FROM friendships
      WHERE (requester_id = $1 AND addressee_id = $2) OR (requester_id = $2 AND addressee_id = $1)`,
    [req.userId, target]
  );
  if (existing.rows[0]) {
    const e = existing.rows[0];
    if (e.status === 'accepted') return res.status(400).json({ error: 'Vocês já são amigos.' });
    if (e.requester_id === req.userId) return res.status(400).json({ error: 'Pedido já enviado — aguarde.' });
    // o outro já tinha pedido: aceita na hora (match de intenções)
    await q(`UPDATE friendships SET status = 'accepted' WHERE id = $1`, [e.id]);
    return res.json({ ok: true, status: 'friends' });
  }
  const ins = await q('INSERT INTO friendships (requester_id, addressee_id) VALUES ($1, $2) RETURNING id', [req.userId, target]);
  const meName = await q('SELECT fighter_name FROM profiles WHERE user_id = $1', [req.userId]);
  const { logActivity } = await import('./activities.js');
  const requestId = ins.rows[0].id;
  const fromName = meName.rows[0]?.fighter_name;
  logActivity(target, 'friend_request', { from: fromName, requestId });
  notifyUser(target, 'social:ping', { type: 'friend_request', from: fromName });
  // os dois modais: quem recebe decide, quem pediu aguarda
  notifyUser(target, 'friend:ask', { requestId, from: fromName, ttl: 30 });
  notifyUser(req.userId, 'friend:waiting', { requestId, to: targetName, ttl: 30 });
  // expiração autoritativa: 15s e a proposta evapora (sem contar como recusa)
  const requesterId = req.userId;
  setTimeout(async () => {
    try {
      const { rows: still } = await q(`SELECT 1 FROM friendships WHERE id = $1 AND status = 'pending'`, [requestId]);
      if (!still[0]) return; // já respondida
      await q('DELETE FROM friendships WHERE id = $1', [requestId]);
      notifyUser(requesterId, 'friend:expired', { requestId });
      notifyUser(target, 'friend:expired', { requestId });
      notifyUser(target, 'social:ping', { type: 'friend_expired' });
    } catch { /* fica para a lista como plano B */ }
  }, 30000);
  res.json({ ok: true, status: 'pending_out' });
});

router.post('/friends/respond', requireAuth, async (req, res) => {
  const id = Number(req.body?.requestId);
  const accept = !!req.body?.accept;
  const { rows } = await q(
    'SELECT id FROM friendships WHERE id = $1 AND addressee_id = $2 AND status = $3',
    [id, req.userId, 'pending']
  );
  if (!rows[0]) return res.status(404).json({ error: 'Pedido não encontrado.' });
  if (accept) {
    await q(`UPDATE friendships SET status = 'accepted' WHERE id = $1`, [id]);
    const pair = await q('SELECT requester_id, addressee_id FROM friendships WHERE id = $1', [id]);
    if (pair.rows[0]) {
      const names = await q(
        'SELECT user_id, fighter_name FROM profiles WHERE user_id = ANY($1)',
        [[pair.rows[0].requester_id, pair.rows[0].addressee_id]]
      );
      const nameOf = Object.fromEntries(names.rows.map((r) => [Number(r.user_id), r.fighter_name]));
      const { logActivity } = await import('./activities.js');
      logActivity(pair.rows[0].requester_id, 'friend_accept', { with: nameOf[Number(pair.rows[0].addressee_id)] });
      logActivity(pair.rows[0].addressee_id, 'friend_accept', { with: nameOf[Number(pair.rows[0].requester_id)] });
      notifyUser(pair.rows[0].requester_id, 'social:ping', { type: 'friend_accept', with: nameOf[Number(pair.rows[0].addressee_id)] });
      notifyUser(pair.rows[0].requester_id, 'friend:answer', { requestId: id, accepted: true, with: nameOf[Number(pair.rows[0].addressee_id)] });
    }
  } else {
    const pair = await q('SELECT requester_id, addressee_id FROM friendships WHERE id = $1', [id]);
    await q('DELETE FROM friendships WHERE id = $1', [id]);
    if (pair.rows[0]) {
      const respName = await q('SELECT fighter_name FROM profiles WHERE user_id = $1', [pair.rows[0].addressee_id]);
      notifyUser(pair.rows[0].requester_id, 'friend:answer', { requestId: id, accepted: false, with: respName.rows[0]?.fighter_name });
      await q(
        `INSERT INTO friend_denials (requester_id, addressee_id, count, last_at) VALUES ($1, $2, 1, now())
         ON CONFLICT (requester_id, addressee_id) DO UPDATE SET count = friend_denials.count + 1, last_at = now()`,
        [pair.rows[0].requester_id, pair.rows[0].addressee_id]
      );
    }
  }
  res.json({ ok: true });
});

router.get('/friends', requireAuth, async (req, res) => {
  const onlineIds = getOnlineIds();
  const clanIds = getClanIds();
  const friends = await q(
    `SELECT f.id AS friendship_id, u.id AS user_id, p.fighter_name, p.level, p.tier, p.rank_points, p.last_seen
       FROM friendships f
       JOIN users u ON u.id = CASE WHEN f.requester_id = $1 THEN f.addressee_id ELSE f.requester_id END
  LEFT JOIN profiles p ON p.user_id = u.id
      WHERE (f.requester_id = $1 OR f.addressee_id = $1) AND f.status = 'accepted'
   ORDER BY p.fighter_name`,
    [req.userId]
  );
  const requests = await q(
    `SELECT f.id, p.fighter_name, p.level, p.tier
       FROM friendships f LEFT JOIN profiles p ON p.user_id = f.requester_id
      WHERE f.addressee_id = $1 AND f.status = 'pending'
   ORDER BY f.created_at DESC`,
    [req.userId]
  );
  res.json({
    friends: friends.rows.map((f) => ({ ...f, online: onlineIds.has(Number(f.user_id)), inClan: clanIds.has(Number(f.user_id)), away: getAwayIds().has(Number(f.user_id)) })),
    requests: requests.rows,
  });
});

// ===== chat entre amigos =====
async function assertFriends(a, b) {
  const { rows } = await q(
    `SELECT 1 FROM friendships
      WHERE ((requester_id = $1 AND addressee_id = $2) OR (requester_id = $2 AND addressee_id = $1))
        AND status = 'accepted'`,
    [a, b]
  );
  return !!rows[0];
}

router.get('/friends/chat/:friendId', requireAuth, async (req, res) => {
  const friendId = Number(req.params.friendId);
  if (!(await assertFriends(req.userId, friendId))) return res.status(403).json({ error: 'Vocês não são amigos.' });
  const after = Number(req.query.after || 0);
  const { rows } = await q(
    `SELECT id, from_id, body, created_at FROM friend_messages
      WHERE ((from_id = $1 AND to_id = $2) OR (from_id = $2 AND to_id = $1)) AND id > $3
   ORDER BY id ASC LIMIT 100`,
    [req.userId, friendId, after]
  );
  res.json({ messages: rows });
});

router.post('/friends/chat/:friendId', requireAuth, async (req, res) => {
  const friendId = Number(req.params.friendId);
  const body = String(req.body?.text || '').trim().slice(0, 500);
  if (!body) return res.status(400).json({ error: 'Mensagem vazia.' });
  if (!(await assertFriends(req.userId, friendId))) return res.status(403).json({ error: 'Vocês não são amigos.' });
  const { rows } = await q(
    'INSERT INTO friend_messages (from_id, to_id, body) VALUES ($1, $2, $3) RETURNING id, from_id, body, created_at',
    [req.userId, friendId, body]
  );
  res.json({ message: rows[0] });
});

export default router;
