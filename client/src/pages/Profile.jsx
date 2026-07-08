// STIKDEAD :: Perfil 2.0 — dashboard do jogador
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api.js';
import Navbar from '../lib/Navbar.jsx';
import ItemIcon from '../lib/ItemIcon.jsx';
import { createPreview } from '../game/preview.js';
import SettingsModal from '../lib/SettingsModal.jsx';
import { PATENTS } from '../../../shared/patents.js';
import PatentTip from '../lib/PatentTip.jsx';
import { RARITY_LABEL } from './Shop.jsx';
import { STYLES, STYLE_KEYS } from '../game/sim.js';

const tierName = (t) => (t || 'BRONZE_III').replace('_', ' ');
const TIER_COLOR = {
  BRONZE: '#a9713d', PRATA: '#b9c2cc', OURO: '#e0a10b',
  PLATINA: '#5fd0c5', DIAMANTE: '#8b5cf6', MESTRE: '#d90429', GRANDMASTER: '#ff2244',
};
const tierColor = (t) => TIER_COLOR[(t || 'BRONZE').split('_')[0]] || '#8a8377';
const xpForNext = (level) => level * 500;
const fmt = (n) => Number(n || 0).toLocaleString('pt-BR');
const fmtTime = (s) => (s >= 3600 ? `${Math.floor(s / 3600)}h ${Math.floor((s % 3600) / 60)}m` : `${Math.floor(s / 60)}m`);

export default function Profile({ profile, onUpdate, onLogout }) {
  const nav = useNavigate();
  const [editing, setEditing] = useState(false);
  const [showCfg, setShowCfg] = useState(false);
  const [name, setName] = useState(profile.fighter_name);
  const [err, setErr] = useState('');
  const [loadout, setLoadout] = useState([]);
  const [history, setHistory] = useState([]);
  const [summary, setSummary] = useState(null);
  const previewHost = useRef(null);
  const previewRef = useRef(null);

  const need = xpForNext(profile.level);
  const pct = Math.min(100, Math.round((profile.xp / need) * 100));
  const total = profile.wins + profile.losses;
  const winRate = total ? Math.round((profile.wins / total) * 100) : 0;
  const rankPct = Math.min(100, profile.rank_points % 100);

  useEffect(() => {
    api('/api/inventory').then((d) => setLoadout(d.loadout)).catch(() => {});
    api('/api/matches/history').then((d) => setHistory(d.matches.slice(0, 5))).catch(() => {});
    api('/api/matches/summary').then(setSummary).catch(() => {});
  }, []);

  useEffect(() => {
    let alive = true;
    if (!previewHost.current) return undefined;
    createPreview(previewHost.current).then((p) => {
      if (!alive) return p.destroy();
      previewRef.current = p;
    });
    return () => { alive = false; previewRef.current?.destroy(); previewRef.current = null; };
  }, []);

  useEffect(() => { previewRef.current?.setLoadout(loadout); }, [loadout]);

  const saveName = async () => {
    setErr('');
    try {
      const data = await api('/api/auth/me', { method: 'PATCH', body: { fighterName: name } });
      onUpdate(data.profile);
      setEditing(false);
    } catch (e) {
      setErr(e.message);
    }
  };

  return (
    <div className="dash">
      {showCfg && <SettingsModal onClose={() => setShowCfg(false)} />}
      <PatentTip />
      <Navbar profile={profile} />

      {/* cabeçalho com arte pintada */}
      <section className="dash-hero">
        <div className="dash-hero-info">
          <button className="cfg-gear" onClick={() => setShowCfg(true)} title="Configurações do jogo" aria-label="Configurações">⚙️</button>
          {editing ? (
            <div className="dash-edit">
              <input value={name} onChange={(e) => setName(e.target.value)} maxLength={16} />
              <button className="mission-claim" onClick={saveName}>Salvar</button>
              <button className="btn-link" onClick={() => { setEditing(false); setName(profile.fighter_name); }}>cancelar</button>
              {err && <span className="dash-err">{err}</span>}
            </div>
          ) : (
            <h1 className="dash-name">
              {profile.fighter_name}
              <button className="btn-link" onClick={() => setEditing(true)} aria-label="Editar nome">✏️</button>
            </h1>
          )}
          <div className="dash-sub">
            Nível <b>{profile.level}</b>
            <span className="tier-badge" style={{ borderColor: tierColor(profile.tier), color: tierColor(profile.tier) }}>
              {tierName(profile.tier)}
            </span>
            🏆 {fmt(profile.rank_points)}
          </div>
          <div className="dash-xp">
            <div className="mission-bar"><div className="mission-fill" style={{ width: `${pct}%` }} /></div>
            <span>EXP {fmt(profile.xp)} / {fmt(need)}</span>
          </div>
          <div className="dash-actions">
          {profile.email === 'souzacostabrenno@gmail.com' && (
            <button className="btn btn-ghost" style={{ width: 'auto' }} onClick={() => nav('/admin')}>⚙️ Admin</button>
          )}
            <button className="btn btn-blood" onClick={() => nav('/lobby')}>⚔️ Jogar online</button>
            <button className="btn btn-ghost" onClick={() => nav('/treino')}>🤖 Treino vs bot</button>
          </div>
        </div>
      </section>

      {/* ===== faixa compacta: conquistas (clique = carreira completa) ===== */}
      <section className="conq-wrap">
        <div className="conq-head">
          <button className="conq-title-link" onClick={() => nav('/carreira')} title="Ver a carreira completa">
            🏆 CONQUISTAS <span className="conq-arrow">›</span>
          </button>
          <span className="conq-progress">
            <b>{PATENTS.filter((p) => profile.level >= p.level).length}</b>/{PATENTS.length} patentes
          </span>
        </div>
        <div className="conq-strip">
          {PATENTS.map((p) => {
            const won = profile.level >= p.level;
            return (
              <button key={p.id} className={`conq-mini ${won ? 'won' : ''}`}
                onPointerDown={(e) => { e.stopPropagation(); window.dispatchEvent(new CustomEvent('stik:patenttip', { detail: { patent: p, unlocked: won, x: e.clientX, y: e.clientY } })); }}
                title={won ? `${p.name} — nível ${p.level}` : `??? — nível ${p.level}`}>
                {won ? (
                  <>
                    <img src={p.icon} alt="" onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.nextSibling.style.display = 'block'; }} />
                    <span style={{ display: 'none' }}>{p.emoji}</span>
                  </>
                ) : <span className="conq-mini-lock">🔒</span>}
              </button>
            );
          })}
        </div>
      </section>

      <div className="dash-grid">
        {/* resumo de carreira */}
        <section className="dash-card span2">
          <h2>RESUMO DE CARREIRA</h2>
          <div className="dash-stats-row">
            <div className="dash-stat"><b>{fmt(profile.wins)}</b><span>VITÓRIAS</span></div>
            <div className="dash-stat"><b>{fmt(profile.losses)}</b><span>DERROTAS</span></div>
            <div className="dash-stat"><b style={{ color: '#e0a10b' }}>{fmt(profile.rank_points)}</b><span>PONTOS</span></div>
            <div className="dash-stat"><b>{winRate}%</b><span>WIN RATE</span></div>
            <div className="dash-stat"><b style={{ color: '#ff2244' }}>{profile.streak || 0}</b><span>SEQUÊNCIA</span></div>
          </div>
        </section>

        {/* rank atual */}
        <section className="dash-card">
          <h2>RANK ATUAL</h2>
          <div className="dash-rank">
            <span className="dash-rank-tier" style={{ color: tierColor(profile.tier) }}>{tierName(profile.tier)}</span>
            <span className="dash-rank-pts">{fmt(profile.rank_points)} pontos</span>
            <div className="mission-bar"><div className="mission-fill" style={{ width: `${rankPct}%` }} /></div>
            <span className="dash-rank-next">{100 - rankPct} pts para o próximo rank</span>
            <button className="btn-link" onClick={() => nav('/rankings')}>ver ranking →</button>
          </div>
        </section>

        {/* build favorita */}
        <section className="dash-card span2">
          <h2>SUA BUILD</h2>
          <div className="dash-build">
            <div className="dash-build-preview" ref={previewHost} />
            <div className="dash-build-items">
              {loadout.length === 0 && <p className="dash-empty">Nada equipado ainda — visite a loja e monte seu stick!</p>}
              {loadout.map((it) => (
                <div key={it.slot} className={`item-card mini r-${it.rarity}`} style={{ cursor: 'default' }}>
                  <ItemIcon item={it} size={40} />
                  <span className="item-name">{it.name}</span>
                  <span className="item-slot">{RARITY_LABEL[it.rarity]}</span>
                </div>
              ))}
            </div>
          </div>
          <button className="btn btn-ghost" style={{ marginTop: 10 }} onClick={() => nav('/inventario')}>
            VER BUILD COMPLETA →
          </button>
        </section>

        {/* últimas partidas */}
        <section className="dash-card">
          <h2>ÚLTIMAS PARTIDAS</h2>
          <button className="btn-link" style={{ float: 'right', marginTop: -34 }} onClick={() => nav('/partidas')}>Ver todas →</button>
          <div className="dash-matches">
            {history.length === 0 && <p className="dash-empty">Nenhuma partida ainda.</p>}
            {history.map((m, i) => (
              <div key={i} className={`dash-match ${m.won ? 'win' : 'loss'}`}>
                <b>{m.won ? 'VITÓRIA' : 'DERROTA'}</b>
                <span>{m.opponent_type === 'bot' ? `Bot · ${m.difficulty || ''}` : 'Online 1v1'}</span>
                <span>{m.wins_a}x{m.wins_b}</span>
                <span className="dash-match-xp">+{m.xp_gain} XP</span>
              </div>
            ))}
          </div>
        </section>

        {/* estatísticas gerais */}
        <section className="dash-card span2">
          <h2>ESTATÍSTICAS GERAIS</h2>
          <div className="dash-stats-grid">
            <div><span>PARTIDAS JOGADAS</span><b>{fmt(summary?.partidas)}</b></div>
            <div><span>TEMPO LUTADO</span><b>{fmtTime(summary?.tempo_s || 0)}</b></div>
            <div><span>DANO CAUSADO</span><b>{fmt(summary?.dano)}</b></div>
            <div><span>GOLPES TOTAIS</span><b>{fmt(summary?.golpes)}</b></div>
            <div><span>BLOQUEIOS</span><b>{fmt(summary?.bloqueios)}</b></div>
            <div><span>COMBO MÁXIMO</span><b>{fmt(summary?.combo_max)}</b></div>
            <div><span>FINALIZAÇÕES</span><b>{fmt(summary?.finalizacoes)}</b></div>
            <div><span>MOEDAS</span><b style={{ color: '#e0a10b' }}>{fmt(profile.coins)}</b></div>
          </div>
        </section>

        {/* estilo de luta */}
        <section className="dash-card span2">
          <h2>SEU ESTILO DE LUTA</h2>
          <div className="style-grid">
            {STYLE_KEYS.map((k) => {
              const st = STYLES[k];
              const on = (profile.style || 'ronin') === k;
              const owned = k === 'ronin' || (profile.owned_styles || []).includes(`estilo_${k}`);
              return (
                <button
                  key={k}
                  className={`style-card ${on ? 'on' : ''} ${owned ? '' : 'locked'}`}
                  onClick={async () => {
                    if (!owned) { nav('/loja?slot=style'); return; }
                    try {
                      const d = await api('/api/auth/me', { method: 'PATCH', body: { style: k } });
                      onUpdate(d.profile);
                    } catch { /* mantém o atual */ }
                  }}
                >
                  <b>{st.label} {k === 'ronin' && <span className="style-free">GRÁTIS</span>}</b>
                  <span className="style-skill">⚡ {st.skill}</span>
                  <small>{st.desc}</small>
                  {on && <span className="style-on">SELECIONADO ✓</span>}
                  {!owned && <span className="style-lock">🔒 DESBLOQUEIE NA LOJA</span>}
                </button>
              );
            })}
          </div>
          <p className="dash-empty" style={{ marginTop: 8 }}>A skill dispara com <b>E</b> (ou o botão redondo no celular) e tem cooldown próprio.</p>
        </section>

        {/* em breve */}
        <section className="dash-card soon">
          <h2>CLÃ</h2>
          <p className="dash-empty">🛡️ Guerras de clã chegam em breve.</p>
          <h2 style={{ marginTop: 14 }}>STATUS ATUAL</h2>
          <StatusMedal profile={profile} />
          <button className="btn btn-ghost" style={{ marginTop: 'auto' }} onClick={onLogout}>
            Sair da conta
          </button>
        </section>
      </div>
    </div>
  );
}


// ===== a medalha do status atual: quem você é HOJE na arena =====
const MEDAL_STYLE = {
  BRONZE: { grad: 'linear-gradient(155deg, #d99a5b, #8a5426 55%, #5d3517)', glow: 'rgba(169,113,61,0.5)', nome: 'Bronze' },
  PRATA: { grad: 'linear-gradient(155deg, #eef2f6, #9aa6b2 55%, #5f6a75)', glow: 'rgba(185,194,204,0.5)', nome: 'Prata' },
  OURO: { grad: 'linear-gradient(155deg, #ffe08a, #e0a10b 55%, #8a6206)', glow: 'rgba(224,161,11,0.55)', nome: 'Ouro' },
  PLATINA: { grad: 'linear-gradient(155deg, #b7fff4, #5fd0c5 55%, #2a7d75)', glow: 'rgba(95,208,197,0.5)', nome: 'Platina' },
  DIAMANTE: { grad: 'linear-gradient(155deg, #d8c5ff, #8b5cf6 55%, #4c2f96)', glow: 'rgba(139,92,246,0.55)', nome: 'Diamante' },
  MASTER: { grad: 'linear-gradient(155deg, #ff6a7e, #d90429 55%, #7a0217)', glow: 'rgba(217,4,41,0.55)', nome: 'Mestre' },
  GRANDMASTER: { grad: 'linear-gradient(155deg, #ff8fa3, #ff2244 50%, #1a0508)', glow: 'rgba(255,34,68,0.65)', nome: 'Grão-Mestre' },
};
const TIER_ORDEM = ['BRONZE', 'PRATA', 'OURO', 'PLATINA', 'DIAMANTE', 'MASTER', 'GRANDMASTER'];
const SUB_ORDEM = ['III', 'II', 'I']; // III é o degrau de entrada; I é o topo da medalha

function StatusMedal({ profile }) {
  const [tierNome, subNome] = String(profile.tier || 'BRONZE_III').split('_');
  const st = MEDAL_STYLE[tierNome] || MEDAL_STYLE.BRONZE;
  const pontos = Number(profile.rank_points || 0);
  const degrau = Math.floor(pontos / 100);
  const topo = tierNome === 'GRANDMASTER' && subNome === 'I';
  const faltam = topo ? 0 : (degrau + 1) * 100 - pontos;
  // qual é o próximo título?
  let proximo = '';
  if (!topo) {
    const si = SUB_ORDEM.indexOf(subNome);
    if (si < 2) proximo = `${st.nome} ${SUB_ORDEM[si + 1]}`;
    else {
      const ti = TIER_ORDEM.indexOf(tierNome);
      const prox = MEDAL_STYLE[TIER_ORDEM[Math.min(ti + 1, TIER_ORDEM.length - 1)]];
      proximo = `${prox.nome} III`;
    }
  }
  return (
    <div className="medal-box">
      <div className="medal" style={{ background: st.grad, boxShadow: `0 0 26px ${st.glow}, inset 0 2px 6px rgba(255,255,255,0.35), inset 0 -4px 10px rgba(0,0,0,0.45)` }}>
        <span className="medal-sub">{subNome}</span>
        <span className="medal-fita" style={{ background: st.grad }} />
      </div>
      <div className="medal-info">
        <div className="medal-titulo">{st.nome} {subNome}</div>
        <p className="medal-explica">
          Este é o seu <b>status atual</b> na arena: <b>{pontos.toLocaleString('pt-BR')} pontos</b> de ranking,
          forjados em <b style={{ color: '#7de0a8' }}>{profile.wins}V</b> · <b style={{ color: '#ff8fa3' }}>{profile.losses}D</b> online.
          Vitórias somam pontos, derrotas tiram — a medalha sobe e desce com você.
        </p>
        {topo ? (
          <p className="medal-meta">👑 Você está no topo absoluto. Defenda o trono.</p>
        ) : (
          <p className="medal-meta">⬆️ Faltam <b style={{ color: '#ffd76a' }}>{faltam}</b> pontos para <b>{proximo}</b>.</p>
        )}
      </div>
    </div>
  );
}
