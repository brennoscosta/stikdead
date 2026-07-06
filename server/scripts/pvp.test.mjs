// Teste de integração: 2 clientes socket.io lutam uma partida PvP completa.
// Os inputs de cada lado são gerados pela IA do bot lendo os snapshots do servidor.
import 'dotenv/config';
import { io as connect } from 'socket.io-client';
import { createBot, botDecide } from '../../shared/bot.js';

const API = 'http://localhost:3001';

async function login(email, password, fighterName) {
  let res = await fetch(`${API}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (res.status === 401) {
    res = await fetch(`${API}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, fighterName }),
    });
  }
  const data = await res.json();
  if (!data.token) throw new Error('login falhou: ' + JSON.stringify(data));
  return data;
}

function makePlayer(token, name, difficulty) {
  const socket = connect(API, { auth: { token }, transports: ['websocket'] });
  const bot = createBot(difficulty);
  const state = { name, side: -1, snapshots: 0, ended: null, presence: 0, lastInput: null };

  socket.on('presence', () => state.presence++);
  socket.on('match:start', ({ side }) => { state.side = side; });
  socket.on('snapshot', (snap) => {
    state.snapshots++;
    // reconstrói um "match" mínimo para a IA decidir
    const fakeMatch = {
      phase: snap.phase,
      fighters: snap.f.map((f) => ({ ...f })),
    };
    const input = botDecide(bot, fakeMatch, state.side, 1 / 30);
    socket.emit('input', { i: input });
  });
  socket.on('match:end', (result) => { state.ended = result; });
  return { socket, state };
}

const a = await login('brenno@teste.com', 'senha12345', 'BRENNO');
const b = await login('jogador2@teste.com', 'senha12345', 'SHADOW_X');
console.log('logins ok:', a.profile.fighter_name, 'vs', b.profile.fighter_name);

const p1 = makePlayer(a.token, 'BRENNO', 'insano');
const p2 = makePlayer(b.token, 'SHADOW_X', 'medio');

await new Promise((r) => setTimeout(r, 600));
console.log('presença recebida por ambos:', p1.state.presence > 0 && p2.state.presence > 0);

// desafio direto: p1 desafia p2, p2 aceita
let challengeId = null;
p2.socket.on('challenge:received', ({ id, from }) => {
  challengeId = id;
  console.log(`desafio recebido por SHADOW_X de ${from.name} — aceitando`);
  p2.socket.emit('challenge:answer', { id, accept: true });
});
const meId = (await (await fetch(`${API}/api/auth/me`, { headers: { Authorization: `Bearer ${b.token}` } })).json()).profile.id;
p1.socket.emit('challenge:send', { to: meId });

// espera a partida terminar (máx 6 min)
const deadline = Date.now() + 6 * 60 * 1000;
while ((!p1.state.ended || !p2.state.ended) && Date.now() < deadline)
  await new Promise((r) => setTimeout(r, 500));

if (!p1.state.ended) throw new Error('partida não terminou no tempo limite');

const r1 = p1.state.ended;
const r2 = p2.state.ended;
console.log('--- resultado ---');
console.log('snapshots recebidos:', p1.state.snapshots, '/', p2.state.snapshots);
console.log('placar:', r1.wins.join('x'), '| vencedor: lado', r1.winnerSide, r1.winnerSide === p1.state.side ? '(BRENNO)' : '(SHADOW_X)');
console.log('BRENNO  → xp:', r1.rewards?.xp, 'moedas:', r1.rewards?.coins, 'rank:', r1.rank?.points, `(${r1.rank?.delta > 0 ? '+' : ''}${r1.rank?.delta})`, r1.rank?.tier);
console.log('SHADOW_X→ xp:', r2.rewards?.xp, 'moedas:', r2.rewards?.coins, 'rank:', r2.rank?.points, `(${r2.rank?.delta > 0 ? '+' : ''}${r2.rank?.delta})`, r2.rank?.tier);
console.log('bônus vencedor:', JSON.stringify((r1.winnerSide === p1.state.side ? r1 : r2).rewards?.bonuses));

p1.socket.close();
p2.socket.close();
process.exit(0);
