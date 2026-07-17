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
import RankBadge from '../lib/RankBadge.jsx';
import AvatarPicker from '../lib/AvatarPicker.jsx';
import { avatarSrc } from '../ds/avatars.js';
import HeroFx from '../lib/HeroFx.jsx';
import StyleBadge, { StyleIcon, STYLE_COR, STYLE_INFO, splitDesc } from '../lib/StyleBadge.jsx';
import { sfx, unlockAudio } from '../game/audio.js';

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
  const [showAv, setShowAv] = useState(false);
  const [avSaving, setAvSaving] = useState(false);
  const [name, setName] = useState(profile.fighter_name);
  const [err, setErr] = useState('');
  const [equipando, setEquipando] = useState(null); // UPDATE 2.9: anima ANTES de mover pra 1ª posição
  const [conqFiltro, setConqFiltro] = useState('todos'); // UPDATE 3.0: filtros das conquistas
  const [conqSel, setConqSel] = useState(null);          // UPDATE 3.0: patente aberta no modal

  // UPDATE 3.0 — após reordenar, o card equipado fica TOTALMENTE visível:
  // scroll volta ao início instantaneamente (nunca anima para a direita)
  useEffect(() => {
    if (estRef.current) estRef.current.scrollLeft = 0;
  }, [profile.style]);
  const [loadout, setLoadout] = useState([]);
  const [history, setHistory] = useState([]);
  const [summary, setSummary] = useState(null);
  const previewHost = useRef(null);
  const previewRef = useRef(null);
  const estRef = useRef(null);
  const estScroll = (dir) => estRef.current?.scrollBy({ left: dir * 320, behavior: 'smooth' });

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

  const pickAvatar = async (key) => {
    if (key === (profile.avatar || 'padrao')) { setShowAv(false); return; }
    setAvSaving(true);
    try {
      const data = await api('/api/auth/me', { method: 'PATCH', body: { avatar: key } });
      onUpdate(data.profile);
      setShowAv(false);
    } catch (e) { /* mantém aberto em caso de erro */ }
    setAvSaving(false);
  };

  return (
    <div className="dash">
      {showCfg && <SettingsModal onClose={() => setShowCfg(false)} />}
      {showAv && <AvatarPicker current={profile.avatar || 'padrao'} onPick={pickAvatar} onClose={() => setShowAv(false)} saving={avSaving} />}
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
        <HeroFx />
        <button className="dash-avatar-btn avatar-vivo" onClick={() => { unlockAudio(); sfx.click(); setShowAv(true); }} title="Trocar avatar" aria-label="Trocar avatar">
          <img key={profile.avatar} className="dash-avatar" src={avatarSrc(profile.avatar)} alt="" />
          <span className="dash-avatar-edit"><Icon name="editar" size={13} /></span>
        </button>
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
            {/* UPDATE 2.9 — progressão de rank visível: Prata III · 339/400 ▓▓░ */}
            {(() => {
              const pts = Number(profile.rank_points || 0);
              const prox = (Math.floor(pts / 100) + 1) * 100;
              return (
                <span className="rank-prog" title={`${tierName(profile.tier)} — faltam ${prox - pts} pts para subir`}>
                  <b style={{ color: tierColor(profile.tier) }}>{tierName(profile.tier)}</b>
                  <em>{fmt(pts)} / {fmt(prox)}</em>
                  <i className="rank-prog-bar"><span style={{ width: `${pts % 100}%` }} /></i>
                </span>
              );
            })()}
          </div>
          {/* UPDATE 2.9 — estilo equipado direto no header (badge + ícone + tooltip) */}
          <div className="dash-estilo-linha">
            <small className="dash-estilo-rotulo">ESTILO</small>
            <StyleBadge styleKey={profile.style || 'ronin'} />
          </div>
          <div className="dash-xp">
            <div className="mission-bar"><div className="mission-fill" style={{ width: `${pct}%` }} /></div>
            <span>EXP {fmt(profile.xp)} / {fmt(need)}</span>
          </div>
          <div className="dash-actions">
          {profile.email === 'souzacostabrenno@gmail.com' && (
            <button className="btn btn-ghost" style={{ width: 'auto' }} onClick={() => nav('/admin')}><Icon name="config" size={14} /> Admin</button>
          )}
            {/* UPDATE 2.9 — CTAs premium com subtítulo, reflexo metálico e elevação */}
            <button className="cta-hero cta-online" onClick={() => nav('/lobby')}>
              <Icon name="espada" size={22} weight="forte" />
              <span className="cta-hero-txt"><b>JOGAR ONLINE</b><small>PvP em tempo real</small></span>
            </button>
            <button className="cta-hero cta-treino" onClick={() => nav('/treino')}>
              <Icon name="robo" size={22} weight="forte" />
              <span className="cta-hero-txt"><b>TREINO VS BOT</b><small>Pratique habilidades</small></span>
            </button>
          </div>
        </div>
      </section>

      {/* ===== UPDATE 3.0 — CONQUISTAS: categorias, grid, progresso e modal ===== */}
      {(() => {
        const RAR_ATO = { 'A RUA': 'Comum', 'O DOJO': 'Incomum', 'A ARENA': 'Raro', 'A LENDA': 'Épico', 'A MORTE': 'Lendário' };
        const RAR_COR = { Comum: '#9a8f88', Incomum: '#7de0a8', Raro: '#5bb8ff', 'Épico': '#b98cff', 'Lendário': '#ffd76a' };
        const nv = profile.level;
        const estado = (p) => {
          const obtida = nv >= p.level;
          const secreta = !obtida && p.level > nv + 20; // longe demais: ainda é mistério
          return { obtida, secreta, rar: RAR_ATO[p.ato], pct: obtida ? 100 : Math.min(99, Math.floor((nv / p.level) * 100)) };
        };
        const FILTROS_CONQ = [['todos', 'TODOS'], ['obtidos', 'OBTIDOS'], ['progresso', 'EM PROGRESSO'], ['raros', 'RAROS'], ['secretos', 'SECRETOS']];
        const passaFiltro = (p) => {
          const e = estado(p);
          if (conqFiltro === 'obtidos') return e.obtida;
          if (conqFiltro === 'progresso') return !e.obtida && !e.secreta;
          if (conqFiltro === 'raros') return ['Raro', 'Épico', 'Lendário'].includes(e.rar);
          if (conqFiltro === 'secretos') return e.secreta;
          return true;
        };
        const ATOS = [...new Set(PATENTS.map((p) => p.ato))];
        const obtidas = PATENTS.filter((p) => nv >= p.level).length;
        return (
          <section className="conq-wrap">
            <div className="conq-head">
              <button className="conq-title-link" onClick={() => nav('/carreira')} title="Ver a carreira completa">
                <Icon name="trofeu" size={16} weight="forte" className="h2-ico" /> CONQUISTAS <span className="conq-arrow">›</span>
              </button>
              <div className="conq-filtros" role="tablist" aria-label="Filtrar conquistas">
                {FILTROS_CONQ.map(([id, l]) => (
                  <button key={id} role="tab" aria-selected={conqFiltro === id}
                    className={`conq-filtro ${conqFiltro === id ? 'on' : ''}`}
                    onClick={() => setConqFiltro(id)}>{l}</button>
                ))}
              </div>
              <span className="conq-progress"><b>{obtidas}</b>/{PATENTS.length} patentes</span>
            </div>

            <div className="conq-cats">
              {ATOS.map((ato) => {
                const doAto = PATENTS.filter((p) => p.ato === ato);
                const visiveis = doAto.filter(passaFiltro);
                if (visiveis.length === 0) return null;
                const ganhas = doAto.filter((p) => nv >= p.level).length;
                return (
                  <article key={ato} className="conq-cat" style={{ '--cat-cor': RAR_COR[RAR_ATO[ato]] }}>
                    <header className="conq-cat-head">
                      <b>{ato}</b>
                      <span className="conq-cat-rar">{RAR_ATO[ato]}</span>
                      <em>{ganhas}/{doAto.length}</em>
                      <i className="conq-cat-bar"><span style={{ width: `${(ganhas / doAto.length) * 100}%` }} /></i>
                    </header>
                    <div className="conq-grid">
                      {visiveis.map((p) => {
                        const e = estado(p);
                        return (
                          <button key={p.id} className={`conq-tile ${e.obtida ? 'won' : e.secreta ? 'secreta' : ''}`}
                            onClick={() => setConqSel(p)}
                            title={e.obtida ? `${p.name} — nível ${p.level}` : e.secreta ? '??? — conquista secreta' : `??? — nível ${p.level}`}>
                            <span className="conq-tile-arte">
                              {e.obtida ? (
                                <>
                                  <img src={p.icon} alt="" loading="lazy" onError={(ev) => { ev.currentTarget.style.display = 'none'; ev.currentTarget.nextSibling.style.display = 'grid'; }} />
                                  <span className="conq-tile-fallback" style={{ display: 'none' }}>{p.emoji}</span>
                                </>
                              ) : (
                                <span className="conq-tile-lock"><Icon name="cadeado" size={17} /></span>
                              )}
                            </span>
                            <i className="conq-tile-bar"><span style={{ width: `${e.pct}%` }} /></i>
                            <small className="conq-tile-pct">{e.obtida ? '✓ 100%' : e.secreta ? '???' : `${e.pct}%`}</small>
                          </button>
                        );
                      })}
                    </div>
                  </article>
                );
              })}
            </div>

            {/* modal da conquista */}
            {conqSel && (() => {
              const e = estado(conqSel);
              return (
                <div className="pc-overlay" style={{ zIndex: 470 }} onClick={() => setConqSel(null)}>
                  <div className="conq-modal" style={{ '--cat-cor': RAR_COR[e.rar] }} onClick={(ev) => ev.stopPropagation()}>
                    <button className="av-close" onClick={() => setConqSel(null)} aria-label="Fechar"><Icon name="fechar" size={16} /></button>
                    <span className="conq-modal-arte">
                      {e.obtida
                        ? <img src={conqSel.icon} alt="" onError={(ev) => { ev.currentTarget.style.display = 'none'; }} />
                        : <span className="conq-tile-lock"><Icon name="cadeado" size={30} /></span>}
                    </span>
                    <span className="conq-modal-rar">{e.rar}</span>
                    <h3 className="conq-modal-nome">{e.obtida || !e.secreta ? conqSel.name : '???'}</h3>
                    <p className="conq-modal-desc">
                      {e.secreta && !e.obtida
                        ? 'Conquista secreta — continue evoluindo para revelar seu segredo.'
                        : conqSel.desc}
                    </p>
                    <div className="conq-modal-prog">
                      <i className="conq-tile-bar"><span style={{ width: `${e.pct}%` }} /></i>
                      <small>{e.obtida ? '✓ Obtida' : `${e.pct}% · Nível ${nv}/${conqSel.level}`}</small>
                    </div>
                    <div className="conq-modal-meta">
                      <span><small>REQUISITO</small><b>Nível {conqSel.level}</b></span>
                      <span><small>ATO</small><b>{conqSel.ato}</b></span>
                      <span><small>RECOMPENSA</small><b>Título «{e.obtida || !e.secreta ? conqSel.name : '???'}»</b></span>
                    </div>
                  </div>
                </div>
              );
            })()}
          </section>
        );
      })()}

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

        {/* estilo de luta — carrossel (mockups oficiais) */}
        <section className="dash-card estilo-showcase">
          <h2 className="h2-linha"><Icon name="combo" size={15} weight="forte" className="h2-ico" /> SEU ESTILO DE LUTA
            <span className="est-nav">
              <button type="button" className="est-arrow" aria-label="Anterior" onClick={() => estScroll(-1)}>‹</button>
              <button type="button" className="est-arrow" aria-label="Próximo" onClick={() => estScroll(1)}>›</button>
            </span>
          </h2>
          <div className="estilo-linha2">
          {/* UPDATE 3.0 — painel lateral: o jogador entende o estilo na hora */}
          {(() => {
            const atual = profile.style || 'ronin';
            const st = STYLES[atual];
            const info = STYLE_INFO[atual] || {};
            const { passiva } = splitDesc(st.desc);
            const cor = STYLE_COR[atual];
            return (
              <aside key={atual} className="estilo-info" style={{ '--est-cor': cor }}>
                <small className="ei-rotulo">ESTILO ATUAL</small>
                <b className="ei-nome"><StyleIcon styleKey={atual} size={18} /> {st.label.toUpperCase()}</b>
                <dl className="ei-ficha">
                  <div><dt>Especialidade</dt><dd>{info.espec}</dd></div>
                  <div><dt>Passiva</dt><dd>{passiva || '—'}</dd></div>
                  <div><dt>Habilidade</dt><dd>{st.skill}</dd></div>
                  <div><dt>Classe</dt><dd>{info.classe}</dd></div>
                </dl>
              </aside>
            );
          })()}
          <div className="estilo-grid" ref={estRef}>
            {/* UPDATE 2.8 — o estilo equipado SEMPRE ocupa a primeira posição */}
            {(() => {
              const atual = profile.style || 'ronin';
              return [atual, ...STYLE_KEYS.filter((k) => k !== atual)];
            })().map((k) => {
              const st = STYLES[k];
              const on = (profile.style || 'ronin') === k;
              const owned = k === 'ronin' || (profile.owned_styles || []).includes(`estilo_${k}`);
              const art = k === 'berserker' ? 'carrasco' : k;
              return (
                <button
                  key={k}
                  className={`estilo-card ${on ? 'on' : ''} ${owned ? '' : 'locked'} ${equipando === k ? 'equipando' : ''}`}
                  aria-label={`Estilo ${st.label}${on ? ' — equipado' : ''}${owned ? '' : ' — bloqueado'}`}
                  onClick={async () => {
                    unlockAudio();
                    if (!owned) { nav('/loja?slot=style'); return; }
                    if (on || equipando) return;
                    // UPDATE 2.9: primeiro a animação de equipar NO card clicado…
                    setEquipando(k);
                    sfx.click();
                    try {
                      const [d] = await Promise.all([
                        api('/api/auth/me', { method: 'PATCH', body: { style: k } }),
                        new Promise((r) => setTimeout(r, 480)), // deixa a animação respirar
                      ]);
                      // …e SÓ ENTÃO ele sobe para a 1ª posição (o useEffect
                      // acima zera o scroll no mesmo frame da reordenação)
                      onUpdate(d.profile);
                      sfx.drop();
                    } catch { /* mantém o atual */ }
                    setEquipando(null);
                  }}
                >
                  <img className="estilo-art" src={`/arte/estilo-${art}.webp`} alt={st.label} loading="lazy" />
                  {on && <span className="estilo-sel">✓ EQUIPADO</span>}
                  {!owned && <span className="estilo-lock"><Icon name="cadeado" size={16} /> DESBLOQUEIE NA LOJA</span>}
                </button>
              );
            })}
          </div>
          </div>
          <p className="dash-empty" style={{ marginTop: 8 }}>Arraste ou use as setas para ver todos. Clique num estilo para equipá-lo (skill no <b>E</b> / botão redondo no celular).</p>
        </section>

        </div>
        <div className="dash-col">
        {/* rank atual */}
        <section className="dash-card">
          <h2><Icon name="liga" size={15} weight="forte" className="h2-ico" /> RANK ATUAL</h2>
          <RankBadge tier={profile.tier} points={profile.rank_points} onClick={() => nav('/rankings')} />
          <button className="btn-link" style={{ marginTop: 12 }} onClick={() => nav('/rankings')}>ver ranking →</button>
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
                    <img className="dm-avatar" src={avatarSrc(m.opponent_avatar)} alt="" />
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
