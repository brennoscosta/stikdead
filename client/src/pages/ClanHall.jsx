// STIKDEAD :: SALÃO DO CLÃ — bandeira hasteada, quartel e reputação 🛡️
import { useEffect, useRef, useState } from 'react';
import { api } from '../lib/api.js';
import { getSocket } from '../lib/socket.js';
import { createPlaza } from '../game/praca.js';
import Navbar from '../lib/Navbar.jsx';
import PlayerCard from '../lib/PlayerCard.jsx';

const fmt = (n) => Number(n || 0).toLocaleString('pt-BR');

// a bandeira: foto enviada OU estandarte CSS na cor do clã
export function ClanFlag({ clan, size = 'g' }) {
  return (
    <div className={`flag ${size}`}>
      <div className="flag-mastro" />
      <div className="flag-pano" style={clan.flagUrl ? undefined : { background: `linear-gradient(160deg, ${clan.flagColor}, #12080a 160%)` }}>
        {clan.flagUrl
          ? <img src={clan.flagUrl} alt={clan.name} />
          : <span className="flag-sigla">{clan.name.slice(0, 3).toUpperCase()}</span>}
      </div>
    </div>
  );
}

export default function ClanHall({ profile }) {
  const [meu, setMeu] = useState(null); // { clan, isOwner, canCreate }
  const [chat, setChat] = useState([]);
  const [text, setText] = useState('');
  const [card, setCard] = useState(null);
  const [erro, setErro] = useState('');
  const [editando, setEditando] = useState(false);
  // form de fundação
  const [nome, setNome] = useState('');
  const [lema, setLema] = useState('');
  const [cor, setCor] = useState('#d90429');
  const [flagData, setFlagData] = useState(null);
  const plazaHost = useRef(null);
  const plazaRef = useRef(null);
  const boxRef = useRef(null);

  const load = () => api('/api/clans/mine').then(setMeu).catch(() => {});
  useEffect(() => { load(); const t = setInterval(load, 8000); return () => clearInterval(t); }, []);

  // quartel: praça + canal do clã (só com clã)
  useEffect(() => {
    if (!meu?.clan) return;
    let alive = true;
    const socket = getSocket();
    socket.emit('guild:enter');
    createPlaza(plazaHost.current, { variant: 'guild', onNameClick: (n) => setCard({ name: n }) }).then((p) => {
      if (!alive) return p.destroy();
      plazaRef.current = p;
    });
    const onMsg = (m) => { setChat((c) => [...c.slice(-49), m]); plazaRef.current?.say?.(m.name, m.text); };
    socket.on('guild:msg', onMsg);
    return () => {
      alive = false;
      socket.emit('guild:leave');
      socket.off('guild:msg', onMsg);
      plazaRef.current?.destroy(); plazaRef.current = null;
    };
  }, [!!meu?.clan]);

  useEffect(() => {
    if (!meu?.clan || !plazaRef.current) return;
    plazaRef.current.setPlayers(meu.clan.membros.map((m) => ({ id: m.user_id, name: m.fighter_name, loadout: [] })));
  }, [meu]);
  useEffect(() => { boxRef.current?.scrollTo(0, 999999); }, [chat]);

  const abrirEdicao = () => {
    setNome(meu.clan.name); setLema(meu.clan.motto || ''); setCor(meu.clan.flagColor || '#d90429');
    setFlagData(null); setErro(''); setEditando(true);
  };
  const salvarEdicao = async (e) => {
    e.preventDefault();
    setErro('');
    try {
      const body = { name: nome, motto: lema, flagColor: cor };
      if (flagData) body.flagData = flagData;
      await api('/api/clans', { method: 'PATCH', body });
      setEditando(false);
      load();
    } catch (err) { setErro(err.message || 'Erro ao salvar.'); }
  };
  const fundar = async (e) => {
    e.preventDefault();
    setErro('');
    try {
      await api('/api/clans', { method: 'POST', body: { name: nome, motto: lema, flagColor: cor, flagData } });
      load();
    } catch (err) { setErro(err.message || 'Erro ao fundar.'); }
  };
  const escolherBandeira = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 400 * 1024) { setErro('Bandeira: máximo 400KB.'); return; }
    const r = new FileReader();
    r.onload = () => setFlagData(r.result);
    r.readAsDataURL(f);
  };
  const send = (e) => {
    e.preventDefault();
    const t = text.trim();
    if (!t) return;
    getSocket().emit('guild:send', { text: t });
    setText('');
  };

  if (!meu) return (<div className="scene dash"><Navbar profile={profile} /><p className="dash-empty">Abrindo o quartel...</p></div>);

  // ===== SEM CLÃ: fundação ou espera =====
  if (!meu.clan) {
    return (
      <div className="scene dash">
        <Navbar profile={profile} />
        <h1 className="dash-name" style={{ marginBottom: 2 }}>🛡️ CLÃ</h1>
        {meu.canCreate ? (
          <form className="cla-fundar" onSubmit={fundar}>
            <h3 className="pc-section">FUNDAR UM CLÃ</h3>
            <p className="dash-empty" style={{ marginTop: 0 }}>Nome curto, um lema e a bandeira. O resto é história.</p>
            <input value={nome} onChange={(e) => setNome(e.target.value)} maxLength={12} placeholder="Nome (até 12)" required />
            <input value={lema} onChange={(e) => setLema(e.target.value)} maxLength={30} placeholder="Lema (até 30)" />
            <div className="cla-flag-row">
              <label className="cla-flag-opt">
                🎨 Cor da bandeira
                <input type="color" value={cor} onChange={(e) => setCor(e.target.value)} />
              </label>
              <label className="cla-flag-opt">
                🖼️ Ou envie uma imagem
                <input type="file" accept="image/png,image/jpeg,image/webp" onChange={escolherBandeira} />
              </label>
            </div>
            {flagData && <img src={flagData} alt="prévia" className="cla-flag-preview" />}
            {erro && <p className="dash-err">{erro}</p>}
            <button className="btn btn-blood" style={{ width: 'auto', padding: '11px 26px' }}>🛡️ Fundar clã</button>
          </form>
        ) : (
          <p className="dash-empty">
            {meu.canJoin
              ? 'Você pode ENTRAR num clã (nível 5+): aguarde o convite de um dono — ele te chama clicando no seu nome em qualquer salão. Para FUNDAR o seu, alcance o nível 10.'
              : 'Clãs abrem as portas no nível 5 (entrar) e no nível 10 (fundar). Continue lutando!'}
          </p>
        )}
      </div>
    );
  }

  // ===== COM CLÃ: o quartel =====
  const c = meu.clan;
  const online = c.membros.length; // todos listados; presença fina vem da praça
  return (
    <div className="scene dash">
      <Navbar profile={profile} />
      <div className="cla-head">
        <ClanFlag clan={c} />
        <div>
          <h1 className="dash-name" style={{ margin: 0 }}>{c.name}</h1>
          {c.motto && <p className="cla-lema">“{c.motto}”</p>}
          <p className="cla-rep">
            ⚔️ <b>{fmt(c.reputacao.vitorias)}</b> vitórias dos membros ·
            🛡️ <b>{fmt(c.reputacao.duoWins)}</b>/{fmt(c.reputacao.duoBattles)} batalhas de clã ·
            👥 {c.membros.length} membro{c.membros.length === 1 ? '' : 's'}
          </p>
        </div>
      </div>

      <div className="cla-plaza" ref={plazaHost} />

      <div className="fr-layout">
        <div className="fr-list">
          <h3 className="pc-section" style={{ margin: '0 0 6px' }}>MEMBROS</h3>
          {c.membros.map((m) => (
            <div key={m.user_id} className="fr-friend">
              <span className="fr-dot online" />
              <button className="fr-name" onClick={() => setCard({ name: m.fighter_name })}>
                {m.fighter_name}{m.user_id === c.ownerId ? ' 👑' : ''}
              </button>
              <small>Nv {m.level} · 🏆 {fmt(m.rank_points)}</small>
            </div>
          ))}
          {meu.isOwner && <p className="dash-empty" style={{ fontSize: 12 }}>👑 Para convidar: clique no nome de alguém em qualquer salão e use o botão do clã.</p>}
          {meu.isOwner && !editando && (
            <button className="btn btn-ghost" style={{ width: 'auto', padding: '8px 16px', marginTop: 4 }} onClick={abrirEdicao}>⚙️ Editar clã</button>
          )}
          {meu.isOwner && editando && (
            <form className="cla-fundar" style={{ marginTop: 8 }} onSubmit={salvarEdicao}>
              <h3 className="pc-section">EDITAR CLÃ</h3>
              <input value={nome} onChange={(e) => setNome(e.target.value)} maxLength={12} placeholder="Nome (até 12)" required />
              <input value={lema} onChange={(e) => setLema(e.target.value)} maxLength={30} placeholder="Lema (até 30)" />
              <div className="cla-flag-row">
                <label className="cla-flag-opt">🎨 Cor da bandeira <input type="color" value={cor} onChange={(e) => setCor(e.target.value)} /></label>
                <label className="cla-flag-opt">🖼️ Trocar imagem <input type="file" accept="image/png,image/jpeg,image/webp" onChange={escolherBandeira} /></label>
              </div>
              {flagData && <img src={flagData} alt="prévia" className="cla-flag-preview" />}
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn btn-blood" style={{ width: 'auto', padding: '10px 20px' }}>💾 Salvar</button>
                <button type="button" className="btn btn-ghost" style={{ width: 'auto', padding: '10px 16px' }} onClick={() => setEditando(false)}>Cancelar</button>
              </div>
            </form>
          )}
          <button className="btn btn-ghost" style={{ width: 'auto', padding: '8px 16px', marginTop: 8 }}
            onClick={async () => { try { await api('/api/clans/leave', { method: 'POST', body: {} }); load(); } catch (e) { setErro(e.message); } }}>
            {meu.isOwner ? 'Dissolver (se vazio)' : 'Sair do clã'}
          </button>
          {erro && <p className="dash-err">{erro}</p>}
        </div>

        <div className="fr-chat">
          <div className="fr-chat-head">💬 QUARTEL — só o clã ouve</div>
          <div className="fr-msgs" ref={boxRef}>
            {chat.map((m, i) => (
              <div key={i} className="clan-line">
                <strong className="chat-name" onClick={() => setCard({ name: m.name })}>{m.name}</strong>: {m.text}
              </div>
            ))}
            {chat.length === 0 && <p className="dash-empty">O quartel está em silêncio... convoca a tropa!</p>}
          </div>
          <form className="fr-input" onSubmit={send}>
            <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Fala com o clã..." maxLength={100} />
            <button className="btn btn-blood" style={{ width: 'auto', padding: '10px 18px' }}>➤</button>
          </form>
        </div>
      </div>

      {card && <PlayerCard name={card.name} onClose={() => setCard(null)} />}
    </div>
  );
}
