// STIKDEAD :: simulação de combate (JS puro, sem renderização)
// Roda no browser (Fase 2/3) e no servidor autoritativo (Fase 4) sem alterações.

export const ARENA = { left: -410, right: 410 };

export const MOVES = {
  light: { startup: 0.08, active: 0.07, recover: 0.16, range: 95, dmg: 8, hitstun: 0.28, kb: 140, chip: 1, freeze: 0.05 },
  heavy: { startup: 0.22, active: 0.09, recover: 0.3, range: 120, dmg: 18, hitstun: 0.5, kb: 360, chip: 4, freeze: 0.09 },
  // RASTEIRA: chute durante o dash — desliza rente ao chão varrendo o oponente
  rasteira: { startup: 0.05, active: 0.24, recover: 0.2, range: 105, dmg: 13, hitstun: 0.55, kb: 340, chip: 2, freeze: 0.07 },
};
const RAST_SPEED = 520;

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

// ===== estilos de luta (skill ativa + passivo) =====
export const STYLES = {
  ronin: {
    label: 'Ronin', skill: 'Corte Rápido', cd: 9, dur: 0.5,
    desc: '3 cortes instantâneos. Passivo: +10% de velocidade.',
  },
  shinobi: {
    label: 'Shinobi', skill: 'Dash Sombrio', cd: 10, dur: 0.35,
    desc: 'Atravessa o oponente cortando (invencível). Passivo: dash recarrega 25% mais rápido.',
  },
  monge: {
    label: 'Monge', skill: 'Explosão de Ki', cd: 10, dur: 0.45,
    desc: 'Onda de choque radial com empurrão brutal. Passivo: bloqueio reflete 2 de dano.',
  },
  berserker: {
    label: 'Berserker', skill: 'Fúria', cd: 14, dur: 0.3,
    desc: '4s de +50% dano e armadura contra golpes leves. Passivo: +15% dano com vida baixa.',
  },
  espectro: {
    label: 'Espectro', skill: 'Golpe Aéreo', cd: 11, dur: 0.9,
    desc: 'Salta e esmaga a área ao aterrissar. Passivo: pulo 15% mais alto.',
  },
};
export const STYLE_KEYS = Object.keys(STYLES);

// multiplicador de dano do atacante (fúria + passivo do berserker)
const dmgMod = (atk) =>
  (atk.fury > 0 ? 1.5 : 1) * (atk.style === 'berserker' && atk.hp < 40 ? 1.15 : 1);

export const EMPTY_INPUT = Object.freeze({
  left: false, right: false, jump: false, light: false, heavy: false, block: false, dash: false, skill: false,
});

function createFighter(x, face) {
  return {
    x, y: 0, vx: 0, vy: 0, face,
    hp: 100, state: 'idle', t: 0,
    dashCd: 0, invuln: 0, hitDone: false,
    style: 'ronin', skillCd: 0, fury: 0, skillPhase: 0,
    combo: 0, comboT: 0,
    prev: { jump: false, light: false, heavy: false, dash: false, skill: false },
  };
}

export function createMatch({ bestOf = 3, styles = ['ronin', 'ronin'] } = {}) {
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
    fighters: [Object.assign(createFighter(-170, 1), { style: STYLE_KEYS.includes(styles[0]) ? styles[0] : 'ronin' }), Object.assign(createFighter(170, -1), { style: STYLE_KEYS.includes(styles[1]) ? styles[1] : 'ronin' })],
    roundWinner: -1,
    winner: -1,
    elapsed: 0,
    koFinisher: false,
    stats: [
      { damage: 0, hits: 0, maxCombo: 0, blocked: 0 },
      { damage: 0, hits: 0, maxCombo: 0, blocked: 0 },
    ],
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
  const dmg = Math.max(1, Math.round((blocked ? move.chip : move.dmg) * (blocked ? 1 : dmgMod(atk))));
  if (blocked && def.style === 'monge') atk.hp = Math.max(1, atk.hp - 2); // reflexo de Ki
  const kb = move.kb * (blocked ? BLOCK_KB_FACTOR : 1);

  def.hp = Math.max(0, def.hp - dmg);
  def.vx = kb * atk.face;

  const st = m.stats[atkIdx];
  st.damage += dmg;
  if (blocked) m.stats[1 - atkIdx].blocked++;
  else st.hits++;

  if (!blocked) {
    const armored = def.fury > 0 && move !== MOVES.heavy; // fúria ignora hitstun de leves
    if (!armored) {
      def.state = 'hit';
      def.t = 0;
      def.hitstun = move.hitstun;
    }
    atk.combo = atk.comboT > 0 ? atk.combo + 1 : 1;
    atk.comboT = COMBO_WINDOW + move.hitstun;
    st.maxCombo = Math.max(st.maxCombo, atk.combo);
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
    m.koFinisher = move === MOVES.heavy;
    ev.push({ type: 'ko', winner: atkIdx, finisher: move === MOVES.heavy, x: def.x, y: def.y + 90 });
    endRound(m, atkIdx, ev);
  } else if (m.suddenDeath && !blocked) {
    endRound(m, atkIdx, ev);
  }
}

// golpe de skill: gate de alcance e direção, depois o applyHit padrão
// (KO, stats, combo, freeze e eventos vêm de graça)
function skillStrike(m, atkIdx, { dmg, range, kb, hitstun, bidir = false }, ev) {
  const atk = m.fighters[atkIdx];
  const def = m.fighters[1 - atkIdx];
  const dx = def.x - atk.x;
  if (Math.abs(dx) > range) return false;
  if (!bidir && Math.sign(dx || atk.face) !== atk.face) return false;
  applyHit(m, atkIdx, { dmg, hitstun, kb, chip: Math.max(1, Math.ceil(dmg / 4)), freeze: 0.06 }, ev);
  return true;
}

function castSkill(m, idx, ev) {
  const f = m.fighters[idx];
  const st = STYLES[f.style] || STYLES.ronin;
  f.skillCd = st.cd;
  f.t = 0;
  f.skillPhase = 0;
  f.vx = 0;
  ev.push({ type: 'skill', idx, style: f.style, name: st.skill, x: f.x, y: f.y + 90 });

  if (f.style === 'berserker') {
    f.fury = 4.0;
    f.state = 'skill';
  } else if (f.style === 'shinobi') {
    const opp = m.fighters[1 - idx];
    const from = f.x;
    f.x = Math.max(ARENA.left, Math.min(ARENA.right, f.x + f.face * 150));
    f.invuln = 0.35;
    // cortou ao atravessar?
    const crossed = (opp.x - from) * (opp.x - f.x) <= 0;
    if (crossed) skillStrike(m, idx, { dmg: 12, range: 200, kb: 160, hitstun: 0.35, bidir: true }, ev);
    f.state = 'skill';
  } else if (f.style === 'espectro') {
    f.vy = 560;
    f.y = 0.01;
    f.vx = f.face * 240;
    f.state = 'skillair';
  } else {
    f.state = 'skill'; // ronin e monge resolvem no stepSkill
  }
}

function stepSkill(m, idx, ev) {
  const f = m.fighters[idx];
  const st = STYLES[f.style] || STYLES.ronin;
  f.vx = 0;

  if (f.style === 'ronin') {
    const cuts = [0.08, 0.2, 0.32];
    while (f.skillPhase < cuts.length && f.t >= cuts[f.skillPhase]) {
      skillStrike(m, idx, { dmg: 6, range: 105, kb: 90, hitstun: 0.22 }, ev);
      f.skillPhase++;
    }
  } else if (f.style === 'monge' && f.skillPhase === 0 && f.t >= 0.18) {
    f.skillPhase = 1;
    skillStrike(m, idx, { dmg: 10, range: 140, kb: 520, hitstun: 0.45, bidir: true }, ev);
    ev.push({ type: 'skillwave', idx, x: f.x, y: f.y + 60 });
  }

  if (f.t >= st.dur) { f.state = 'idle'; }
}

function updateFighter(m, idx, inp, dt, ev) {
  const f = m.fighters[idx];
  const opp = m.fighters[1 - idx];
  f.t += dt;
  f.dashCd = Math.max(0, f.dashCd - dt);
  f.invuln = Math.max(0, f.invuln - dt);
  f.skillCd = Math.max(0, f.skillCd - dt);
  f.fury = Math.max(0, f.fury - dt);
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
      f.vx = dir * SPEED * (f.style === 'ronin' ? 1.1 : 1);
      f.state = dir !== 0 ? 'walk' : 'idle';
      if (pressed(inp, f.prev, 'jump') && grounded) {
        f.vy = JUMP_VY * (f.style === 'espectro' ? 1.15 : 1); f.y = 0.01; f.state = 'jump'; f.t = 0;
        ev.push({ type: 'jump', idx });
      } else if (pressed(inp, f.prev, 'dash') && f.dashCd === 0) {
        f.state = 'dash'; f.t = 0; f.dashCd = DASH_CD * (f.style === 'shinobi' ? 0.75 : 1); f.invuln = DASH_INVULN;
        f.dashDir = dir !== 0 ? dir : f.face;
        ev.push({ type: 'dash', idx, x: f.x });
      } else if (pressed(inp, f.prev, 'skill') && grounded && f.skillCd === 0) {
        castSkill(m, idx, ev);
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
      // chute no meio do dash = RASTEIRA
      if (pressed(inp, f.prev, 'heavy')) {
        f.state = 'rasteira'; f.t = 0; f.hitDone = false; f.rastDir = f.dashDir;
        ev.push({ type: 'rasteira', idx, x: f.x });
        break;
      }
      if (f.t >= DASH_TIME) { f.state = 'idle'; f.vx = 0; }
      break;
    }
    case 'rasteira': {
      const mv = MOVES.rasteira;
      const total = mv.startup + mv.active + mv.recover;
      // desliza forte e vai perdendo o embalo
      f.vx = RAST_SPEED * (f.rastDir || f.face) * Math.max(0.15, 1 - (f.t / total) * 0.85);
      const inActive = f.t >= mv.startup && f.t < mv.startup + mv.active;
      if (inActive && !f.hitDone && m.phase === 'fight') {
        const dist = Math.abs(opp.x - f.x);
        const targetable = !['ko', 'victory'].includes(opp.state) && opp.invuln === 0;
        if (dist <= mv.range && targetable) {
          f.hitDone = true;
          f.face = opp.x >= f.x ? 1 : -1; // varre para onde o corpo está
          applyHit(m, idx, mv, ev);
        }
      }
      if (f.t >= total) { f.state = 'idle'; f.vx = 0; }
      break;
    }
    case 'skill': {
      stepSkill(m, idx, ev);
      break;
    }
    case 'skillair': {
      // Espectro no ar: cai com força e esmaga ao aterrissar
      if (grounded && f.t > 0.08) {
        f.state = 'idle'; f.vx = 0;
        skillStrike(m, idx, { dmg: 14, range: 115, kb: 420, hitstun: 0.45, bidir: true }, ev);
        ev.push({ type: 'skillslam', idx, x: f.x });
      }
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
  f.prev = { jump: inp.jump, light: inp.light, heavy: inp.heavy, dash: inp.dash, skill: inp.skill };
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

  m.elapsed += dt;
  updateFighter(m, 0, inputA, dt, ev);
  updateFighter(m, 1, inputB, dt, ev);
  separate(m);
  return ev;
}
