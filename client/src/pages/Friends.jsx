// STIKDEAD :: AMIGOS — salão social redesenhado (Sprint 04)
// cards ricos (avatar, liga, status, troféus, clã), busca p/ adicionar, solicitações,
// estados de skeleton/vazio/erro. Salão (praça) + chat mantidos.
import { useEffect, useRef, useState } from 'react';
import { api } from '../lib/api.js';
import { getSocket } from '../lib/socket.js';
import { createPlaza } from '../game/praca.js';
import Navbar from '../lib/Navbar.jsx';
import PlayerCard from '../lib/PlayerCard.jsx';
import Icon from '../ds/Icon.jsx';
import { rankArte, rankCor, rankNome } from '../ds/rank.js';

const fmt = (n) => Number(n || 0).toLocaleString('pt-BR');
const tempoAtras = (iso) => {
  if (!iso) return null;
  const m = Math.max(1, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  if (m < 60) return `${m} min`;
  const h = Math.round(m / 60);
  if (h < 48) return `${h}h`;
  return `${Math.round(h / 24)}d`;
};

function statusOf(f) {
  if (f.online && f.away) return { txt: 'Ausente', dot: 'away' };
  if (f.online && f.inClan) return { txt: 'No salão', dot: 'clan' };
  if (f.online) return { txt: 'Online', dot: 'online' };
  const t = tempoAtras(f.last_seen);
  return { txt: t ? `visto há ${t}` : 'Offline', dot: 'off' };
}

export default function Friends({ profile }) {
  const [data, setData] = useState({ friends: [], requests: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [chat, setChat] = useState([]);
  const [text, setText] = useState('');
  const [card, setCard] = useState(null); // { name, gift? }
  const [busca, setBusca] = useState('');
  const [meuCla, setMeuCla] = useState(null);
  useEffect(() => { api('/api/clans/mine').then((r) => setMeuCla(r.clan ? { name: r.clan.name, color: r.clan.flagColor } : null)).catch(() => {}); }, []);
  const plazaHost = useRef(null);
  const plazaRef = useRef(null);
  const boxRef = useRef(null);
  const inputRef = useRef(null);

  const load = () => {
    setError('');
    return api('/api/friends')
      .then((d) => { setData(d); setLoading(false); })
      .catch((e) => { setError(e?.message || 'Não foi possível carregar seus amigos.'); setLoading(false); });
  };
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
      .map((f) => ({ id: f.user_id, name: f.fighter_name, loadout: [], clan: f.clan_name ? { name: f.clan_name, color: f.clan_color } : null }));
    walkers.push({ id: profile.id, name: profile.fighter_name, loadout: [], clan: meuCla });
    plazaRef.current?.setPlayers(walkers);
  }, [data, profile, meuCla]);

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
    setText(`/${name} 😮‍💨 `);
    inputRef.current?.focus();
  };
  const respond = async (id, accept) => {
    await api('/api/friends/respond', { method: 'POST', body: { requestId: id, accept } });
    load();
  };
  const buscar = (e) => {
    e.preventDefault();
    const n = busca.trim();
    if (!n) return;
    setCard({ name: n });
  };

  const onlineCount = data.friends.filter((f) => f.online).length;
  const friends = [...data.friends].sort((a, b) => (b.online ? 1 : 0) - (a.online ? 1 : 0));

  return (
    <div className="scene dash">
      <Navbar profile={profile} />
      <h1 className="dash-name" style={{ marginBottom: 2 }}><Icon name="grupo" size={22} weight="forte" /> AMIGOS</h1>
      <p className="dash-empty" style={{ marginTop: 0 }}>
        {loading ? 'carregando teu círculo…' : <>{data.friends.length} amigo{data.friends.length === 1 ? '' : 's'} · <b style={{ color: '#7de0a8' }}>{onlineCount} online</b> no salão dos amigos</>}
      </p>

      {/* buscar / adicionar */}
      <form className="fr-search" onSubmit={buscar}>
        <Icon name="grupo" size={15} className="fr-search-ico" />
        <input value={busca} onChange={(e) => setBusca(e.target.value)} maxLength={16} placeholder="Pesquisar jogador pelo nome para ver o perfil / adicionar…" />
        <button className="btn btn-blood" type="submit" style={{ width: 'auto', padding: '9px 18px' }}>Buscar</button>
      </form>

      {/* solicitações */}
      {data.requests.length > 0 && (
        <div className="fr-requests">
          <h3 className="pc-section"><Icon name="grupo" size={13} weight="forte" /> PEDIDOS DE AMIZADE <span className="fr-badge">{data.requests.length}</span></h3>
          <div className="fr-req-grid">
            {data.requests.map((r) => (
              <div key={r.id} className="fr-req-card">
                <img className="fr-rank rank-img" src={rankArte(r.tier)} alt="" title={rankNome(r.tier)} />
                <div className="fr-req-info">
                  <button className="fr-name" onClick={() => setCard({ name: r.fighter_name })}>{r.fighter_name}</button>
                  <small>Nv {r.level} · <span style={{ color: rankCor(r.tier) }}>{rankNome(r.tier)}</span></small>
                </div>
                <span className="fr-req-actions">
                  <button className="cv-aceitar" onClick={() => respond(r.id, true)}>ACEITAR</button>
                  <button className="cv-recusar" onClick={() => respond(r.id, false)}>RECUSAR</button>
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* o salão do clã */}
      <div className="cla-plaza" ref={plazaHost} />

      <div className="fr-layout">
        <div className="fr-list">
          <h3 className="pc-section" style={{ margin: '0 0 8px' }}><Icon name="espada" size={13} weight="forte" /> GUERREIROS</h3>

          {error && (
            <div className="fr-error">
              <p>⚠️ {error}</p>
              <button className="btn btn-ghost" style={{ width: 'auto', padding: '8px 16px' }} onClick={() => { setLoading(true); load(); }}>Tentar de novo</button>
            </div>
          )}

          {loading && !error && (
            <div className="fr-friends-grid">
              {[0, 1, 2, 3].map((i) => <div key={i} className="fr-card is-skeleton" />)}
            </div>
          )}

          {!loading && !error && data.friends.length === 0 && (
            <p className="dash-empty">Sem amigos ainda. Vai à Praça, puxa papo e clica nos nomes! 🥷</p>
          )}

          {!loading && !error && data.friends.length > 0 && (
            <div className="fr-friends-grid">
              {friends.map((f) => {
                const st = statusOf(f);
                return (
                  <div key={f.user_id} className={`fr-card st-${st.dot}`}>
                    <div className="fr-card-top">
                      <img className="fr-avatar" src="/arte/avatar-padrao.webp" alt="" />
                      <img className="fr-rank rank-img" src={rankArte(f.tier)} alt="" title={rankNome(f.tier)} />
                      <div className="fr-card-info">
                        <button className="fr-name" onClick={() => setCard({ name: f.fighter_name })}>{f.fighter_name}</button>
                        <span className="fr-meta">Nv {f.level} · <Icon name="trofeu" size={11} weight="forte" /> {fmt(f.rank_points)}</span>
                        {f.clan_name && <span className="fr-clan" style={{ color: f.clan_color || '#ffd76a' }}><Icon name="escudo" size={10} /> {f.clan_name}</span>}
                      </div>
                      <span className={`fr-status dot-${st.dot}`}><i className="fr-dot2" /> {st.txt}</span>
                    </div>
                    <div className="fr-card-actions">
                      <button className="fr-act" onClick={() => setCard({ name: f.fighter_name })}><Icon name="perfil" size={13} /> Perfil</button>
                      <button className="fr-act" onClick={() => whisper(f.fighter_name)}>💬 Sussurrar</button>
                      <button className="fr-act" onClick={() => setCard({ name: f.fighter_name, gift: true })}>🎁 Presente</button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="fr-chat">
          <div className="fr-chat-head">💬 SALÃO DOS AMIGOS <small style={{ color: 'var(--muted)', fontWeight: 400 }}>· /nome para sussurrar</small></div>
          <div className="fr-msgs" ref={boxRef}>
            {chat.map((m, i) => (
              <div key={i} className={`clan-line ${m.private ? 'pv' : ''} ${m.system ? 'sys' : ''}`}>
                {m.system ? <em>{m.text}</em> : (
                  <>
                    <strong className="chat-name" onClick={() => setCard({ name: m.name })}>{m.name}</strong>
                    {m.private && <span className="pv-tag">{Number(m.userId) === Number(profile.id) ? `😮‍💨 ➜ ${m.to}` : '😮‍💨 sussurro'}</span>}
                    : {m.text}
                  </>
                )}
              </div>
            ))}
            {chat.length === 0 && <p className="dash-empty">O salão está em silêncio... quebra o gelo!</p>}
          </div>
          <form className="fr-input" onSubmit={send}>
            <input ref={inputRef} value={text} onChange={(e) => setText(e.target.value)} placeholder="Fala com o clã... (/nome sussurra)" maxLength={100} />
            <button className="btn btn-blood" style={{ width: 'auto', padding: '10px 18px' }}>➤</button>
          </form>
        </div>
      </div>

      {card && <PlayerCard name={card.name} autoGift={card.gift} onClose={() => setCard(null)} onWhisper={whisper} />}
    </div>
  );
}
