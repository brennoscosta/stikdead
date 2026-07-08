// STIKDEAD :: servidor online — presença, matchmaking, desafios e salas autoritativas
import jwt from 'jsonwebtoken';
import { createMatch, stepMatch, EMPTY_INPUT } from '../../shared/sim.js';
import { q, pool } from './db.js';
import { computeRewards, applyXp, rankDelta, tierFor, xpForLevel } from './rewards.js';
import { getLoadout, grantStreakDrop } from './shop.js';
import { bumpMissions } from './missions.js';

const TICK = 1 / 30;
const CHALLENGE_TTL = 30_000;
const RECONNECT_GRACE = 15_000;

const sanitizeInput = (i) => ({
  left: !!i?.left, right: !!i?.right, jump: !!i?.jump,
  light: !!i?.light, heavy: !!i?.heavy, block: !!i?.block, dash: !!i?.dash, skill: !!i?.skill,
});

const ONLINE_IDS = new Set();
export const getOnlineIds = () => ONLINE_IDS;
const CLAN_ROOM = new Set(); // quem está com a aba Amigos aberta (canal dos amigos)
const GUILD_ROOM = new Map(); // userId -> clanId (aba do clã aberta)
// ===== MODO DUO (2v2): duplas, fila e batalhas de clã =====
const DUO_OF = new Map();      // userId -> leaderId (membro de dupla formada)
const DUOS = new Map();        // leaderId -> { leader, partner, searching }
const duoQueue = [];           // leaderIds buscando batalha
const DUO_MATCHES = new Map(); // duoId -> { teams: [[a1,a2],[b1,b2]], done: [], roundWins: [0,0], winsCount: [0,0] }
let nextDuo = 1;
const breakDuo = (leaderId, reason) => {
  const d = DUOS.get(leaderId);
  if (!d) return;
  DUOS.delete(leaderId);
  DUO_OF.delete(d.leader); DUO_OF.delete(d.partner);
  const qi = duoQueue.indexOf(leaderId);
  if (qi >= 0) duoQueue.splice(qi, 1);
  for (const uid of [d.leader, d.partner]) online.get(uid)?.socket.emit('duo:broken', { reason });
};
const BOT_FIGHT = new Set(); // quem está lutando contra a máquina
export const getClanIds = () => CLAN_ROOM;
let ONLINE_REF = null; // preenchido no attachOnline
const AWAY_IDS = new Set();
export const getAwayIds = () => AWAY_IDS;
export function notifyUser(userId, event, payload = {}) {
  const e = ONLINE_REF?.get(Number(userId));
  if (e) e.socket.emit(event, payload);
}

export function attachOnline(io) {
  const online = new Map();   // userId -> { socket, user }
  ONLINE_REF = online;
  const queue = [];           // userIds
  const challenges = new Map(); // id -> { from, to, timer }
  const rooms = new Map();    // roomId -> Room
  const userRoom = new Map(); // userId -> roomId
  let nextRoom = 1;
  let nextChallenge = 1;

  // ===== autenticação do socket =====
  io.use(async (socket, next) => {
    try {
      const { sub } = jwt.verify(socket.handshake.auth?.token, process.env.JWT_SECRET);
      const { rows } = await q(
        `SELECT u.id, p.fighter_name AS name, p.level, p.tier, p.rank_points
           FROM users u JOIN profiles p ON p.user_id = u.id WHERE u.id = $1`,
        [Number(sub)]
      );
      if (!rows[0]) return next(new Error('unauthorized'));
      socket.user = { ...rows[0], id: Number(rows[0].id) };
      next();
    } catch {
      next(new Error('unauthorized'));
    }
  });

  const presencePayload = () =>
    [...online.values()].map(({ user, loadout }) => ({
      away: AWAY_IDS.has(user.id),
      id: user.id, name: user.name, level: user.level, tier: user.tier,
      inMatch: userRoom.has(user.id) || BOT_FIGHT.has(user.id), loadout: loadout || [],
      clan: user.clan || null,
      duo: DUO_OF.has(user.id), duoLeader: DUOS.has(user.id), duoLeaderId: DUO_OF.get(user.id) || null,
      duoWith: (() => {
        const lid = DUO_OF.get(user.id);
        if (!lid) return null;
        const d = DUOS.get(lid);
        const outro = d ? (d.leader === user.id ? d.partner : d.leader) : null;
        return outro ? online.get(outro)?.user.name || null : null;
      })(),
    }));
  const broadcastPresence = () => io.emit('presence', { players: presencePayload() });

  const chatHistory = [];
  const chatLast = new Map();

  const dequeue = (userId) => {
    const i = queue.indexOf(userId);
    if (i >= 0) queue.splice(i, 1);
  };

  function tryMatchQueue() {
    while (queue.length >= 2) {
      const a = queue.shift();
      const b = queue.shift();
      if (!online.has(a)) { queue.unshift(b); continue; }
      if (!online.has(b)) { queue.unshift(a); continue; }
      createRoom(a, b);
    }
  }

  // batalha de clã: líder vs líder + parceiro vs parceiro, salas irmãs
  function startDuoMatch(leaderA, leaderB) {
    const A = DUOS.get(leaderA), B = DUOS.get(leaderB);
    if (!A || !B) return;
    for (const uid of [A.leader, A.partner, B.leader, B.partner]) {
      if (!online.has(uid) || userRoom.has(uid)) return; // alguém caiu/entrou em luta
    }
    const qi = duoQueue.indexOf(leaderA); if (qi >= 0) duoQueue.splice(qi, 1);
    const qj = duoQueue.indexOf(leaderB); if (qj >= 0) duoQueue.splice(qj, 1);
    A.searching = false; B.searching = false;
    dequeue(A.leader); dequeue(A.partner); dequeue(B.leader); dequeue(B.partner);
    const duoId = `d${nextDuo++}`;
    // UMA sala, QUATRO guerreiros: [líder A, parceiro A, líder B, parceiro B] — times [0,0,1,1]
    createRoom([A.leader, A.partner, B.leader, B.partner], null, null, duoId);
  }

  // fim de uma sala-irmã: soma no placar da batalha de clã
  async function settleDuoRoom(room, winnerSide) {
    const dm = DUO_MATCHES.get(room.duo);
    if (!dm) return;
    // qual time é o lado 0 desta sala?
    const t0 = dm.teams[0].includes(room.users[0]) ? 0 : 1;
    const timeVencedor = winnerSide === 0 ? t0 : 1 - t0;
    dm.winsCount[timeVencedor] += 1;
    dm.roundWins[t0] += room.match.wins?.[0] || 0;
    dm.roundWins[1 - t0] += room.match.wins?.[1] || 0;
    dm.done += 1;
    if (dm.done < 2) return;
    DUO_MATCHES.delete(room.duo);
    // veredito: partidas vencidas; empate 1-1 -> rounds; ainda -> empate
    let vencedor = dm.winsCount[0] > dm.winsCount[1] ? 0 : dm.winsCount[1] > dm.winsCount[0] ? 1 : -1;
    if (vencedor === -1) vencedor = dm.roundWins[0] > dm.roundWins[1] ? 0 : dm.roundWins[1] > dm.roundWins[0] ? 1 : -1;
    // reputação: time com clã unificado conta batalha; vencedor conta vitória
    try {
      const todos = [...dm.teams[0], ...dm.teams[1]];
      const { rows } = await q('SELECT user_id, clan_id FROM profiles WHERE user_id = ANY($1)', [todos]);
      const claDe = (uid) => rows.find((r) => Number(r.user_id) === uid)?.clan_id || null;
      for (let t = 0; t < 2; t++) {
        const [x, y] = dm.teams[t];
        const cla = claDe(x) && claDe(x) === claDe(y) ? claDe(x) : null;
        if (cla) await q('UPDATE clans SET duo_battles = duo_battles + 1, duo_wins = duo_wins + $1 WHERE id = $2', [vencedor === t ? 1 : 0, cla]);
      }
    } catch { /* reputação não derruba o jogo */ }
    // aviso aos 4 guerreiros
    for (let t = 0; t < 2; t++) {
      const placar = `${dm.winsCount[t]} x ${dm.winsCount[1 - t]}`;
      const texto = vencedor === -1
        ? `🤝 Batalha de clã EMPATADA (${placar}, rounds ${dm.roundWins[t]}x${dm.roundWins[1 - t]}).`
        : vencedor === t
          ? `🏆 SUA DUPLA VENCEU a batalha de clã! (${placar})`
          : `💀 Sua dupla perdeu a batalha de clã (${placar}).`;
      for (const uid of dm.teams[t]) online.get(uid)?.socket.emit('duo:result', { won: vencedor === t, draw: vencedor === -1, texto });
    }
  }

  function createRoom(idA, idB, bet = null, duo = null) {
    const ids = Array.isArray(idA) ? idA : [idA, idB];
    const roomId = `r${nextRoom++}`;
    const players = ids.map((uid) => online.get(uid));
    const room = {
      id: roomId,
      arena: ['dojo', 'temple', 'prison', 'neve', 'deserto', 'praia', 'cidade_rio', 'cemiterio'][Math.floor(Math.random() * 8)],
      users: ids,
      bet,
      duo,
      names: players.map((p) => p.user.name),
      match: createMatch({
        styles: players.map((p) => p?.style || 'ronin'),
        teams: ids.length === 4 ? [0, 0, 1, 1] : null,
      }),
      inputs: ids.map(() => ({ ...EMPTY_INPUT })),
      connected: ids.map(() => true),
      paused: false,
      pauseDeadline: 0,
      finished: false,
      interval: null,
    };
    rooms.set(roomId, room);
    for (const uid of ids) userRoom.set(uid, roomId);

    Promise.all(room.users.map((uid) => getLoadout(uid))).then((louts) => {
      room.loadouts = louts;
      players.forEach(({ socket }, side) => {
        socket.join(roomId);
        socket.emit('match:start', {
          roomId, side, arena: room.arena,
          teams: room.match.teams || null,
          players: room.users.map((uid, s) => {
            const u = online.get(uid).user;
            return { name: u.name, level: u.level, tier: u.tier, loadout: louts[s], style: online.get(uid)?.style || 'ronin' };
          }),
        });
      });
    });

    room.interval = setInterval(() => tickRoom(room), TICK * 1000);
    broadcastPresence();
    return room;
  }

  const reduceF = (f) => ({
    x: Math.round(f.x * 10) / 10, y: Math.round(f.y * 10) / 10,
    face: f.face, hp: f.hp, state: f.state, t: f.t,
    vy: Math.round(f.vy), hitstun: f.hitstun || 0, combo: f.combo, fury: Math.round(f.fury * 10) / 10, style: f.style,
  });

  function snapshot(room, ev) {
    const m = room.match;
    const sr = room.sisterRoom;
    return {
      sis: sr ? { f: sr.match.fighters.map(reduceF), wins: sr.match.wins, lo: sr.loadouts || null, over: !!sr.finished } : undefined,
      phase: m.phase, phaseT: m.phaseT, timer: m.timer, round: m.round,
      wins: m.wins, suddenDeath: m.suddenDeath,
      f: m.fighters.map((f) => ({
        x: Math.round(f.x * 10) / 10, y: Math.round(f.y * 10) / 10,
        face: f.face, hp: f.hp, state: f.state, t: f.t,
        vy: Math.round(f.vy), hitstun: f.hitstun || 0, combo: f.combo,
        skillCd: Math.round(f.skillCd * 10) / 10, fury: Math.round(f.fury * 10) / 10, style: f.style,
      })),
      ev,
    };
  }

  function tickRoom(room) {
    if (room.finished) return;

    if (room.paused) {
      if (Date.now() >= room.pauseDeadline) {
        const loser = room.connected.indexOf(false);
        const teams = room.match.teams || [0, 1];
        return finishRoom(room, loser === -1 ? 0 : 1 - teams[loser], { wo: true });
      }
      return;
    }

    const ev = stepMatch(room.match, room.inputs, null, TICK);
    io.to(room.id).emit('snapshot', snapshot(room, ev));
    if (room.match.phase === 'matchend') finishRoom(room, room.match.winner, {});
  }

  async function finishRoom(room, winnerSide, { wo = false }) {
    if (room.finished) return;
    room.finished = true;
    clearInterval(room.interval);

    const m = room.match;
    const results = [];
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const { rows } = await client.query(
        `SELECT user_id, level, xp, coins, diamonds, rank_points, wins, losses, win_streak
           FROM profiles WHERE user_id = ANY($1) FOR UPDATE`,
        [room.users]
      );
      const profs = room.users.map((uid) => rows.find((r) => Number(r.user_id) === uid));
      const teams = m.teams || [0, 1];
      const mirrorOf = (s) => (room.users.length === 2 ? 1 - s : (s + 2) % 4); // rival direto (líder↔líder, parceiro↔parceiro)
      const delta = room.users.length === 2 ? rankDelta(profs[winnerSide].rank_points, profs[1 - winnerSide].rank_points) : null;

      // APOSTA: transferência pura do perdedor para o vencedor (só existe no 1v1)
      let transfer = 0;
      const apostaCol = room.bet ? (room.bet.kind === 'diamonds' ? 'diamonds' : 'coins') : null;
      if (room.bet && room.users.length === 2) {
        const perdedor = profs[1 - winnerSide];
        transfer = Math.min(Number(perdedor[apostaCol] || 0), room.bet.amount);
      }

      for (const side of room.users.keys()) {
        const p = profs[side];
        const won = teams[side] === winnerSide;
        const streak = won ? p.win_streak + 1 : 0;
        const rewards = computeRewards({
          won,
          stats: m.stats[side],
          winsB: m.wins[1 - teams[side]],
          streak,
          factor: wo && !won ? 0 : 1, // abandono não rende nada ao desistente
        });
        const lv = applyXp(p.level, p.xp, rewards.xp);
        const dPar = delta || rankDelta(profs[side].rank_points, profs[mirrorOf(side)].rank_points);
        const newRank = Math.max(0, p.rank_points + (won ? dPar.win : -dPar.loss));
        const tier = tierFor(newRank);
        let itemDrop = null;
        if (won && streak > 0 && streak % 3 === 0) itemDrop = await grantStreakDrop(client, room.users[side]);
        bumpMissions(room.users[side], m.stats[side] || {}, won);

        // moedas do sistema: na APOSTA não existem; na normal, o perdedor tem piso ZERO (perde só o que tem)
        let coinDelta;
        if (room.bet) {
          coinDelta = apostaCol === 'coins' ? (won ? transfer : -transfer) : 0;
        } else {
          coinDelta = won ? rewards.coins : -Math.min(Number(p.coins), Math.abs(rewards.coins));
        }
        const diamDelta = room.bet && apostaCol === 'diamonds' ? (won ? transfer : -transfer) : 0;

        await client.query(
          `UPDATE profiles SET level=$1, xp=$2, coins=GREATEST(0, coins+$3), diamonds=GREATEST(0, diamonds+$4),
                  rank_points=$5, tier=$6, wins=wins+$7, losses=losses+$8, win_streak=$9, updated_at=now()
            WHERE user_id=$10`,
          [lv.level, lv.xp, coinDelta, diamDelta, newRank, tier, won ? 1 : 0, won ? 0 : 1, streak, room.users[side]]
        );
        await client.query(
          `INSERT INTO matches (user_id, opponent_type, opponent_id, won, wins_a, wins_b, duration_s, stats, xp_gain, coin_gain)
           VALUES ($1,'player',$2,$3,$4,$5,$6,$7,$8,$9)`,
          [room.users[side], room.users[mirrorOf(side)], won, m.wins[teams[side]], m.wins[1 - teams[side]],
           Math.round(m.elapsed), m.stats[side], rewards.xp, coinDelta]
        );
        results[side] = {
          winnerSide, wo, wins: m.wins, itemDrop,
          bet: room.bet ? { kind: room.bet.kind, amount: transfer, won } : null,
          rewards: { ...rewards, coins: room.bet ? 0 : coinDelta, levelsUp: lv.levelsUp },
          rank: { points: newRank, delta: won ? dPar.win : -dPar.loss, tier },
          profile: {
            level: lv.level, xp: lv.xp, xpNext: xpForLevel(lv.level),
            coins: Number(p.coins) + coinDelta,
            diamonds: Number(p.diamonds || 0) + diamDelta,
          },
        };
        const ou = online.get(room.users[side]);
        if (ou) {
          ou.user.level = lv.level;
          ou.user.tier = tier;
          ou.user.rank_points = newRank;
        }
      }
      await client.query('COMMIT');
      if (room.duo && room.users.length === 4) {
        (async () => {
          try {
            const { rows: cr } = await q('SELECT user_id, clan_id FROM profiles WHERE user_id = ANY($1)', [room.users]);
            const claDe = (uid) => cr.find((r) => Number(r.user_id) === uid)?.clan_id || null;
            for (const t of [0, 1]) {
              const membros = room.users.filter((_, s) => (m.teams || [0, 1])[s] === t);
              const cla = claDe(membros[0]) && claDe(membros[0]) === claDe(membros[1]) ? claDe(membros[0]) : null;
              if (cla) await q('UPDATE clans SET duo_battles = duo_battles + 1, duo_wins = duo_wins + $1 WHERE id = $2', [winnerSide === t ? 1 : 0, cla]);
            }
          } catch { /* reputação não derruba o jogo */ }
          room.users.forEach((uid, s) => {
            const won = (m.teams || [0, 1])[s] === winnerSide;
            online.get(uid)?.socket.emit('duo:result', { won, draw: false, texto: won ? '🏆 SUA DUPLA VENCEU A BATALHA!' : '💀 A dupla rival levou a batalha.' });
          });
        })().catch(() => {});
      }
      // apostas viram história no feed de atividades
      if (room.bet && transfer > 0) {
        try {
          const { logActivity } = await import('./activities.js');
          const vencedor = room.users[winnerSide], perdedor = room.users[1 - winnerSide];
          logActivity(vencedor, 'bet_win', { amount: transfer, kind: room.bet.kind, with: room.names[1 - winnerSide] });
          logActivity(perdedor, 'bet_loss', { amount: transfer, kind: room.bet.kind, with: room.names[winnerSide] });
          notifyUser(vencedor, 'social:ping', { type: 'bet_win' });
          notifyUser(perdedor, 'social:ping', { type: 'bet_loss' });
        } catch { /* feed não derruba o acerto */ }
      }
    } catch (err) {
      await client.query('ROLLBACK');
      console.error('finishRoom', err);
    } finally {
      client.release();
    }

    room.users.forEach((uid, side) => {
      online.get(uid)?.socket.emit('match:end', results[side] || { winnerSide, wo, wins: m.wins });
      userRoom.delete(uid);
    });
    rooms.delete(room.id);
    broadcastPresence();
  }

  // ===== conexões =====
  io.on('connection', (socket) => {
    const user = socket.user;
    const prev = online.get(user.id);
    if (prev) prev.socket.disconnect(true);
    online.set(user.id, { socket, user });
    ONLINE_IDS.add(user.id);
    q('UPDATE profiles SET last_seen = now() WHERE user_id = $1', [user.id]).catch(() => {});
    q('SELECT style FROM profiles WHERE user_id = $1', [user.id])
      .then(({ rows }) => { const e = online.get(user.id); if (e) e.style = rows[0]?.style || 'ronin'; })
      .catch(() => {});
    const carregaCla = () => q(
      `SELECT c.name, c.flag_color FROM profiles p JOIN clans c ON c.id = p.clan_id WHERE p.user_id = $1`, [user.id])
      .then(({ rows }) => {
        user.clan = rows[0] ? { name: rows[0].name, color: rows[0].flag_color } : null;
        broadcastPresence();
      }).catch(() => {});
    carregaCla();
    socket.on('clan:refresh', carregaCla);
    getLoadout(user.id).then((l) => {
      const entry = online.get(user.id);
      if (entry && entry.socket === socket) { entry.loadout = l; broadcastPresence(); }
    }).catch(() => {});

    // chat do lobby
    socket.emit('chat:history', { messages: chatHistory });
    const parsePrivate = (text) => {
      const m = text.match(/^\/(\S+)\s+([\s\S]+)/);
      if (!m) return null;
      const targetName = m[1].toLowerCase();
      for (const entry of online.values()) {
        if (entry.user.name.toLowerCase() === targetName) return { entry, body: m[2] };
      }
      return { entry: null, body: m[2], targetName: m[1] };
    };

    const handleSend = (payload, channel) => {
      const text = String(payload?.text || '').trim().slice(0, 100);
      if (!text) return;
      const now = Date.now();
      if (now - (chatLast.get(user.id) || 0) < 1000) return; // 1 msg/s
      chatLast.set(user.id, now);

      // sussurro: /nome mensagem (sem case sensitive)
      if (text.startsWith('/')) {
        const pv = parsePrivate(text);
        if (!pv) return;
        if (!pv.entry) {
          socket.emit(channel, { name: 'STIKDEAD', system: true, text: `${pv.targetName} não está online.`, ts: now });
          return;
        }
        const msg = { name: user.name, userId: user.id, to: pv.entry.user.name, private: true, text: pv.body, ts: now };
        socket.emit(channel, msg);
        if (pv.entry.socket !== socket) pv.entry.socket.emit(channel, msg);
        // sussurro também vira balão privado nas duas pontas? não: balão é público — sussurro fica no texto
        return;
      }

      const msg = { name: user.name, userId: user.id, text, ts: now };
      if (channel === 'chat:msg') {
        chatHistory.push(msg);
        if (chatHistory.length > 50) chatHistory.shift();
        io.emit('chat:msg', msg);
      } else {
        // canal do clã: entrega para os AMIGOS online (e para si)
        socket.emit('clan:msg', msg);
        q(`SELECT CASE WHEN requester_id = $1 THEN addressee_id ELSE requester_id END AS fid
             FROM friendships WHERE (requester_id = $1 OR addressee_id = $1) AND status = 'accepted'`, [user.id])
          .then(({ rows }) => {
            for (const r of rows) {
              const e = online.get(Number(r.fid));
              if (e) e.socket.emit('clan:msg', msg);
            }
          }).catch(() => {});
      }
    };

    socket.on('chat:send', (payload) => handleSend(payload, 'chat:msg'));
    socket.on('clan:send', (payload) => handleSend(payload, 'clan:msg'));
    socket.on('presence:visibility', (p) => {
      if (p?.hidden) AWAY_IDS.add(user.id); else AWAY_IDS.delete(user.id);
      broadcastPresence();
    });
    socket.on('status:battle', (p) => {
      if (p?.on) BOT_FIGHT.add(user.id); else BOT_FIGHT.delete(user.id);
      broadcastPresence();
    });
    socket.on('clan:enter', () => { CLAN_ROOM.add(user.id); });
    socket.on('clan:leave', () => { CLAN_ROOM.delete(user.id); });
    // salão do clã de verdade: filtrado por clan_id (buscado fresco ao entrar)
    socket.on('guild:enter', async () => {
      const { rows } = await q('SELECT clan_id FROM profiles WHERE user_id = $1', [user.id]);
      if (rows[0]?.clan_id) GUILD_ROOM.set(user.id, Number(rows[0].clan_id));
    });
    socket.on('guild:leave', () => { GUILD_ROOM.delete(user.id); });

    // ===== DUPLA: amigo convida amigo =====
    socket.on('duo:invite', async ({ to }) => {
      const alvo = Number(to);
      const t = online.get(alvo);
      if (!t || alvo === user.id || DUO_OF.has(user.id) || DUO_OF.has(alvo) || userRoom.has(user.id) || userRoom.has(alvo)) return;
      const { rows: amigos } = await q(
        `SELECT 1 FROM friendships WHERE status = 'accepted' AND
           ((requester_id = $1 AND addressee_id = $2) OR (requester_id = $2 AND addressee_id = $1))`,
        [user.id, alvo]);
      if (!amigos[0]) {
        socket.emit('chat:msg', { name: 'STIKDEAD', system: true, text: 'Duplas são entre AMIGOS — peça amizade primeiro. 🤝', ts: Date.now() });
        return;
      }
      t.socket.emit('duo:invited', { from: { id: user.id, name: user.name, level: user.level } });
      socket.emit('chat:msg', { name: 'STIKDEAD', system: true, text: `Convite de dupla enviado para ${t.user.name}. 🤝`, ts: Date.now() });
    });
    socket.on('duo:answer', ({ from, accept }) => {
      const lider = Number(from);
      const L = online.get(lider);
      if (!L || DUO_OF.has(user.id) || DUO_OF.has(lider)) return;
      if (!accept) { L.socket.emit('chat:msg', { name: 'STIKDEAD', system: true, text: `${user.name} recusou a dupla.`, ts: Date.now() }); return; }
      DUOS.set(lider, { leader: lider, partner: user.id, searching: false });
      DUO_OF.set(lider, lider); DUO_OF.set(user.id, lider);
      const payload = { leader: { id: lider, name: L.user.name }, partner: { id: user.id, name: user.name } };
      L.socket.emit('duo:formed', payload);
      socket.emit('duo:formed', payload);
      broadcastPresence();
    });
    socket.on('duo:cancel', () => {
      const lid = DUO_OF.get(user.id);
      if (lid) { breakDuo(lid, `${user.name} desfez a dupla`); broadcastPresence(); }
    });

    // líder busca batalha de clã (fila duo) — SEM APOSTAS por natureza
    socket.on('duo:queue', () => {
      const d = DUOS.get(user.id);
      if (!d || userRoom.has(d.leader) || userRoom.has(d.partner)) return;
      if (!online.has(d.partner)) { breakDuo(user.id, 'parceiro offline'); return; }
      if (duoQueue.includes(user.id)) return;
      // já tem alguém esperando? luta AGORA
      const rivalLeader = duoQueue.shift();
      if (rivalLeader && rivalLeader !== user.id && DUOS.has(rivalLeader)) {
        startDuoMatch(user.id, rivalLeader);
      } else {
        if (rivalLeader) duoQueue.unshift(rivalLeader);
        duoQueue.push(user.id);
        d.searching = true;
        for (const uid of [d.leader, d.partner]) online.get(uid)?.socket.emit('duo:searching');
      }
    });
    // desafio direto dupla -> dupla (pela lista do lobby)
    socket.on('duo:challenge', ({ toLeader }) => {
      const meuLider = DUO_OF.get(user.id);              // qualquer membro pode puxar o desafio
      const liderDele = DUO_OF.get(Number(toLeader));    // e mirar qualquer membro da outra dupla
      const meu = meuLider ? DUOS.get(meuLider) : null;
      const dele = liderDele ? DUOS.get(liderDele) : null;
      if (!meu || !dele || meu === dele) return;
      online.get(liderDele)?.socket.emit('duo:challenged', { from: { id: meuLider, name: user.name } });
      socket.emit('chat:msg', { name: 'STIKDEAD', system: true, text: '⚔️ Desafio de dupla enviado! Aguardando o líder deles...', ts: Date.now() });
    });
    socket.on('duo:challenge:answer', ({ from, accept }) => {
      const rival = Number(from);
      if (!accept) { online.get(rival)?.socket.emit('chat:msg', { name: 'STIKDEAD', system: true, text: 'Desafio de dupla recusado.', ts: Date.now() }); return; }
      if (!DUOS.has(user.id) || !DUOS.has(rival)) return;
      startDuoMatch(rival, user.id);
    });
    socket.on('guild:send', (payload) => {
      const meuCla = GUILD_ROOM.get(user.id);
      if (!meuCla) return;
      const text = String(payload?.text || '').trim().slice(0, 100);
      if (!text) return;
      const msg = { name: user.name, userId: user.id, text, ts: Date.now() };
      for (const [uid, cid] of GUILD_ROOM) {
        if (cid === meuCla) online.get(uid)?.socket.emit('guild:msg', msg);
      }
    });
    socket.on('presence:get', () => {
      socket.emit('presence', { players: presencePayload() });
    });
    socket.on('loadout:refresh', () => {
      getLoadout(user.id).then((l) => {
        const entry = online.get(user.id);
        if (entry) { entry.loadout = l; broadcastPresence(); }
      }).catch(() => {});
    });

    // reconexão a uma sala ativa
    const roomId = userRoom.get(user.id);
    if (roomId && rooms.has(roomId)) {
      const room = rooms.get(roomId);
      const side = room.users.indexOf(user.id);
      room.connected[side] = true;
      socket.join(roomId);
      if (room.connected.every(Boolean)) {
        room.paused = false;
        io.to(roomId).emit('match:resumed');
      }
      socket.emit('match:start', {
        roomId, side, rejoin: true, arena: room.arena || 'dojo',
        players: room.users.map((uid, s) => {
          const u = online.get(uid)?.user;
          return {
            name: u?.name || room.names[s], level: u?.level || 1,
            tier: u?.tier || 'BRONZE_III', loadout: room.loadouts?.[s] || [],
            style: online.get(uid)?.style || 'ronin',
          };
        }),
      });
    }

    broadcastPresence();

    const avisaDuo = () => socket.emit('chat:msg', { name: 'STIKDEAD', system: true, text: '🤝 Você está em DUPLA — desfaça-a para lutar sozinho.', ts: Date.now() });
    socket.on('queue:join', () => {
      if (DUO_OF.has(user.id)) return avisaDuo();
      if (userRoom.has(user.id) || queue.includes(user.id)) return;
      queue.push(user.id);
      socket.emit('queue:status', { inQueue: true });
      tryMatchQueue();
    });

    socket.on('queue:leave', () => {
      dequeue(user.id);
      socket.emit('queue:status', { inQueue: false });
    });

    socket.on('challenge:send', async ({ to, bet }) => {
      if (DUO_OF.has(user.id)) return avisaDuo();
      if (DUO_OF.has(Number(to))) return socket.emit('chat:msg', { name: 'STIKDEAD', system: true, text: '🤝 Esse lutador está em DUPLA — desafie a dupla dele!', ts: Date.now() });
      const target = online.get(Number(to));
      if (!target || userRoom.has(user.id) || userRoom.has(Number(to)) || Number(to) === user.id) return;
      // aposta: validação + saldo dos DOIS antes de propor
      let aposta = null;
      if (bet && bet.kind) {
        const kind = bet.kind === 'diamonds' ? 'diamonds' : 'coins';
        const amount = Math.floor(Number(bet.amount));
        if (!Number.isFinite(amount) || amount < 1 || amount > 1000000) {
          socket.emit('chat:msg', { name: 'STIKDEAD', system: true, text: 'Valor de aposta inválido.', ts: Date.now() });
          return;
        }
        const col = kind === 'diamonds' ? 'diamonds' : 'coins';
        const { rows: saldos } = await q(
          `SELECT user_id, ${col} AS saldo FROM profiles WHERE user_id = ANY($1)`,
          [[user.id, Number(to)]]
        );
        const meu = saldos.find((r) => Number(r.user_id) === user.id);
        const dele = saldos.find((r) => Number(r.user_id) === Number(to));
        const icone = kind === 'diamonds' ? '💎' : '🪙';
        if (!meu || Number(meu.saldo) < amount) {
          socket.emit('chat:msg', { name: 'STIKDEAD', system: true, text: `Saldo insuficiente para apostar ${amount} ${icone}.`, ts: Date.now() });
          return;
        }
        if (!dele || Number(dele.saldo) < amount) {
          socket.emit('chat:msg', { name: 'STIKDEAD', system: true, text: `${target.user.name} não tem ${amount} ${icone} para cobrir a aposta.`, ts: Date.now() });
          return;
        }
        aposta = { kind, amount };
      }
      if (AWAY_IDS.has(Number(to))) {
        socket.emit('chat:msg', { name: 'STIKDEAD', system: true, text: `${target.user.name} está ausente 💤 — não pode ser desafiado agora.`, ts: Date.now() });
        return;
      }
      if (BOT_FIGHT.has(Number(to))) {
        socket.emit('chat:msg', { name: 'STIKDEAD', system: true, text: `${target.user.name} está EM COMBATE ⚔️ — espere a luta terminar.`, ts: Date.now() });
        return;
      }
      const id = `c${nextChallenge++}`;
      const ch = {
        id, from: user.id, to: Number(to), bet: aposta,
        timer: setTimeout(() => {
          challenges.delete(id);
          online.get(user.id)?.socket.emit('challenge:cancel', { id, reason: 'expirou' });
          target.socket.emit('challenge:cancel', { id, reason: 'expirou' });
        }, CHALLENGE_TTL),
      };
      challenges.set(id, ch);
      target.socket.emit('challenge:received', {
        id, ttl: CHALLENGE_TTL, bet: aposta,
        from: { id: user.id, name: user.name, level: user.level, tier: user.tier },
      });
      socket.emit('challenge:sent', { id, to: target.user.name, bet: aposta });
    });

    socket.on('challenge:answer', async ({ id, accept }) => {
      if (accept && DUO_OF.has(user.id)) return avisaDuo();
      const ch = challenges.get(id);
      if (!ch || ch.to !== user.id) return;
      clearTimeout(ch.timer);
      challenges.delete(id);
      if (!accept) {
        online.get(ch.from)?.socket.emit('challenge:cancel', { id, reason: 'recusado' });
        return;
      }
      if (userRoom.has(ch.from) || userRoom.has(ch.to) || !online.has(ch.from)) return;
      if (ch.bet) {
        // o mundo girou desde a proposta: re-checa os dois cofres
        const col = ch.bet.kind === 'diamonds' ? 'diamonds' : 'coins';
        const { rows: saldos } = await q(
          `SELECT user_id, ${col} AS saldo FROM profiles WHERE user_id = ANY($1)`,
          [[ch.from, ch.to]]
        );
        const pobre = saldos.find((r) => Number(r.saldo) < ch.bet.amount);
        if (pobre || saldos.length < 2) {
          const motivo = 'aposta cancelada: saldo insuficiente';
          online.get(ch.from)?.socket.emit('challenge:cancel', { id, reason: motivo });
          online.get(ch.to)?.socket.emit('challenge:cancel', { id, reason: motivo });
          return;
        }
      }
      dequeue(ch.from);
      dequeue(ch.to);
      createRoom(ch.from, ch.to, ch.bet);
    });

    socket.on('input', (data) => {
      const rid = userRoom.get(user.id);
      const room = rooms.get(rid);
      if (!room || room.finished) return;
      const side = room.users.indexOf(user.id);
      if (side >= 0) room.inputs[side] = sanitizeInput(data?.i);
    });

    socket.on('match:quit', () => {
      const rid = userRoom.get(user.id);
      const room = rooms.get(rid);
      if (!room || room.finished) return;
      const side = room.users.indexOf(user.id);
      finishRoom(room, 1 - side, { wo: true });
    });

    socket.on('disconnect', () => {
      if (online.get(user.id)?.socket === socket) { ONLINE_IDS.delete(user.id); CLAN_ROOM.delete(user.id); GUILD_ROOM.delete(user.id); AWAY_IDS.delete(user.id); BOT_FIGHT.delete(user.id); }
      const duoLid = DUO_OF.get(user.id);
      if (duoLid && !userRoom.has(user.id)) breakDuo(duoLid, `${user.name} saiu`);
      if (online.get(user.id)?.socket === socket) online.delete(user.id);
      dequeue(user.id);
      const rid = userRoom.get(user.id);
      const room = rooms.get(rid);
      if (room && !room.finished) {
        const side = room.users.indexOf(user.id);
        room.connected[side] = false;
        room.paused = true;
        room.pauseDeadline = Date.now() + RECONNECT_GRACE;
        room.inputs[side] = { ...EMPTY_INPUT };
        socket.to(room.id).emit('match:paused', { reason: 'opponent_dc', graceMs: RECONNECT_GRACE });
      }
      broadcastPresence();
    });
  });
}
