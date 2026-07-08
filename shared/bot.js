// STIKDEAD :: IA do bot (JS puro)
// Decide inputs a partir do estado da simulação. 4 dificuldades.
import { MOVES } from './sim.js';

export const DIFFICULTIES = {
  //                                                                  rasteira: converte dash em varrida | punish: castiga golpe errado | skillEager: fome de especial
  facil:   { react: 0.55, attack: 0.30, heavyMix: 0.25, block: 0.06, dash: 0.03, retreat: 0.10, idle: 0.35, rasteira: 0.05, punish: 0,    skillEager: 0.006 },
  medio:   { react: 0.34, attack: 0.55, heavyMix: 0.30, block: 0.22, dash: 0.10, retreat: 0.15, idle: 0.15, rasteira: 0.22, punish: 0,    skillEager: 0.011 },
  dificil: { react: 0.20, attack: 0.75, heavyMix: 0.35, block: 0.45, dash: 0.20, retreat: 0.20, idle: 0.06, rasteira: 0.45, punish: 0.35, skillEager: 0.016 },
  insano:  { react: 0.06, attack: 0.97, heavyMix: 0.45, block: 0.85, dash: 0.45, retreat: 0.18, idle: 0,    rasteira: 0.85, punish: 0.85, skillEager: 0.03 },
};

export function createBot(difficulty = 'medio', rng = Math.random) {
  const p = DIFFICULTIES[difficulty] || DIFFICULTIES.medio;
  return { p, rng, clock: 0, next: 0, intent: emptyIntent() };
}

const emptyIntent = () => ({
  left: false, right: false, jump: false, light: false, heavy: false, block: false, dash: false, skill: false,
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
  bot.intent.skill = false;
  bot.intent.jump = false;

  // reação: bloquear quando o oponente inicia um ataque (rasteira inclusa)
  const oppAttacking = opp.state === 'light' || opp.state === 'heavy' || opp.state === 'rasteira';
  const dist = Math.abs(opp.x - self.x);
  if (self.skillCd === 0 && dist < 170 && rng() < (p.skillEager ?? p.attack * 0.02)) bot.intent.skill = true;
  // RASTEIRA: no meio do próprio dash, converte em varrida
  if (self.state === 'dash' && dist < 400 && rng() < (p.rasteira || 0)) bot.intent.heavy = true;
  // PUNIÇÃO (leitura de pro): oponente errou/terminou o golpe perto → castiga na recuperação
  if (p.punish && oppAttacking && dist < 150) {
    const mv = MOVES[opp.state];
    if (mv && opp.t > mv.startup + mv.active && rng() < p.punish) {
      if (rng() < p.heavyMix) bot.intent.heavy = true; else bot.intent.light = true;
      return bot.intent;
    }
  }
  if (oppAttacking && dist < 190 && rng() < p.block) {
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
    if (dist > 170 && rng() < p.dash) bot.intent.dash = true; // dash de aproximação (semente da rasteira)
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
