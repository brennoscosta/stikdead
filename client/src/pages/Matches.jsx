// STIKDEAD :: Histórico completo de partidas
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../lib/Navbar.jsx';
import { api } from '../lib/api.js';

const DIFF_LABEL = { facil: 'Bot Fácil', medio: 'Bot Médio', dificil: 'Bot Difícil', insano: 'Bot Insano' };

export default function Matches({ profile }) {
  const nav = useNavigate();
  const [rows, setRows] = useState(null);

  useEffect(() => {
    api('/api/matches/all').then((d) => setRows(d.matches)).catch(() => setRows([]));
  }, []);

  return (
    <div className="scene scene-nav">
      <Navbar profile={profile} />
      <h1 className="brand" style={{ fontSize: 'clamp(28px, 6vw, 42px)' }}>
        TODAS AS <span className="red">PARTIDAS</span>
      </h1>
      <button className="btn btn-ghost" style={{ width: 'auto', padding: '8px 20px', marginBottom: 16 }} onClick={() => nav('/perfil')}>
        ← Voltar ao perfil
      </button>
      {rows === null && <p className="dash-empty">Carregando...</p>}
      {rows && rows.length === 0 && <p className="dash-empty">Nenhuma partida ainda — vá lutar!</p>}
      <div className="dash-matches" style={{ width: '100%', maxWidth: 640 }}>
        {rows?.map((m, i) => {
          const opponent = m.opponent_type === 'player'
            ? (m.opponent_name || 'Jogador')
            : (DIFF_LABEL[m.difficulty] || 'Bot');
          const dt = new Date(m.created_at);
          return (
            <div key={i} className="dash-match" style={{ borderLeftColor: m.won ? '#7de0a8' : '#d90429', gridTemplateColumns: '58px 1fr 120px 74px' }}>
              <strong style={{ color: m.won ? '#7de0a8' : '#ff5a70' }}>{m.won ? 'VITÓRIA' : 'DERROTA'}</strong>
              <span>vs {opponent} · {m.wins_a}x{m.wins_b}</span>
              <span style={{ color: 'var(--muted)', fontSize: 12 }}>
                {dt.toLocaleDateString('pt-BR')} {dt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
              </span>
              <span style={{ color: m.coin_gain >= 0 ? '#e0a10b' : '#ff5a70', textAlign: 'right' }}>
                {m.coin_gain >= 0 ? '+' : ''}{m.coin_gain} 🪙
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
