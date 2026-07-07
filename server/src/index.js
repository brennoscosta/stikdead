import 'dotenv/config';
import { createServer } from 'node:http';
import express from 'express';
import { Server as SocketServer } from 'socket.io';
import { attachOnline } from './online.js';
import cors from 'cors';
import authRouter from './auth.js';
import matchesRouter from './matches.js';
import shopRouter from './shop.js';
import missionsRouter from './missions.js';
import { q } from './db.js';

if (!process.env.JWT_SECRET) {
  console.error('JWT_SECRET não definido. Configure o arquivo .env antes de iniciar.');
  process.exit(1);
}

const app = express();
app.disable('x-powered-by');
app.use(cors({ origin: process.env.CORS_ORIGIN?.split(',') || true }));
app.use(express.json({ limit: '64kb' }));

app.get('/api/health', async (_req, res) => {
  try {
    await q('SELECT 1');
    res.json({ ok: true, db: 'up' });
  } catch {
    res.status(503).json({ ok: false, db: 'down' });
  }
});

app.use('/api/auth', authRouter);
app.use('/api/admin', (await import('./admin.js')).default);
app.use('/api/diamonds', (await import('./diamonds.js')).default);
app.use('/api', (await import('./social.js')).default);
app.use('/api/gifts', (await import('./gifts.js')).default);
app.use('/api/activities', (await import('./activities.js')).default);
app.use('/api/matches', matchesRouter);
app.use('/api', shopRouter);
app.use('/api', missionsRouter);

app.use((_req, res) => res.status(404).json({ error: 'Rota não encontrada.' }));

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: 'Erro interno. Tente novamente.' });
});

const port = Number(process.env.PORT) || 3001;
const http = createServer(app);
const io = new SocketServer(http, {
  cors: { origin: process.env.CORS_ORIGIN?.split(',') || true },
});
attachOnline(io);
http.listen(port, () => console.log(`STIKDEAD API + game server na porta ${port}`));
