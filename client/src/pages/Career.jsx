// STIKDEAD :: CARREIRA — tudo sobre o lutador, da primeira surra ao trono 🏆
import { useEffect, useState } from 'react';
import { api } from '../lib/api.js';
import Navbar from '../lib/Navbar.jsx';
import { PATENTS, patentFor } from '../../../shared/patents.js';

const TIER_NOME = (t) => String(t || '').replace('_', ' ').toUpperCase();
const fmt = (n) => Number(n || 0).toLocaleString('pt-BR');
const pct = (w, l) => (w + l > 0 ? Math.round((w / (w + l)) * 100) : 0);

export default function Career({ profile }) {
  const [c, setC] = useState(null);
  useEffect(() => { api('/api/matches/career').then(setC).catch(() => {}); }, []);
  if (!c) return (<><Navbar profile={profile} /><div className="career-wrap"><p className="dash-empty">Abrindo o dossiê...</p></div></>);

  const p = c.profile;
  const patente = patentFor(p.level);
  const desbloq = PATENTS.filter((x) => p.level >= x.level).length;
  const winrate = pct(p.wins, p.losses);

  const Stat = ({ label, value, sub, cor }) => (
    <div className="car-stat">
      <div className="car-stat-v" style={cor ? { color: cor } : undefined}>{value}</div>
      <div className="car-stat-l">{label}</div>
      {sub && <div className="car-stat-s">{sub}</div>}
    </div>
  );

  return (
    <>
      <Navbar profile={profile} />
      <div className="career-wrap">
        {/* cabeçalho: quem é este lutador */}
        <header className="car-hero">
          {patente && (
            <div className="car-patente">
              <img src={patente.icon} alt="" onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.nextSibling.style.display = 'flex'; }} />
              <span className="car-patente-emoji" style={{ display: 'none' }}>{patente.emoji}</span>
            </div>
          )}
          <div>
            <h1 className="car-nome">{p.fighter_name}</h1>
            <div className="car-sub">
              {patente ? <b className="car-pat-nome">{patente.name}</b> : 'Sem patente'} · Nível {p.level}/100 · {TIER_NOME(p.tier)}
            </div>
            <div className="car-sub2">Lutando desde {new Date(p.created_at).toLocaleDateString('pt-BR')}</div>
          </div>
        </header>

        {/* o quadro geral */}
        <div className="car-grid">
          <Stat label="RANKING GERAL" value={`#${fmt(c.rankGlobal)}`} sub={`${fmt(p.rank_points)} 🏆 pts`} cor="#ffd76a" />
          <Stat label="VITÓRIAS ONLINE" value={fmt(p.wins)} cor="#7de0a8" />
          <Stat label="DERROTAS ONLINE" value={fmt(p.losses)} cor="#ff8fa3" />
          <Stat label="APROVEITAMENTO" value={`${winrate}%`} sub={`${fmt(p.wins + p.losses)} duelos`} />
          <Stat label="SEQUÊNCIA ATUAL" value={p.win_streak > 0 ? `🔥 ${p.win_streak}` : '—'} />
          <Stat label="SEMANA" value={`${c.semana.wins}V · ${c.semana.losses}D`} sub="últimos 7 dias" />
          <Stat label="VS BOT INSANO" value={`${c.insano.wins}V · ${c.insano.losses}D`} sub={c.insano.wins + c.insano.losses > 0 ? `${pct(c.insano.wins, c.insano.losses)}% de vitórias` : 'nunca enfrentou'} cor="#ff6a4a" />
          <Stat label="VS MÁQUINAS (total)" value={`${c.bots.wins}V · ${c.bots.losses}D`} />
          <Stat label="APOSTAS GANHAS" value={fmt(c.apostas.ganhas)} sub={`+${fmt(c.apostas.totalGanho)} arrecadado`} cor="#7de0a8" />
          <Stat label="APOSTAS PERDIDAS" value={fmt(c.apostas.perdidas)} sub={`-${fmt(c.apostas.totalPerdido)} transferido`} cor="#ff8fa3" />
          <Stat label="COFRE" value={`🪙 ${fmt(p.coins)}`} sub={`💎 ${fmt(p.diamonds)}`} />
          <Stat label="PATENTES" value={`${desbloq}/${PATENTS.length}`} sub="conquistas de nível" cor="#ffd76a" />
        </div>

        {/* as 50 patentes em glória plena */}
        <div className="conq-head" style={{ marginTop: 26 }}>
          <h2 className="dash-h2">🏆 PATENTES DE NÍVEL</h2>
          <span className="conq-progress"><b>{desbloq}</b>/{PATENTS.length}</span>
        </div>
        <div className="conq-grid">
          {PATENTS.map((pt) => {
            const won = p.level >= pt.level;
            return (
              <div key={pt.id} className={`conq-slot ${won ? 'won' : ''}`} title={won ? `${pt.name} — nível ${pt.level}` : `??? — desbloqueia no nível ${pt.level}`}>
                {won ? (
                  <>
                    <img src={pt.icon} alt={pt.name} onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.parentElement.classList.add('no-img'); }} />
                    <span className="conq-fallback">{pt.emoji}</span>
                    <span className="conq-name">{pt.name}</span>
                  </>
                ) : (
                  <>
                    <span className="conq-lock">🔒</span>
                    <span className="conq-req">Nv {pt.level}</span>
                  </>
                )}
              </div>
            );
          })}
        </div>

        {/* últimas batalhas */}
        <h2 className="dash-h2" style={{ marginTop: 26 }}>⚔️ ÚLTIMAS BATALHAS</h2>
        <ul className="car-recent">
          {c.recentes.length === 0 && <li className="dash-empty">Nenhuma batalha registrada ainda.</li>}
          {c.recentes.map((m, i) => (
            <li key={i} className={m.won ? 'w' : 'l'}>
              <span className="car-r-res">{m.won ? 'VITÓRIA' : 'DERROTA'}</span>
              <span className="car-r-opp">{m.opponent_type === 'bot' ? `🤖 bot ${m.difficulty}` : '⚔️ online'}</span>
              <span className="car-r-score">{m.wins_a} × {m.wins_b}</span>
              <span className="car-r-gain">{Number(m.coin_gain) >= 0 ? `+${fmt(m.coin_gain)}` : `-${fmt(Math.abs(m.coin_gain))}`} 🪙</span>
              <span className="car-r-data">{new Date(m.created_at).toLocaleDateString('pt-BR')}</span>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}
