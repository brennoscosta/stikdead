import { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getSocket } from '../lib/socket.js';
import { createPlaza } from '../game/praca.js';
import { createInput } from '../game/input.js';
import { createRenderer } from '../game/renderer.js';
import { TouchControls } from './Battle.jsx';
import '../battle.css';

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

    return () => {
      socket.off('presence', onPresence);
      socket.off('queue:status', onQueue);
      socket.off('challenge:received', onChallenge);
      socket.off('challenge:cancel', onCancel);
      socket.off('challenge:sent', onSent);
      socket.off('match:start', onStart);
      socket.off('chat:history', onChatHistory);
      socket.off('chat:msg', onChatMsg);
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
    <div className="scene">
      <h1 className="brand" style={{ fontSize: 'clamp(40px, 8vw, 60px)' }}>
        LOBBY <span className="red">ONLINE</span>
      </h1>
      <div className="tagline">
        {players.length} lutador{players.length === 1 ? '' : 'es'} online
      </div>

      <div className="card" style={{ maxWidth: 460 }}>
        {notice && <div className="error" role="status">{notice}</div>}

        <button
          className={`btn ${inQueue ? 'btn-ghost' : 'btn-blood'}`}
          onClick={() => socket.emit(inQueue ? 'queue:leave' : 'queue:join')}
        >
          {inQueue ? 'Procurando oponente... (cancelar)' : '⚔ Buscar partida'}
        </button>

        <div className="plaza" ref={plazaHost} />
        <div className="chat-box">
          <div className="chat-msgs">
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
        </div>
        <div className="divider">JOGADORES ONLINE</div>

        {others.length === 0 && (
          <p className="switch-line" style={{ marginTop: 4 }}>
            Ninguém mais online agora. Use "Buscar partida" ou abra outra aba para testar.
          </p>
        )}

        <ul className="lobby-list">
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
                  onClick={() => socket.emit('challenge:send', { to: p.id })}
                >
                  DESAFIAR
                </button>
              )}
            </li>
          ))}
        </ul>

        {sent && <p className="switch-line">Desafio enviado para {sent}. Aguardando...</p>}

        <button className="btn btn-ghost" style={{ marginTop: 18 }} onClick={() => nav('/perfil')}>
          Voltar ao perfil
        </button>
      </div>

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
              onClick={() => getSocket().emit('challenge:answer', { id: incoming.id, accept: true })}
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
    </div>
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
  };
  const inputRef = useRef(null);
  const [paused, setPaused] = useState(false);
  const [waiting, setWaiting] = useState(false); // oponente caiu
  const [reconnecting, setReconnecting] = useState(false); // eu caí
  const [result, setResult] = useState(null);

  const me = session.side;
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
      setTimeout(() => setResult(r), r.wo ? 0 : 1100);
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

    (async () => {
      try {
        renderer = await createRenderer(hostRef.current, session.arena || 'dojo');
        renderer.setLoadouts(session.players[0]?.loadout, session.players[1]?.loadout);
        renderer.setNames(names[0], names[1]);
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
          if (e.type === 'fightstart') { centerText('LUTE!'); setTimeout(() => centerText(''), 650); }
          if (e.type === 'roundstart') { centerText(`ROUND ${e.round}`); setTimeout(() => centerText(''), 900); }
          if (e.type === 'firstblood') announce('PRIMEIRO SANGUE!');
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
                <div className="bt-reward gold">+{result.rewards.coins} <span>MOEDAS</span></div>
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
