// STIKDEAD :: Diamantes 💎 — moeda premium via Mercado Pago (Checkout Pro)
// Fluxo: POST /checkout cria a preference -> jogador paga na tela do MP ->
// MP chama /webhook -> conferimos o pagamento na API -> creditamos (idempotente).
import { Router } from 'express';
import { q } from './db.js';
import { requireAuth } from './auth.js';

const MP_TOKEN = process.env.MP_ACCESS_TOKEN || '';
const BASE_URL = process.env.PUBLIC_URL || 'https://game.stikdead.com';

export const PACKS = {
  punhado:  { id: 'punhado',  diamonds: 100,  cents: 490,  label: 'Punhado de Diamantes' },
  bolsa:    { id: 'bolsa',    diamonds: 550,  cents: 1990, label: 'Bolsa de Diamantes' },
  bau:      { id: 'bau',      diamonds: 1200, cents: 3990, label: 'Baú de Diamantes' },
  tesouro:  { id: 'tesouro',  diamonds: 2600, cents: 7490, label: 'Tesouro de Diamantes' },
};

const router = Router();

router.get('/packs', (_req, res) => {
  res.json({ packs: Object.values(PACKS), enabled: !!MP_TOKEN });
});

router.post('/checkout', requireAuth, async (req, res) => {
  const pack = PACKS[req.body?.pack];
  if (!pack) return res.status(400).json({ error: 'Pacote inválido.' });
  if (!MP_TOKEN) return res.status(503).json({ error: 'Pagamentos ainda não configurados.' });

  // reaproveita pedido pendente recente do mesmo pack (evita duplicatas de clique)
  const existing = await q(
    `SELECT id FROM diamond_orders
      WHERE user_id = $1 AND pack_id = $2 AND status = 'pending'
        AND created_at > now() - interval '15 minutes'
      ORDER BY id DESC LIMIT 1`,
    [req.userId, pack.id]
  );
  let orderId = existing.rows[0]?.id;
  if (!orderId) {
    const { rows } = await q(
      `INSERT INTO diamond_orders (user_id, pack_id, diamonds, amount_cents)
       VALUES ($1, $2, $3, $4) RETURNING id`,
      [req.userId, pack.id, pack.diamonds, pack.cents]
    );
    orderId = rows[0].id;
  }

  const pref = {
    items: [{
      title: `STIKDEAD — ${pack.label} (${pack.diamonds} 💎)`,
      quantity: 1,
      currency_id: 'BRL',
      unit_price: pack.cents / 100,
    }],
    external_reference: String(orderId),
    notification_url: `${BASE_URL}/api/diamonds/webhook`,
    back_urls: {
      success: `${BASE_URL}/loja?pg=ok`,
      pending: `${BASE_URL}/loja?pg=pendente`,
      failure: `${BASE_URL}/loja?pg=erro`,
    },
    auto_return: 'approved',
    statement_descriptor: 'STIKDEAD',
  };

  const r = await fetch('https://api.mercadopago.com/checkout/preferences', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${MP_TOKEN}` },
    body: JSON.stringify(pref),
  });
  const data = await r.json();
  if (!r.ok || !data.init_point) {
    console.error('MP preference falhou:', data);
    return res.status(502).json({ error: 'Falha ao iniciar pagamento.' });
  }
  await q('UPDATE diamond_orders SET mp_preference_id = $1 WHERE id = $2', [data.id, orderId]);
  res.json({ init_point: data.init_point, order_id: orderId });
});

// crédito idempotente: um payment_id só credita UMA vez (UNIQUE no banco)
async function creditPayment(paymentId) {
  const r = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
    headers: { Authorization: `Bearer ${MP_TOKEN}` },
  });
  if (!r.ok) return;
  const pay = await r.json();
  if (pay.status !== 'approved') return;
  const orderId = Number(pay.external_reference);
  if (!orderId) return;

  const { rows } = await q(
    `UPDATE diamond_orders
        SET status = 'paid', mp_payment_id = $1, paid_at = now()
      WHERE id = $2 AND status = 'pending'
      RETURNING user_id, diamonds`,
    [String(paymentId), orderId]
  );
  if (!rows[0]) return; // já creditado ou pedido inexistente
  await q('UPDATE profiles SET diamonds = diamonds + $1 WHERE user_id = $2', [rows[0].diamonds, rows[0].user_id]);
  console.log(`💎 pedido ${orderId}: +${rows[0].diamonds} diamantes para user ${rows[0].user_id}`);
}

// webhook do MP (público; a verdade vem da consulta autenticada à API, nunca do corpo)
router.post('/webhook', async (req, res) => {
  res.sendStatus(200); // responde já; processa em seguida
  try {
    const paymentId = req.body?.data?.id || req.query?.id || req.query?.['data.id'];
    const type = req.body?.type || req.query?.type || req.query?.topic;
    if (paymentId && (!type || String(type).includes('payment'))) {
      await creditPayment(paymentId);
    }
  } catch (e) {
    console.error('webhook MP:', e.message);
  }
});

// reconciliação reutilizável (admin e cliente)
export async function reconcileOrder(orderId) {
  const search = await fetch(
    `https://api.mercadopago.com/v1/payments/search?external_reference=${orderId}`,
    { headers: { Authorization: `Bearer ${MP_TOKEN}` } }
  );
  if (search.ok) {
    const d = await search.json();
    for (const p of d.results || []) if (p.status === 'approved') await creditPayment(p.id);
  }
  const after = await q('SELECT status FROM diamond_orders WHERE id = $1', [orderId]);
  return after.rows[0]?.status || 'unknown';
}

// segurança extra: o cliente pode pedir reconciliação do próprio pedido ao voltar da tela do MP
router.post('/reconcile/:orderId', requireAuth, async (req, res) => {
  const { rows } = await q(
    `SELECT id, status FROM diamond_orders WHERE id = $1 AND user_id = $2`,
    [Number(req.params.orderId), req.userId]
  );
  if (!rows[0]) return res.status(404).json({ error: 'Pedido não encontrado.' });
  if (rows[0].status === 'paid') return res.json({ status: 'paid' });
  // busca pagamentos dessa preference
  const search = await fetch(
    `https://api.mercadopago.com/v1/payments/search?external_reference=${rows[0].id}`,
    { headers: { Authorization: `Bearer ${MP_TOKEN}` } }
  );
  if (search.ok) {
    const d = await search.json();
    for (const p of d.results || []) if (p.status === 'approved') await creditPayment(p.id);
  }
  const after = await q('SELECT status FROM diamond_orders WHERE id = $1', [rows[0].id]);
  res.json({ status: after.rows[0].status });
});

export default router;
