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
    req.adminEmail = ADMIN_EMAIL;
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

// ===== PAGAMENTOS (diamantes) =====
router.get('/payments', requireAdmin, async (_req, res) => {
  const { rows } = await q(
    `SELECT o.id, o.pack_id, o.diamonds, o.amount_cents, o.status,
            o.created_at, o.paid_at, o.mp_payment_id,
            p.fighter_name, u.email
       FROM diamond_orders o
       JOIN users u ON u.id = o.user_id
  LEFT JOIN profiles p ON p.user_id = o.user_id
   ORDER BY o.created_at DESC
      LIMIT 200`
  );
  const totals = await q(
    `SELECT COALESCE(SUM(amount_cents) FILTER (WHERE status='paid'), 0) AS receita_cents,
            COALESCE(SUM(amount_cents) FILTER (WHERE status='paid' AND paid_at::date = now()::date), 0) AS receita_hoje_cents,
            COUNT(*) FILTER (WHERE status='paid') AS pagos,
            COUNT(*) FILTER (WHERE status='pending') AS pendentes
       FROM diamond_orders`
  );
  res.json({ orders: rows, totals: totals.rows[0] });
});

router.post('/payments/:id/check', requireAdmin, async (req, res) => {
  const { reconcileOrder } = await import('./diamonds.js');
  const status = await reconcileOrder(Number(req.params.id));
  res.json({ status });
});

// ===== EMAILS =====
router.get('/emails/status', requireAdmin, async (_req, res) => {
  const { emailEnabled } = await import('./email.js');
  const { rows } = await q('SELECT COUNT(*) FROM users WHERE email IS NOT NULL');
  res.json({ enabled: emailEnabled(), recipients: Number(rows[0].count) });
});

router.post('/emails/preview', requireAdmin, async (req, res) => {
  const { broadcastHtml } = await import('./email.js');
  res.json({ html: broadcastHtml(String(req.body?.message || '')) });
});

router.post('/emails/send', requireAdmin, async (req, res) => {
  const { sendBroadcast, emailEnabled } = await import('./email.js');
  if (!emailEnabled()) return res.status(503).json({ error: 'SendGrid não configurado (SENDGRID_API_KEY).' });
  const subject = String(req.body?.subject || '').trim();
  const message = String(req.body?.message || '').trim();
  if (!subject || !message) return res.status(400).json({ error: 'Assunto e mensagem são obrigatórios.' });
  const onlyTo = req.body?.test ? req.adminEmail : null;
  const r = await sendBroadcast(subject, message, onlyTo);
  res.json(r);
});

export default router;
