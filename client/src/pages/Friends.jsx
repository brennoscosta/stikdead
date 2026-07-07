// STIKDEAD :: Clã — a praça dos amigos: cenário próprio, balões, sussurros e presentes
import { useEffect, useRef, useState } from 'react';
import { api } from '../lib/api.js';
import { getSocket } from '../lib/socket.js';
import { createPlaza } from '../game/praca.js';
import Navbar from '../lib/Navbar.jsx';
import PlayerCard from '../lib/PlayerCard.jsx';

export default function Friends({ profile }) {
  const [data, setData] = useState({ friends: [], requests: [] });
  const [chat, setChat] = useState([]);
  const [text, setText] = useState('');
  const [card, setCard] = useState(null); // { name, gift? }
  const plazaHost = useRef(null);
  const plazaRef = useRef(null);
  const boxRef = useRef(null);
  const inputRef = useRef(null);

  const load = () => api('/api/friends').then(setData).catch(() => {});
  useEffect(() => { load(); const t = setInterval(load, 6000); return () => clearInterval(t); }, []);

  // sala do clã: presença real — só quem está COM A ABA ABERTA caminha aqui
  useEffect(() => {
    let alive = true;
    getSocket().emit('clan:enter');
    createPlaza(plazaHost.current, { variant: 'cla', onNameClick: (n) => setCard({ name: n }) }).then((p) => {
      if (!alive) return p.destroy();
      plazaRef.current = p;
    });
    return () => {
      alive = false;
      getSocket().emit('clan:leave');
      plazaRef.current?.destroy(); plazaRef.current = null;
    };
  }, []);
  useEffect(() => {
    const walkers = data.friends.filter((f) => f.inClan)
      .map((f) => ({ id: f.user_id, name: f.fighter_name, loadout: [] }));
    walkers.push({ id: profile.id, name: profile.fighter_name, loadout: [] });
    plazaRef.current?.setPlayers(walkers);
  }, [data, profile]);

  // canal do clã via socket (+ balões)
  useEffect(() => {
    const socket = getSocket();
    const onMsg = (m) => {
      setChat((c) => [...c.slice(-49), m]);
      if (!m.private && !m.system) plazaRef.current?.say?.(m.name, m.text);
    };
    socket.on('clan:msg', onMsg);
    const onPing = () => load();
    socket.on('social:ping', onPing);
    return () => { socket.off('clan:msg', onMsg); socket.off('social:ping', onPing); };
  }, []);

  useEffect(() => { boxRef.current?.scrollTo(0, 999999); }, [chat]);

  const send = (e) => {
    e.preventDefault();
    const t = text.trim();
    if (!t) return;
    getSocket().emit('clan:send', { text: t });
    setText('');
  };
  const whisper = (name) => {
    setText(`/${name} `);
    inputRef.current?.focus();
  };

  const respond = async (id, accept) => {
    await api('/api/friends/respond', { method: 'POST', body: { requestId: id, accept } });
    load();
  };

  const onlineCount = data.friends.filter((f) => f.online).length;

  return (
    <div className="scene dash">
      <Navbar profile={profile} />
      <h1 className="dash-name" style={{ marginBottom: 2 }}>🛡️ CLÃ</h1>
      <p className="dash-empty" style={{ marginTop: 0 }}>
        {data.friends.length} amigo{data.friends.length === 1 ? '' : 's'} · {onlineCount} online no salão
      </p>

      {data.requests.length > 0 && (
        <div className="fr-requests">
          <h3 className="pc-section">PEDIDOS DE AMIZADE</h3>
          {data.requests.map((r) => (
            <div key={r.id} className="fr-request">
              <button className="fr-name" onClick={() => setCard({ name: r.fighter_name })}>{r.fighter_name}</button>
              <small>Nível {r.level} · {r.tier}</small>
              <span className="fr-req-actions">
                <button className="adm-btn" onClick={() => respond(r.id, true)}>✓ aceitar</button>
                <button className="adm-btn" onClick={() => respond(r.id, false)}>✕</button>
              </span>
            </div>
          ))}
        </div>
      )}

      {/* o salão do clã */}
      <div className="cla-plaza" ref={plazaHost} />

      <div className="fr-layout">
        <div className="fr-list">
          <h3 className="pc-section" style={{ margin: '0 0 6px' }}>GUERREIROS</h3>
          {data.friends.length === 0 && (
            <p className="dash-empty">Sem amigos ainda. Vai à Praça, puxa papo e clica nos nomes! 🥷</p>
          )}
          {data.friends.map((f) => (
            <div key={f.user_id} className="fr-friend">
              <span className={`fr-dot ${f.online ? 'online' : ''}`} />
              <button className="fr-name" onClick={() => setCard({ name: f.fighter_name })}>{f.fighter_name}</button>
              <small>Nv {f.level} · 🏆 {Number(f.rank_points || 0).toLocaleString('pt-BR')}</small>
              <button className="adm-btn" onClick={() => whisper(f.fighter_name)}>💬</button>
              <button className="adm-btn" title="Enviar presente" onClick={() => setCard({ name: f.fighter_name, gift: true })}>🎁</button>
            </div>
          ))}
        </div>

        <div className="fr-chat">
          <div className="fr-chat-head">💬 SALÃO DO CLÃ <small style={{ color: 'var(--muted)', fontWeight: 400 }}>· /nome para sussurrar</small></div>
          <div className="fr-msgs" ref={boxRef}>
            {chat.map((m, i) => (
              <div key={i} className={`clan-line ${m.private ? 'pv' : ''} ${m.system ? 'sys' : ''}`}>
                {m.system ? <em>{m.text}</em> : (
                  <>
                    <strong className="chat-name" onClick={() => setCard({ name: m.name })}>{m.name}</strong>
                    {m.private && <span className="pv-tag">{Number(m.userId) === Number(profile.id) ? `➜ ${m.to}` : 'sussurro'}</span>}
                    : {m.text}
                  </>
                )}
              </div>
            ))}
            {chat.length === 0 && <p className="dash-empty">O salão está em silêncio... quebra o gelo!</p>}
          </div>
          <form className="fr-input" onSubmit={send}>
            <input ref={inputRef} value={text} onChange={(e) => setText(e.target.value)} placeholder="Fala com o clã... (/nome sussurra)" maxLength={200} />
            <button className="btn btn-blood" style={{ width: 'auto', padding: '10px 18px' }}>➤</button>
          </form>
        </div>
      </div>

      {card && <PlayerCard name={card.name} autoGift={card.gift} onClose={() => setCard(null)} onWhisper={whisper} />}
    </div>
  );
}
