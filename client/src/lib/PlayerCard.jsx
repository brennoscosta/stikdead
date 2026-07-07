// STIKDEAD :: cartão público do jogador — o palco do ego
import { useEffect, useState } from 'react';
import { api } from './api.js';
import ItemIcon from './ItemIcon.jsx';
import { SLOT_LABEL, RARITY_LABEL } from '../pages/Shop.jsx';

export default function PlayerCard({ name, onClose, onWhisper, onGifted }) {
  const [p, setP] = useState(null);
  const [err, setErr] = useState(null);
  const [busy, setBusy] = useState(false);
  const [picking, setPicking] = useState(false);
  const [chest, setChest] = useState(null);
  const openPicker = async () => {
    setPicking(true);
    if (!chest) {
      try { const d = await api('/api/inventory'); setChest(d.chest || []); } catch { setChest([]); }
    }
  };
  const sendGift = async (itemId) => {
    if (!confirm('Enviar este item de presente? Ele sai do seu baú.')) return;
    setBusy(true);
    try {
      await api('/api/gifts/send', { method: 'POST', body: { toName: name, itemId } });
      setPicking(false);
      onGifted?.();
      alert('🎁 Presente enviado!');
    } catch (e) { alert(e.message); }
    setBusy(false);
  };

  const load = () => api(`/api/players/by-name/${encodeURIComponent(name)}`).then(setP).catch((e) => setErr(e.message));
  useEffect(() => { setP(null); setErr(null); load(); /* eslint-disable-next-line */ }, [name]);

  const request = async () => {
    setBusy(true);
    try { await api('/api/friends/request', { method: 'POST', body: { name } }); load(); }
    catch (e) { alert(e.message); }
    setBusy(false);
  };
  const respond = async (accept) => {
    setBusy(true);
    try { await api('/api/friends/respond', { method: 'POST', body: { requestId: p.requestId, accept } }); load(); }
    catch (e) { alert(e.message); }
    setBusy(false);
  };

  return (
    <div className="pc-overlay" onClick={onClose}>
      <div className="pc-card" onClick={(e) => e.stopPropagation()}>
        <button className="pc-close" onClick={onClose}>✕</button>
        {err && <p className="em-err">{err}</p>}
        {!p && !err && <p className="dash-empty">Carregando lutador...</p>}
        {p && (
          <>
            <div className="pc-head">
              <div>
                <h2 className="pc-name">
                  {p.name} {p.online && <span className="pc-online" title="Online agora">●</span>}
                </h2>
                {p.title && <div className="pc-title">「 {p.title} 」</div>}
                <div className="pc-sub">Nível {p.level} · {p.tier}</div>
              </div>
              <div className="pc-trophies">🏆 {Number(p.trophies || 0).toLocaleString('pt-BR')}</div>
            </div>
            <div className="pc-stats">
              <div><b>{p.matches}</b><span>partidas</span></div>
              <div><b style={{ color: '#7de0a8' }}>{p.wins}</b><span>vitórias</span></div>
              <div><b style={{ color: '#ff5a70' }}>{p.losses}</b><span>derrotas</span></div>
              <div><b>{p.winRate}%</b><span>win rate</span></div>
              {p.winStreak > 1 && <div><b>🔥 {p.winStreak}</b><span>sequência</span></div>}
            </div>
            <h3 className="pc-section">EQUIPADO</h3>
            {p.loadout?.length ? (
              <div className="pc-loadout">
                {p.loadout.map((it) => (
                  <div key={it.slot} className={`pc-item r-${it.rarity}`} title={`${it.name} · ${RARITY_LABEL[it.rarity] || it.rarity}`}>
                    <ItemIcon item={it} />
                    <small>{SLOT_LABEL[it.slot] || it.slot}</small>
                  </div>
                ))}
              </div>
            ) : <p className="dash-empty">Luta no estilo raiz — nada equipado.</p>}
            <div className="pc-actions">
              {p.friendship === 'none' && <button className="btn btn-blood" disabled={busy} onClick={request}>➕ Pedir amizade</button>}
              {p.friendship === 'pending_out' && <button className="btn btn-ghost" disabled>⏳ Pedido enviado</button>}
              {p.friendship === 'pending_in' && (
                <>
                  <button className="btn btn-blood" disabled={busy} onClick={() => respond(true)}>✓ Aceitar amizade</button>
                  <button className="btn btn-ghost" disabled={busy} onClick={() => respond(false)}>✕ Recusar</button>
                </>
              )}
              {p.friendship === 'friends' && <span className="pc-friends-badge">🤝 Amigos</span>}
              {p.friendship !== 'self' && (
                <button className="btn btn-ghost" style={{ width: 'auto', padding: '10px 16px' }} disabled={busy} onClick={openPicker}>
                  🎁 Presente
                </button>
              )}
              {p.friendship !== 'self' && onWhisper && (
                <button className="btn btn-ghost" style={{ width: 'auto', padding: '10px 16px' }} onClick={() => { onWhisper(p.name); onClose(); }}>
                  💬 Sussurrar
                </button>
              )}
            </div>
            {picking && (
              <div className="gift-picker">
                <h3 className="pc-section">ESCOLHA O PRESENTE (sai do seu baú)</h3>
                {!chest && <p className="dash-empty">Abrindo seu baú...</p>}
                {chest && chest.length === 0 && <p className="dash-empty">Seu baú está vazio.</p>}
                <div className="pc-loadout">
                  {(chest || []).map((it) => (
                    <button key={it.id} className={`pc-item r-${it.rarity}`} disabled={busy} onClick={() => sendGift(it.id)} title={it.name}>
                      <ItemIcon item={it} />
                      <small>{it.name.slice(0, 14)}</small>
                    </button>
                  ))}
                </div>
                <button className="btn btn-ghost" style={{ width: 'auto', padding: '8px 16px', marginTop: 8 }} onClick={() => setPicking(false)}>Cancelar</button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
