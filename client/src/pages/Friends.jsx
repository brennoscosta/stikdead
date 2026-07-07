// STIKDEAD :: Clã — amigos, quem está online e o chat entre guerreiros
import { useEffect, useRef, useState } from 'react';
import { api } from '../lib/api.js';
import Navbar from '../lib/Navbar.jsx';
import PlayerCard from '../lib/PlayerCard.jsx';

export default function Friends({ profile }) {
  const [data, setData] = useState({ friends: [], requests: [] });
  const [sel, setSel] = useState(null);          // amigo selecionado p/ chat
  const [msgs, setMsgs] = useState([]);
  const [text, setText] = useState('');
  const [card, setCard] = useState(null);        // nome aberto no cartão
  const lastId = useRef(0);
  const boxRef = useRef(null);

  const load = () => api('/api/friends').then(setData).catch(() => {});
  useEffect(() => { load(); const t = setInterval(load, 10000); return () => clearInterval(t); }, []);

  // chat do amigo selecionado: carrega e faz polling
  useEffect(() => {
    if (!sel) return;
    lastId.current = 0;
    setMsgs([]);
    let dead = false;
    const pull = async () => {
      try {
        const d = await api(`/api/friends/chat/${sel.user_id}?after=${lastId.current}`);
        if (dead || !d.messages.length) return;
        lastId.current = d.messages[d.messages.length - 1].id;
        setMsgs((m) => [...m, ...d.messages]);
      } catch { /* segue */ }
    };
    pull();
    const t = setInterval(pull, 4000);
    return () => { dead = true; clearInterval(t); };
  }, [sel]);

  useEffect(() => { boxRef.current?.scrollTo(0, 999999); }, [msgs]);

  const send = async (e) => {
    e.preventDefault();
    const body = text.trim();
    if (!body || !sel) return;
    setText('');
    try {
      const d = await api(`/api/friends/chat/${sel.user_id}`, { method: 'POST', body: { text: body } });
      lastId.current = d.message.id;
      setMsgs((m) => [...m, d.message]);
    } catch (err) { alert(err.message); }
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
        {data.friends.length} amigo{data.friends.length === 1 ? '' : 's'} · {onlineCount} online agora
      </p>

      {data.requests.length > 0 && (
        <div className="fr-requests">
          <h3 className="pc-section">PEDIDOS DE AMIZADE</h3>
          {data.requests.map((r) => (
            <div key={r.id} className="fr-request">
              <button className="fr-name" onClick={() => setCard(r.fighter_name)}>{r.fighter_name}</button>
              <small>Nível {r.level} · {r.tier}</small>
              <span className="fr-req-actions">
                <button className="adm-btn" onClick={() => respond(r.id, true)}>✓ aceitar</button>
                <button className="adm-btn" onClick={() => respond(r.id, false)}>✕</button>
              </span>
            </div>
          ))}
        </div>
      )}

      <div className="fr-layout">
        <div className="fr-list">
          {data.friends.length === 0 && (
            <p className="dash-empty">
              Ainda sem amigos por aqui. Vai à Praça, conversa no chat e clica no nome de alguém para pedir amizade! 🥷
            </p>
          )}
          {data.friends.map((f) => (
            <div key={f.user_id} className={`fr-friend ${sel?.user_id === f.user_id ? 'on' : ''}`}>
              <span className={`fr-dot ${f.online ? 'online' : ''}`} title={f.online ? 'Online' : 'Offline'} />
              <button className="fr-name" onClick={() => setCard(f.fighter_name)}>{f.fighter_name}</button>
              <small>Nv {f.level} · 🏆 {Number(f.rank_points || 0).toLocaleString('pt-BR')}</small>
              <button className="adm-btn" onClick={() => setSel(f)}>💬 chat</button>
            </div>
          ))}
        </div>

        <div className="fr-chat">
          {!sel ? (
            <p className="dash-empty" style={{ margin: 'auto' }}>Escolhe um amigo para conversar →</p>
          ) : (
            <>
              <div className="fr-chat-head">
                💬 <button className="fr-name" onClick={() => setCard(sel.fighter_name)}>{sel.fighter_name}</button>
              </div>
              <div className="fr-msgs" ref={boxRef}>
                {msgs.map((m) => (
                  <div key={m.id} className={`fr-msg ${Number(m.from_id) === Number(profile.id) ? 'mine' : ''}`}>
                    <span>{m.body}</span>
                    <small>{new Date(m.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</small>
                  </div>
                ))}
              </div>
              <form className="fr-input" onSubmit={send}>
                <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Mensagem..." maxLength={500} />
                <button className="btn btn-blood" style={{ width: 'auto', padding: '10px 18px' }}>➤</button>
              </form>
            </>
          )}
        </div>
      </div>

      {card && <PlayerCard name={card} onClose={() => setCard(null)} />}
    </div>
  );
}
