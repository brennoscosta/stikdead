import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api.js';
import Navbar from '../lib/Navbar.jsx';

export default function Missions({ profile, onProfile }) {
  const nav = useNavigate();
  const [missions, setMissions] = useState([]);
  const [chestClaimed, setChestClaimed] = useState(false);
  const [notice, setNotice] = useState(null);

  const load = () =>
    api('/api/missions').then((d) => {
      setMissions(d.missions);
      setChestClaimed(d.chestClaimed);
    });
  useEffect(() => { load(); }, []);

  const claim = async (m) => {
    setNotice(null);
    try {
      const d = await api('/api/missions/claim', { method: 'POST', body: { missionId: m.id } });
      setMissions(d.missions);
      onProfile?.((p) => ({ ...p, coins: d.coins }));
      setNotice({ ok: true, text: `+${m.coins} moedas!` });
    } catch (err) {
      setNotice({ ok: false, text: err.message });
    }
  };

  const openChest = async () => {
    setNotice(null);
    try {
      const d = await api('/api/missions/chest', { method: 'POST' });
      setChestClaimed(true);
      if (d.item) setNotice({ ok: true, text: `🎁 Baú aberto: ${d.item.name}!` });
      else {
        setNotice({ ok: true, text: '🎁 Baú aberto: +300 moedas!' });
        onProfile?.((p) => ({ ...p, coins: d.coins }));
      }
    } catch (err) {
      setNotice({ ok: false, text: err.message });
    }
  };

  const allClaimed = missions.length > 0 && missions.every((m) => m.claimed);
  const doneCount = missions.filter((m) => m.progress >= m.goal).length;

  return (
    <div className="scene scene-nav">
      <Navbar profile={profile} />
      <h1 className="brand" style={{ fontSize: 'clamp(36px, 7vw, 54px)' }}>
        MISSÕES <span className="red">DIÁRIAS</span>
      </h1>
      <div className="tagline">{doneCount}/3 concluídas · renovam à meia-noite</div>
      {notice && <div className={`shop-notice ${notice.ok ? 'ok' : 'err'}`} role="status">{notice.text}</div>}

      <div className="missions-list">
        {missions.map((m) => {
          const done = m.progress >= m.goal;
          return (
            <div key={m.id} className={`mission-card ${done ? 'done' : ''}`}>
              <div className="mission-info">
                <span className="mission-label">{m.label}</span>
                <div className="mission-bar">
                  <div className="mission-fill" style={{ width: `${Math.min(100, (m.progress / m.goal) * 100)}%` }} />
                </div>
                <span className="mission-progress">{Math.min(m.progress, m.goal)}/{m.goal}</span>
              </div>
              {m.claimed ? (
                <span className="mission-claimed">COLETADA ✓</span>
              ) : done ? (
                <button className="mission-claim" onClick={() => claim(m)}>🪙 {m.coins}</button>
              ) : (
                <span className="mission-reward">🪙 {m.coins}</span>
              )}
            </div>
          );
        })}
      </div>

      <div className={`chest-card ${allClaimed && !chestClaimed ? 'ready' : ''}`}>
        <span style={{ fontSize: 34 }}>🧰</span>
        <div style={{ flex: 1, textAlign: 'left' }}>
          <strong>BAÚ DIÁRIO</strong>
          <div className="item-slot">Complete e colete as 3 missões para liberar</div>
        </div>
        {chestClaimed ? (
          <span className="mission-claimed">ABERTO ✓</span>
        ) : (
          <button className="mission-claim" disabled={!allClaimed} onClick={openChest}>ABRIR</button>
        )}
      </div>

      <div style={{ display: 'flex', gap: 12, marginTop: 26 }}>
        <button className="btn btn-blood" style={{ width: 'auto', padding: '12px 26px' }} onClick={() => nav('/lobby')}>
          Ir lutar
        </button>
        <button className="btn btn-ghost" style={{ width: 'auto', padding: '12px 26px' }} onClick={() => nav('/perfil')}>
          Voltar
        </button>
      </div>
    </div>
  );
}
