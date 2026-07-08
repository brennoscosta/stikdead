import { io as IO } from 'socket.io-client';

const api = async (path, tok, method = 'GET', body) => {
  const r = await fetch('http://localhost:3001' + path, {
    method, headers: { 'Content-Type': 'application/json', ...(tok ? { Authorization: `Bearer ${tok}` } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  return r.json();
};
const t1 = (await api('/api/auth/login', null, 'POST', { email: 'brenno@teste.com', password: 'senha12345' })).token;
const t2 = (await api('/api/auth/login', null, 'POST', { email: 'jogador2@teste.com', password: 'senhaNova123' })).token;

const s1 = IO('http://localhost:3001', { auth: { token: t1 }, transports: ['websocket'] });
const s2 = IO('http://localhost:3001', { auth: { token: t2 }, transports: ['websocket'] });
await Promise.all([new Promise(r => s1.on('connect', r)), new Promise(r => s2.on('connect', r))]);
console.log('1. dois lutadores online ✓');

s2.on('friend:ask', (p) => console.log(`2. modal chegou no alvo: "${p.from} quer ser seu amigo" (ttl ${p.ttl}s, req ${p.requestId})`));
s1.on('friend:waiting', (p) => console.log(`3. modal de espera no remetente: aguardando ${p.to}`));
s1.on('friend:expired', (p) => console.log(`4. ⏱️ EXPIROU no remetente (req ${p.requestId})`));
s2.on('friend:expired', () => console.log('5. ⏱️ EXPIROU no alvo — os dois fecham'));

await api('/api/friends/request', t1, 'POST', { name: 'shadow_x' });
console.log('   (pedido enviado; deixando os 15s escoarem sem responder...)');
await new Promise(r => setTimeout(r, 16500));
const fr = await api('/api/friends', t2);
console.log('6. proposta evaporou do banco:', fr.requests.length === 0 ? 'sim ✓ (não virou pendência)' : `NÃO (${fr.requests.length} pendente)`);
s1.close(); s2.close(); process.exit(0);
