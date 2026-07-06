import { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { createMatch, stepMatch } from '../game/sim.js';
import { createBot, botDecide, DIFFICULTIES } from '../game/bot.js';
import { createInput } from '../game/input.js';
import { createRenderer } from '../game/renderer.js';
import { ARENAS } from '../game/arena.js';
import { playEvent, unlockAudio, toggleMute, isMuted, sfx } from '../game/audio.js';
import { api } from '../lib/api.js';
import '../battle.css';

const DIFF_LABEL = { facil: 'Fácil', medio: 'Médio', dificil: 'Difícil', insano: 'Insano' };

export default function Battle({ profile, onProfile }) {
  const [params] = useSearchParams();
  const initialD = ['facil', 'medio', 'dificil', 'insano'].includes(params.get('d')) ? params.get('d') : 'medio';
  const [screen, setScreen] = useState('select'); // select | fight
  const [difficulty, setDifficulty] = useState(initialD);
  const [arena, setArena] = useState('random');

  const enterGameMode = (d) => {
    unlockAudio();
    setDifficulty(d);
    setScreen('fight');
    // ainda dentro do gesto de clique: fullscreen é permitido aqui
    document.documentElement.requestFullscreen?.().catch(() => {});
    try { screen.orientation?.lock?.('landscape').catch(() => {}); } catch { /* iOS não deixa */ }
  };
  const exitGameMode = () => {
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    setScreen('select');
  };

  return screen === 'select' ? (
    <DifficultySelect onPick={enterGameMode} arena={arena} setArena={setArena} />
  ) : (
    <Fight
      profile={profile}
      difficulty={difficulty}
      arena={arena === 'random' ? ['dojo', 'temple', 'prison'][Math.floor(Math.random() * 3)] : arena}
      onExit={exitGameMode}
      onProfile={onProfile}
    />
  );
}

function DifficultySelect({ onPick, arena, setArena }) {
  const nav = useNavigate();
  return (
    <div className="scene">
      <h1 className="brand" style={{ fontSize: 'clamp(40px, 8vw, 60px)' }}>
        MODO <span className="red">TREINO</span>
      </h1>
      <div className="tagline">Escolha a arena e a dificuldade do bot</div>
      <div className="card">
        <div className="arena-row">
          {['random', 'dojo', 'temple', 'prison'].map((a) => (
            <button
              key={a}
              className={`arena-btn ${arena === a ? 'on' : ''}`}
              onClick={() => setArena(a)}
            >
              {a === 'random' ? '🎲 Aleatória' : ARENAS[a].label}
            </button>
          ))}
        </div>
        {Object.keys(DIFFICULTIES).map((d) => (
          <button
            key={d}
            className={`btn ${d === 'insano' ? 'btn-blood' : 'btn-ghost'}`}
            onClick={() => onPick(d)}
          >
            {DIFF_LABEL[d]}
          </button>
        ))}
        <button className="btn btn-ghost" style={{ marginTop: 24 }} onClick={() => nav('/perfil')}>
          Voltar ao perfil
        </button>
      </div>
    </div>
  );
}

function Fight({ profile, difficulty, arena, onExit, onProfile }) {
  const hostRef = useRef(null);
  const hud = {
    hpA: useRef(null), hpB: useRef(null),
    dotsA: useRef(null), dotsB: useRef(null),
    timer: useRef(null), announce: useRef(null),
    combo: useRef(null), center: useRef(null), vs: useRef(null),
  };
  const inputRef = useRef(null);
  const pausedRef = useRef(false);
  const [paused, setPaused] = useState(false);
  const [result, setResult] = useState(null);
  const [mutedUi, setMutedUi] = useState(isMuted());
  const [loading, setLoading] = useState(true);
  const [runId, setRunId] = useState(0);

  const setPause = useCallback((v) => {
    pausedRef.current = v;
    setPaused(v);
  }, []);

  useEffect(() => {
    let alive = true;
    let renderer = null;
    let raf = 0;
    const match = createMatch();
    const bot = createBot(difficulty);
    const input = createInput();
    inputRef.current = input;

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
      if (!el) return;
      el.textContent = text;
      el.classList.toggle('show', !!text);
    };

    const watchdog = setTimeout(() => {
      if (!alive || !hostRef.current) return;
      console.error('[stikdead] vigia: carregamento excedeu 12s');
      setLoading(false);
      hostRef.current.innerHTML =
        '<div style="color:#f2efe9;padding:40px;text-align:center;font-family:sans-serif">Falha ao preparar a arena.<br/><a href="/perfil" style="color:#ff8fa3">← Voltar ao perfil</a></div>';
    }, 12000);
    (async () => {
      let myLoadout = [];
      try {
        const inv = await Promise.race([
          api('/api/inventory'),
          new Promise((_, rej) => setTimeout(() => rej(new Error('timeout inventário')), 4000)),
        ]);
        myLoadout = inv.loadout;
      } catch (e) { console.warn('[stikdead] sem loadout:', e.message); }
      try {
        renderer = await createRenderer(hostRef.current, arena);
      } catch (err) {
        console.error(err);
        if (hostRef.current)
          hostRef.current.innerHTML =
            '<div style="color:#ff8fa3;font:600 18px Barlow Condensed,sans-serif;padding:80px 24px;text-align:center">' +
            'Erro ao iniciar o jogo: ' + String(err?.message || err) + '</div>';
        return;
      }
      if (!alive) return renderer.destroy();
      renderer.setLoadouts(myLoadout, [{ slot: 'body', template: 'scarf', params: { color: '#777777' } }]);
      renderer.setNames(profile.fighter_name, `BOT · ${DIFF_LABEL[difficulty]}`);
      clearTimeout(watchdog);
      setLoading(false);
      console.log('[stikdead] luta pronta');

      let last = performance.now();
      let lastCount = null;

      const loop = (now) => {
        if (!alive) return;
        raf = requestAnimationFrame(loop);
        const dt = Math.min(0.033, (now - last) / 1000);
        last = now;

        let events = [];
        if (!pausedRef.current) {
          const inp = input.get();
          const botInp = botDecide(bot, match, 1, dt);
          events = stepMatch(match, inp, botInp, dt);
        }

        for (const e of events) {
          playEvent(e, 0);
          if (e.type === 'fightstart') { centerText('LUTE!'); setTimeout(() => centerText(''), 650); }
          if (e.type === 'firstblood') announce('PRIMEIRO SANGUE!');
          if (e.type === 'suddendeath') announce('MORTE SÚBITA!', 'red');
          if (e.type === 'ko') announce(e.finisher ? 'FINALIZAÇÃO!' : 'K.O.!', 'red');
          if (e.type === 'roundstart') { centerText(`ROUND ${e.round}`); setTimeout(() => centerText(''), 900); }
          if (e.type === 'roundend' && match.phase !== 'matchend' && e.winner >= 0)
            setTimeout(() => announce(e.winner === 0 ? 'ROUND SEU!' : 'ROUND DO BOT!'), 700);
          if (e.type === 'matchend') {
            const won = e.winner === 0;
            const payload = {
              difficulty,
              won,
              wins: [...match.wins],
              duration: Math.round(match.elapsed),
              stats: { ...match.stats[0], finisher: won && match.koFinisher },
            };
            api('/api/matches/training', { method: 'POST', body: payload })
              .then((data) => {
                onProfile?.((p) => ({ ...p, level: data.profile.level, xp: data.profile.xp, coins: data.profile.coins }));
                setTimeout(() => setResult({ winner: e.winner, wins: [...match.wins], stats: { ...match.stats[0] }, rewards: data.rewards, prog: data.profile }), 1100);
              })
              .catch(() =>
                setTimeout(() => setResult({ winner: e.winner, wins: [...match.wins], stats: { ...match.stats[0] }, offline: true }), 1100)
              );
          }
        }

        // HUD
        const [a, b] = match.fighters;
        if (hud.hpA.current) hud.hpA.current.style.width = `${a.hp}%`;
        if (hud.hpB.current) hud.hpB.current.style.width = `${b.hp}%`;
        if (hud.timer.current)
          hud.timer.current.textContent = match.suddenDeath ? '!!' : String(Math.ceil(match.timer)).padStart(2, '0');
        if (hud.dotsA.current) hud.dotsA.current.dataset.wins = match.wins[0];
        if (hud.dotsB.current) hud.dotsB.current.dataset.wins = match.wins[1];

        const combo = a.combo >= 3 ? a.combo : 0;
        const comboEl = hud.combo.current;
        if (comboEl) {
          comboEl.classList.toggle('show', combo > 0);
          if (combo > 0) comboEl.innerHTML = `<b>${combo}</b> HITS${combo >= 8 ? '<i>COMBO INSANO!</i>' : ''}`;
        }

        if (hud.vs.current)
          hud.vs.current.classList.toggle('show', match.phase === 'countdown' && match.round === 1 && match.phaseT < 2.2);

        if (match.phase === 'countdown') {
          const n = Math.ceil(3.4 - match.phaseT - 0.3);
          if (n >= 1 && n <= 3 && n !== lastCount) { centerText(String(n)); lastCount = n; }
        } else lastCount = null;

        if (announceT > 0) {
          announceT -= dt;
          if (announceT <= 0 && hud.announce.current) hud.announce.current.className = 'bt-announce';
        }

        renderer.frame(match, events, pausedRef.current ? 0 : dt);
      };
      raf = requestAnimationFrame(loop);
    })();

    const onKey = (e) => {
      if (e.code === 'Escape') setPause(!pausedRef.current);
    };
    window.addEventListener('keydown', onKey);

    const portrait = window.matchMedia('(orientation: portrait)');
    const coarse = window.matchMedia('(pointer: coarse)').matches;
    const onRotate = () => {
      if (coarse) setPause(portrait.matches);
    };
    portrait.addEventListener('change', onRotate);
    onRotate();

    return () => {
      alive = false;
      cancelAnimationFrame(raf);
      window.removeEventListener('keydown', onKey);
      portrait.removeEventListener('change', onRotate);
      input.destroy();
      renderer?.destroy();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [difficulty, arena, runId]);

  return (
    <div className="bt-root">
      <div className="bt-canvas" ref={hostRef} />
      {loading && (
        <div className="bt-loading">
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
          <div className="bt-name">{profile.fighter_name}</div>
          <div className="bt-bar"><div className="bt-fill" ref={hud.hpA} /></div>
          <div className="bt-dots" ref={hud.dotsA} data-wins="0"><i /><i /></div>
        </div>
        <div className="bt-timer" ref={hud.timer}>99</div>
        <div className="bt-plate right">
          <div className="bt-name">BOT · {DIFF_LABEL[difficulty]}</div>
          <div className="bt-bar"><div className="bt-fill" ref={hud.hpB} /></div>
          <div className="bt-dots" ref={hud.dotsB} data-wins="0"><i /><i /></div>
        </div>
      </div>

      <div className="bt-vs" ref={hud.vs}>
        <div className="bt-vs-name left">{profile.fighter_name}</div>
        <div className="bt-vs-mark">VS</div>
        <div className="bt-vs-name right">BOT · {DIFF_LABEL[difficulty]}</div>
      </div>
      <div className="bt-combo" ref={hud.combo} />
      <div className="bt-announce" ref={hud.announce} />
      <div className="bt-center" ref={hud.center} />

      <button className="bt-pausebtn" onClick={() => setPause(true)} aria-label="Pausar">II</button>

      <TouchControls inputRef={inputRef} />

      <div className="bt-rotate">
        <div className="bt-rotate-icon" aria-hidden="true" />
        <div>GIRE O CELULAR PARA LUTAR</div>
      </div>

      {paused && !result && (
        <div className="bt-overlay">
          <div className="bt-panel">
            <h2>PAUSADO</h2>
            <button className="btn btn-blood" onClick={() => setPause(false)}>Continuar</button>
            <button className="btn btn-ghost" onClick={onExit}>Sair da luta</button>
          </div>
        </div>
      )}

      {result && (
        <div className="bt-overlay">
          <div className="bt-panel">
            <h1 className={`bt-result ${result.winner === 0 ? 'win' : 'lose'}`}>
              {result.winner === 0 ? 'VITÓRIA' : 'DERROTA'}
            </h1>
            <div className="bt-score">
              {result.wins[0]} <span>VS</span> {result.wins[1]}
            </div>
            {result.rewards && (
              <div className="bt-rewards">
                <div className="bt-reward xp">+{result.rewards.xp} <span>EXP</span></div>
                <div className="bt-reward gold">+{result.rewards.coins} <span>MOEDAS</span></div>
                {result.rewards.bonuses.map((b) => (
                  <div key={b.label} className="bt-bonus">★ {b.label} <span>+{b.xp}</span></div>
                ))}
                {result.rewards.levelsUp > 0 && <div className="bt-levelup">LEVEL UP! Nível {result.prog.level}</div>}
                <div className="bt-prog">
                  <div className="bt-prog-fill" style={{ width: `${Math.round((result.prog.xp / result.prog.xpNext) * 100)}%` }} />
                </div>
                <div className="bt-prog-label">Nível {result.prog.level} · {result.prog.xp}/{result.prog.xpNext} EXP</div>
              </div>
            )}
            {result.offline && <div className="bt-bonus">Recompensas indisponíveis (sem conexão com o servidor)</div>}
            <button
              className="btn btn-blood"
              onClick={() => {
                setResult(null);
                setPause(false);
                setRunId((n) => n + 1);
              }}
            >
              Lutar novamente
            </button>
            <button className="btn btn-ghost" onClick={onExit}>Trocar dificuldade</button>
          </div>
        </div>
      )}
    </div>
  );
}

export function TouchControls({ inputRef }) {
  const stickRef = useRef(null);
  const knobRef = useRef(null);

  const setTouch = (k, v) => {
    if (inputRef.current) inputRef.current.touch[k] = v;
  };

  useEffect(() => {
    const zone = stickRef.current;
    const knob = knobRef.current;
    if (!zone) return;
    let pid = null;

    const move = (e) => {
      const rect = zone.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = e.clientX - cx;
      const dy = e.clientY - cy;
      const max = rect.width / 2 - 18;
      const len = Math.hypot(dx, dy) || 1;
      const k = Math.min(1, max / len);
      knob.style.transform = `translate(${dx * k}px, ${dy * k}px)`;
      setTouch('left', dx < -14);
      setTouch('right', dx > 14);
      setTouch('jump', dy < -26);
    };
    const downH = (e) => { pid = e.pointerId; zone.setPointerCapture(pid); move(e); };
    const moveH = (e) => { if (e.pointerId === pid) move(e); };
    const upH = (e) => {
      if (e.pointerId !== pid) return;
      pid = null;
      knob.style.transform = '';
      setTouch('left', false); setTouch('right', false); setTouch('jump', false);
    };
    zone.addEventListener('pointerdown', downH);
    zone.addEventListener('pointermove', moveH);
    zone.addEventListener('pointerup', upH);
    zone.addEventListener('pointercancel', upH);
    return () => {
      zone.removeEventListener('pointerdown', downH);
      zone.removeEventListener('pointermove', moveH);
      zone.removeEventListener('pointerup', upH);
      zone.removeEventListener('pointercancel', upH);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const Btn = ({ act, label, cls = '' }) => (
    <button
      className={`bt-btn ${cls}`}
      onPointerDown={(e) => { e.preventDefault(); setTouch(act, true); }}
      onPointerUp={() => setTouch(act, false)}
      onPointerLeave={() => setTouch(act, false)}
      onContextMenu={(e) => e.preventDefault()}
    >
      {label}
    </button>
  );

  return (
    <div className="bt-touch">
      <div className="bt-stick" ref={stickRef}>
        <div className="bt-knob" ref={knobRef} />
      </div>
      <div className="bt-actions">
        <Btn act="dash" label="DASH" cls="sm" />
        <Btn act="block" label="BLOCK" cls="sm blue" />
        <Btn act="jump" label="JUMP" cls="sm green" />
        <Btn act="light" label="SOCO" cls="gold" />
        <Btn act="heavy" label="PESADO" cls="red" />
      </div>
    </div>
  );
}
