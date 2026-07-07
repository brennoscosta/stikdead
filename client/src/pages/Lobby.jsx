import { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getSocket } from '../lib/socket.js';
import { createPlaza } from '../game/praca.js';
import Navbar from '../lib/Navbar.jsx';
import { api } from '../lib/api.js';
import ItemIcon from '../lib/ItemIcon.jsx';
import { playEvent, unlockAudio, toggleMute, isMuted, sfx } from '../game/audio.js';
import { STYLES } from '../game/sim.js';
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
  const [incoming, setIncoming] = useState(null); // {id, from, expiresAt}
  const [sent, setSent] = useState(null);
  const [session, setSession] = useState(null); // {side, players}
  const [chat, setChat] = useState([]);
  const [chatText, setChatText] = useState('');
  const plazaHost = useRef(null);
  const plazaRef = useRef(null);
  const playersRef = useRef([]);
  const [missions, setMissions] = useState([]);
  const [myLoadout, setMyLoadout] = useState([]);
  const [notice, setNotice] = useState('');

  useEffect(() => {
    const socket = getSocket();


    const onPresence = ({ players }) => {
      setPlayers(players);
      playersRef.current = players;
      plazaRef.current?.setPlayers(players);
    };
    const onQueue = ({ inQueue }) => setInQueue(inQueue);
    const onChallenge = ({ id, from, ttl }) =>
      setIncoming({ id, from, expiresAt: Date.now() + ttl });
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
    const onChatHistory = ({ messages }) => setChat(messages);
    const onChatMsg = (msg) => setChat((c) => [...c.slice(-49), msg]);
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
      socket.off('chat:history', onChatHistory);
      socket.off('chat:msg', onChatMsg);
      socket.off('connect', onReconnect);
    };
  }, []);

  // countdown do convite recebido
  const [, forceTick] = useState(0);
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
    createPlaza(plazaHost.current).then((p) => {
      if (!alive) return p.destroy();
      plazaRef.current = p;
      p.setPlayers(playersRef.current);
    });
    return () => {
      alive = false;
      plazaRef.current?.destroy();
      plazaRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session]);

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
          <section className="dash-card">
            <h2>JOGADORES ONLINE ({players.length})</h2>
            <ul className="lobby-list">
              {others.length === 0 && (
                <p className="dash-empty">Ninguém mais online agora. Chame os amigos!</p>
              )}
              {others.map((p) => (
                <li key={p.id}>
                  <span className="lobby-dot" data-busy={p.inMatch} />
                  <span className="lobby-name">{p.name}</span>
                  <span className="lobby-meta">Nv {p.level} · {TIER_LABEL(p.tier)}</span>
                  {p.inMatch ? (
                    <span className="lobby-busy">EM LUTA</span>
                  ) : (
                    <button
                      className="lobby-challenge"
                      disabled={!!sent}
                      onClick={() => { goFullscreen(); socket.emit('challenge:send', { to: p.id }); }}
                    >
                      DESAFIAR
                    </button>
                  )}
                </li>
              ))}
            </ul>
            {sent && <p className="dash-empty">Desafio enviado para {sent}. Aguardando…</p>}
          </section>

          <section className="dash-card" style={{ flex: 1 }}>
            <h2>CHAT DO LOBBY</h2>
            <div className="chat-msgs" style={{ maxHeight: 220 }}>
              {chat.map((m, i) => (
                <div key={i} className="chat-msg"><strong>{m.name}:</strong> {m.text}</div>
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
                maxLength={200}
                placeholder="Digite sua mensagem…"
              />
              <button type="submit">➤</button>
            </form>
          </section>
        </aside>

        {/* ===== centro: praça + ação principal ===== */}
        <main className="lobby-center">
          <div className="plaza plaza-big" ref={plazaHost} />
          <button
            className="lobby-cta"
            onClick={() => { if (!inQueue) goFullscreen(); socket.emit(inQueue ? 'queue:leave' : 'queue:join'); }}
          >
            {inQueue ? '⏳ PROCURANDO OPONENTE… (cancelar)' : '⚔ BUSCAR PARTIDA'}
            <small>{inQueue ? 'pareamento automático' : 'partida rápida 1v1'}</small>
          </button>
          <div className="lobby-quick">
            <button onClick={() => nav('/treino')}>🤖 TREINO</button>
            <button onClick={() => nav('/loja')}>🛒 LOJA</button>
            <button onClick={() => nav('/missoes')}>📜 MISSÕES</button>
            <button className="soon">🏆 TORNEIO<small>em breve</small></button>
          </div>
        </main>

        {/* ===== coluna direita: bot + missões ===== */}
        <aside className="lobby-col">
          <section className="dash-card">
            <h2>JOGAR COM BOT</h2>
            <p className="dash-empty" style={{ marginBottom: 10 }}>Treine suas habilidades contra a IA.</p>
            <div className="lobby-bot-row">
              {[['facil', 'FÁCIL'], ['medio', 'MÉDIO'], ['dificil', 'DIFÍCIL'], ['insano', 'INSANO']].map(([d, l]) => (
                <button key={d} className={d === 'insano' ? 'hot' : ''} onClick={() => nav(`/treino?d=${d}`)}>{l}</button>
              ))}
            </div>
          </section>

          <section className="dash-card">
            <h2>MISSÕES DIÁRIAS</h2>
            {missions.slice(0, 3).map((m) => (
              <div key={m.id} className="lobby-mission">
                <span>{m.label}</span>
                <div className="mission-bar"><div className="mission-fill" style={{ width: `${Math.min(100, (m.progress / m.goal) * 100)}%` }} /></div>
                <small>{Math.min(m.progress, m.goal)}/{m.goal} · 🪙 {m.coins}</small>
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
        <h2>SUA BUILD ATUAL</h2>
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

      {incoming && (
        <div className="bt-overlay">
          <div className="bt-panel">
            <h2>DESAFIO!</h2>
            <p style={{ margin: '0 0 6px', fontSize: 22 }}>
              <b style={{ color: '#d90429' }}>{incoming.from.name}</b> te desafiou
            </p>
            <p style={{ margin: '0 0 16px', color: '#9a938a' }}>
              Nv {incoming.from.level} · {TIER_LABEL(incoming.from.tier)} ·{' '}
              {Math.max(0, Math.ceil((incoming.expiresAt - Date.now()) / 1000))}s
            </p>
            <button
              className="btn btn-blood"
              onClick={() => { goFullscreen(); getSocket().emit('challenge:answer', { id: incoming.id, accept: true }); }}
            >
              Aceitar
            </button>
            <button
              className="btn btn-ghost"
              onClick={() => {
                getSocket().emit('challenge:answer', { id: incoming.id, accept: false });
                setIncoming(null);
              }}
            >
              Recusar
            </button>
          </div>
        </div>
      )}
    </div></>
  );
}

// ===================== BATALHA ONLINE =====================

function OnlineFight({ profile, session, onProfile, onDone }) {
  const hostRef = useRef(null);
  const hud = {
    hpA: useRef(null), hpB: useRef(null),
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
  const opp = 1 - me;
  const names = [session.players[0]?.name || 'P1', session.players[1]?.name || 'P2'];

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
    let curAt = 0;
    let pendingEv = [];

    const clientMatch = {
      phase: 'countdown', phaseT: 0, timer: 99, round: 1,
      wins: [0, 0], suddenDeath: false,
      fighters: [
        { x: -170, y: 0, vy: 0, face: 1, hp: 100, state: 'idle', t: 0, hitstun: 0, combo: 0 },
        { x: 170, y: 0, vy: 0, face: -1, hp: 100, state: 'idle', t: 0, hitstun: 0, combo: 0 },
      ],
    };

    const onSnapshot = (snap) => {
      prevSnap = curSnap;
      curSnap = snap;
      curAt = performance.now();
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
        if (hud.hpB.current) hud.hpB.current.style.width = `${fb.hp}%`;
        if (hud.timer.current)
          hud.timer.current.textContent = clientMatch.suddenDeath ? '!!' : String(Math.ceil(clientMatch.timer)).padStart(2, '0');
        if (hud.dotsA.current) hud.dotsA.current.dataset.wins = clientMatch.wins[me];
        if (hud.dotsB.current) hud.dotsB.current.dataset.wins = clientMatch.wins[opp];

        const combo = fa.combo >= 3 ? fa.combo : 0;
        if (hud.combo.current) {
          hud.combo.current.classList.toggle('show', combo > 0);
          if (combo > 0)
            hud.combo.current.innerHTML = `<b>${combo}</b> HITS${combo >= 8 ? '<i>COMBO INSANO!</i>' : ''}`;
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
      <div className="bt-hud">
        <div className="bt-plate left">
          <div className="bt-name">{names[me]}</div>
          <div className="bt-bar"><div className="bt-fill" ref={hud.hpA} /></div>
          <div className="bt-dots" ref={hud.dotsA} data-wins="0"><i /><i /></div>
        </div>
        <div className="bt-timer" ref={hud.timer}>99</div>
        <div className="bt-plate right">
          <div className="bt-name">{names[opp]}</div>
          <div className="bt-bar"><div className="bt-fill" ref={hud.hpB} /></div>
          <div className="bt-dots" ref={hud.dotsB} data-wins="0"><i /><i /></div>
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

      {result && (
        <div className="bt-overlay">
          <div className="bt-panel">
            <h1 className={`bt-result ${result.winnerSide === me ? 'win' : 'lose'}`}>
              {result.winnerSide === me ? 'VITÓRIA' : 'DERROTA'}
            </h1>
            {result.wo && (
              <p style={{ color: '#9a938a', margin: '0 0 10px' }}>
                {result.winnerSide === me ? 'Vitória por W.O. — o oponente abandonou.' : 'Derrota por abandono.'}
              </p>
            )}
            <div className="bt-score">
              {result.wins?.[me]} <span>VS</span> {result.wins?.[opp]}
            </div>
            {result.rewards && (
              <div className="bt-rewards">
                <div className="bt-reward xp">+{result.rewards.xp} <span>EXP</span></div>
                <div className={`bt-reward ${result.rewards.coins >= 0 ? 'gold' : 'loss'}`}>{result.rewards.coins >= 0 ? `+${result.rewards.coins}` : result.rewards.coins} <span>MOEDAS</span></div>
                {rankLine && <div className="bt-bonus">🏆 {rankLine}</div>}
                {result.rewards.bonuses?.map((b) => (
                  <div key={b.label} className="bt-bonus">★ {b.label} <span>+{b.xp}</span></div>
                ))}
                {result.itemDrop && (
                  <div className="bt-levelup" style={{ color: '#3d7bd9' }}>
                    🎁 NOVO ITEM: {result.itemDrop.name}
                  </div>
                )}
                {result.rewards.levelsUp > 0 && (
                  <div className="bt-levelup">LEVEL UP! Nível {result.profile.level}</div>
                )}
                <div className="bt-prog">
                  <div
                    className="bt-prog-fill"
                    style={{ width: `${Math.round((result.profile.xp / result.profile.xpNext) * 100)}%` }}
                  />
                </div>
                <div className="bt-prog-label">
                  Nível {result.profile.level} · {result.profile.xp}/{result.profile.xpNext} EXP
                </div>
              </div>
            )}
            <button className="btn btn-blood" onClick={onDone}>Voltar ao lobby</button>
          </div>
        </div>
      )}
    </div>
  );
}
