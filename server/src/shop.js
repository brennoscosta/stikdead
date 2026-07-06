import { Router } from 'express';
import { requireAuth } from './auth.js';
import { q, pool } from './db.js';

const SLOTS = new Set(['head', 'face', 'body', 'back', 'weapon', 'arms', 'legs', 'feet', 'effect']);

export async function getLoadout(userId) {
  const { rows } = await q(
    `SELECT l.slot, i.id, i.name, i.rarity, i.template, i.params
       FROM loadouts l JOIN items i ON i.id = l.item_id
      WHERE l.user_id = $1`,
    [userId]
  );
  return rows;
}

// Sorteia um item comum/raro que o jogador ainda não tem (baú de sequência).
export async function grantStreakDrop(client, userId) {
  const { rows } = await client.query(
    `SELECT id, name, rarity FROM items
      WHERE rarity IN ('comum', 'raro')
        AND id NOT IN (SELECT item_id FROM user_items WHERE user_id = $1)
      ORDER BY random() LIMIT 1`,
    [userId]
  );
  if (!rows[0]) return null;
  await client.query(
    `INSERT INTO user_items (user_id, item_id, source) VALUES ($1, $2, 'drop')`,
    [userId, rows[0].id]
  );
  return rows[0];
}

const router = Router();

// Catálogo completo + flag de posse
router.get('/shop', requireAuth, async (req, res) => {
  const { rows } = await q(
    `SELECT i.id, i.name, i.slot, i.rarity, i.price, i.template, i.params,
            (u.item_id IS NOT NULL) AS owned
       FROM items i
       LEFT JOIN user_items u ON u.item_id = i.id AND u.user_id = $1
      ORDER BY i.sort`,
    [req.userId]
  );
  const { rows: pr } = await q('SELECT coins FROM profiles WHERE user_id = $1', [req.userId]);
  res.json({ items: rows, coins: pr[0].coins });
});

// Compra (transacional: valida saldo + posse)
router.post('/shop/buy', requireAuth, async (req, res) => {
  const itemId = String(req.body.itemId || '');
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const item = (await client.query('SELECT id, name, rarity, price FROM items WHERE id = $1', [itemId])).rows[0];
    if (!item) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Item não encontrado.' });
    }
    const owned = (await client.query(
      'SELECT 1 FROM user_items WHERE user_id = $1 AND item_id = $2', [req.userId, itemId]
    )).rowCount;
    if (owned) {
      await client.query('ROLLBACK');
      return res.status(409).json({ error: 'Você já tem esse item no baú.' });
    }
    const prof = (await client.query(
      'SELECT coins FROM profiles WHERE user_id = $1 FOR UPDATE', [req.userId]
    )).rows[0];
    if (prof.coins < item.price) {
      await client.query('ROLLBACK');
      return res.status(402).json({ error: `Moedas insuficientes: precisa de ${item.price}, você tem ${prof.coins}.` });
    }
    await client.query('UPDATE profiles SET coins = coins - $1, updated_at = now() WHERE user_id = $2', [item.price, req.userId]);
    await client.query(`INSERT INTO user_items (user_id, item_id, source) VALUES ($1, $2, 'shop')`, [req.userId, itemId]);
    await client.query('COMMIT');
    res.json({ ok: true, item: { id: item.id, name: item.name, rarity: item.rarity }, coins: prof.coins - item.price });
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
});

// Baú + build equipada
router.get('/inventory', requireAuth, async (req, res) => {
  const { rows: chest } = await q(
    `SELECT i.id, i.name, i.slot, i.rarity, i.template, i.params, u.obtained_at, u.source
       FROM user_items u JOIN items i ON i.id = u.item_id
      WHERE u.user_id = $1 ORDER BY i.sort`,
    [req.userId]
  );
  res.json({ chest, loadout: await getLoadout(req.userId) });
});

// Equipar / desequipar
router.put('/loadout', requireAuth, async (req, res) => {
  const slot = String(req.body.slot || '');
  const itemId = req.body.itemId == null ? null : String(req.body.itemId);
  if (!SLOTS.has(slot)) return res.status(400).json({ error: 'Slot inválido.' });

  if (itemId === null) {
    await q('DELETE FROM loadouts WHERE user_id = $1 AND slot = $2', [req.userId, slot]);
    return res.json({ loadout: await getLoadout(req.userId) });
  }

  const { rows } = await q(
    `SELECT i.slot FROM user_items u JOIN items i ON i.id = u.item_id
      WHERE u.user_id = $1 AND u.item_id = $2`,
    [req.userId, itemId]
  );
  if (!rows[0]) return res.status(403).json({ error: 'Esse item não está no seu baú.' });
  if (rows[0].slot !== slot) return res.status(400).json({ error: 'Esse item não encaixa nesse slot.' });

  await q(
    `INSERT INTO loadouts (user_id, slot, item_id) VALUES ($1, $2, $3)
     ON CONFLICT (user_id, slot) DO UPDATE SET item_id = EXCLUDED.item_id`,
    [req.userId, slot, itemId]
  );
  res.json({ loadout: await getLoadout(req.userId) });
});

export default router;
