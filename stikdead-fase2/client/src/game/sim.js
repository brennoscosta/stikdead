// STIKDEAD :: simulação de combate (JS puro, sem renderização)
// Roda no browser (Fase 2/3) e no servidor autoritativo (Fase 4) sem alterações.

export const ARENA = { left: -410, right: 410 };

export const MOVES = {
  light: { startup: 0.08, active: 0.07, recover: 0.16, range: 95, dmg: 8, hitstun: 0.28, kb: 140, chip: 1, freeze: 0.05 },
  heavy: { startup: 0.22, active: 0.09, recover: 0.3, range: 120, dmg: 18, hitstun: 0.5, kb: 360, chip: 4, freeze: 0.09 },
};

const SPEED = 260;
const AIR_CONTROL = 0.55;
const JUMP_VY = 640;
const GRAVITY = 1900;
const DASH_SPEED = 560;
const DASH_TIME = 0.16;
const DASH_INVULN = 0.12;
const DASH_CD = 0.6;
const BLOCK_DMG_FACTOR = 0.2;
const BLOCK_KB_FACTOR = 0.4;
const BODY_GAP = 44;
const ROUND_TIME = 99;
const COUNTDOWN = 3.4;
const ROUND_END_PAUSE = 2.4;
const COMBO_WINDOW = 0.9;

export const EMPTY_INPUT = Object.freeze({
  left: false, right: false, jump: false, light: false, heavy: false, block: false, dash: false,
});

function createFighter(x, face) {
  return {
    x, y: 0, vx: 0, vy: 0, face,
    hp: 100, state: 'idle', t: 0,
    dashCd: 0, invuln: 0, hitDone: false,
    combo: 0, comboT: 0,
    prev: { jump: false, light: false, heavy: false, dash: false },
  };
}

export function createMatch({ bestOf = 3 } = {}) {
  return {
    phase: 'countdown', // countdown | fight | roundend | matchend
    phaseT: 0,
    round: 1,
    roundsToWin: Math.ceil(bestOf / 2),
    wins: [0, 0],
    timer: ROUND_TIME,
    suddenDeath: false,
    firstBlood: false,
    freeze: 0,
    timescale: 1,
    timescaleT: 0,
    fighters: [createFighter(-170, 1), createFighter(170, -1)],
    roundWinner: -1,
    winner: -1,
  };
}

function pressed(inp, prev, key) {
  return inp[key] && !prev[key];
}

function startRound(m) {
  const [a, b] = m.fighters;
  Object.assign(a, createFighter(-170, 1));
  Object.assign(b, createFighter(170, -1));
  m.timer = ROUND_TIME;
  m.suddenDeath = false;
  m.phase = 'countdown';
  m.phaseT = 0;
  m.roundWinner = -1;
}

function endRound(m, winnerIdx, ev) {
  m.phase = 'roundend';
  m.phaseT = 0;
  m.roundWinner = winnerIdx;
  if (winnerIdx >= 0) m.wins[winnerIdx]++;
  ev.push({ type: 'roundend', winner: winnerIdx, round: m.round });
  const loserKo = winnerIdx >= 0 && m.fighters[1 - winnerIdx].state === 'ko';
  if (winnerIdx >= 0 && loserKo) m.fighters[winnerIdx].state = 'victory';
  if (winnerIdx >= 0 && m.wins[winnerIdx] >= m.roundsToWin) {
    m.phase = 'matchend';
    m.winner = winnerIdx;
    ev.push({ type: 'matchend', winner: winnerIdx });
  }
}

function applyHit(m, atkIdx, move, ev) {
  const atk = m.fighters[atkIdx];
  const def = m.fighters[1 - atkIdx];
  const blocked = def.state === 'block' && def.face === -atk.face;
  const dmg = blocked ? move.chip : move.dmg;
  const kb = move.kb * (blocked ? BLOCK_KB_FACTOR : 1);

  def.hp = Math.max(0, def.hp - dmg);
  def.vx = kb * atk.face;

  if (!blocked) {
    def.state = 'hit';
    def.t = 0;
    def.hitstun = move.hitstun;
    atk.combo = atk.comboT > 0 ? atk.combo + 1 : 1;
    atk.comboT = COMBO_WINDOW + move.hitstun;
  }

  m.freeze = move.freeze;
  ev.push({
    type: 'hit',
    x: (atk.x + def.x) / 2,
    y: def.y + 90,
    dmg, blocked,
    heavy: move === MOVES.heavy,
    attacker: atkIdx,
    combo: atk.combo,
  });

  if (!m.firstBlood && !blocked) {
    m.firstBlood = true;
    ev.push({ type: 'firstblood', attacker: atkIdx });
  }

  if (def.hp <= 0) {
    def.state = 'ko';
    def.t = 0;
    def.vx = kb * atk.face * 1.4;
    m.timescale = 0.35;
    m.timescaleT = 0.9;
    ev.push({ type: 'ko', winner: atkIdx, finisher: move === MOVES.heavy, x: def.x, y: def.y + 90 });
    endRound(m, atkIdx, ev);
  } else if (m.suddenDeath && !blocked) {
    endRound(m, atkIdx, ev);
  }
}

function updateFighter(m, idx, inp, dt, ev) {
  const f = m.fighters[idx];
  const opp = m.fighters[1 - idx];
  f.t += dt;
  f.dashCd = Math.max(0, f.dashCd - dt);
  f.invuln = Math.max(0, f.invuln - dt);
  f.comboT = Math.max(0, f.comboT - dt);
  if (f.comboT === 0) f.combo = 0;

  const grounded = f.y <= 0 && f.vy <= 0;
  const dir = (inp.right ? 1 : 0) - (inp.left ? 1 : 0);

  // gravidade
  if (!grounded || f.vy > 0) {
    f.vy -= GRAVITY * dt;
    f.y += f.vy * dt;
    if (f.y <= 0) { f.y = 0; f.vy = 0; }
  }

  switch (f.state) {
    case 'idle':
    case 'walk': {
      f.face = opp.x >= f.x ? 1 : -1;
      f.vx = dir * SPEED;
      f.state = dir !== 0 ? 'walk' : 'idle';
      if (pressed(inp, f.prev, 'jump') && grounded) {
        f.vy = JUMP_VY; f.y = 0.01; f.state = 'jump'; f.t = 0;
        ev.push({ type: 'jump', idx });
      } else if (pressed(inp, f.prev, 'dash') && f.dashCd === 0) {
        f.state = 'dash'; f.t = 0; f.dashCd = DASH_CD; f.invuln = DASH_INVULN;
        f.dashDir = dir !== 0 ? dir : f.face;
        ev.push({ type: 'dash', idx, x: f.x });
      } else if (pressed(inp, f.prev, 'light') && grounded) {
        f.state = 'light'; f.t = 0; f.hitDone = false; f.vx = 0;
      } else if (pressed(inp, f.prev, 'heavy') && grounded) {
        f.state = 'heavy'; f.t = 0; f.hitDone = false; f.vx = 0;
      } else if (inp.block && grounded) {
        f.state = 'block'; f.vx = 0;
      }
      break;
    }
    case 'jump': {
      f.vx = dir * SPEED * AIR_CONTROL || f.vx * 0.99;
      if (grounded && f.t > 0.05) { f.state = 'idle'; f.vx = 0; }
      break;
    }
    case 'dash': {
      f.vx = DASH_SPEED * f.dashDir;
      if (f.t >= DASH_TIME) { f.state = 'idle'; f.vx = 0; }
      break;
    }
    case 'block': {
      f.face = opp.x >= f.x ? 1 : -1;
      f.vx = 0;
      if (!inp.block) f.state = 'idle';
      break;
    }
    case 'light':
    case 'heavy': {
      const move = MOVES[f.state];
      f.vx *= 0.85;
      const inActive = f.t >= move.startup && f.t < move.startup + move.active;
      if (inActive && !f.hitDone && m.phase === 'fight') {
        const dist = Math.abs(opp.x - f.x);
        const inFront = Math.sign(opp.x - f.x) === f.face || dist < BODY_GAP;
        const targetable = !['ko', 'victory'].includes(opp.state) && opp.invuln === 0;
        if (dist <= move.range && inFront && targetable) {
          f.hitDone = true;
          applyHit(m, idx, move, ev);
        }
      }
      if (f.t >= move.startup + move.active + move.recover) { f.state = 'idle'; f.vx = 0; }
      break;
    }
    case 'hit': {
      f.vx *= Math.pow(0.02, dt);
      if (f.t >= f.hitstun) { f.state = 'idle'; f.vx = 0; }
      break;
    }
    case 'ko': {
      f.vx *= Math.pow(0.05, dt);
      break;
    }
    case 'victory':
      f.vx = 0;
      break;
  }

  f.x += f.vx * dt;
  f.x = Math.max(ARENA.left, Math.min(ARENA.right, f.x));
  f.prev = { jump: inp.jump, light: inp.light, heavy: inp.heavy, dash: inp.dash };
}

function separate(m) {
  const [a, b] = m.fighters;
  const busy = (f) => ['ko', 'hit', 'dash'].includes(f.state);
  if (busy(a) || busy(b)) return;
  if (a.y > 0 || b.y > 0) return;
  const dx = b.x - a.x;
  if (Math.abs(dx) < BODY_GAP) {
    const push = (BODY_GAP - Math.abs(dx)) / 2;
    const s = Math.sign(dx) || 1;
    a.x -= push * s;
    b.x += push * s;
  }
}

// Avança a simulação. Retorna a lista de eventos do tick (para FX/HUD/replay).
export function stepMatch(m, inputA, inputB, rawDt) {
  const ev = [];
  if (m.phase === 'matchend') return ev;

  if (m.timescaleT > 0) {
    m.timescaleT -= rawDt;
    if (m.timescaleT <= 0) m.timescale = 1;
  }
  const dt = rawDt * m.timescale;

  if (m.freeze > 0) {
    m.freeze -= rawDt;
    return ev;
  }

  m.phaseT += dt;

  if (m.phase === 'countdown') {
    if (m.phaseT >= COUNTDOWN) {
      m.phase = 'fight';
      m.phaseT = 0;
      ev.push({ type: 'fightstart', round: m.round });
    }
    return ev;
  }

  if (m.phase === 'roundend') {
    updateFighter(m, 0, EMPTY_INPUT, dt, ev);
    updateFighter(m, 1, EMPTY_INPUT, dt, ev);
    if (m.phaseT >= ROUND_END_PAUSE) {
      m.round++;
      startRound(m);
      ev.push({ type: 'roundstart', round: m.round });
    }
    return ev;
  }

  // fight
  if (!m.suddenDeath) {
    m.timer -= dt;
    if (m.timer <= 0) {
      m.timer = 0;
      const [a, b] = m.fighters;
      if (a.hp === b.hp) {
        m.suddenDeath = true;
        ev.push({ type: 'suddendeath' });
      } else {
        endRound(m, a.hp > b.hp ? 0 : 1, ev);
        return ev;
      }
    }
  }

  updateFighter(m, 0, inputA, dt, ev);
  updateFighter(m, 1, inputB, dt, ev);
  separate(m);
  return ev;
}
