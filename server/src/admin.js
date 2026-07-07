// STIKDEAD :: painel administrativo — acesso exclusivo do dono
import { Router } from 'express';
import { q } from './db.js';
import { requireAuth } from './auth.js';

const ADMIN_EMAIL = 'souzacostabrenno@gmail.com';
const router = Router();

async function requireAdmin(req, res, next) {
  try {
    const { rows } = await q('SELECT email FROM users WHERE id = $1', [req.userId]);
    if (rows[0]?.email !== ADMIN_EMAIL) return res.status(403).json({ error: 'Acesso restrito.' });
    next();
  } catch {
    res.status(500).json({ error: 'Erro de verificação.' });
  }
}

router.use(requireAuth, requireAdmin);

// ===== dashboard =====
router.get('/stats', async (_req, res) => {
  const [users, today, connected, items, matches, coins] = await Promise.all([
    q('SELECT count(*)::int AS n FROM users'),
    q("SELECT count(*)::int AS n FROM users WHERE created_at::date = now()::date"),
    q("SELECT count(*)::int AS n FROM users WHERE last_login_at::date = now()::date"),
    q('SELECT count(*)::int AS n FROM items'),
    q("SELECT count(*)::int AS n FROM matches WHERE created_at::date = now()::date"),
    q('SELECT COALESCE(sum(coins), 0)::bigint AS n FROM profiles'),
  ]);
  res.json({
    total_usuarios: users.rows[0].n,
    cadastros_hoje: today.rows[0].n,
    conectados_hoje: connected.rows[0].n,
    total_itens: items.rows[0].n,
    partidas_hoje: matches.rows[0].n,
    moedas_em_circulacao: Number(coins.rows[0].n),
  });
});

// ===== usuários (leitura + edição total) =====
router.get('/users', async (req, res) => {
  const term = String(req.query.q || '').trim();
  const { rows } = await q(
    `SELECT u.id, u.email, u.created_at, u.last_login_at,
            p.fighter_name, p.level, p.xp, p.coins, p.style, p.rank_points, p.tier
       FROM users u JOIN profiles p ON p.user_id = u.id
      WHERE $1 = '' OR u.email ILIKE '%'||$1||'%' OR p.fighter_name ILIKE '%'||$1||'%'
      ORDER BY u.created_at DESC LIMIT 200`,
    [term]
  );
  res.json({ users: rows });
});

router.patch('/users/:id', async (req, res) => {
  const id = Number(req.params.id);
  const allowed = ['fighter_name', 'level', 'xp', 'coins', 'style', 'rank_points', 'tier'];
  const sets = [];
  const vals = [];
  for (const k of allowed) {
    if (req.body[k] !== undefined) {
      vals.push(req.body[k]);
      sets.push(`${k} = $${vals.length}`);
    }
  }
  if (!sets.length) return res.status(400).json({ error: 'Nada para atualizar.' });
  vals.push(id);
  const { rows } = await q(
    `UPDATE profiles SET ${sets.join(', ')}, updated_at = now() WHERE user_id = $${vals.length} RETURNING *`,
    vals
  );
  if (!rows[0]) return res.status(404).json({ error: 'Usuário não encontrado.' });
  res.json({ profile: rows[0] });
});

// ===== itens (leitura + edição total) =====
router.get('/items', async (_req, res) => {
  const { rows } = await q('SELECT id, name, slot, rarity, price, template, sort FROM items ORDER BY sort, id');
  res.json({ items: rows });
});

router.patch('/items/:id', async (req, res) => {
  const allowed = ['name', 'price', 'rarity', 'slot', 'sort'];
  const sets = [];
  const vals = [];
  for (const k of allowed) {
    if (req.body[k] !== undefined) {
      vals.push(req.body[k]);
      sets.push(`${k} = $${vals.length}`);
    }
  }
  if (!sets.length) return res.status(400).json({ error: 'Nada para atualizar.' });
  vals.push(String(req.params.id));
  const { rows } = await q(
    `UPDATE items SET ${sets.join(', ')} WHERE id = $${vals.length} RETURNING *`,
    vals
  );
  if (!rows[0]) return res.status(404).json({ error: 'Item não encontrado.' });
  res.json({ item: rows[0] });
});

// ===== mapas (catálogo do jogo) =====
router.get('/arenas', (_req, res) => {
  res.json({
    arenas: [
      { id: 'dojo', label: 'Dojo' }, { id: 'temple', label: 'Templo' }, { id: 'prison', label: 'Prisão' },
      { id: 'neve', label: 'Neve' }, { id: 'deserto', label: 'Deserto' }, { id: 'praia', label: 'Praia' },
    ],
    nota: 'Arenas são assets do cliente (client/public/arenas). Para trocar a arte: fábrica de assets --group=arenas.',
  });
});

export default router;
