// STIKDEAD :: SOCIAL — o hub dos dois salões: Amigos e Clã 👥
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api.js';
import Navbar from '../lib/Navbar.jsx';

export default function Social({ profile }) {
  const nav = useNavigate();
  const [meu, setMeu] = useState(null);
  useEffect(() => { api('/api/clans/mine').then(setMeu).catch(() => {}); }, []);

  return (
    <div className="scene dash">
      <Navbar profile={profile} />
      <h1 className="dash-name" style={{ marginBottom: 4 }}>👥 SOCIAL</h1>
      <p className="dash-empty" style={{ marginTop: 0 }}>Dois salões, duas famílias. Escolhe o teu.</p>
      <div className="soc-grid">
        <button className="soc-card" onClick={() => nav('/social/amigos')}>
          <span className="soc-ico">🧑‍🤝‍🧑</span>
          <span className="soc-title">AMIGOS</span>
          <span className="soc-desc">O salão da tua turma: praça, papo, sussurros e presentes.</span>
        </button>
        <button className="soc-card" onClick={() => nav('/social/cla')}>
          <span className="soc-ico">🛡️</span>
          <span className="soc-title">CLÃ</span>
          <span className="soc-desc">
            {meu?.clan
              ? <>Bandeira hasteada: <b style={{ color: '#ffd76a' }}>{meu.clan.name}</b> — entra no quartel.</>
              : 'Funde o teu (nível 10+) ou aguarde um convite (nível 5+).'}
          </span>
        </button>
      </div>
    </div>
  );
}
