// STIKDEAD :: presentes 🎁 — um item viaja de um baú para outro
import { Router } from 'express';
import { q, pool } from './db.js';
import { requireAuth } from './auth.js';
import { logActivity } from './activities.js';
import { notifyUser } from './online.js';

const router = Router();

// enviar: o item SAI do baú de quem dá e ENTRA no de quem recebe (transação)
const CURRENCY_COL = { coins: 'coins', diamonds: 'diamonds' };
const CURRENCY_LABEL = { coins: 'Moedas', diamonds: 'Diamantes' };

router.post('/send', requireAuth, async (req, res) => {
  const toName = String(req.body?.toName || '').trim();
  const kind = ['item', 'coins', 'diamonds'].includes(req.body?.kind) ? req.body.kind : 'item';
  const itemId = String(req.body?.itemId || '');
  const amount = Math.floor(Number(req.body?.amount || 0));
  const message = String(req.body?.message || '').trim().slice(0, 200) || null;
  const target = await q('SELECT user_id, fighter_name FROM profiles WHERE lower(fighter_name) = lower($1)', [toName]);
  const to = target.rows[0];
  if (!to) return res.status(404).json({ error: 'Lutador não encontrado.' });
  if (Number(to.user_id) === req.userId) return res.status(400).json({ error: 'Presentear a si mesmo é treino, não presente.' });

  // ===== presente em ESPÉCIE (moedas/diamantes) =====
  if (kind !== 'item') {
    if (!Number.isFinite(amount) || amount < 1) return res.status(400).json({ error: 'Quantidade inválida.' });
    if (amount > 1000000) return res.status(400).json({ error: 'Máximo de 1.000.000 por presente.' });
    const col = CURRENCY_COL[kind];
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      // débito ATÔMICO E CONDICIONAL: impossível ficar negativo, mesmo em corrida
      const deb = await client.query(
        `UPDATE profiles SET ${col} = ${col} - $1 WHERE user_id = $2 AND ${col} >= $1 RETURNING ${col}`,
        [amount, req.userId]
      );
      if (!deb.rows[0]) {
        await client.query('ROLLBACK');
        return res.status(400).json({ error: `Saldo insuficiente de ${CURRENCY_LABEL[kind].toLowerCase()}.` });
      }
      await client.query(`UPDATE profiles SET ${col} = ${col} + $1 WHERE user_id = $2`, [amount, to.user_id]);
      const g = await client.query(
        'INSERT INTO gifts (from_id, to_id, kind, amount, message) VALUES ($1, $2, $3, $4, $5) RETURNING id',
        [req.userId, to.user_id, kind, amount, message]
      );
      await client.query('COMMIT');
      const me = await q('SELECT fighter_name FROM profiles WHERE user_id = $1', [req.userId]);
      logActivity(req.userId, 'gift_sent', { to: to.fighter_name, kind, amount });
      logActivity(to.user_id, 'gift_received', { from: me.rows[0]?.fighter_name, kind, amount, giftId: g.rows[0].id });
      notifyUser(to.user_id, 'gift:new', {});
      return res.json({ ok: true });
    } catch (e) {
      await client.query('ROLLBACK');
      console.error('gift moeda:', e.message);
      return res.status(500).json({ error: 'Falha ao enviar o presente.' });
    } finally {
      client.release();
    }
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    // uma unidade do item, com trava
    const owned = await client.query(
      'SELECT ctid FROM user_items WHERE user_id = $1 AND item_id = $2 LIMIT 1 FOR UPDATE',
      [req.userId, itemId]
    );
    if (!owned.rows[0]) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Este item não está no seu baú.' });
    }
    // item equipado não viaja: o dono precisa tirar do corpo primeiro (mensagem honesta)
    const equipado = await client.query('SELECT 1 FROM loadouts WHERE user_id = $1 AND item_id = $2', [req.userId, itemId]);
    if (equipado.rows[0]) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Este item está EQUIPADO no seu lutador — remova-o do corpo (Inventário) antes de presentear.' });
    }
    // o destinatário já tem esse item? presente repetido não existe
    const jaTem = await client.query('SELECT 1 FROM user_items WHERE user_id = $1 AND item_id = $2', [to.user_id, itemId]);
    if (jaTem.rows[0]) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: `${to.fighter_name} já possui este item no baú — escolha outro presente.` });
    }
    await client.query('DELETE FROM user_items WHERE ctid = $1', [owned.rows[0].ctid]);
    await client.query(
      `INSERT INTO user_items (user_id, item_id, source) VALUES ($1, $2, 'gift')`,
      [to.user_id, itemId]
    );
    const g = await client.query(
      'INSERT INTO gifts (from_id, to_id, item_id, message) VALUES ($1, $2, $3, $4) RETURNING id',
      [req.userId, to.user_id, itemId, message]
    );
    await client.query('COMMIT');

    const item = await q('SELECT name FROM items WHERE id = $1', [itemId]);
    const me = await q('SELECT fighter_name FROM profiles WHERE user_id = $1', [req.userId]);
    logActivity(req.userId, 'gift_sent', { to: to.fighter_name, kind: 'item', item: item.rows[0]?.name, itemId });
    logActivity(to.user_id, 'gift_received', { from: me.rows[0]?.fighter_name, kind: 'item', item: item.rows[0]?.name, itemId, giftId: g.rows[0].id });
    notifyUser(to.user_id, 'gift:new', {});
    res.json({ ok: true });
  } catch (e) {
    await client.query('ROLLBACK');
    console.error('gift:', e.message);
    res.status(500).json({ error: 'Falha ao enviar o presente.' });
  } finally {
    client.release();
  }
});

// presentes fechados esperando o destinatário
router.get('/pending', requireAuth, async (req, res) => {
  const { rows } = await q(
    `SELECT g.id, g.created_at, g.message, g.kind, g.amount, i.id AS item_id, i.name, i.rarity, i.slot, i.template, i.params, i.excellents,
            p.fighter_name AS from_name
       FROM gifts g
  LEFT JOIN items i ON i.id = g.item_id
  LEFT JOIN profiles p ON p.user_id = g.from_id
      WHERE g.to_id = $1 AND g.opened_at IS NULL
   ORDER BY g.id ASC LIMIT 5`,
    [req.userId]
  );
  res.json({ gifts: rows });
});

// abrir (a revelação)
router.post('/open/:id', requireAuth, async (req, res) => {
  const { rows } = await q(
    `UPDATE gifts SET opened_at = now() WHERE id = $1 AND to_id = $2 AND opened_at IS NULL RETURNING item_id`,
    [Number(req.params.id), req.userId]
  );
  if (!rows[0]) return res.status(404).json({ error: 'Presente não encontrado.' });
  res.json({ ok: true });
});

export default router;
