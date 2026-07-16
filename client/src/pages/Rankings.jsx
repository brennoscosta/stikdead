// STIKDEAD :: RANKINGS — arena competitiva: pódio top-3 + lista rica (Sprint 04)
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api.js';
import Navbar from '../lib/Navbar.jsx';
import { patentFor } from '../../../shared/patents.js';
import PatentTip from '../lib/PatentTip.jsx';
import PlayerCard from '../lib/PlayerCard.jsx';
import Icon from '../ds/Icon.jsx';
import { rankArte, rankCor, rankNome } from '../ds/rank.js';

const fmt = (n) => Number(n || 0).toLocaleString('pt-BR');
const winRate = (r) => { const t = (r.wins || 0) + (r.losses || 0); return t ? Math.round((r.wins / t) * 100) : 0; };

const BOARDS = [
  { id: 'geral', label: 'Geral', chip: '🏆', metric: (v) => `${fmt(v)}`, unit: 'pts', title: 'RANKING GERAL' },
  { id: 'pvp', label: 'PvP', chip: '⚔️', metric: (v) => `${fmt(v)}`, unit: 'vitórias', title: 'TOP PVP' },
  { id: 'bots', label: 'vs Bots', chip: '🤖', metric: (v) => `${fmt(v)}`, unit: 'vs bots', title: 'CAÇA-BOTS' },
  { id: 'insano', label: 'Insano', chip: '👹', metric: (v) => `${fmt(v)}`, unit: 'no insano', title: 'MODO INSANO' },
  { id: 'apostas', label: 'Apostas', chip: '💰', metric: (v) => `${v >= 0 ? '+' : '−'}${fmt(Math.abs(v))}`, unit: '🪙 saldo', title: 'REIS DA APOSTA' },
];

function RankRow({ r, board, onName, onPatent, featured }) {
  const pat = patentFor(r.level);
  const wr = winRate(r);
  return (
    <div className={`rk-row ${r.me ? 'me' : ''} ${featured ? `rk-top rk-top${r.position}` : ''}`} onClick={() => onName(r.name)} role="button" tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter') onName(r.name); }}>
      <span className="rk-pos">{r.position <= 3 ? ['🥇', '🥈', '🥉'][r.position - 1] : `#${r.position}`}</span>
      <img className="rk-avatar" src="/arte/avatar-padrao.webp" alt="" />
      <img className="rk-liga rank-img" src={rankArte(r.tier)} alt="" title={rankNome(r.tier)} />
      <div className="rk-idcol">
        <b className="rk-name">{r.name}{r.me ? ' (você)' : ''}</b>
        {pat && (
          <button className="rk-titulo" onPointerDown={(e) => onPatent(e, r.level)} title={pat.name}>
            <Icon name="trofeu" size={9} weight="forte" /> {pat.name}
          </button>
        )}
      </div>
      <span className="rk-liganome" style={{ color: rankCor(r.tier) }}>{rankNome(r.tier)}</span>
      <span className="rk-stat rk-vd"><b>{fmt(r.wins)}</b>V · <b>{fmt(r.losses)}</b>D</span>
      <span className="rk-stat rk-wr"><i className="rk-wrbar"><em style={{ width: `${wr}%` }} /></i>{wr}%</span>
      <span className="rk-stat rk-streak" title="Sequência de vitórias">{(r.win_streak || 0) > 0 ? <>🔥 {r.win_streak}</> : '—'}</span>
      <span className="rk-metric"><b>{board.metric(r.metric)}</b> <small>{board.unit}</small></span>
    </div>
  );
}

export default function Rankings({ profile }) {
  const nav = useNavigate();
  const [board, setBoard] = useState('geral');
  const [limit, setLimit] = useState(10);
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [card, setCard] = useState(null);

  const load = () => {
    setData(null); setError('');
    api(`/api/rankings?board=${board}&limit=${limit}`).then(setData).catch((e) => setError(e?.message || 'Não deu para consultar a arena.'));
  };
  useEffect(load, [board, limit]);

  const B = BOARDS.find((b) => b.id === board);
  const abrePatente = (e, level) => {
    const p = patentFor(level);
    if (!p) return;
    e.stopPropagation();
    window.dispatchEvent(new CustomEvent('stik:patenttip', { detail: { patent: p, unlocked: true, x: e.clientX, y: e.clientY } }));
  };

  const top3 = data ? data.top.filter((r) => r.position <= 3) : [];
  const rest = data ? data.top.filter((r) => r.position > 3) : [];

  return (
    <div className="scene scene-nav dash">
      <Navbar profile={profile} />
      <PatentTip />
      <h1 className="dash-name" style={{ textAlign: 'center', marginBottom: 2 }}>
        <Icon name="trofeu" size={24} weight="forte" /> {B.title}
      </h1>
      {data && (
        <p className="dash-empty" style={{ marginTop: 0, textAlign: 'center' }}>
          Sua posição: <strong style={{ color: '#e0a10b' }}>#{data.myPosition}</strong> · {fmt(data.myPoints)} pontos
        </p>
      )}

      {/* categorias */}
      <div className="rk-tabs">
        {BOARDS.map((b) => (
          <button key={b.id} className={`rk-tab ${board === b.id ? 'on' : ''}`} onClick={() => setBoard(b.id)}>
            <span className="rk-tab-chip">{b.chip}</span> {b.label}
          </button>
        ))}
      </div>
      <div className="rk-limits">
        {[10, 50, 100].map((n) => (
          <button key={n} className={`rk-limit ${limit === n ? 'on' : ''}`} onClick={() => setLimit(n)}>Top {n}</button>
        ))}
      </div>

      {error && (
        <div className="fr-error" style={{ maxWidth: 500, margin: '20px auto' }}>
          <p>⚠️ {error}</p>
          <button className="btn btn-ghost" style={{ width: 'auto', padding: '8px 16px' }} onClick={load}>Tentar de novo</button>
        </div>
      )}

      {!data && !error && (
        <div className="rk-wrap">
          <div className="rk-podium">{[0, 1, 2].map((i) => <div key={i} className="rk-pod-card is-skeleton" />)}</div>
          <div className="rk-list">{[0, 1, 2, 3, 4].map((i) => <div key={i} className="rk-row is-skeleton" />)}</div>
        </div>
      )}

      {data && !error && (
        <div className="rk-wrap">
          {data.top.length === 0 && <p className="dash-empty" style={{ textAlign: 'center' }}>Placa vazia. Seja o primeiro nome aqui! 🥷</p>}

          {/* pódio top-3 */}
          {top3.length > 0 && (
            <div className="rk-podium">
              {top3.map((r) => {
                const pat = patentFor(r.level);
                return (
                  <div key={r.position} className={`rk-pod-card rk-pod${r.position} ${r.me ? 'me' : ''}`} style={{ '--rank-cor': rankCor(r.tier) }}
                    onClick={() => setCard(r.name)} role="button" tabIndex={0}>
                    <span className="rk-pod-medal">{['🥇', '🥈', '🥉'][r.position - 1]}</span>
                    <div className="rk-pod-avatar-wrap">
                      <img className="rk-pod-avatar" src="/arte/avatar-padrao.webp" alt="" />
                      <img className="rk-pod-liga rank-img" src={rankArte(r.tier)} alt="" title={rankNome(r.tier)} />
                    </div>
                    <b className="rk-pod-name">{r.name}{r.me ? ' (você)' : ''}</b>
                    <span className="rk-pod-tier" style={{ color: rankCor(r.tier) }}>{rankNome(r.tier)}</span>
                    <span className="rk-pod-metric">{B.metric(r.metric)} <small>{B.unit}</small></span>
                    <span className="rk-pod-sub">{fmt(r.wins)}V · {fmt(r.losses)}D · {winRate(r)}% WR{(r.win_streak || 0) > 0 ? ` · 🔥${r.win_streak}` : ''}</span>
                    {pat && <span className="rk-pod-titulo">{pat.name}</span>}
                  </div>
                );
              })}
            </div>
          )}

          {/* lista */}
          {rest.length > 0 && (
            <div className="rk-list">
              <div className="rk-list-head">
                <span className="rk-pos">#</span><span /><span /><span>LUTADOR</span><span className="rk-liganome">LIGA</span>
                <span className="rk-stat rk-vd">V · D</span><span className="rk-stat rk-wr">WIN RATE</span><span className="rk-stat rk-streak">SEQ</span><span className="rk-metric">{B.chip} {B.unit.toUpperCase()}</span>
              </div>
              {rest.map((r) => <RankRow key={r.position} r={r} board={B} onName={setCard} onPatent={abrePatente} />)}
            </div>
          )}
        </div>
      )}

      <div style={{ display: 'flex', gap: 12, marginTop: 26, justifyContent: 'center' }}>
        <button className="btn btn-blood" style={{ width: 'auto', padding: '12px 26px' }} onClick={() => nav('/lobby')}>
          <Icon name="espada" size={14} weight="forte" /> Buscar partida
        </button>
        <button className="btn btn-ghost" style={{ width: 'auto', padding: '12px 26px' }} onClick={() => nav('/perfil')}>Voltar</button>
      </div>

      {card && <PlayerCard name={card} onClose={() => setCard(null)} />}
    </div>
  );
}
