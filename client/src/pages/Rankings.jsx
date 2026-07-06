import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api.js';

const TIER_COLOR = {
  BRONZE: '#a9713d', PRATA: '#b9c2cc', OURO: '#e0a10b',
  PLATINA: '#5fd0c5', DIAMANTE: '#8b5cf6', MESTRE: '#d90429', GRANDMASTER: '#ff2244',
};
const tierName = (tier) => (tier || 'BRONZE_III').replace('_', ' ');
const tierColor = (tier) => TIER_COLOR[(tier || 'BRONZE').split('_')[0]] || '#8a8377';

export default function Rankings() {
  const nav = useNavigate();
  const [data, setData] = useState(null);

  useEffect(() => { api('/api/rankings').then(setData); }, []);

  return (
    <div className="scene">
      <h1 className="brand" style={{ fontSize: 'clamp(36px, 7vw, 54px)' }}>
        TOP 100 <span className="red">BRASIL</span>
      </h1>
      {data && (
        <div className="tagline">
          Sua posição: <strong style={{ color: '#e0a10b' }}>#{data.myPosition}</strong> · {data.myPoints} pontos
        </div>
      )}

      <div className="rank-table">
        {data?.top.map((r) => (
          <div key={r.position} className={`rank-row ${r.me ? 'me' : ''} ${r.position <= 3 ? `top${r.position}` : ''}`}>
            <span className="rank-pos">{r.position <= 3 ? ['🥇', '🥈', '🥉'][r.position - 1] : `#${r.position}`}</span>
            <span className="rank-name">{r.name}{r.me ? ' (você)' : ''}</span>
            <span className="rank-tier" style={{ color: tierColor(r.tier) }}>{tierName(r.tier)}</span>
            <span className="rank-record">{r.wins}V · {r.losses}D</span>
            <span className="rank-points">🏆 {r.rank_points}</span>
          </div>
        ))}
        {data?.top.length === 0 && <p className="switch-line">Ninguém lutou ainda. Seja o primeiro!</p>}
      </div>

      <div style={{ display: 'flex', gap: 12, marginTop: 26 }}>
        <button className="btn btn-blood" style={{ width: 'auto', padding: '12px 26px' }} onClick={() => nav('/lobby')}>
          Buscar partida
        </button>
        <button className="btn btn-ghost" style={{ width: 'auto', padding: '12px 26px' }} onClick={() => nav('/perfil')}>
          Voltar
        </button>
      </div>
    </div>
  );
}
