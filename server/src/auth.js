import { Router } from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'node:crypto';
import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';
import { q, pool } from './db.js';

const JWT_SECRET = process.env.JWT_SECRET;
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';
const googleClient = GOOGLE_CLIENT_ID ? new OAuth2Client(GOOGLE_CLIENT_ID) : null;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const NAME_RE = /^[A-Za-z0-9_]{3,16}$/;

export const signToken = (userId) =>
  jwt.sign({ sub: String(userId) }, JWT_SECRET, { expiresIn: '7d' });

export function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Faça login para continuar.' });
  try {
    req.userId = Number(jwt.verify(token, JWT_SECRET).sub);
    next();
  } catch {
    return res.status(401).json({ error: 'Sessão expirada. Entre novamente.' });
  }
}

async function fetchProfile(userId) {
  const { rows } = await q(
    `SELECT u.id, u.email, p.fighter_name, p.style, p.avatar, p.level, p.xp, p.coins, p.diamonds,
            (SELECT array_agg(item_id) FROM user_items ui WHERE ui.user_id = u.id AND ui.item_id LIKE 'estilo_%') AS owned_styles,
            p.rank_points, p.tier, p.wins, p.losses, p.win_streak, p.title, p.clan_id
       FROM users u JOIN profiles p ON p.user_id = u.id
      WHERE u.id = $1`,
    [userId]
  );
  return rows[0] || null;
}

async function createUserWithProfile(client, { email, passwordHash, googleId, fighterName }) {
  const user = await client.query(
    `INSERT INTO users (email, password_hash, google_id) VALUES ($1, $2, $3) RETURNING id`,
    [email, passwordHash, googleId]
  );
  await client.query(
    `INSERT INTO profiles (user_id, fighter_name) VALUES ($1, $2)`,
    [user.rows[0].id, fighterName]
  );
  import('./email.js')
    .then((m) => m.sendWelcome(email, fighterName))
    .then((r) => console.log('📧 boas-vindas:', email, JSON.stringify(r)))
    .catch((e) => console.error('📧 boas-vindas FALHOU:', email, e.message));
  return user.rows[0].id;
}

const router = Router();

router.post('/register', async (req, res) => {
  const email = String(req.body.email || '').trim().toLowerCase();
  const password = String(req.body.password || '');
  const fighterName = String(req.body.fighterName || '').trim();

  if (!EMAIL_RE.test(email)) return res.status(400).json({ error: 'E-mail inválido.' });
  if (password.length < 8)
    return res.status(400).json({ error: 'A senha precisa de pelo menos 8 caracteres.' });
  if (!NAME_RE.test(fighterName))
    return res.status(400).json({
      error: 'Nome de lutador: 3 a 16 caracteres, apenas letras, números e _.',
    });

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const passwordHash = await bcrypt.hash(password, 10);
    const userId = await createUserWithProfile(client, {
      email,
      passwordHash,
      googleId: null,
      fighterName,
    });
    await client.query('COMMIT');
    res.status(201).json({ token: signToken(userId), profile: await fetchProfile(userId) });
  } catch (err) {
    await client.query('ROLLBACK');
    if (err.code === '23505') {
      const field = err.constraint === 'profiles_fighter_name_key' ? 'nome de lutador' : 'e-mail';
      return res.status(409).json({ error: `Esse ${field} já está em uso.` });
    }
    throw err;
  } finally {
    client.release();
  }
});

router.post('/login', async (req, res) => {
  const email = String(req.body.email || '').trim().toLowerCase();
  const password = String(req.body.password || '');
  const { rows } = await q('SELECT id, password_hash FROM users WHERE email = $1', [email]);
  const user = rows[0];
  if (!user?.password_hash || !(await bcrypt.compare(password, user.password_hash)))
    return res.status(401).json({ error: 'E-mail ou senha incorretos.' });
  q('UPDATE users SET last_login_at = now() WHERE id = $1', [user.id]).catch(() => {});
  res.json({ token: signToken(user.id), profile: await fetchProfile(user.id) });
});

router.post('/google', async (req, res) => {
  if (!googleClient)
    return res.status(503).json({ error: 'Login com Google não está configurado.' });
  const { idToken } = req.body;
  let payload;
  try {
    const ticket = await googleClient.verifyIdToken({ idToken, audience: GOOGLE_CLIENT_ID });
    payload = ticket.getPayload();
  } catch {
    return res.status(401).json({ error: 'Não foi possível validar sua conta Google.' });
  }

  const googleId = payload.sub;
  const email = (payload.email || '').toLowerCase();
  const existing = await q(
    'SELECT id FROM users WHERE google_id = $1 OR (email = $2 AND email IS NOT NULL)',
    [googleId, email]
  );

  if (existing.rows[0]) {
    const userId = existing.rows[0].id;
    await q('UPDATE users SET google_id = $1 WHERE id = $2 AND google_id IS NULL', [
      googleId,
      userId,
    ]);
    q('UPDATE users SET last_login_at = now() WHERE id = $1', [userId]).catch(() => {});
    return res.json({ token: signToken(userId), profile: await fetchProfile(userId) });
  }

  const base = (email.split('@')[0] || 'lutador').replace(/[^A-Za-z0-9_]/g, '').slice(0, 12) || 'lutador';
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    let userId;
    for (let attempt = 0; ; attempt++) {
      const fighterName = attempt === 0 ? base : `${base}_${Math.floor(Math.random() * 9000) + 1000}`;
      try {
        await client.query('SAVEPOINT trial');
        userId = await createUserWithProfile(client, {
          email,
          passwordHash: null,
          googleId,
          fighterName,
        });
        break;
      } catch (err) {
        if (err.code === '23505' && attempt < 5) {
          await client.query('ROLLBACK TO SAVEPOINT trial');
          continue;
        }
        throw err;
      }
    }
    await client.query('COMMIT');
    res.status(201).json({ token: signToken(userId), profile: await fetchProfile(userId) });
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
});

router.get('/me', requireAuth, async (req, res) => {
  const profile = await fetchProfile(req.userId);
  if (!profile) return res.status(404).json({ error: 'Perfil não encontrado.' });
  res.json({ profile });
});

const VALID_STYLES = new Set(['ronin', 'shinobi', 'monge', 'berserker', 'espectro']);
const VALID_AVATARS = new Set(['shinobi', 'kitsune', 'espectro', 'predador', 'dourado', 'campeao', 'samurai', 'oni', 'ceifador', 'imperador']);

router.patch('/me', requireAuth, async (req, res) => {
  // troca de avatar (Profile Icons) — só visual, valida contra a galeria oficial
  if (req.body.avatar !== undefined && req.body.fighterName === undefined) {
    const avatar = String(req.body.avatar || '');
    if (!VALID_AVATARS.has(avatar)) return res.status(400).json({ error: 'Avatar inválido.' });
    await q('UPDATE profiles SET avatar = $1, updated_at = now() WHERE user_id = $2', [avatar, req.userId]);
    return res.json({ profile: await fetchProfile(req.userId) });
  }
  // troca de estilo de luta (sem mexer no nome)
  if (req.body.style !== undefined && req.body.fighterName === undefined) {
    const style = String(req.body.style || '');
    if (!VALID_STYLES.has(style)) return res.status(400).json({ error: 'Estilo inválido.' });
    if (style !== 'ronin') {
      const { rows } = await q(
        'SELECT 1 FROM user_items WHERE user_id = $1 AND item_id = $2',
        [req.userId, `estilo_${style}`]
      );
      if (!rows[0]) return res.status(403).json({ error: 'Desbloqueie esse estilo na Loja primeiro.' });
    }
    await q('UPDATE profiles SET style = $1, updated_at = now() WHERE user_id = $2', [style, req.userId]);
    return res.json({ profile: await fetchProfile(req.userId) });
  }
  const fighterName = String(req.body.fighterName || '').trim();
  if (!NAME_RE.test(fighterName))
    return res.status(400).json({
      error: 'Nome de lutador: 3 a 16 caracteres, apenas letras, números e _.',
    });
  try {
    await q('UPDATE profiles SET fighter_name = $1, updated_at = now() WHERE user_id = $2', [
      fighterName,
      req.userId,
    ]);
  } catch (err) {
    if (err.code === '23505')
      return res.status(409).json({ error: 'Esse nome de lutador já está em uso.' });
    throw err;
  }
  res.json({ profile: await fetchProfile(req.userId) });
});

// ===== esqueci a senha =====
const SITE_URL = process.env.PUBLIC_URL || 'https://game.stikdead.com';
const sha = (t) => crypto.createHash('sha256').update(t).digest('hex');

router.post('/forgot', async (req, res) => {
  const email = String(req.body.email || '').trim().toLowerCase();
  // resposta sempre igual: nunca revelamos se o email existe
  res.json({ ok: true, message: 'Se este email tiver conta, o link de redefinição chega em instantes.' });
  try {
    const { rows } = await q('SELECT id FROM users WHERE email = $1', [email]);
    if (!rows[0]) return;
    const token = crypto.randomBytes(32).toString('hex');
    await q(
      `INSERT INTO password_resets (user_id, token_hash, expires_at) VALUES ($1, $2, now() + interval '1 hour')`,
      [rows[0].id, sha(token)]
    );
    const { sendPasswordReset } = await import('./email.js');
    await sendPasswordReset(email, `${SITE_URL}/redefinir?token=${token}`);
  } catch (e) {
    console.error('forgot:', e.message);
  }
});

router.post('/reset', async (req, res) => {
  const token = String(req.body.token || '');
  const password = String(req.body.password || '');
  if (password.length < 8) return res.status(400).json({ error: 'A senha precisa de pelo menos 8 caracteres.' });
  const { rows } = await q(
    `UPDATE password_resets SET used_at = now()
      WHERE token_hash = $1 AND used_at IS NULL AND expires_at > now()
      RETURNING user_id`,
    [sha(token)]
  );
  if (!rows[0]) return res.status(400).json({ error: 'Link inválido ou expirado. Peça um novo.' });
  const passwordHash = await bcrypt.hash(password, 10);
  await q('UPDATE users SET password_hash = $1 WHERE id = $2', [passwordHash, rows[0].user_id]);
  res.json({ ok: true });
});

export default router;
