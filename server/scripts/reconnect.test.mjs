import 'dotenv/config';
import { io as connect } from 'socket.io-client';
import { createBot, botDecide } from '../../shared/bot.js';

const API = 'http://localhost:3001';
const login = async (email, password) => {
  const r = await fetch(`${API}/api/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }) });
  return (await r.json()).token;
};

function player(token, diff) {
  const st = { side: -1, snaps: 0, ended: null, paused: false, resumed: false, started: false };
  const bot = createBot(diff);
  const make = () => {
    const s = connect(API, { auth: { token }, transports: ['websocket'] });
    s.on('match:start', ({ side, rejoin }) => { st.side = side; st.started = true; if (rejoin) st.rejoined = true; });
    s.on('snapshot', (snap) => {
      st.snaps++;
      const input = botDecide(bot, { phase: snap.phase, fighters: snap.f }, st.side, 1 / 30);
      s.emit('input', { i: input });
    });
    s.on('match:paused', () => { st.paused = true; });
    s.on('match:resumed', () => { st.resumed = true; });
    s.on('match:end', (r) => { st.ended = r; });
    return s;
  };
  st.socket = make();
  st.remake = () => { st.socket = make(); };
  return st;
}

const [tA, tB] = await Promise.all([login('brenno@teste.com', 'senha12345'), login('jogador2@teste.com', 'senha12345')]);
const A = player(tA, 'dificil');
const B = player(tB, 'dificil');
await new Promise((r) => setTimeout(r, 400));

// matchmaking por fila
A.socket.emit('queue:join');
B.socket.emit('queue:join');
await new Promise((r) => setTimeout(r, 800));
console.log('fila pareou os dois:', A.started && B.started);

// deixa lutar 4s, derruba B no meio da luta
await new Promise((r) => setTimeout(r, 4000));
const snapsBefore = A.snaps;
B.socket.close();
await new Promise((r) => setTimeout(r, 2500));
console.log('A avisado da pausa:', A.paused, '| snapshots congelados:', A.snaps === snapsBefore || A.snaps - snapsBefore < 5);

// B reconecta dentro da janela de 15s
B.remake();
await new Promise((r) => setTimeout(r, 1500));
console.log('B retomou a sala (rejoin):', !!B.rejoined, '| partida retomada:', A.resumed);

// espera terminar
const deadline = Date.now() + 5 * 60 * 1000;
while ((!A.ended || !B.ended) && Date.now() < deadline) await new Promise((r) => setTimeout(r, 500));
console.log('partida terminou após reconexão:', !!A.ended, '| placar:', A.ended?.wins?.join('x'), '| W.O.:', !!A.ended?.wo);
A.socket.close(); B.socket.close();
process.exit(0);
