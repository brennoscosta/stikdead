// cronômetro do presente: destinatário conecta socket -> remetente envia -> mede o gift:new
import { io } from '../client/node_modules/socket.io-client/dist/socket.io.esm.min.js';

const api = async (path, tok, method = 'GET', body) => {
  const r = await fetch('http://localhost:3001' + path, {
    method, headers: { 'Content-Type': 'application/json', ...(tok ? { Authorization: `Bearer ${tok}` } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  return r.json();
};

const t1 = (await api('/api/auth/login', null, 'POST', { email: 'brenno@teste.com', password: 'senha12345' })).token;
const t2 = (await api('/api/auth/login', null, 'POST', { email: 'jogador2@teste.com', password: 'senhaNova123' })).token;

const sock = io('http://localhost:3001', { auth: { token: t2 }, transports: ['websocket'] });
await new Promise((res, rej) => { sock.on('connect', res); sock.on('connect_error', rej); setTimeout(() => rej(new Error('timeout conexão')), 4000); });
console.log('1. destinatário conectado no socket ✓');

let t0;
const got = new Promise((res) => sock.on('gift:new', () => res(Date.now() - t0)));

const inv = await api('/api/inventory', t1);
const item = inv.chest[0];
console.log('2. enviando presente:', item.name);
t0 = Date.now();
const send = await api('/api/gifts/send', t1, 'POST', { toName: 'shadow_x', itemId: item.id, message: 'teste de velocidade' });
console.log('3. send respondeu:', send.ok ? 'ok' : send.error);

const ms = await Promise.race([got, new Promise((r) => setTimeout(() => r(-1), 6000))]);
console.log(ms >= 0 ? `4. 🎁 gift:new chegou em ${ms}ms ⚡` : '4. ✗ gift:new NÃO chegou em 6s — corrente quebrada');
sock.close();
process.exit(0);
