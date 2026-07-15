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
import StatusMedal, { formaMetal } from '../lib/StatusMedal.jsx';
import { RARITY_LABEL } from './Shop.jsx';
import { STYLES, STYLE_KEYS } from '../game/sim.js';
import Icon from '../ds/Icon.jsx';
import { rankArte, rankCor, rankNome } from '../ds/rank.js';

const tierName = (t) => (t || 'BRONZE_III').replace('_', ' ');
const TIER_COLOR = {
  BRONZE: '#a9713d', PRATA: '#b9c2cc', OURO: '#e0a10b',
  PLATINA: '#5fd0c5', DIAMANTE: '#8b5cf6', MESTRE: '#d90429', GRANDMASTER: '#ff2244',
};
const tierColor = (t) => TIER_COLOR[(t || 'BRONZE').split('_')[0]] || '#8a8377';
const xpForNext = (level) => level * 500;
const fmt = (n) => Number(n || 0).toLocaleString('pt-BR');
const fmtTime = (s) => (s >= 3600 ? `${Math.floor(s / 3600)}h ${Math.floor((s % 3600) / 60)}m` : `${Math.floor(s / 60)}m`);
const tempoAtras = (iso) => {
  if (!iso) return '';
  const m = Math.max(1, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  if (m < 60) return `${m} min atrás`;
  const h = Math.round(m / 60);
  if (h < 48) return `${h}h atrás`;
  return `${Math.round(h / 24)}d atrás`;
};

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

      {/* menu lateral (desktop largo): navegação do jogador */}
      <nav className="perfil-menu" aria-label="Seções do jogador">
        {[['perfil', 'PERFIL', '/perfil'], ['conquista', 'CARREIRA', '/carreira'], ['espada', 'PARTIDAS', '/partidas'], ['xp', 'ATIVIDADES', '/atividades'], ['amigos', 'AMIGOS', '/social/amigos'], ['cla', 'CLÃ', '/social/cla'], ['grupo', 'SOCIAL', '/social']].map(([ic, l, to]) => (
          <button key={to} className={to === '/perfil' ? 'on' : ''} onClick={() => { if (to !== '/perfil') nav(to); }}>
            <Icon name={ic} size={15} weight="forte" /> {l}
          </button>
        ))}
      </nav>

      {/* cabeçalho com arte pintada */}
      <section className="dash-hero">
        <img className="dash-avatar" src="/arte/avatar-padrao.webp" alt="" />
        <div className="dash-hero-info">
          <button className="cfg-gear" onClick={() => setShowCfg(true)} title="Configurações do jogo" aria-label="Configurações"><Icon name="config" size="sm" weight="forte" /></button>
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
              <button className="btn-link" onClick={() => setEditing(true)} aria-label="Editar nome"><Icon name="editar" size={14} /></button>
            </h1>
          )}
          <div className="dash-sub">
            Nível <b>{profile.level}</b>
            <span className="tier-badge" style={{ borderColor: formaMetal(profile).cor, color: formaMetal(profile).cor }}>
              {formaMetal(profile).nome}
            </span>
            <span className="dash-sub-pts"><Icon name="trofeu" size={14} weight="forte" /> {fmt(profile.rank_points)}</span>
          </div>
          <div className="dash-xp">
            <div className="mission-bar"><div className="mission-fill" style={{ width: `${pct}%` }} /></div>
            <span>EXP {fmt(profile.xp)} / {fmt(need)}</span>
          </div>
          <div className="dash-actions">
          {profile.email === 'souzacostabrenno@gmail.com' && (
            <button className="btn btn-ghost" style={{ width: 'auto' }} onClick={() => nav('/admin')}><Icon name="config" size={14} /> Admin</button>
          )}
            <button className="btn btn-blood" onClick={() => nav('/lobby')}><Icon name="espada" size={14} weight="forte" /> Jogar online</button>
            <button className="btn btn-ghost" onClick={() => nav('/treino')}><Icon name="soco" size={14} /> Treino vs bot</button>
          </div>
        </div>
        <div className="hero-emblema" style={{ '--rank-cor': rankCor(profile.tier) }} aria-hidden="true">
          <img className="rank-img" src={rankArte(profile.tier)} alt="" />
          <span>{rankNome(profile.tier)}</span>
        </div>
      </section>

      {/* ===== faixa compacta: conquistas (clique = carreira completa) ===== */}
      <section className="conq-wrap">
        <div className="conq-head">
          <button className="conq-title-link" onClick={() => nav('/carreira')} title="Ver a carreira completa">
            <Icon name="trofeu" size={16} weight="forte" className="h2-ico" /> CONQUISTAS <span className="conq-arrow">›</span>
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
                ) : <span className="conq-mini-lock"><Icon name="cadeado" size={15} /></span>}
              </button>
            );
          })}
        </div>
      </section>

      <div className="dash-grid dash-grid2">
        <div className="dash-col">
        {/* resumo de carreira */}
        <section className="dash-card span2">
          <h2><Icon name="conquista" size={15} weight="forte" className="h2-ico" /> RESUMO DE CARREIRA</h2>
          <div className="dash-stats-row">
            <div className="dash-stat"><Icon name="espada" size={17} weight="forte" className="stat-ico i-osso" /><b>{fmt(profile.wins)}</b><span>VITÓRIAS</span></div>
            <div className="dash-stat"><Icon name="perfil" size={17} weight="forte" className="stat-ico i-sangue" /><b>{fmt(profile.losses)}</b><span>DERROTAS</span></div>
            <div className="dash-stat"><Icon name="trofeu" size={17} weight="forte" className="stat-ico" /><b style={{ color: '#e0a10b' }}>{fmt(profile.rank_points)}</b><span>PONTOS</span></div>
            <div className="dash-stat"><Icon name="combo" size={17} weight="forte" className="stat-ico i-osso" /><b>{winRate}%</b><span>WIN RATE</span><i className="stat-medidor"><em style={{ width: `${winRate}%` }} /></i></div>
            <div className="dash-stat"><Icon name="aura" size={17} weight="forte" className="stat-ico i-sangue" /><b style={{ color: '#ff2244' }}>{profile.streak || 0}</b><span>SEQUÊNCIA</span></div>
          </div>
        </section>


        {/* build favorita */}
        <section className="dash-card span2">
          <h2><Icon name="armadura" size={15} weight="forte" className="h2-ico" /> SUA BUILD</h2>
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


        {/* estatísticas gerais */}
        <section className="dash-card span2">
          <h2><Icon name="nivel" size={15} weight="forte" className="h2-ico" /> ESTATÍSTICAS GERAIS</h2>
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
          <h2><Icon name="combo" size={15} weight="forte" className="h2-ico" /> SEU ESTILO DE LUTA</h2>
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
                  <span className="style-skill"><Icon name="ultimate" size={12} /> {st.skill}</span>
                  <small>{st.desc}</small>
                  {on && <span className="style-on">SELECIONADO ✓</span>}
                  {!owned && <span className="style-lock"><Icon name="cadeado" size={12} /> DESBLOQUEIE NA LOJA</span>}
                </button>
              );
            })}
          </div>
          <p className="dash-empty" style={{ marginTop: 8 }}>A skill dispara com <b>E</b> (ou o botão redondo no celular) e tem cooldown próprio.</p>
        </section>

        </div>
        <div className="dash-col">
        {/* rank atual */}
        <section className="dash-card">
          <h2><Icon name="liga" size={15} weight="forte" className="h2-ico" /> RANK ATUAL</h2>
          <div className="dash-rank">
            <span className="rank-emblema" aria-hidden="true"><img className="rank-img" src={rankArte(profile.tier)} alt="" /></span>
            <span className="dash-rank-tier" style={{ color: rankCor(profile.tier) }}>{rankNome(profile.tier)}</span>
            <span className="dash-rank-pts">{fmt(profile.rank_points)} pontos</span>
            <div className="mission-bar"><div className="mission-fill" style={{ width: `${rankPct}%` }} /></div>
            <span className="dash-rank-next">{100 - rankPct} pts para o próximo rank</span>
            <button className="btn-link" onClick={() => nav('/rankings')}>ver ranking →</button>
          </div>
        </section>
        {/* últimas partidas */}
        <section className="dash-card">
          <h2 className="h2-linha"><Icon name="espada" size={15} weight="forte" className="h2-ico" /> ÚLTIMAS PARTIDAS <button className="btn-link h2-link" onClick={() => nav('/partidas')}>ver todas →</button></h2>
          <div className="dash-matches">
            {history.length === 0 && <p className="dash-empty">Nenhuma partida ainda.</p>}
            {history.map((m, i) => (
              <div key={i} className={`dash-match ${m.won ? 'win' : 'loss'}`}>
                <b>{m.won ? 'VITÓRIA' : 'DERROTA'}</b>
                <span className="dm-opp">
                  {m.opponent_type === 'bot' ? (
                    <img className="dm-avatar" src="/arte/bot.png" alt="" />
                  ) : (
                    <img className="dm-avatar" src="/arte/avatar-padrao.webp" alt="" />
                  )}
                  <span className="dm-nome">{m.opponent_type === 'bot' ? `Bot · ${m.difficulty || ''}` : (m.opponent_name || 'Online 1v1')}</span>
                  {m.opponent_type !== 'bot' && m.opponent_tier && (
                    <img className="dm-emblema rank-img" src={rankArte(m.opponent_tier)} alt="" title={rankNome(m.opponent_tier)} />
                  )}
                </span>
                <span className="dm-placar">{m.wins_a}x{m.wins_b}</span>
                <span className="dm-tempo">{tempoAtras(m.created_at)}</span>
                <span className="dash-match-xp">+{m.xp_gain} XP</span>
              </div>
            ))}
          </div>
        </section>
        {/* clã + status */}
        <section className="dash-card soon">
          <h2><Icon name="cla" size={15} weight="forte" className="h2-ico" /> CLÃ</h2>
          <ClanCardResumo />
          <h2 style={{ marginTop: 14 }}><Icon name="aura" size={15} weight="forte" className="h2-ico" /> STATUS ATUAL</h2>
          <StatusMedal profile={profile} />
          <button className="btn btn-ghost" style={{ marginTop: 'auto' }} onClick={onLogout}>
            Sair da conta
          </button>
        </section>
        </div>
      </div>
    </div>
  );
}




// ===== resumo do clã no perfil =====
function ClanCardResumo() {
  const [meu, setMeu] = useState(null);
  const nav2 = useNavigate();
  useEffect(() => { api('/api/clans/mine').then(setMeu).catch(() => {}); }, []);
  if (!meu) return <p className="dash-empty">🛡️ ...</p>;
  if (!meu.clan) return (
    <p className="dash-empty">
      🛡️ Sem clã. {meu.canCreate ? <button className="btn-link" onClick={() => nav2('/social/cla')}>Fundar o seu →</button> : meu.canJoin ? 'Aguarde um convite (nv 5+).' : 'Disponível no nível 5+.'}
    </p>
  );
  const c = meu.clan;
  return (
    <div className="cla-resumo" onClick={() => nav2('/social/cla')} role="button">
      <span className="cla-resumo-flag" style={c.flagUrl ? undefined : { background: c.flagColor }}>
        {c.flagUrl ? <img src={c.flagUrl} alt="" /> : c.name.slice(0, 2).toUpperCase()}
      </span>
      <span>
        <b style={{ color: '#ffd76a' }}>{c.name}</b>{meu.isOwner ? ' 👑' : ''}
        {c.motto && <em className="cla-resumo-lema"> “{c.motto}”</em>}
        <small style={{ display: 'block', color: 'var(--muted)' }}>
          <Icon name="amigos" size={12} /> {c.membros.length} · <Icon name="espada" size={12} /> {c.reputacao.vitorias} vitórias · <Icon name="escudo" size={12} /> {c.reputacao.duoWins}/{c.reputacao.duoBattles} batalhas
        </small>
      </span>
    </div>
  );
}
