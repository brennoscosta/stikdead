// STIKDEAD :: perfil público do CLÃ — a bandeira, a tropa, as patentes e as medalhas 🛡️
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../lib/api.js';
import Navbar from '../lib/Navbar.jsx';
import PatentTip from '../lib/PatentTip.jsx';
import PlayerCard from '../lib/PlayerCard.jsx';
import { ClanFlag } from './ClanHall.jsx';
import { patentFor } from '../../../shared/patents.js';
import { formaMetal } from '../lib/StatusMedal.jsx';

const fmt = (n) => Number(n || 0).toLocaleString('pt-BR');

export default function ClanPublic({ profile }) {
  const { id } = useParams();
  const nav = useNavigate();
  const [c, setC] = useState(null);
  const [erro, setErro] = useState('');
  const [card, setCard] = useState(null);

  useEffect(() => {
    api(`/api/clans/${id}/public`).then((r) => setC(r.clan)).catch((e) => setErro(e.message));
  }, [id]);

  if (erro) return (<div className="scene dash"><Navbar profile={profile} /><p className="dash-empty">🛡️ {erro}</p></div>);
  if (!c) return (<div className="scene dash"><Navbar profile={profile} /><p className="dash-empty">Levantando a bandeira...</p></div>);

  return (
    <div className="scene dash">
      <Navbar profile={profile} />
      <PatentTip />
      <div className="cla-head">
        <ClanFlag clan={c} />
        <div>
          <h1 className="dash-name" style={{ margin: 0 }}>{c.name}</h1>
          {c.motto && <p className="cla-lema">“{c.motto}”</p>}
          <p className="cla-rep">
            ⚔️ <b>{fmt(c.reputacao.vitorias)}</b> vitórias dos membros ·
            🛡️ <b>{fmt(c.reputacao.duoWins)}</b>/{fmt(c.reputacao.duoBattles)} batalhas de clã ·
            👥 {c.membros.length} lutador{c.membros.length === 1 ? '' : 'es'}
          </p>
        </div>
      </div>

      <h3 className="pc-section" style={{ marginTop: 16 }}>A TROPA</h3>
      <ul className="clapub-lista">
        {c.membros.map((m) => {
          const pat = patentFor(m.level);
          const fm = formaMetal(m);
          return (
            <li key={m.user_id} className="clapub-membro">
              {pat ? (
                <button className="rk-pat" title={pat.name}
                  onPointerDown={(e) => { e.stopPropagation(); window.dispatchEvent(new CustomEvent('stik:patenttip', { detail: { patent: pat, unlocked: true, x: e.clientX, y: e.clientY } })); }}>
                  <img src={pat.icon} alt="" onError={(e) => { e.currentTarget.outerHTML = `<span style="font-size:16px">${pat.emoji}</span>`; }} />
                </button>
              ) : <span className="rk-pat rk-pat-vazia">—</span>}
              <button className="fr-name" onClick={() => setCard(m.fighter_name)}>
                {m.fighter_name}{m.user_id === c.ownerId ? ' 👑' : ''}
              </button>
              <small>Nv {m.level}{pat ? ` · ${pat.name}` : ''}</small>
              <span className="clapub-medal" style={{ color: fm.cor }} title={`Forma ${fm.forma}/7`}>🏅 {fm.nome}</span>
              <span className="clapub-rec">{m.wins}V · {m.losses}D</span>
            </li>
          );
        })}
      </ul>

      <button className="btn btn-ghost" style={{ width: 'auto', padding: '10px 22px', marginTop: 14 }} onClick={() => nav(-1)}>← Voltar</button>
      {card && <PlayerCard name={card} onClose={() => setCard(null)} />}
    </div>
  );
}
