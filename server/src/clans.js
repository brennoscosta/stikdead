// STIKDEAD :: CLÃS — nome curto, lema, bandeira e reputação 🛡️
import { Router } from 'express';
import { mkdir, writeFile, unlink } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const execF = promisify(execFile);
import { q } from './db.js';
import { requireAuth } from './auth.js';
import { logActivity } from './activities.js';
import { notifyUser } from './online.js';

const router = Router();
const FLAGS_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'uploads', 'clans'); // ancorado ao código, imune ao cwd do pm2
const CRIAR_NIVEL = 10, ENTRAR_NIVEL = 5;

const meuPerfil = async (uid) =>
  (await q('SELECT user_id, fighter_name, level, clan_id FROM profiles WHERE user_id = $1', [uid])).rows[0];

const clanCompleto = async (clanId) => {
  const { rows: c } = await q('SELECT * FROM clans WHERE id = $1', [clanId]);
  if (!c[0]) return null;
  const { rows: membros } = await q(
    `SELECT p.user_id, p.fighter_name, p.level, p.wins, p.losses, p.rank_points, p.win_streak
       FROM profiles p WHERE p.clan_id = $1 ORDER BY p.rank_points DESC`, [clanId]);
  const vitorias = membros.reduce((s, m) => s + Number(m.wins), 0);
  const derrotas = membros.reduce((s, m) => s + Number(m.losses), 0);
  const cl = c[0];
  return {
    id: cl.id, name: cl.name, motto: cl.motto,
    flagColor: cl.flag_color, flagUrl: cl.flag_file ? `/api/clans/flag/${cl.id}?v=${encodeURIComponent(cl.flag_file)}` : null,
    ownerId: Number(cl.owner_id),
    reputacao: { vitorias, derrotas, duoWins: cl.duo_wins, duoBattles: cl.duo_battles },
    membros: membros.map((m) => ({ ...m, user_id: Number(m.user_id) })),
  };
};

// ===== criar (nível 10+) =====
router.post('/', requireAuth, async (req, res) => {
  const p = await meuPerfil(req.userId);
  if (!p) return res.status(404).json({ error: 'Perfil não encontrado.' });
  if (p.clan_id) return res.status(400).json({ error: 'Você já pertence a um clã.' });
  if (p.level < CRIAR_NIVEL) return res.status(403).json({ error: `Só a partir do nível ${CRIAR_NIVEL} se funda um clã.` });

  const name = String(req.body.name || '').trim();
  const motto = String(req.body.motto || '').trim().slice(0, 30);
  const flagColor = /^#[0-9a-fA-F]{6}$/.test(req.body.flagColor || '') ? req.body.flagColor : '#d90429';
  if (name.length < 2 || name.length > 12) return res.status(400).json({ error: 'Nome do clã: 2 a 12 caracteres.' });

  // bandeira enviada (opcional): dataURL png/jpeg/webp até ~400KB
  let flagFile = null;
  const data = req.body.flagData;
  if (typeof data === 'string' && data.startsWith('data:image/')) {
    const m = data.match(/^data:image\/(png|jpe?g|webp);base64,(.+)$/);
    if (!m) return res.status(400).json({ error: 'Bandeira: use PNG, JPG ou WEBP.' });
    const buf = Buffer.from(m[2], 'base64');
    if (buf.length > 400 * 1024) return res.status(400).json({ error: 'Bandeira: máximo 400KB.' });
    if (!existsSync(FLAGS_DIR)) await mkdir(FLAGS_DIR, { recursive: true });
    // conversão: 512x512 webp levinha (cover + crop central); ffmpeg falhou? guarda o original
    const bruto = path.join(FLAGS_DIR, `tmp${Date.now()}.${m[1] === 'jpeg' ? 'jpg' : m[1]}`);
    await writeFile(bruto, buf);
    flagFile = `f${Date.now()}.webp`;
    try {
      await execF('ffmpeg', ['-y', '-loglevel', 'error', '-i', bruto,
        '-vf', 'scale=512:512:force_original_aspect_ratio=increase,crop=512:512', path.join(FLAGS_DIR, flagFile)]);
      await unlink(bruto).catch(() => {});
    } catch {
      flagFile = path.basename(bruto); // sem ffmpeg: fica o original
    }
  }

  try {
    const { rows } = await q(
      `INSERT INTO clans (name, motto, flag_color, flag_file, owner_id) VALUES ($1,$2,$3,$4,$5) RETURNING id`,
      [name, motto, flagColor, flagFile, req.userId]);
    await q('UPDATE profiles SET clan_id = $1 WHERE user_id = $2', [rows[0].id, req.userId]);
    await q('INSERT INTO clan_history (user_id, clan_id, clan_name) VALUES ($1,$2,$3)', [req.userId, rows[0].id, name]);
    res.json({ ok: true, clan: await clanCompleto(rows[0].id) });
  } catch (e) {
    if (String(e.message).includes('unique')) return res.status(400).json({ error: 'Já existe um clã com esse nome.' });
    throw e;
  }
});

// ===== editar (só o dono): nome, lema, cor e bandeira =====
router.patch('/', requireAuth, async (req, res) => {
  const p = await meuPerfil(req.userId);
  if (!p?.clan_id) return res.status(400).json({ error: 'Você não tem clã.' });
  const { rows: c } = await q('SELECT * FROM clans WHERE id = $1', [p.clan_id]);
  if (Number(c[0].owner_id) !== req.userId) return res.status(403).json({ error: 'Só o dono edita o clã.' });

  const sets = [], vals = [];
  const add = (col, v) => { vals.push(v); sets.push(`${col} = $${vals.length}`); };

  if (req.body.name !== undefined) {
    const name = String(req.body.name || '').trim();
    if (name.length < 2 || name.length > 12) return res.status(400).json({ error: 'Nome do clã: 2 a 12 caracteres.' });
    add('name', name);
  }
  if (req.body.motto !== undefined) add('motto', String(req.body.motto || '').trim().slice(0, 30));
  if (req.body.flagColor !== undefined && /^#[0-9a-fA-F]{6}$/.test(req.body.flagColor)) add('flag_color', req.body.flagColor);

  const data = req.body.flagData;
  if (typeof data === 'string' && data.startsWith('data:image/')) {
    const m = data.match(/^data:image\/(png|jpe?g|webp);base64,(.+)$/);
    if (!m) return res.status(400).json({ error: 'Bandeira: use PNG, JPG ou WEBP.' });
    const buf = Buffer.from(m[2], 'base64');
    if (buf.length > 400 * 1024) return res.status(400).json({ error: 'Bandeira: máximo 400KB.' });
    if (!existsSync(FLAGS_DIR)) await mkdir(FLAGS_DIR, { recursive: true });
    const bruto = path.join(FLAGS_DIR, `tmp${Date.now()}.${m[1] === 'jpeg' ? 'jpg' : m[1]}`);
    await writeFile(bruto, buf);
    let novo = `f${Date.now()}.webp`;
    try {
      await execF('ffmpeg', ['-y', '-loglevel', 'error', '-i', bruto,
        '-vf', 'scale=512:512:force_original_aspect_ratio=increase,crop=512:512', path.join(FLAGS_DIR, novo)]);
      await unlink(bruto).catch(() => {});
    } catch { novo = path.basename(bruto); }
    if (c[0].flag_file) unlink(path.join(FLAGS_DIR, c[0].flag_file)).catch(() => {});
    add('flag_file', novo);
  } else if (req.body.removeFlag === true) {
    if (c[0].flag_file) unlink(path.join(FLAGS_DIR, c[0].flag_file)).catch(() => {});
    add('flag_file', null);
  }

  if (!sets.length) return res.status(400).json({ error: 'Nada para mudar.' });
  vals.push(p.clan_id);
  try {
    await q(`UPDATE clans SET ${sets.join(', ')} WHERE id = $${vals.length}`, vals);
  } catch (e) {
    if (String(e.message).includes('unique')) return res.status(400).json({ error: 'Já existe um clã com esse nome.' });
    throw e;
  }
  res.json({ ok: true, clan: await clanCompleto(p.clan_id) });
});

// ===== meu clã =====
router.get('/mine', requireAuth, async (req, res) => {
  const p = await meuPerfil(req.userId);
  if (!p?.clan_id) return res.json({ clan: null, canCreate: p ? p.level >= CRIAR_NIVEL : false, canJoin: p ? p.level >= ENTRAR_NIVEL : false });
  const clan = await clanCompleto(p.clan_id);
  res.json({ clan, isOwner: clan?.ownerId === req.userId });
});

// ===== bandeira (servida pela API para passar pelo proxy) =====
router.get('/flag/:id', async (req, res) => {
  const { rows } = await q('SELECT flag_file FROM clans WHERE id = $1', [Number(req.params.id) || 0]);
  if (!rows[0]?.flag_file) return res.status(404).end();
  res.sendFile(path.join(FLAGS_DIR, rows[0].flag_file));
});

// ===== convidar (só o dono; alvo nível 5+, sem clã) =====
router.post('/invite', requireAuth, async (req, res) => {
  const p = await meuPerfil(req.userId);
  if (!p?.clan_id) return res.status(400).json({ error: 'Você não tem clã.' });
  const { rows: c } = await q('SELECT * FROM clans WHERE id = $1', [p.clan_id]);
  if (Number(c[0].owner_id) !== req.userId) return res.status(403).json({ error: 'Só o dono do clã convida.' });

  const alvoNome = String(req.body.name || '').trim();
  const { rows: alvoRows } = await q('SELECT user_id, fighter_name, level, clan_id FROM profiles WHERE LOWER(fighter_name) = LOWER($1)', [alvoNome]);
  const alvo = alvoRows[0];
  if (!alvo) return res.status(404).json({ error: 'Lutador não encontrado.' });
  const alvoId = Number(alvo.user_id);
  if (alvoId === req.userId) return res.status(400).json({ error: 'Convidar a si mesmo? Ambicioso.' });
  if (alvo.clan_id) return res.status(400).json({ error: `${alvo.fighter_name} já tem clã.` });
  if (alvo.level < ENTRAR_NIVEL) return res.status(400).json({ error: `${alvo.fighter_name} precisa ser nível ${ENTRAR_NIVEL}+.` });

  const ins = await q(
    `INSERT INTO clan_invites (clan_id, user_id, invited_by) VALUES ($1,$2,$3)
     ON CONFLICT (clan_id, user_id) DO UPDATE SET invited_by = EXCLUDED.invited_by RETURNING id`,
    [p.clan_id, alvoId, req.userId]);
  logActivity(alvoId, 'clan_invite', { inviteId: ins.rows[0].id, clan: c[0].name, from: p.fighter_name });
  // popup em tempo real (estilo convite de amizade/dupla)
  notifyUser(alvoId, 'clan:invited', {
    inviteId: ins.rows[0].id,
    clan: { id: c[0].id, name: c[0].name, color: c[0].flag_color },
    from: p.fighter_name,
  });
  notifyUser(alvoId, 'social:ping', { type: 'clan_invite' });
  res.json({ ok: true });
});

// ===== responder convite =====
router.post('/respond', requireAuth, async (req, res) => {
  const inviteId = Number(req.body.inviteId) || 0;
  const accept = !!req.body.accept;
  const { rows } = await q('SELECT ci.*, c.name FROM clan_invites ci JOIN clans c ON c.id = ci.clan_id WHERE ci.id = $1 AND ci.user_id = $2', [inviteId, req.userId]);
  const inv = rows[0];
  if (!inv) return res.status(404).json({ error: 'Convite não encontrado.' });
  await q('DELETE FROM clan_invites WHERE id = $1', [inviteId]);
  if (!accept) return res.json({ ok: true, joined: false });
  const p = await meuPerfil(req.userId);
  if (p.clan_id) return res.status(400).json({ error: 'Você já tem clã.' });
  if (p.level < ENTRAR_NIVEL) return res.status(400).json({ error: `Nível ${ENTRAR_NIVEL}+ para entrar.` });
  await q('UPDATE profiles SET clan_id = $1 WHERE user_id = $2', [inv.clan_id, req.userId]);
  await q('INSERT INTO clan_history (user_id, clan_id, clan_name) VALUES ($1,$2,$3)', [req.userId, inv.clan_id, inv.name]);
  logActivity(Number(inv.invited_by), 'clan_joined', { who: p.fighter_name, clan: inv.name });
  // festa dos dois lados: quem convidou vê o popup mudar para "fulano entrou!"
  notifyUser(Number(inv.invited_by), 'clan:joined-by', { who: p.fighter_name, clan: inv.name });
  notifyUser(Number(inv.invited_by), 'social:ping', { type: 'clan_joined' });
  res.json({ ok: true, joined: true, clanName: inv.name });
});

// ===== sair (dono só se estiver sozinho — aí o clã dissolve) =====
router.post('/leave', requireAuth, async (req, res) => {
  const p = await meuPerfil(req.userId);
  if (!p?.clan_id) return res.status(400).json({ error: 'Você não tem clã.' });
  const { rows: c } = await q('SELECT owner_id FROM clans WHERE id = $1', [p.clan_id]);
  const souDono = Number(c[0].owner_id) === req.userId;
  const fechaHistoria = () => q('UPDATE clan_history SET left_at = now() WHERE user_id = $1 AND clan_id = $2 AND left_at IS NULL', [req.userId, p.clan_id]);
  if (souDono) {
    const { rows: n } = await q('SELECT COUNT(*) AS n FROM profiles WHERE clan_id = $1', [p.clan_id]);
    if (Number(n[0].n) > 1) return res.status(400).json({ error: 'O dono só sai quando o clã estiver vazio.' });
    await q('UPDATE profiles SET clan_id = NULL WHERE user_id = $1', [req.userId]);
    await fechaHistoria();
    await q('DELETE FROM clans WHERE id = $1', [p.clan_id]);
    return res.json({ ok: true, dissolved: true });
  }
  await q('UPDATE profiles SET clan_id = NULL WHERE user_id = $1', [req.userId]);
  await fechaHistoria();
  res.json({ ok: true });
});

// ===== perfil público do clã: lutadores, patentes e medalhas =====
router.get('/:id/public', async (req, res) => {
  const id = Number(req.params.id) || 0;
  const clan = await clanCompleto(id);
  if (!clan) return res.status(404).json({ error: 'Clã não encontrado (pode ter sido dissolvido).' });
  res.json({ clan });
});

export default router;
