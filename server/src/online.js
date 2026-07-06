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
  light: !!i?.light, heavy: !!i?.heavy, block: !!i?.block, dash: !!i?.dash,
});

export function attachOnline(io) {
  const online = new Map();   // userId -> { socket, user }
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
      id: user.id, name: user.name, level: user.level, tier: user.tier,
      inMatch: userRoom.has(user.id), loadout: loadout || [],
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

  function createRoom(idA, idB) {
    const roomId = `r${nextRoom++}`;
    const players = [online.get(idA), online.get(idB)];
    const room = {
      id: roomId,
      arena: ['dojo', 'temple', 'prison'][Math.floor(Math.random() * 3)],
      users: [idA, idB],
      names: [players[0].user.name, players[1].user.name],
      match: createMatch(),
      inputs: [{ ...EMPTY_INPUT }, { ...EMPTY_INPUT }],
      connected: [true, true],
      paused: false,
      pauseDeadline: 0,
      finished: false,
      interval: null,
    };
    rooms.set(roomId, room);
    userRoom.set(idA, roomId);
    userRoom.set(idB, roomId);

    Promise.all(room.users.map((uid) => getLoadout(uid))).then((louts) => {
      room.loadouts = louts;
      players.forEach(({ socket }, side) => {
        socket.join(roomId);
        socket.emit('match:start', {
          roomId, side, arena: room.arena,
          players: room.users.map((uid, s) => {
            const u = online.get(uid).user;
            return { name: u.name, level: u.level, tier: u.tier, loadout: louts[s] };
          }),
        });
      });
    });

    room.interval = setInterval(() => tickRoom(room), TICK * 1000);
    broadcastPresence();
  }

  function snapshot(room, ev) {
    const m = room.match;
    return {
      phase: m.phase, phaseT: m.phaseT, timer: m.timer, round: m.round,
      wins: m.wins, suddenDeath: m.suddenDeath,
      f: m.fighters.map((f) => ({
        x: Math.round(f.x * 10) / 10, y: Math.round(f.y * 10) / 10,
        face: f.face, hp: f.hp, state: f.state, t: f.t,
        vy: Math.round(f.vy), hitstun: f.hitstun || 0, combo: f.combo,
      })),
      ev,
    };
  }

  function tickRoom(room) {
    if (room.finished) return;

    if (room.paused) {
      if (Date.now() >= room.pauseDeadline) {
        const loser = room.connected.indexOf(false);
        return finishRoom(room, loser === -1 ? 0 : 1 - loser, { wo: true });
      }
      return;
    }

    const ev = stepMatch(room.match, room.inputs[0], room.inputs[1], TICK);
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
        `SELECT user_id, level, xp, coins, rank_points, wins, losses, win_streak
           FROM profiles WHERE user_id = ANY($1) FOR UPDATE`,
        [[room.users[0], room.users[1]]]
      );
      const profs = room.users.map((uid) => rows.find((r) => Number(r.user_id) === uid));
      const delta = rankDelta(profs[winnerSide].rank_points, profs[1 - winnerSide].rank_points);

      for (const side of [0, 1]) {
        const p = profs[side];
        const won = side === winnerSide;
        const streak = won ? p.win_streak + 1 : 0;
        const rewards = computeRewards({
          won,
          stats: m.stats[side],
          winsB: m.wins[1 - side],
          streak,
          factor: wo && !won ? 0 : 1, // abandono não rende nada ao desistente
        });
        const lv = applyXp(p.level, p.xp, rewards.xp);
        const newRank = Math.max(0, p.rank_points + (won ? delta.win : -delta.loss));
        const tier = tierFor(newRank);
        let itemDrop = null;
        if (won && streak > 0 && streak % 3 === 0) itemDrop = await grantStreakDrop(client, room.users[side]);
        bumpMissions(room.users[side], m.stats[side] || {}, won);

        await client.query(
          `UPDATE profiles SET level=$1, xp=$2, coins=coins+$3, rank_points=$4, tier=$5,
                  wins=wins+$6, losses=losses+$7, win_streak=$8, updated_at=now()
            WHERE user_id=$9`,
          [lv.level, lv.xp, rewards.coins, newRank, tier, won ? 1 : 0, won ? 0 : 1, streak, room.users[side]]
        );
        await client.query(
          `INSERT INTO matches (user_id, opponent_type, opponent_id, won, wins_a, wins_b, duration_s, stats, xp_gain, coin_gain)
           VALUES ($1,'player',$2,$3,$4,$5,$6,$7,$8,$9)`,
          [room.users[side], room.users[1 - side], won, m.wins[side], m.wins[1 - side],
           Math.round(m.elapsed), m.stats[side], rewards.xp, rewards.coins]
        );
        results[side] = {
          winnerSide, wo, wins: m.wins, itemDrop,
          rewards: { ...rewards, levelsUp: lv.levelsUp },
          rank: { points: newRank, delta: won ? delta.win : -delta.loss, tier },
          profile: { level: lv.level, xp: lv.xp, xpNext: xpForLevel(lv.level), coins: p.coins + rewards.coins },
        };
        const ou = online.get(room.users[side]);
        if (ou) {
          ou.user.level = lv.level;
          ou.user.tier = tier;
          ou.user.rank_points = newRank;
        }
      }
      await client.query('COMMIT');
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
    getLoadout(user.id).then((l) => {
      const entry = online.get(user.id);
      if (entry && entry.socket === socket) { entry.loadout = l; broadcastPresence(); }
    }).catch(() => {});

    // chat do lobby
    socket.emit('chat:history', { messages: chatHistory });
    socket.on('chat:send', (payload) => {
      const text = String(payload?.text || '').trim().slice(0, 200);
      if (!text) return;
      const now = Date.now();
      if (now - (chatLast.get(user.id) || 0) < 1000) return; // 1 msg/s
      chatLast.set(user.id, now);
      const msg = { name: user.name, text, ts: now };
      chatHistory.push(msg);
      if (chatHistory.length > 50) chatHistory.shift();
      io.emit('chat:msg', msg);
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
          };
        }),
      });
    }

    broadcastPresence();

    socket.on('queue:join', () => {
      if (userRoom.has(user.id) || queue.includes(user.id)) return;
      queue.push(user.id);
      socket.emit('queue:status', { inQueue: true });
      tryMatchQueue();
    });

    socket.on('queue:leave', () => {
      dequeue(user.id);
      socket.emit('queue:status', { inQueue: false });
    });

    socket.on('challenge:send', ({ to }) => {
      const target = online.get(Number(to));
      if (!target || userRoom.has(user.id) || userRoom.has(Number(to)) || Number(to) === user.id) return;
      const id = `c${nextChallenge++}`;
      const ch = {
        id, from: user.id, to: Number(to),
        timer: setTimeout(() => {
          challenges.delete(id);
          online.get(user.id)?.socket.emit('challenge:cancel', { id, reason: 'expirou' });
          target.socket.emit('challenge:cancel', { id, reason: 'expirou' });
        }, CHALLENGE_TTL),
      };
      challenges.set(id, ch);
      target.socket.emit('challenge:received', {
        id, ttl: CHALLENGE_TTL,
        from: { id: user.id, name: user.name, level: user.level, tier: user.tier },
      });
      socket.emit('challenge:sent', { id, to: target.user.name });
    });

    socket.on('challenge:answer', ({ id, accept }) => {
      const ch = challenges.get(id);
      if (!ch || ch.to !== user.id) return;
      clearTimeout(ch.timer);
      challenges.delete(id);
      if (!accept) {
        online.get(ch.from)?.socket.emit('challenge:cancel', { id, reason: 'recusado' });
        return;
      }
      if (userRoom.has(ch.from) || userRoom.has(ch.to) || !online.has(ch.from)) return;
      dequeue(ch.from);
      dequeue(ch.to);
      createRoom(ch.from, ch.to);
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
