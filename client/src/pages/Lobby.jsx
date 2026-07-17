import { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getSocket } from '../lib/socket.js';
import { createPlaza } from '../game/praca.js';
import PlayerCard from '../lib/PlayerCard.jsx';
import KeysHud from '../lib/KeysHud.jsx';
import Navbar from '../lib/Navbar.jsx';
import { api } from '../lib/api.js';
import ItemIcon from '../lib/ItemIcon.jsx';
import Icon from '../ds/Icon.jsx';
import { rankArte, rankCor, rankNome } from '../ds/rank.js';
import { playEvent, unlockAudio, toggleMute, isMuted, sfx } from '../game/audio.js';
import { STYLES } from '../game/sim.js';
import { avatarSrc } from '../ds/avatars.js';
import StyleBadge from '../lib/StyleBadge.jsx';
import DiffIcon, { DIFF_META, DIFF_KEYS } from '../lib/DiffIcon.jsx';
import BotPortrait from '../lib/BotPortrait.jsx';
import { SkillButton } from './Battle.jsx';
import { createInput } from '../game/input.js';
import { createRenderer } from '../game/renderer.js';
import { TouchControls } from './Battle.jsx';
import '../battle.css';


const goFullscreen = () => {
  document.documentElement.requestFullscreen?.().catch(() => {});
  try { screen.orientation?.lock?.('landscape').catch(() => {}); } catch { /* iOS */ }
};

const TIER_LABEL = (t) => (t || 'BRONZE_III').replace('_', ' ');

export default function Lobby({ profile, onProfile }) {
  const nav = useNavigate();
  const [players, setPlayers] = useState([]);
  const [inQueue, setInQueue] = useState(false);
  const [incoming, setIncoming] = useState(null); // {id, from, expiresAt, bet}
  const [clanPop, setClanPop] = useState(null); // {mode:'invite'|'joined'|'entered', ...}
  const [betFor, setBetFor] = useState(null); // jogador alvo do modal de desafio/aposta
  const [duo, setDuo] = useState(null); // { leader, partner } quando a dupla está formada
  const [duoIn, setDuoIn] = useState(null); // convite de dupla recebido {from}
  const [duoChIn, setDuoChIn] = useState(null); // desafio duo recebido {from}
  const [duoBusca, setDuoBusca] = useState(false);
  const [sent, setSent] = useState(null);
  const [session, setSession] = useState(null); // {side, players}
  const [chat, setChat] = useState([]);
  const [chatText, setChatText] = useState('');
  const [card, setCard] = useState(null);
  const plazaHost = useRef(null);
  const plazaRef = useRef(null);
  const playersRef = useRef([]);
  const [missions, setMissions] = useState([]);
  const [myLoadout, setMyLoadout] = useState([]);
  const [notice, setNotice] = useState('');
  const [botDiff, setBotDiff] = useState(null); // UPDATE 2.8: dificuldade só seleciona

  useEffect(() => {
    const socket = getSocket();


    const onPresence = ({ players }) => {
      setPlayers(players);
      playersRef.current = players;
      plazaRef.current?.setPlayers(players);
    };
    const onQueue = ({ inQueue }) => setInQueue(inQueue);
    const onChallenge = ({ id, from, ttl, bet }) =>
      setIncoming({ id, from, bet, expiresAt: Date.now() + ttl });
    const onCancel = ({ reason }) => {
      setIncoming(null);
      setSent(null);
      setNotice(reason === 'recusado' ? 'Desafio recusado.' : 'O desafio expirou.');
      setTimeout(() => setNotice(''), 3000);
    };
    const onSent = ({ to }) => setSent(to);
    const onStart = ({ side, players, rejoin, arena }) => {
      setIncoming(null);
      setSent(null);
      setInQueue(false);
      setSession({ side, players, rejoin, arena });
      document.documentElement.requestFullscreen?.().catch(() => {});
    };

    socket.on('presence', onPresence);
    socket.on('queue:status', onQueue);
    socket.on('challenge:received', onChallenge);
    socket.on('challenge:cancel', onCancel);
    socket.on('challenge:sent', onSent);
    socket.on('match:start', onStart);
    const onDuoInvited = ({ from }) => setDuoIn({ from });
    const onDuoFormed = (d) => { setDuo(d); setDuoIn(null); setDuoBusca(false); };
    const onDuoBroken = ({ reason }) => { setDuo(null); setDuoBusca(false); setChat((c) => [...c.slice(-49), { name: 'STIKDEAD', system: true, text: `Dupla desfeita: ${reason}.`, ts: Date.now() }]); };
    const onDuoSearching = () => setDuoBusca(true);
    const onDuoChallenged = ({ from }) => setDuoChIn({ from });
    const onDuoResult = ({ texto }) => setChat((c) => [...c.slice(-49), { name: 'STIKDEAD', system: true, text: texto, ts: Date.now() }]);
    const onClanInvited = (p) => setClanPop({ mode: 'invite', ...p, expiresAt: Date.now() + 30000 });
    const onClanJoinedBy = (p) => setClanPop({ mode: 'joined', ...p, expiresAt: Date.now() + 6000 });
    socket.on('clan:invited', onClanInvited);
    socket.on('clan:joined-by', onClanJoinedBy);
    socket.on('duo:invited', onDuoInvited);
    socket.on('duo:formed', onDuoFormed);
    socket.on('duo:broken', onDuoBroken);
    socket.on('duo:searching', onDuoSearching);
    socket.on('duo:challenged', onDuoChallenged);
    socket.on('duo:result', onDuoResult);
    const onChatHistory = ({ messages }) => setChat(messages);
    const onChatMsg = (msg) => {
      setChat((c) => [...c.slice(-49), msg]);
      plazaRef.current?.say?.(msg.name, msg.text);
    };
    socket.on('chat:history', onChatHistory);
    socket.on('chat:msg', onChatMsg);
    socket.emit('presence:get');
    const onReconnect = () => socket.emit('presence:get');
    socket.on('connect', onReconnect);

    return () => {
      socket.off('presence', onPresence);
      socket.off('queue:status', onQueue);
      socket.off('challenge:received', onChallenge);
      socket.off('challenge:cancel', onCancel);
      socket.off('challenge:sent', onSent);
      socket.off('match:start', onStart);
      socket.off('clan:invited', onClanInvited);
      socket.off('clan:joined-by', onClanJoinedBy);
      socket.off('duo:invited', onDuoInvited);
      socket.off('duo:formed', onDuoFormed);
      socket.off('duo:broken', onDuoBroken);
      socket.off('duo:searching', onDuoSearching);
      socket.off('duo:challenged', onDuoChallenged);
      socket.off('duo:result', onDuoResult);
      socket.off('chat:history', onChatHistory);
      socket.off('chat:msg', onChatMsg);
      socket.off('connect', onReconnect);
    };
  }, []);

  // countdown do convite recebido
  const [, forceTick] = useState(0);
  useEffect(() => {
    if (!clanPop) return;
    const t = setInterval(() => { if (Date.now() >= clanPop.expiresAt) setClanPop(null); }, 500);
    return () => clearInterval(t);
  }, [clanPop]);
  useEffect(() => {
    if (!incoming) return;
    const iv = setInterval(() => {
      if (Date.now() >= incoming.expiresAt) setIncoming(null);
      else forceTick((n) => n + 1);
    }, 250);
    return () => clearInterval(iv);
  }, [incoming]);

  useEffect(() => {
    if (session) return;
    api('/api/missions').then((d) => setMissions(d.missions)).catch(() => {});
    api('/api/inventory').then((d) => setMyLoadout(d.loadout)).catch(() => {});
  }, [session]);

  useEffect(() => {
    if (session || !plazaHost.current) return;
    let alive = true;
    createPlaza(plazaHost.current, { onNameClick: (n) => setCard(n) }).then((p) => {
      if (!alive) return p.destroy();
      plazaRef.current = p;
      p.setProtagonist({ name: profile.fighter_name, loadout: myLoadoutRef.current });
      p.setPlayers(playersRef.current);
    });
    return () => {
      alive = false;
      plazaRef.current?.destroy();
      plazaRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session]);

  // o protagonista veste os itens reais assim que o inventário chega (e a cada troca)
  const myLoadoutRef = useRef([]);
  useEffect(() => {
    myLoadoutRef.current = myLoadout || [];
    plazaRef.current?.setProtagonist({ name: profile.fighter_name, loadout: myLoadoutRef.current });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [myLoadout]);

  if (session)
    return (
      <OnlineFight
        profile={profile}
        session={session}
        onProfile={onProfile}
        onDone={() => {
          if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
          setSession(null);
        }}
      />
    );

  const others = players.filter((p) => p.name !== profile.fighter_name);
  const socket = getSocket();

  return (
    <><Navbar profile={profile} />
    <div className="lobby2" onPointerDown={unlockAudio}>
      {notice && <div className="shop-notice err" role="status" style={{ margin: '10px auto 0', maxWidth: 700 }}>{notice}</div>}

      <div className="lobby-grid">
        {/* ===== coluna esquerda: jogadores + chat ===== */}
        <aside className="lobby-col">
          <section className="dash-card player-cartao">
            <span className="avatar-vivo">
              <img key={profile.avatar} className="pc-avatar" src={avatarSrc(profile.avatar)} alt="" />
            </span>
            <div className="pc-meio">
              <b className="pc-nome">{profile.fighter_name}</b>
              <span className="pc-nivel">NÍVEL<b>{profile.level}</b></span>
              <div className="mission-bar pc-xp"><div className="mission-fill" style={{ width: `${Math.min(100, Math.round((profile.xp / (profile.level * 500)) * 100))}%` }} /></div>
              <span className="pc-rank" style={{ color: rankCor(profile.tier) }}>
                {rankNome(profile.tier)} · <Icon name="trofeu" size={12} weight="forte" /> {Number(profile.rank_points || 0).toLocaleString('pt-BR')}
              </span>
              <StyleBadge styleKey={profile.style || 'ronin'} />
            </div>
            <img className="pc-emblema rank-img" src={rankArte(profile.tier)} alt="" />
          </section>

          <section className="dash-card">
            <h2><Icon name="grupo" size="xs" weight="forte" className="h2-ico" /> JOGADORES ONLINE ({players.length})</h2>
            <ul className="lobby-list">
              {others.length === 0 && (
                <p className="dash-empty">Ninguém mais online agora. Chame os amigos!</p>
              )}
              {others.map((p) => (
                <li key={p.id} className={p.away ? 'is-away' : ''}>
                  <span
                    className={`lobby-dot ${p.away ? 'st-away' : p.inMatch ? 'st-busy' : 'st-free'}`}
                    title={p.away ? 'Ausente' : p.inMatch ? 'Em jogo' : 'Online e disponível'}
                  />
                  <img className="lp-avatar" src={avatarSrc(p.avatar)} alt="" />
                  <img className="rank-mini rank-img" src={rankArte(p.tier)} alt="" title={rankNome(p.tier)} />
                  <button className="lobby-name fr-name" onClick={() => setCard(p.name)}>{p.name}</button>
                  <span className="lobby-meta">Nv {p.level} · {TIER_LABEL(p.tier)}{p.duo ? <b style={{ color: '#ffd76a' }}> · 🤝{p.duoWith ? ` c/ ${p.duoWith}` : ''}</b> : ''}</span>
                  {p.away ? (
                    <span className="lobby-busy st-away-tag">💤 AUSENTE</span>
                  ) : p.inMatch ? (
                    <span className="lobby-busy">🟡 EM LUTA</span>
                  ) : p.duo && duo ? (
                    <span className="lobby-busy" title="Desafie pela lista de duplas abaixo">🤝</span>
                  ) : !duo ? (
                    <span style={{ display: 'flex', gap: 6 }}>
                      <button className="lobby-challenge" disabled={!!sent} onClick={() => setBetFor(p)}>DESAFIAR</button>
                      <button className="lobby-challenge lc-duo" title="Convidar para ser sua dupla (amigos)" onClick={() => getSocket().emit('duo:invite', { to: p.id })}>🤝</button>
                    </span>
                  ) : (
                    <span className="lobby-busy" title="Você está em dupla">🤝 EM DUPLA</span>
                  )}
                </li>
              ))}
            </ul>
            {sent && <p className="dash-empty">Desafio enviado para {sent}. Aguardando…</p>}

            {/* ===== o mural amarelo das DUPLAS ===== */}
            {(() => {
              const porLider = new Map();
              for (const p of players) {
                if (p.duo && p.duoLeaderId) {
                  if (!porLider.has(p.duoLeaderId)) porLider.set(p.duoLeaderId, []);
                  porLider.get(p.duoLeaderId).push(p);
                }
              }
              const duplas = [...porLider.entries()].filter(([, ms]) => ms.length === 2);
              if (duplas.length === 0) return null;
              return (
                <div className="duo-mural">
                  <h3 className="pc-section" style={{ margin: '0 0 6px', color: '#ffd76a' }}>🤝 DUPLAS NA ARENA</h3>
                  {duplas.map(([lid, ms]) => {
                    const minha = duo && ms.some((m) => m.id === profile.id);
                    const lutando = ms.some((m) => m.inMatch);
                    return (
                      <div key={lid} className="duo-mural-linha">
                        <span className="duo-mural-nomes">
                          <b>{ms[0].name}</b> + <b>{ms[1].name}</b>
                          {minha ? <em> · sua dupla</em> : null}
                        </span>
                        {minha ? null : lutando ? (
                          <span className="lobby-busy">🟡 EM BATALHA</span>
                        ) : duo ? (
                          <button className="btn btn-blood duo-btn" onClick={() => getSocket().emit('duo:challenge', { toLeader: lid })}>
                            ⚔️ DESAFIAR DUPLA
                          </button>
                        ) : (
                          <small style={{ color: 'var(--muted)' }}>forme uma dupla para desafiar</small>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })()}
            {duo && (
              <div className="duo-bar">
                🤝 DUPLA: <b>{duo.leader.name}</b> + <b>{duo.partner.name}</b>
                {duo.leader.id === profile.id ? (
                  duoBusca
                    ? <span className="duo-busca">🔎 buscando batalha de clã...</span>
                    : <button className="btn btn-blood duo-btn" onClick={() => getSocket().emit('duo:queue')}>🛡️ Buscar batalha de clã</button>
                ) : <span className="duo-busca">aguardando o líder buscar...</span>}
                <button className="btn btn-ghost duo-btn" onClick={() => getSocket().emit('duo:cancel')}>desfazer</button>
              </div>
            )}
          </section>

          <section className="dash-card" style={{ flex: 1 }}>
            <h2><Icon name="chat" size="xs" weight="forte" className="h2-ico" /> CHAT DO LOBBY</h2>
            <div className="chat-msgs" style={{ maxHeight: 220 }}>
              {chat.map((m, i) => (
                <div key={i} className={`chat-msg ${m.private ? 'pv' : ''} ${m.system ? 'sys' : ''}`}>
                  {m.system ? <em>{m.text}</em> : (
                    <>
                      <strong className="chat-name" onClick={() => setCard(m.name)}>{m.name}</strong>
                      {m.private && <span className="pv-tag">{m.name === profile.fighter_name ? `😮‍💨 ➜ ${m.to}` : '😮‍💨 sussurro'}</span>}
                      : {m.text}
                    </>
                  )}
                </div>
              ))}
              {chat.length === 0 && <div className="chat-msg" style={{ opacity: 0.5 }}>Diga olá para o lobby…</div>}
            </div>
            <form
              className="chat-input"
              onSubmit={(e) => {
                e.preventDefault();
                const t = chatText.trim();
                if (!t) return;
                getSocket().emit('chat:send', { text: t });
                setChatText('');
              }}
            >
              <input
                value={chatText}
                onChange={(e) => setChatText(e.target.value)}
                maxLength={100}
                placeholder="Digite sua mensagem…"
              />
              <button type="submit" aria-label="Enviar"><Icon name="voltar" size="xs" weight="forte" style={{ transform: 'rotate(180deg)' }} /></button>
            </form>
          </section>
        </aside>

        {/* ===== centro: praça + ação principal ===== */}
        <main className="lobby-center">
          <div className="plaza plaza-big" ref={plazaHost} />
          <div className="cta-premio">
            <img src="/arte/bau.png" alt="" />
            <span>SEQUÊNCIA <b>{profile.streak || 0}</b> · o baú abre a cada 3 vitórias online seguidas</span>
            <i className="cp-dots">{[0, 1, 2].map((i) => {
              const s = profile.streak || 0;
              const cheias = s > 0 && s % 3 === 0 ? 3 : s % 3;
              return <em key={i} className={i < cheias ? 'on' : ''} />;
            })}</i>
          </div>
          <button
            className={`lobby-cta ${inQueue ? 'is-busca' : ''}`}
            disabled={!!duo}
            title={duo ? 'Você está em dupla — desfaça-a para lutar sozinho' : undefined}
            onClick={() => { if (duo) return; if (!inQueue) goFullscreen(); socket.emit(inQueue ? 'queue:leave' : 'queue:join'); }}
          >
            <span className="cta-linha">
              <Icon name={inQueue ? 'buscar' : 'espada'} size="sm" weight="forte" />
              {inQueue ? 'PROCURANDO OPONENTE…' : 'BUSCAR PARTIDA'}
            </span>
            <small>{inQueue ? 'pareamento automático · clique para cancelar' : 'partida rápida 1v1'}</small>
          </button>
          <div className="lobby-quick">
            <button disabled={!!duo} title={duo ? 'Em dupla não se treina sozinho — desfaça-a primeiro' : undefined}
              onClick={() => { if (!duo) nav('/treino'); }}><Icon name="soco" size="sm" weight="forte" /> TREINO{duo ? <small>desfaça a dupla</small> : null}</button>
            <button onClick={() => nav('/loja')}><Icon name="loja" size="sm" weight="forte" /> LOJA</button>
            <button onClick={() => nav('/missoes')}><Icon name="missoes" size="sm" weight="forte" /> MISSÕES</button>
            <button className="soon"><Icon name="trofeu" size="sm" weight="forte" /> TORNEIO<small>em breve</small></button>
          </div>
        </main>

        {/* ===== coluna direita: evento + convites + bot + missões ===== */}
        <aside className="lobby-col">
          <section className="dash-card evento-banner" aria-label="Evento">
            <div className="ev-info">
              <small>EVENTO</small>
              <b>TORNEIO SEMANAL</b>
              <span className="ev-breve">EM BREVE</span>
            </div>
            <img className="ev-arte" src="/arte/trofeu-roxo.png" alt="" />
          </section>

          {incoming && (
            <section className="dash-card convite-painel">
              <h2><Icon name="espada" size="xs" weight="forte" className="h2-ico" /> CONVITE DE CONFRONTO</h2>
              <div className="cv-linha">
                <img className="cv-avatar" src={avatarSrc(incoming.from.avatar)} alt="" />
                <div className="cv-info">
                  <b>{incoming.from.name}</b>
                  <span style={{ color: rankCor(incoming.from.tier) }}>{rankNome(incoming.from.tier)} · Nv {incoming.from.level}</span>
                  {incoming.bet && (
                    <em className="cv-bet">valendo {incoming.bet.amount.toLocaleString('pt-BR')} {incoming.bet.kind === 'diamonds' ? '💎' : '🪙'}</em>
                  )}
                </div>
                <span className="cv-timer">{Math.max(0, Math.ceil((incoming.expiresAt - Date.now()) / 1000))}s</span>
              </div>
              <div className="cv-acoes">
                <button className="cv-aceitar" onClick={() => { goFullscreen(); getSocket().emit('challenge:answer', { id: incoming.id, accept: true }); }}>ACEITAR</button>
                <button className="cv-recusar" onClick={() => { getSocket().emit('challenge:answer', { id: incoming.id, accept: false }); setIncoming(null); }}>RECUSAR</button>
              </div>
            </section>
          )}

          <section className="dash-card bot-painel">
            <h2><Icon name="soco" size="xs" weight="forte" className="h2-ico" /> JOGAR COM BOT</h2>
            <div className="bot-topo">
              {/* UPDATE 3.0 — o retrato muda na hora conforme a dificuldade */}
              <BotPortrait key={botDiff || 'facil'} d={botDiff || 'facil'} size={76} />
              <p className="dash-empty">
                {botDiff
                  ? { facil: 'Um iniciante de olhos azuis. Ideal para aquecer.', medio: 'Bandana, katana e alguma malícia. Respeite.', dificil: 'Máscara oni e lâmina em chamas. Cuidado.', insano: 'O BOSS. Aura demoníaca. Boa sorte — vai precisar.' }[botDiff]
                  : 'Treine suas habilidades contra a IA.'}
              </p>
            </div>
            <div className="lobby-bot-row diff-grid">
              {DIFF_KEYS.map((d) => (
                <button
                  key={d}
                  style={{ '--diff-cor': DIFF_META[d].cor }}
                  className={`diff-btn ${d === 'insano' ? 'insano' : ''} ${botDiff === d ? 'sel' : ''}`}
                  aria-pressed={botDiff === d}
                  onClick={() => { setBotDiff(d); sfx.click(); }}
                >
                  <DiffIcon d={d} size={14} /> {DIFF_META[d].label}
                </button>
              ))}
            </div>
            {botDiff && (
              <button
                key={botDiff}
                className="bot-iniciar"
                style={{ '--diff-cor': DIFF_META[botDiff].cor }}
                onClick={() => { sfx.dash(); goFullscreen(); nav(`/treino?d=${botDiff}&go=1`); }}
              >
                <Icon name="espada" size="sm" weight="forte" /> INICIAR PARTIDA
                <small>{DIFF_META[botDiff].label}</small>
              </button>
            )}
          </section>

          <section className="dash-card">
            <h2><Icon name="missoes" size="xs" weight="forte" className="h2-ico" /> MISSÕES DIÁRIAS</h2>
            {missions.slice(0, 3).map((m) => (
              <div key={m.id} className="lobby-mission">
                <span>{m.label}</span>
                <div className="mission-bar"><div className="mission-fill" style={{ width: `${Math.min(100, (m.progress / m.goal) * 100)}%` }} /></div>
                <small className="lm-meta">{Math.min(m.progress, m.goal)}/{m.goal} · <Icon name="moeda" size={12} weight="forte" /> {m.coins}</small>
              </div>
            ))}
            <button className="btn btn-ghost" style={{ marginTop: 10 }} onClick={() => nav('/missoes')}>
              VER TODAS
            </button>
          </section>
        </aside>
      </div>

      {/* ===== barra da build atual ===== */}
      <section className="lobby-build">
        <h2><Icon name="armadura" size="xs" weight="forte" className="h2-ico" /> SUA BUILD ATUAL</h2>
        <div className="lobby-build-row">
          {myLoadout.length === 0 && <p className="dash-empty">Nada equipado — visite a loja!</p>}
          {myLoadout.map((it) => (
            <button key={it.slot} className={`item-card mini r-${it.rarity}`} onClick={() => nav('/inventario')}>
              <ItemIcon item={it} size={38} />
              <span className="item-name">{it.name}</span>
            </button>
          ))}
        </div>
      </section>

      {betFor && (
        <div className="pc-overlay" style={{ zIndex: 460 }} onClick={() => setBetFor(null)}>
          <div className="fa-card" style={{ maxWidth: 380 }} onClick={(e) => e.stopPropagation()}>
            <h2 className="fa-title">⚔️ Desafiar <span className="fa-name">{betFor.name}</span></h2>
            <BetPicker
              profile={profile}
              onNormal={() => {
                goFullscreen();
                getSocket().emit('challenge:send', { to: betFor.id });
                setBetFor(null);
              }}
              onBet={(kind, amount) => {
                goFullscreen();
                getSocket().emit('challenge:send', { to: betFor.id, bet: { kind, amount } });
                setBetFor(null);
              }}
              onClose={() => setBetFor(null)}
            />
          </div>
        </div>
      )}
      {duoIn && (
        <div className="bt-overlay">
          <div className="bt-panel">
            <h2>🤝 DUPLA!</h2>
            <p style={{ margin: '0 0 14px', fontSize: 19 }}><b style={{ color: '#ffd76a' }}>{duoIn.from.name}</b> te chamou para ser a dupla dele nas batalhas de clã.</p>
            <button className="btn btn-blood" onClick={() => { getSocket().emit('duo:answer', { from: duoIn.from.id, accept: true }); setDuoIn(null); }}>Aceitar</button>
            <button className="btn btn-ghost" onClick={() => { getSocket().emit('duo:answer', { from: duoIn.from.id, accept: false }); setDuoIn(null); }}>Recusar</button>
          </div>
        </div>
      )}
      {duoChIn && (
        <div className="bt-overlay">
          <div className="bt-panel">
            <h2>⚔️ BATALHA DE CLÃ!</h2>
            <p style={{ margin: '0 0 14px', fontSize: 19 }}>A dupla de <b style={{ color: '#d90429' }}>{duoChIn.from.name}</b> desafiou a sua! 2 contra 2, sem apostas.</p>
            <button className="btn btn-blood" onClick={() => { goFullscreen(); getSocket().emit('duo:challenge:answer', { from: duoChIn.from.id, accept: true }); setDuoChIn(null); }}>Aceitar</button>
            <button className="btn btn-ghost" onClick={() => { getSocket().emit('duo:challenge:answer', { from: duoChIn.from.id, accept: false }); setDuoChIn(null); }}>Recusar</button>
          </div>
        </div>
      )}
      {clanPop && (
        <div className="bt-overlay">
          <div className="bt-panel" style={{ borderColor: clanPop.clan?.color || '#e0a10b' }}>
            {clanPop.mode === 'invite' && (
              <>
                <h2 style={{ color: '#9fd8ff' }}>CONVITE DE CLÃ</h2>
                <p style={{ margin: '0 0 6px', fontSize: 20 }}>
                  <b style={{ color: '#ffd76a' }}>{clanPop.from}</b> te chamou para o clã{' '}
                  <b style={{ color: clanPop.clan?.color || '#9fd8ff' }}>{clanPop.clan?.name}</b>
                </p>
                <p style={{ margin: '0 0 10px', color: '#9a938a' }}>
                  {Math.max(0, Math.ceil((clanPop.expiresAt - Date.now()) / 1000))}s para decidir
                </p>
                <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
                  <button className="btn btn-blood" onClick={async () => {
                    try {
                      const r = await api('/api/clans/respond', { method: 'POST', body: { inviteId: clanPop.inviteId, accept: true } });
                      if (r.joined) {
                        getSocket().emit('clan:refresh');
                        setClanPop({ mode: 'entered', clan: clanPop.clan, expiresAt: Date.now() + 6000 });
                      } else setClanPop(null);
                    } catch (e) { setClanPop(null); alert(e.message || 'Não rolou.'); }
                  }}>⚔️ ENTRAR NO CLÃ</button>
                  <button className="btn btn-ghost" onClick={async () => {
                    try { await api('/api/clans/respond', { method: 'POST', body: { inviteId: clanPop.inviteId, accept: false } }); } catch { /* já era */ }
                    setClanPop(null);
                  }}>Recusar</button>
                </div>
              </>
            )}
            {clanPop.mode === 'entered' && (
              <>
                <h2 style={{ color: '#7de0a8' }}>🏳️ VOCÊ ENTROU NO CLÃ!</h2>
                <p style={{ fontSize: 20 }}>Bem-vindo ao <b style={{ color: clanPop.clan?.color || '#9fd8ff' }}>{clanPop.clan?.name}</b> — o quartel te espera no Social.</p>
              </>
            )}
            {clanPop.mode === 'joined' && (
              <>
                <h2 style={{ color: '#7de0a8' }}>🎉 RECRUTA A BORDO!</h2>
                <p style={{ fontSize: 20 }}><b style={{ color: '#ffd76a' }}>{clanPop.who}</b> entrou no clã <b>{clanPop.clan}</b>!</p>
              </>
            )}
          </div>
        </div>
      )}
      {card && <PlayerCard name={card} onClose={() => setCard(null)} onWhisper={(n) => setChatText(`/${n} 😮‍💨 `)} />}
    </div></>
  );
}

// ===================== BATALHA ONLINE =====================

function OnlineFight({ profile, session, onProfile, onDone }) {
  const hostRef = useRef(null);
  const hud = {
    hpA: useRef(null), hpB: useRef(null), skillCd: useRef(null),
    hpC: useRef(null), hpD: useRef(null),
    dotsA: useRef(null), dotsB: useRef(null),
    timer: useRef(null), announce: useRef(null),
    combo: useRef(null), center: useRef(null), vs: useRef(null),
    skill: useRef(null),
  };
  const inputRef = useRef(null);
  const [paused, setPaused] = useState(false);
  const [waiting, setWaiting] = useState(false); // oponente caiu
  const [reconnecting, setReconnecting] = useState(false); // eu caí
  const [result, setResult] = useState(null);
  const [mutedUi, setMutedUi] = useState(isMuted());
  const [loading, setLoading] = useState(true);

  const me = session.side;
  useEffect(() => {
    document.body.classList.add('in-fight');
    return () => document.body.classList.remove('in-fight');
  }, []);
  const quatro = session.players.length === 4;
  const teams = session.teams || (quatro ? [0, 0, 1, 1] : [0, 1]);
  const opp = quatro ? (me + 2) % 4 : 1 - me;       // rival espelho
  const aliado = quatro ? (me % 2 === 0 ? me + 1 : me - 1) : -1;
  const rival2 = quatro ? (aliado + 2) % 4 : -1;
  const names = session.players.map((p, i) => p?.name || `P${i + 1}`);

  useEffect(() => {
    let alive = true;
    let renderer = null;
    let raf = 0;
    const socket = getSocket();
    const input = createInput();
    inputRef.current = input;

    // estado de rede: dois últimos snapshots para interpolação
    let prevSnap = null;
    let curSnap = null;
    const sisRef = { current: null };
    let curAt = 0;
    let pendingEv = [];

    const spawns = session.players.length === 4
      ? [[-230, 1], [-130, 1], [130, -1], [230, -1]]
      : [[-170, 1], [170, -1]];
    const clientMatch = {
      phase: 'countdown', phaseT: 0, timer: 99, round: 1,
      wins: [0, 0], suddenDeath: false,
      teams: session.players.length === 4 ? (session.teams || [0, 0, 1, 1]) : null,
      fighters: spawns.map(([sx, sf], i) => ({
        x: sx, y: 0, vy: 0, face: sf, hp: 100, state: 'idle', t: 0, hitstun: 0, combo: 0,
        style: session.players[i]?.style || 'ronin',
      })),
    };

    const onSnapshot = (snap) => {
      prevSnap = curSnap;
      curSnap = snap;
      curAt = performance.now();
      if (snap.sis) sisRef.current = snap.sis;
      if (snap.ev?.length) pendingEv.push(...snap.ev);
    };
    const onEnd = (r) => {
      if (r.profile) onProfile?.((p) => ({ ...p, level: r.profile.level, xp: r.profile.xp, coins: r.profile.coins }));
      setTimeout(() => {
        setResult(r);
        (r.winnerSide === me ? sfx.victory() : sfx.defeat());
        if (r.itemDrop) setTimeout(() => sfx.drop(), 700);
      }, r.wo ? 0 : 1100);
    };
    const onPausedEv = () => setWaiting(true);
    const onResumed = () => setWaiting(false);
    const onDisconnect = () => setReconnecting(true);
    const onReconnect = () => setReconnecting(false);

    socket.on('snapshot', onSnapshot);
    socket.on('match:end', onEnd);
    socket.on('match:paused', onPausedEv);
    socket.on('match:resumed', onResumed);
    socket.on('disconnect', onDisconnect);
    socket.io.on('reconnect', onReconnect);

    let announceT = 0;
    const announce = (text, cls = '') => {
      const el = hud.announce.current;
      if (!el) return;
      el.textContent = text;
      el.className = `bt-announce show ${cls}`;
      announceT = 1.2;
    };
    const centerText = (text) => {
      const el = hud.center.current;
      if (el) {
        el.textContent = text;
        el.classList.toggle('show', !!text);
      }
    };

    let lastSentJson = '';
    let lastHeartbeat = 0;

    const watchdog = setTimeout(() => {
      if (!alive || !hostRef.current) return;
      console.error('[stikdead] vigia: carregamento online excedeu 12s');
      setLoading(false);
      hostRef.current.innerHTML =
        '<div style="color:#f2efe9;padding:40px;text-align:center;font-family:sans-serif">Falha ao preparar a arena.<br/><a href="/lobby" style="color:#ff8fa3">← Voltar ao lobby</a></div>';
    }, 12000);
    (async () => {
      try {
        renderer = await createRenderer(hostRef.current, session.arena || 'dojo');
        renderer.setLoadouts(session.players[0]?.loadout, session.players[1]?.loadout);
        renderer.setNames(names[0], names[1]);
        renderer.setMySide(me);
        if (session.players.length === 4)
          renderer.setSquad(names, session.players.map((p) => p?.loadout || []));
        clearTimeout(watchdog);
        setLoading(false);
        console.log('[stikdead] luta online pronta');
      } catch (err) {
        console.error(err);
        if (hostRef.current)
          hostRef.current.innerHTML =
            '<div style="color:#ff8fa3;font:600 18px Barlow Condensed,sans-serif;padding:80px 24px;text-align:center">' +
            'Erro ao iniciar o jogo: ' + String(err?.message || err) + '</div>';
        return;
      }
      if (!alive) return renderer.destroy();
      let last = performance.now();
      let lastCount = null;
      let lastCombo = 0;

      const loop = (now) => {
        if (!alive) return;
        raf = requestAnimationFrame(loop);
        const dt = Math.min(0.05, (now - last) / 1000);
        last = now;

        // envia input (em mudança ou heartbeat de 100ms)
        const inp = input.get();
        const j = JSON.stringify(inp);
        if (j !== lastSentJson || now - lastHeartbeat > 100) {
          socket.emit('input', { i: inp });
          lastSentJson = j;
          lastHeartbeat = now;
        }

        // aplica snapshot com interpolação de posição
        if (curSnap) {
          clientMatch.phase = curSnap.phase;
          clientMatch.phaseT = curSnap.phaseT + (now - curAt) / 1000;
          clientMatch.timer = curSnap.timer;
          clientMatch.round = curSnap.round;
          clientMatch.wins = curSnap.wins;
          clientMatch.suddenDeath = curSnap.suddenDeath;
          const alpha = Math.min(1, (now - curAt) / 33.4);
          curSnap.f.forEach((cf, i) => {
            const pf = prevSnap?.f[i] || cf;
            const f = clientMatch.fighters[i];
            f.x = pf.x + (cf.x - pf.x) * alpha;
            f.y = Math.max(0, pf.y + (cf.y - pf.y) * alpha);
            f.face = cf.face;
            f.hp = cf.hp;
            f.state = cf.state;
            f.t = cf.t + (now - curAt) / 1000;
            f.vy = cf.vy;
            f.hitstun = cf.hitstun;
            f.combo = cf.combo;
            if (cf.skillCd !== undefined) f.skillCd = cf.skillCd;
            if (cf.fury !== undefined) f.fury = cf.fury;
            if (cf.style) f.style = cf.style;
          });
        }

        const events = pendingEv;
        pendingEv = [];
        for (const e of events) {
          if (e.type !== 'matchend') playEvent(e, me);
          if (e.type === 'fightstart') { centerText('LUTE!'); setTimeout(() => centerText(''), 650); }
          if (e.type === 'roundstart') { centerText(`ROUND ${e.round}`); setTimeout(() => centerText(''), 900); }
          if (e.type === 'firstblood') announce('PRIMEIRO SANGUE!');
          if (e.type === 'skill') announce(e.name.toUpperCase(), e.idx === me ? '' : 'red');
          if (e.type === 'suddendeath') announce('MORTE SÚBITA!', 'red');
          if (e.type === 'ko') announce(e.finisher ? 'FINALIZAÇÃO!' : 'K.O.!', 'red');
          if (e.type === 'roundend' && e.winner >= 0)
            setTimeout(() => announce(e.winner === me ? 'ROUND SEU!' : 'ROUND DO OPONENTE!'), 700);
        }

        // HUD (sempre com o jogador local à esquerda)
        const fa = clientMatch.fighters[me];
        const fb = clientMatch.fighters[opp];
        if (hud.hpA.current) hud.hpA.current.style.width = `${fa.hp}%`;
        if (hud.skillCd.current) {
          const total = STYLES[fa.style]?.cd || 10;
          const frac = Math.max(0, Math.min(1, 1 - fa.skillCd / total));
          hud.skillCd.current.style.width = `${frac * 100}%`;
          hud.skillCd.current.dataset.ready = fa.skillCd <= 0 ? '1' : '0';
        }
        if (hud.hpB.current) hud.hpB.current.style.width = `${fb.hp}%`;
        if (hud.timer.current)
          hud.timer.current.textContent = clientMatch.suddenDeath ? '!!' : String(Math.ceil(clientMatch.timer)).padStart(2, '0');
        if (hud.dotsA.current) hud.dotsA.current.dataset.wins = clientMatch.wins[teams[me]];
        if (hud.dotsB.current) hud.dotsB.current.dataset.wins = clientMatch.wins[teams[opp]];

        const combo = fa.combo >= 3 ? fa.combo : 0;
        if (hud.combo.current) {
          hud.combo.current.classList.toggle('show', combo > 0);
          if (combo > 0 && combo !== lastCombo) {
            // reescreve SÓ quando muda: o <b> novo dispara o pop do CSS
            hud.combo.current.innerHTML = `<b>${combo}</b> HITS${combo >= 8 ? '<i>COMBO INSANO!</i>' : ''}`;
            hud.combo.current.dataset.tier = combo >= 8 ? '3' : combo >= 5 ? '2' : '1';
          }
          lastCombo = combo;
        }

        if (hud.vs.current)
          hud.vs.current.classList.toggle(
            'show',
            clientMatch.phase === 'countdown' && clientMatch.round === 1 && clientMatch.phaseT < 2.2
          );

        if (clientMatch.phase === 'countdown') {
          const n = Math.ceil(3.4 - clientMatch.phaseT - 0.3);
          if (n >= 1 && n <= 3 && n !== lastCount) { centerText(String(n)); lastCount = n; }
        } else lastCount = null;

        if (announceT > 0) {
          announceT -= dt;
          if (announceT <= 0 && hud.announce.current) hud.announce.current.className = 'bt-announce';
        }

        renderer.frame(clientMatch, events, dt);
        // mini-barras do 2v2: aliado à esquerda, segundo rival à direita
        if (aliado >= 0) {
          if (hud.hpC.current) hud.hpC.current.style.width = `${clientMatch.fighters[aliado]?.hp ?? 0}%`;
          if (hud.hpD.current) hud.hpD.current.style.width = `${clientMatch.fighters[rival2]?.hp ?? 0}%`;
        }
        if (hud.skill?.current && curSnap?.f?.[me]) {
          const cd = curSnap.f[me].skillCd || 0;
          const max = (STYLES[curSnap.f[me].style] || STYLES.ronin).cd;
          hud.skill.current.style.setProperty('--cd', `${Math.min(1, 1 - cd / max) * 100}%`);
          hud.skill.current.dataset.ready = cd <= 0 ? '1' : '';
          hud.skill.current.querySelector('.bt-skill-cd').textContent = cd > 0 ? Math.ceil(cd) : '';
        }
      };
      raf = requestAnimationFrame(loop);
    })();

    const onKey = (e) => {
      if (e.code === 'Escape') setPaused((p) => !p);
    };
    window.addEventListener('keydown', onKey);

    return () => {
      alive = false;
      cancelAnimationFrame(raf);
      window.removeEventListener('keydown', onKey);
      socket.off('snapshot', onSnapshot);
      socket.off('match:end', onEnd);
      socket.off('match:paused', onPausedEv);
      socket.off('match:resumed', onResumed);
      socket.off('disconnect', onDisconnect);
      socket.io.off('reconnect', onReconnect);
      input.destroy();
      renderer?.destroy();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const rankLine = result?.rank
    ? `${result.rank.delta > 0 ? '+' : ''}${result.rank.delta} pts · ${TIER_LABEL(result.rank.tier)} (${result.rank.points})`
    : null;

  return (
    <div className="bt-root">
      <div className="bt-canvas" ref={hostRef} />
      {loading && (
        <div className="bt-loading">
          <img className="bt-loading-logo" src="/logo.webp" alt="STIKDEAD" />
          <div className="ink-spinner" />
          <div className="bt-loading-title">PREPARANDO A ARENA…</div>
          <div className="bt-loading-tip">Dica: {['Segure BLOQUEAR no momento do golpe para aparar', 'O dash tem invencibilidade nos primeiros instantes', 'Chutes quebram bloqueios baixos de energia', 'Vença 3 seguidas no online e ganhe um item', 'Complete as 3 missões do dia para abrir o baú'][Math.floor(Math.random() * 5)]}</div>
        </div>
      )}

      <button
        className="bt-mute"
        onClick={() => setMutedUi(toggleMute())}
        aria-label="Som"
      >{mutedUi ? '🔇' : '🔊'}</button>
      <div className={`bt-hud${quatro ? ' bt-hud-duo' : ''}`}>
        <div className="bt-plate left">
          {quatro ? (
            <div className="bt-team">
              <div className="bt-row">
                <span className="bt-row-name">{names[me]}</span>
                <div className="bt-bar"><div className="bt-fill" ref={hud.hpA} /></div>
              </div>
              <div className="bt-row">
                <span className="bt-row-name" style={{ color: '#ffd76a' }}>🤝 {names[aliado]}</span>
                <div className="bt-bar"><div className="bt-fill sisfill" ref={hud.hpC} /></div>
              </div>
              <div className="bt-dots" ref={hud.dotsA} data-wins="0"><i /><i /></div>
            </div>
          ) : (
            <div className="bt-linha">
              <div className="bt-retrato eu">
                <img src={avatarSrc(session.players[me]?.avatar ?? profile.avatar)} alt="" />
                <b className="bt-nivel">{session.players[me]?.level ?? profile.level}</b>
              </div>
              <div className="bt-plate-info">
                <div className="bt-name">{names[me]}</div>
                <div className="bt-sub"><img className="bt-emblema rank-img" src={rankArte(session.players[me]?.tier || profile.tier)} alt="" /> {rankNome(session.players[me]?.tier || profile.tier)}</div>
                <div className="bt-bar"><div className="bt-fill" ref={hud.hpA} /></div>
                <div className="bt-dots" ref={hud.dotsA} data-wins="0"><i /><i /></div>
              </div>
            </div>
          )}
        </div>
        <div className="bt-meio">
          <div className="bt-modo">{quatro ? '2V2 · CLÃ' : 'RANKED 1V1'}</div>
          <div className="bt-timer" ref={hud.timer}>99</div>
        </div>
        <div className="bt-plate right">
          {quatro ? (
            <div className="bt-team">
              <div className="bt-row">
                <div className="bt-bar"><div className="bt-fill" ref={hud.hpB} /></div>
                <span className="bt-row-name">{names[opp]}</span>
              </div>
              <div className="bt-row">
                <div className="bt-bar"><div className="bt-fill sisfill dark" ref={hud.hpD} /></div>
                <span className="bt-row-name" style={{ color: '#8fb8d9' }}>{names[rival2]}</span>
              </div>
              <div className="bt-dots" ref={hud.dotsB} data-wins="0"><i /><i /></div>
            </div>
          ) : (
            <div className="bt-linha inv">
              <div className="bt-plate-info">
                <div className="bt-name">{names[opp]}</div>
                <div className="bt-sub"><img className="bt-emblema rank-img" src={rankArte(session.players[opp]?.tier)} alt="" /> {rankNome(session.players[opp]?.tier)}</div>
                <div className="bt-bar"><div className="bt-fill" ref={hud.hpB} /></div>
                <div className="bt-dots" ref={hud.dotsB} data-wins="0"><i /><i /></div>
              </div>
              <div className="bt-retrato ele">
                <img src={avatarSrc(session.players[opp]?.avatar)} alt="" />
                <b className="bt-nivel">{session.players[opp]?.level ?? '?'}</b>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="bt-vs" ref={hud.vs}>
        <div className="bt-vs-name left">{names[me]}</div>
        <div className="bt-vs-mark">VS</div>
        <div className="bt-vs-name right">{names[opp]}</div>
      </div>

      <div className="bt-combo" ref={hud.combo} />
      <div className="bt-announce" ref={hud.announce} />
      <div className="bt-center" ref={hud.center} />

      <button className="bt-pausebtn" onClick={() => setPaused(true)} aria-label="Menu">II</button>

      <KeysHud ref={hud.skillCd} skillName={STYLES[session.players?.[me]?.style]?.skill} />
      <SkillButton inputRef={inputRef} hudRef={hud} style={session.players?.[me]?.style || 'ronin'} />
      <TouchControls inputRef={inputRef} />

      <div className="bt-rotate">
        <div className="bt-rotate-icon" aria-hidden="true" />
        <div>GIRE O CELULAR PARA LUTAR</div>
      </div>

      {waiting && !result && (
        <div className="bt-overlay">
          <div className="bt-panel">
            <h2>OPONENTE CAIU</h2>
            <p style={{ color: '#9a938a', marginTop: 0 }}>
              Aguardando reconexão... se não voltar em 15s, você vence por W.O.
            </p>
          </div>
        </div>
      )}

      {reconnecting && !result && (
        <div className="bt-overlay">
          <div className="bt-panel">
            <h2 style={{ color: '#d90429' }}>RECONECTANDO...</h2>
            <p style={{ color: '#9a938a', marginTop: 0 }}>Sua conexão caiu. Tentando voltar à luta.</p>
          </div>
        </div>
      )}

      {paused && !result && !waiting && !reconnecting && (
        <div className="bt-overlay">
          <div className="bt-panel">
            <h2>MENU</h2>
            <p style={{ color: '#9a938a', marginTop: 0 }}>A luta continua ao fundo — o oponente não espera.</p>
            <button className="btn btn-blood" onClick={() => setPaused(false)}>Voltar à luta</button>
            <button
              className="btn btn-ghost"
              onClick={() => {
                getSocket().emit('match:quit');
                setPaused(false);
              }}
            >
              Desistir (derrota)
            </button>
          </div>
        </div>
      )}

      {result && (() => {
        const won = result.won ?? (result.winnerSide === me);
        return (
        <div className="bt-overlay res-overlay">
          <div className="res-tela">
            <header className="res-topo">
              <div className="res-lutador eu">
                <img className="res-avatar" src={avatarSrc(session.players[me]?.avatar ?? profile.avatar)} alt="" />
                <div className="res-lut-info">
                  <b>{names[me]}</b>
                  <span style={{ color: rankCor(session.players[me]?.tier) }}>{rankNome(session.players[me]?.tier)}</span>
                </div>
              </div>
              <div className="res-centro">
                <h1 className={`res-titulo ${won ? 'win' : 'lose'}`}>{won ? 'VITÓRIA' : 'DERROTA'}</h1>
                <small>{result.wo ? (won ? 'POR W.O. — O OPONENTE ABANDONOU' : 'DERROTA POR ABANDONO') : (won ? 'VOCÊ É IMPLACÁVEL!' : 'A VINGANÇA VEM NA PRÓXIMA')}</small>
                <div className="res-placar"><b className="p-eu">{result.wins?.[me]}</b><span>VS</span><b className="p-ele">{result.wins?.[opp]}</b></div>
              </div>
              <div className="res-lutador ele">
                <img className="res-avatar" src={avatarSrc(session.players[opp]?.avatar)} alt="" />
                <div className="res-lut-info">
                  <b>{names[opp]}</b>
                  <span style={{ color: rankCor(session.players[opp]?.tier) }}>{rankNome(session.players[opp]?.tier)}</span>
                </div>
              </div>
            </header>

            {result.rewards && (
              <div className="res-grid">
                <section className="res-cartao"><small>EXP</small><b className="rc-roxo">+{result.rewards.xp}</b><Icon name="xp" size={18} weight="forte" /></section>
                {result.bet ? (
                  <section className="res-cartao"><small>APOSTA</small><b className={result.bet.won ? 'rc-ouro' : 'rc-sangue'}>{result.bet.won ? '+' : '-'}{result.bet.amount.toLocaleString('pt-BR')}</b><Icon name={result.bet.kind === 'diamonds' ? 'diamante' : 'moeda'} size={18} weight="forte" /></section>
                ) : (
                  <section className="res-cartao"><small>MOEDAS</small><b className={result.rewards.coins >= 0 ? 'rc-ouro' : 'rc-sangue'}>{result.rewards.coins >= 0 ? `+${result.rewards.coins}` : `-${Math.abs(result.rewards.coins)}`}</b><Icon name="moeda" size={18} weight="forte" /></section>
                )}
                {result.itemDrop && (
                  <section className="res-cartao rc-item"><small>NOVO ITEM</small><ItemIcon item={result.itemDrop} size={46} /><em>{result.itemDrop.name}</em></section>
                )}
              </div>
            )}

            {result.rank && (
              <div className="res-rank">
                <img className="rank-img" src={rankArte(result.rank.tier)} alt="" />
                <div className="res-rank-info">
                  <small>PROGRESSO DE RANK</small>
                  <b style={{ color: rankCor(result.rank.tier) }}>{rankNome(result.rank.tier)}</b>
                  <span>{result.rank.points} pts <em className={result.rank.delta >= 0 ? 'up' : 'down'}>{result.rank.delta > 0 ? '+' : ''}{result.rank.delta}</em></span>
                </div>
              </div>
            )}

            {result.rewards?.bonuses?.length > 0 && (
              <div className="res-bonus">
                <small>DESEMPENHO</small>
                {result.rewards.bonuses.map((b) => (
                  <div key={b.label} className="res-bonus-linha"><Icon name="favorito" size={13} weight="forte" /> {b.label} <b>+{b.xp}</b></div>
                ))}
              </div>
            )}

            {result.rewards && (
              <div className="res-prog">
                {result.rewards.levelsUp > 0 && <div className="bt-levelup">LEVEL UP! Nível {result.profile.level}</div>}
                <div className="bt-prog"><div className="bt-prog-fill" style={{ width: `${Math.round((result.profile.xp / result.profile.xpNext) * 100)}%` }} /></div>
                <div className="bt-prog-label">Nível {result.profile.level} · {result.profile.xp}/{result.profile.xpNext} EXP</div>
              </div>
            )}

            <button className="btn btn-blood res-voltar" onClick={onDone}><Icon name="lobby" size={14} weight="forte" /> VOLTAR AO LOBBY</button>
          </div>
        </div>
        );
      })()}
    </div>
  );
}


// ===== escolha da aposta ao desafiar =====
function BetPicker({ profile, onNormal, onBet, onClose }) {
  const [kind, setKind] = useState(null); // null = normal
  const [amount, setAmount] = useState(100);
  const saldo = kind === 'diamonds' ? Number(profile?.diamonds || 0) : Number(profile?.coins || 0);
  const atalhos = kind === 'diamonds' ? [10, 50, 100] : [100, 500, 1000];
  const valido = kind && amount >= 1 && amount <= saldo;

  return (
    <div style={{ textAlign: 'center' }}>
      <div className="bet-kinds">
        <button className={`bet-kind ${kind === null ? 'on' : ''}`} onClick={() => setKind(null)}>⚔️ Normal</button>
        <button className={`bet-kind ${kind === 'coins' ? 'on' : ''}`} onClick={() => { setKind('coins'); setAmount(100); }}>🪙 Apostar</button>
        <button className={`bet-kind ${kind === 'diamonds' ? 'on' : ''}`} onClick={() => { setKind('diamonds'); setAmount(10); }}>💎 Apostar</button>
      </div>
      {kind === null ? (
        <p className="dash-empty" style={{ margin: '10px 0' }}>Partida comum: recompensas padrão do sistema.</p>
      ) : (
        <>
          <p className="dash-empty" style={{ margin: '8px 0 6px' }}>
            Quem perder transfere o valor pro vencedor. Seu saldo: <b style={{ color: kind === 'diamonds' ? '#7db4ff' : '#ffd76a' }}>{saldo.toLocaleString('pt-BR')} {kind === 'diamonds' ? '💎' : '🪙'}</b>
          </p>
          <div className="bet-shortcuts">
            {atalhos.map((v) => (
              <button key={v} className={`bet-chip ${amount === v ? 'on' : ''}`} disabled={v > saldo} onClick={() => setAmount(v)}>{v}</button>
            ))}
            <input
              type="number" min="1" max={saldo} value={amount}
              onChange={(e) => setAmount(Math.max(1, Math.floor(Number(e.target.value) || 1)))}
              className="bet-input"
            />
          </div>
          {amount > saldo && <p className="dash-err" style={{ margin: '4px 0' }}>Saldo insuficiente.</p>}
        </>
      )}
      <div className="pc-actions" style={{ justifyContent: 'center', marginTop: 12 }}>
        {kind === null ? (
          <button className="btn btn-blood" style={{ width: 'auto', padding: '11px 26px' }} onClick={onNormal}>⚔️ Desafiar</button>
        ) : (
          <button className="btn btn-blood" style={{ width: 'auto', padding: '11px 26px' }} disabled={!valido} onClick={() => onBet(kind, amount)}>
            💰 Desafiar valendo {amount.toLocaleString('pt-BR')} {kind === 'diamonds' ? '💎' : '🪙'}
          </button>
        )}
        <button className="btn btn-ghost" style={{ width: 'auto', padding: '11px 18px' }} onClick={onClose}>Cancelar</button>
      </div>
    </div>
  );
}
