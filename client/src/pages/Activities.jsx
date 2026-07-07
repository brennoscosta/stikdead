// STIKDEAD :: atividades — o diário do lutador + avisos do servidor
import { useEffect, useState } from 'react';
import { api } from '../lib/api.js';
import Navbar from '../lib/Navbar.jsx';
import PlayerCard from '../lib/PlayerCard.jsx';

const ICON = { diamond_purchase: '💎', friend_request: '🤝', friend_accept: '✅', gift_sent: '🎁', gift_received: '🎁' };

export default function Activities({ profile }) {
  const [feed, setFeed] = useState(null);
  const [card, setCard] = useState(null);

  const load = () => api('/api/activities').then(setFeed).catch(() => {});
  useEffect(() => { load(); }, []);

  const accept = async (requestId) => {
    await api('/api/friends/respond', { method: 'POST', body: { requestId, accept: true } });
    load();
  };

  const Name = ({ n }) => <button className="fr-name" onClick={() => setCard(n)}>{n}</button>;
  const line = (a) => {
    const d = a.data || {};
    switch (a.kind) {
      case 'diamond_purchase': return <>Você comprou <b style={{ color: '#9fc4ff' }}>💎 {Number(d.diamonds).toLocaleString('pt-BR')} diamantes</b></>;
      case 'friend_request': return <><Name n={d.from} /> solicitou sua amizade {a.actionable && <button className="adm-btn" onClick={() => accept(d.requestId)}>✓ aceitar</button>}</>;
      case 'friend_accept': return <>Você e <Name n={d.with} /> agora são amigos</>;
      case 'gift_sent': return d.kind === 'coins' || d.kind === 'diamonds'
        ? <>Você enviou <b>{d.kind === 'coins' ? '🪙' : '💎'} {Number(d.amount).toLocaleString('pt-BR')}</b> de presente para <Name n={d.to} /></>
        : <>Você enviou <b>{d.item}</b> de presente para <Name n={d.to} /></>;
      case 'gift_received': return d.kind === 'coins' || d.kind === 'diamonds'
        ? <><Name n={d.from} /> te enviou <b>{d.kind === 'coins' ? '🪙' : '💎'} {Number(d.amount).toLocaleString('pt-BR')}</b> de presente</>
        : <><Name n={d.from} /> te enviou um presente: <b>{d.item}</b></>;
      default: return <>{a.kind}</>;
    }
  };

  // mistura global + pessoal por data
  const merged = feed ? [
    ...feed.personal.map((a) => ({ ...a, _t: new Date(a.created_at).getTime(), _g: false })),
    ...feed.global.map((g) => ({ ...g, _t: new Date(g.created_at).getTime(), _g: true })),
  ].sort((a, b) => b._t - a._t) : [];

  return (
    <div className="scene dash">
      <Navbar profile={profile} />
      <h1 className="dash-name" style={{ marginBottom: 2 }}>📜 ATIVIDADES</h1>
      <p className="dash-empty" style={{ marginTop: 0 }}>{profile.fighter_name} · Nível {profile.level}</p>
      <div className="act-feed">
        {!feed && <p className="dash-empty">Abrindo o diário...</p>}
        {feed && merged.length === 0 && <p className="dash-empty">Nada por aqui ainda — vai lutar! ⚔️</p>}
        {merged.map((a) => a._g ? (
          <div key={`g${a.id}`} className="act-line act-global">
            <span className="act-ico">📢</span>
            <span><b>STIKDEAD:</b> {a.body}</span>
            <small>{new Date(a.created_at).toLocaleDateString('pt-BR')} {new Date(a.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</small>
          </div>
        ) : (
          <div key={a.id} className="act-line">
            <span className="act-ico">{ICON[a.kind] || '•'}</span>
            <span>{line(a)}</span>
            <small>{new Date(a.created_at).toLocaleDateString('pt-BR')} {new Date(a.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</small>
          </div>
        ))}
      </div>
      {card && <PlayerCard name={card} onClose={() => setCard(null)} />}
    </div>
  );
}
