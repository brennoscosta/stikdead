import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import authRouter from './auth.js';
import matchesRouter from './matches.js';
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
app.use('/api/matches', matchesRouter);

app.use((_req, res) => res.status(404).json({ error: 'Rota não encontrada.' }));

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: 'Erro interno. Tente novamente.' });
});

const port = Number(process.env.PORT) || 3001;
app.listen(port, () => console.log(`STIKDEAD API na porta ${port}`));
