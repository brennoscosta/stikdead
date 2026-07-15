import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api.js';
import Navbar from '../lib/Navbar.jsx';
import Icon from '../ds/Icon.jsx';

// ícone e cor de cada missão pelo texto — só apresentação
const iconeDaMissao = (label) => {
  const l = String(label).toLowerCase();
  if (l.includes('venç') || l.includes('venc')) return ['espada', '#ff2244'];
  if (l.includes('combo')) return ['combo', '#8b5cf6'];
  if (l.includes('bloque')) return ['escudo', '#4da3ff'];
  if (l.includes('dano')) return ['ultimate', '#ff7a1a'];
  if (l.includes('skill') || l.includes('especia')) return ['aura', '#4dee98'];
  if (l.includes('finaliz')) return ['favorito', '#ffd166'];
  if (l.includes('partida') || l.includes('lute')) return ['soco', '#e0a10b'];
  return ['missoes', '#9a938a'];
};

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

  const total = missions.length || 3;

  return (
    <div className="scene scene-nav">
      <Navbar profile={profile} />
      {notice && <div className={`shop-notice ${notice.ok ? 'ok' : 'err'}`} role="status">{notice.text}</div>}

      <div className="mis-layout">
        {/* ===== abas (mockup: sidebar esquerda) ===== */}
        <aside className="loja-menu mis-menu">
          <h1 className="loja-titulo"><Icon name="missoes" size={19} weight="forte" /> MISSÕES</h1>
          <button className="on">
            <Icon name="missoes" size={14} weight="forte" /> DIÁRIAS
            {missions.some((m) => m.progress >= m.goal && !m.claimed) && <b className="mm-badge">{missions.filter((m) => m.progress >= m.goal && !m.claimed).length}</b>}
          </button>
          <button disabled><Icon name="conquista" size={14} weight="forte" /> SEMANAIS <span className="mm-breve">EM BREVE</span></button>
          <button disabled><Icon name="passe" size={14} weight="forte" /> MENSAIS <span className="mm-breve">EM BREVE</span></button>
          <button disabled><Icon name="aura" size={14} weight="forte" /> EVENTOS <span className="mm-breve">EM BREVE</span></button>
        </aside>

        {/* ===== centro: cabeçalho + linhas + baú ===== */}
        <main className="mis-centro">
          <header className="mis-topo">
            <div className="mt-info">
              <b>MISSÕES DIÁRIAS</b>
              <span>{doneCount}/{total} concluídas · renovam à meia-noite</span>
              <div className="mission-bar"><div className="mission-fill" style={{ width: `${(doneCount / total) * 100}%` }} /></div>
            </div>
            <img className="mt-bau" src="/arte/bau.png" alt="" />
          </header>

          {missions.map((m) => {
            const done = m.progress >= m.goal;
            const [icone, cor] = iconeDaMissao(m.label);
            return (
              <div key={m.id} className={`mis-linha ${done ? 'done' : ''} ${m.claimed ? 'coletada' : ''}`}>
                <span className="ml-ico" style={{ '--mi-cor': cor }}><Icon name={icone} size={19} weight="forte" /></span>
                <div className="ml-info">
                  <b>{m.label}</b>
                  <div className="mission-bar"><div className="mission-fill" style={{ width: `${Math.min(100, (m.progress / m.goal) * 100)}%` }} /></div>
                </div>
                <span className="ml-prog">{Math.min(m.progress, m.goal)}<i>/{m.goal}</i></span>
                <span className="ml-premio"><Icon name="moeda" size={14} weight="forte" /> {m.coins}</span>
                {m.claimed ? (
                  <span className="ml-feito">CONCLUÍDA ✓</span>
                ) : done ? (
                  <button className="ml-coletar" onClick={() => claim(m)}>COLETAR</button>
                ) : (
                  <button className="ml-ir" onClick={() => nav('/lobby')}>IR</button>
                )}
              </div>
            );
          })}

          <section className={`mis-bau ${allClaimed && !chestClaimed ? 'pronto' : ''}`}>
            <img src="/arte/bau.png" alt="" />
            <div className="mb-info">
              <b>BAÚ DE MISSÕES</b>
              <span>Complete e colete as {total} missões do dia para liberar</span>
              <div className="mission-bar"><div className="mission-fill" style={{ width: `${(missions.filter((m) => m.claimed).length / total) * 100}%` }} /></div>
            </div>
            {chestClaimed ? (
              <span className="ml-feito">ABERTO ✓</span>
            ) : (
              <button className="mb-abrir" disabled={!allClaimed} onClick={openChest}>ABRIR</button>
            )}
          </section>

          <div className="mis-acoes">
            <button className="btn btn-blood" style={{ width: 'auto', padding: '11px 24px' }} onClick={() => nav('/lobby')}>
              <Icon name="espada" size={13} weight="forte" /> IR LUTAR
            </button>
          </div>
        </main>
      </div>
    </div>
  );
}
