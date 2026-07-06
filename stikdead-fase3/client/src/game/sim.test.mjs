import { createMatch, stepMatch, EMPTY_INPUT } from './sim.js';
import { createBot, botDecide } from './bot.js';

function playMatch(diffA, diffB, seed) {
  let s = seed;
  const rng = () => (s = (s * 1103515245 + 12345) % 2 ** 31) / 2 ** 31;
  const m = createMatch();
  const botA = createBot(diffA, rng);
  const botB = createBot(diffB, rng);
  const dt = 1 / 60;
  let ticks = 0, hits = 0, blocks = 0, kos = 0, rounds = 0;
  while (m.phase !== 'matchend' && ticks < 60 * 60 * 12) {
    const evs = stepMatch(m, botDecide(botA, m, 0, dt), botDecide(botB, m, 1, dt), dt);
    for (const e of evs) {
      if (e.type === 'hit') { hits++; if (e.blocked) blocks++; }
      if (e.type === 'ko') kos++;
      if (e.type === 'roundend') rounds++;
    }
    ticks++;
  }
  return { winner: m.winner, wins: m.wins, hits, blocks, kos, rounds, seconds: (ticks / 60).toFixed(1) };
}

console.log('== insano vs facil (3 partidas) ==');
let insaneWins = 0;
for (let i = 1; i <= 3; i++) {
  const r = playMatch('insano', 'facil', i * 7919);
  if (r.winner === 0) insaneWins++;
  console.log(`  partida ${i}:`, JSON.stringify(r));
}
console.log(`  insano venceu ${insaneWins}/3 (esperado: 3/3)`);

console.log('== medio vs medio (equilíbrio, 4 partidas) ==');
for (let i = 1; i <= 4; i++) console.log(' ', JSON.stringify(playMatch('medio', 'medio', i * 104729)));

console.log('== sanidade ==');
const m = createMatch();
console.log('  fase inicial:', m.phase, '| hp:', m.fighters.map(f => f.hp).join('/'), '| timer:', m.timer);
for (let i = 0; i < 60 * 4; i++) stepMatch(m, EMPTY_INPUT, EMPTY_INPUT, 1 / 60);
console.log('  após countdown:', m.phase);
