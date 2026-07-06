// STIKDEAD :: IA do bot (JS puro)
// Decide inputs a partir do estado da simulação. 4 dificuldades.

export const DIFFICULTIES = {
  facil:   { react: 0.55, attack: 0.30, heavyMix: 0.25, block: 0.06, dash: 0.03, retreat: 0.10, idle: 0.35 },
  medio:   { react: 0.34, attack: 0.55, heavyMix: 0.30, block: 0.22, dash: 0.10, retreat: 0.15, idle: 0.15 },
  dificil: { react: 0.20, attack: 0.75, heavyMix: 0.35, block: 0.45, dash: 0.18, retreat: 0.20, idle: 0.06 },
  insano:  { react: 0.11, attack: 0.92, heavyMix: 0.40, block: 0.65, dash: 0.28, retreat: 0.22, idle: 0.02 },
};

export function createBot(difficulty = 'medio', rng = Math.random) {
  const p = DIFFICULTIES[difficulty] || DIFFICULTIES.medio;
  return { p, rng, clock: 0, next: 0, intent: emptyIntent() };
}

const emptyIntent = () => ({
  left: false, right: false, jump: false, light: false, heavy: false, block: false, dash: false,
});

export function botDecide(bot, match, selfIdx, dt) {
  const { p, rng } = bot;
  const self = match.fighters[selfIdx];
  const opp = match.fighters[1 - selfIdx];
  bot.clock += dt;

  if (match.phase !== 'fight' || ['hit', 'ko', 'victory'].includes(self.state)) {
    bot.intent = emptyIntent();
    return bot.intent;
  }

  // ataques são "toques": limpa botões de ação a cada frame, mantém direção/bloqueio
  bot.intent.light = false;
  bot.intent.heavy = false;
  bot.intent.dash = false;
  bot.intent.jump = false;

  // reação: bloquear quando o oponente inicia um ataque
  const oppAttacking = opp.state === 'light' || opp.state === 'heavy';
  const dist = Math.abs(opp.x - self.x);
  if (oppAttacking && dist < 170 && rng() < p.block) {
    bot.intent.block = true;
    bot.intent.left = bot.intent.right = false;
    return bot.intent;
  }
  if (!oppAttacking) bot.intent.block = false;

  // decisões principais no ritmo de reação
  if (bot.clock < bot.next) return bot.intent;
  bot.next = bot.clock + p.react * (0.7 + rng() * 0.6);

  const toward = opp.x > self.x ? 'right' : 'left';
  const away = toward === 'right' ? 'left' : 'right';
  bot.intent.left = bot.intent.right = false;

  const desperate = self.hp <= 25 && opp.hp > self.hp;
  if (desperate && rng() < p.retreat) {
    bot.intent[away] = true;
    if (rng() < p.dash) bot.intent.dash = true;
    return bot.intent;
  }

  if (dist > 130) {
    // aproximação
    if (rng() < p.idle) return bot.intent; // hesita
    bot.intent[toward] = true;
    if (dist > 260 && rng() < p.dash) bot.intent.dash = true;
    return bot.intent;
  }

  // alcance de golpe
  if (rng() < p.attack) {
    if (rng() < p.heavyMix) bot.intent.heavy = true;
    else bot.intent.light = true;
  } else if (rng() < p.retreat) {
    bot.intent[away] = true;
  } else if (rng() < p.block) {
    bot.intent.block = true;
  }
  return bot.intent;
}
