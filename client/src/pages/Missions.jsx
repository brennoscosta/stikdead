import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api.js';
import Navbar from '../lib/Navbar.jsx';
import Icon from '../ds/Icon.jsx';

// ícone e cor de cada objetivo pelo texto — só apresentação
const iconeDaMissao = (label) => {
  const l = String(label).toLowerCase();
  if (l.includes('venç') || l.includes('venc')) return ['espada', '#ff2244'];
  if (l.includes('combo')) return ['combo', '#8b5cf6'];
  if (l.includes('bloque')) return ['escudo', '#4da3ff'];
  if (l.includes('dano')) return ['ultimate', '#ff7a1a'];
  if (l.includes('minuto') || l.includes('tempo')) return ['aura', '#4dd0e1'];
  if (l.includes('skill') || l.includes('especia')) return ['aura', '#4dee98'];
  if (l.includes('finaliz')) return ['favorito', '#ffd166'];
  if (l.includes('partida') || l.includes('jogue') || l.includes('lute')) return ['soco', '#e0a10b'];
  return ['missoes', '#9a938a'];
};

// progresso formatado: metas de tempo guardam segundos, exibem minutos
const fmtProg = (m) => {
  if (m.kind === 'time') return { cur: Math.floor(Math.min(m.progress, m.goal) / 60), max: Math.floor(m.goal / 60), unit: ' min' };
  return { cur: Math.min(m.progress, m.goal), max: m.goal, unit: '' };
};

export default function Missions({ profile, onProfile }) {
  const nav = useNavigate();
  const [tab, setTab] = useState('diarias'); // 'diarias' | 'metas'
  const [missions, setMissions] = useState([]);
  const [chestClaimed, setChestClaimed] = useState(false);
  const [metas, setMetas] = useState([]);
  const [bonusClaimed, setBonusClaimed] = useState(false);
  const [bonusDiamonds, setBonusDiamonds] = useState(5);
  const [notice, setNotice] = useState(null);

  const load = () =>
    api('/api/missions').then((d) => { setMissions(d.missions); setChestClaimed(d.chestClaimed); });
  const loadMetas = () =>
    api('/api/metas').then((d) => { setMetas(d.metas); setBonusClaimed(d.bonusClaimed); setBonusDiamonds(d.bonusDiamonds || 5); });
  useEffect(() => { load(); loadMetas(); }, []);

  const claim = async (m) => {
    setNotice(null);
    try {
      const d = await api('/api/missions/claim', { method: 'POST', body: { missionId: m.id } });
      setMissions(d.missions);
      onProfile?.((p) => ({ ...p, coins: d.coins }));
      setNotice({ ok: true, text: `+${m.coins} moedas!` });
    } catch (err) { setNotice({ ok: false, text: err.message }); }
  };

  const openChest = async () => {
    setNotice(null);
    try {
      const d = await api('/api/missions/chest', { method: 'POST' });
      setChestClaimed(true);
      if (d.item) setNotice({ ok: true, text: `Baú aberto: ${d.item.name}!` });
      else { setNotice({ ok: true, text: 'Baú aberto: +300 moedas!' }); onProfile?.((p) => ({ ...p, coins: d.coins })); }
    } catch (err) { setNotice({ ok: false, text: err.message }); }
  };

  const claimMeta = async (m) => {
    setNotice(null);
    try {
      const d = await api('/api/metas/claim', { method: 'POST', body: { metaId: m.id } });
      setMetas(d.metas);
      onProfile?.((p) => ({ ...p, coins: d.coins }));
      setNotice({ ok: true, text: `+${m.coins} moedas!` });
    } catch (err) { setNotice({ ok: false, text: err.message }); }
  };

  const claimBonus = async () => {
    setNotice(null);
    try {
      const d = await api('/api/metas/bonus', { method: 'POST' });
      setBonusClaimed(true);
      onProfile?.((p) => ({ ...p, diamonds: d.diamonds }));
      setNotice({ ok: true, text: `Bônus de metas: +${bonusDiamonds} diamantes!` });
    } catch (err) { setNotice({ ok: false, text: err.message }); }
  };

  const isMetas = tab === 'metas';
  const list = isMetas ? metas : missions;
  const doneCount = list.filter((m) => m.progress >= m.goal).length;
  const total = list.length || (isMetas ? 4 : 3);
  const allClaimed = list.length > 0 && list.every((m) => m.claimed);
  const metasPend = metas.filter((m) => m.progress >= m.goal && !m.claimed).length;
  const misPend = missions.filter((m) => m.progress >= m.goal && !m.claimed).length;

  return (
    <div className="scene scene-nav">
      <Navbar profile={profile} />
      {notice && <div className={`shop-notice ${notice.ok ? 'ok' : 'err'}`} role="status">{notice.text}</div>}

      <div className="mis-layout">
        <aside className="loja-menu mis-menu">
          <h1 className="loja-titulo"><Icon name="missoes" size={19} weight="forte" /> MISSÕES</h1>
          <button className={isMetas ? '' : 'on'} onClick={() => setTab('diarias')}>
            <Icon name="missoes" size={14} weight="forte" /> DIÁRIAS
            {misPend > 0 && <b className="mm-badge">{misPend}</b>}
          </button>
          <button className={isMetas ? 'on' : ''} onClick={() => setTab('metas')}>
            <Icon name="favorito" size={14} weight="forte" /> METAS
            {metasPend > 0 && <b className="mm-badge">{metasPend}</b>}
          </button>
          <button disabled><Icon name="conquista" size={14} weight="forte" /> SEMANAIS <span className="mm-breve">EM BREVE</span></button>
          <button disabled><Icon name="passe" size={14} weight="forte" /> MENSAIS <span className="mm-breve">EM BREVE</span></button>
          <button disabled><Icon name="aura" size={14} weight="forte" /> EVENTOS <span className="mm-breve">EM BREVE</span></button>
        </aside>

        <main className="mis-centro">
          <header className="mis-topo">
            <div className="mt-info">
              <b>{isMetas ? 'METAS DIÁRIAS' : 'MISSÕES DIÁRIAS'}</b>
              <span>{doneCount}/{total} concluídas · renovam à meia-noite</span>
              <div className="mission-bar"><div className="mission-fill" style={{ width: `${(doneCount / total) * 100}%` }} /></div>
            </div>
            <img className="mt-bau" src={isMetas ? '/arte/rank-diamante.png' : '/arte/bau.png'} alt="" />
          </header>

          {list.map((m) => {
            const done = m.progress >= m.goal;
            const [icone, cor] = iconeDaMissao(m.label);
            const p = fmtProg(m);
            return (
              <div key={m.id} className={`mis-linha ${done ? 'done' : ''} ${m.claimed ? 'coletada' : ''}`}>
                <span className="ml-ico" style={{ '--mi-cor': cor }}><Icon name={icone} size={19} weight="forte" /></span>
                <div className="ml-info">
                  <b>{m.label}</b>
                  <div className="mission-bar"><div className="mission-fill" style={{ width: `${Math.min(100, (m.progress / m.goal) * 100)}%` }} /></div>
                </div>
                <span className="ml-prog">{p.cur}<i>/{p.max}{p.unit}</i></span>
                <span className="ml-premio"><Icon name="moeda" size={14} weight="forte" /> {m.coins}</span>
                {m.claimed ? (
                  <span className="ml-feito">CONCLUÍDA ✓</span>
                ) : done ? (
                  <button className="ml-coletar" onClick={() => (isMetas ? claimMeta(m) : claim(m))}>COLETAR</button>
                ) : (
                  <button className="ml-ir" onClick={() => nav('/lobby')}>IR</button>
                )}
              </div>
            );
          })}

          {isMetas ? (
            <section className={`mis-bau mis-bonus ${allClaimed && !bonusClaimed ? 'pronto' : ''}`}>
              <span className="mb-diamante"><Icon name="diamante" size={40} weight="forte" /></span>
              <div className="mb-info">
                <b>BÔNUS DE METAS</b>
                <span>Complete e colete as {total} metas do dia para ganhar {bonusDiamonds} diamantes</span>
                <div className="mission-bar"><div className="mission-fill" style={{ width: `${(metas.filter((m) => m.claimed).length / total) * 100}%` }} /></div>
              </div>
              {bonusClaimed ? (
                <span className="ml-feito">RESGATADO ✓</span>
              ) : (
                <button className="mb-abrir" disabled={!allClaimed} onClick={claimBonus}>RESGATAR</button>
              )}
            </section>
          ) : (
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
          )}

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
