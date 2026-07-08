// STIKDEAD :: RANKINGS — cinco placas de glória, com a patente de cada lutador 🏆
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api.js';
import Navbar from '../lib/Navbar.jsx';
import { patentFor } from '../../../shared/patents.js';
import PatentTip from '../lib/PatentTip.jsx';

const TIER_COLOR = {
  BRONZE: '#a9713d', PRATA: '#b9c2cc', OURO: '#e0a10b',
  PLATINA: '#5fd0c5', DIAMANTE: '#8b5cf6', MESTRE: '#d90429', GRANDMASTER: '#ff2244',
};
const tierName = (tier) => (tier || 'BRONZE_III').replace('_', ' ');
const tierColor = (tier) => TIER_COLOR[(tier || 'BRONZE').split('_')[0]] || '#8a8377';
const fmt = (n) => Number(n || 0).toLocaleString('pt-BR');

const BOARDS = [
  { id: 'geral', label: '🏆 Geral', metric: (v) => `🏆 ${fmt(v)}` },
  { id: 'insano', label: '👹 Insano', metric: (v) => `👹 ${fmt(v)} vitórias` },
  { id: 'apostas', label: '💰 Apostas', metric: (v) => `${v >= 0 ? '+' : '-'}${fmt(Math.abs(v))} 🪙` },
  { id: 'bots', label: '🤖 vs Bots', metric: (v) => `🤖 ${fmt(v)} vitórias` },
  { id: 'pvp', label: '⚔️ PvP', metric: (v) => `⚔️ ${fmt(v)} vitórias` },
];

export default function Rankings({ profile }) {
  const nav = useNavigate();
  const [board, setBoard] = useState('geral');
  const [limit, setLimit] = useState(10);
  const [data, setData] = useState(null);

  useEffect(() => {
    setData(null);
    api(`/api/rankings?board=${board}&limit=${limit}`).then(setData).catch(() => {});
  }, [board, limit]);

  const B = BOARDS.find((b) => b.id === board);
  const abrePatente = (e, level) => {
    const p = patentFor(level);
    if (!p) return;
    e.stopPropagation();
    window.dispatchEvent(new CustomEvent('stik:patenttip', { detail: { patent: p, unlocked: true, x: e.clientX, y: e.clientY } }));
  };

  return (
    <div className="scene scene-nav">
      <Navbar profile={profile} />
      <PatentTip />
      <h1 className="brand" style={{ fontSize: 'clamp(34px, 7vw, 52px)' }}>
        TOP {limit}<span className="red">{{ geral: ' BRASIL', insano: ' INSANO', apostas: ' APOSTAS', bots: ' CAÇA-BOTS', pvp: ' PVP' }[board]}</span>
      </h1>
      {data && board === 'geral' && (
        <div className="tagline">
          Sua posição: <strong style={{ color: '#e0a10b' }}>#{data.myPosition}</strong> · {fmt(data.myPoints)} pontos
        </div>
      )}

      {/* seletor de placa */}
      <div className="rk-boards">
        {BOARDS.map((b) => (
          <button key={b.id} className={`rk-board ${board === b.id ? 'on' : ''}`} onClick={() => setBoard(b.id)}>{b.label}</button>
        ))}
      </div>
      {/* seletor de tamanho */}
      <div className="rk-limits">
        {[10, 50, 100].map((n) => (
          <button key={n} className={`rk-limit ${limit === n ? 'on' : ''}`} onClick={() => setLimit(n)}>Top {n}</button>
        ))}
      </div>

      <div className="rank-table">
        {!data && <p className="switch-line">Consultando os anais da arena...</p>}
        {data?.top.map((r) => {
          const pat = patentFor(r.level);
          return (
            <div key={r.position} className={`rank-row ${r.me ? 'me' : ''} ${r.position <= 3 ? `top${r.position}` : ''}`}>
              <span className="rank-pos">{r.position <= 3 ? ['🥇', '🥈', '🥉'][r.position - 1] : `#${r.position}`}</span>
              {pat ? (
                <button className="rk-pat" onPointerDown={(e) => abrePatente(e, r.level)} title={pat.name}>
                  <img src={pat.icon} alt="" onError={(e) => { e.currentTarget.outerHTML = `<span style="font-size:16px">${pat.emoji}</span>`; }} />
                </button>
              ) : <span className="rk-pat rk-pat-vazia">—</span>}
              <span className="rank-name">{r.name}{r.me ? ' (você)' : ''}</span>
              <span className="rank-tier" style={{ color: tierColor(r.tier) }}>{tierName(r.tier)}</span>
              <span className="rank-record">{r.wins}V · {r.losses}D</span>
              <span className="rank-points">{B.metric(r.metric)}</span>
            </div>
          );
        })}
        {data?.top.length === 0 && <p className="switch-line">Placa vazia. Faça história: seja o primeiro nome aqui!</p>}
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
