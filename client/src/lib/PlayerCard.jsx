// STIKDEAD :: cartão público do jogador — o palco do ego
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { api } from './api.js';
import ItemIcon from './ItemIcon.jsx';
import { SLOT_LABEL, RARITY_LABEL } from '../pages/Shop.jsx';

export default function PlayerCard({ name, onClose, onWhisper, onGifted, autoGift }) {
  const [p, setP] = useState(null);
  const [err, setErr] = useState(null);
  const [busy, setBusy] = useState(false);
  const [picking, setPicking] = useState(false);
  const [chest, setChest] = useState(null);
  const [chosen, setChosen] = useState(null);      // item escolhido para presente
  const [giftMsg, setGiftMsg] = useState('');
  const [giftKind, setGiftKind] = useState(null);  // 'item' | 'coins' | 'diamonds'
  const [amount, setAmount] = useState('');
  const [wallet, setWallet] = useState(null);
  useEffect(() => { if (autoGift) openPicker(); /* eslint-disable-next-line */ }, [autoGift]);
  const openPicker = async () => {
    setPicking(true);
    setGiftKind(null);
    if (!wallet) {
      try { const d = await api('/api/auth/me'); setWallet({ coins: d.profile.coins, diamonds: d.profile.diamonds || 0 }); } catch { /* segue */ }
    }
    if (!chest) {
      try { const d = await api('/api/inventory'); setChest(d.chest || []); } catch { setChest([]); }
    }
  };
  const sendGift = async () => {
    setBusy(true);
    try {
      const body = giftKind === 'item'
        ? { toName: name, kind: 'item', itemId: chosen.id, message: giftMsg.trim() || undefined }
        : { toName: name, kind: giftKind, amount: Math.floor(Number(amount)), message: giftMsg.trim() || undefined };
      await api('/api/gifts/send', { method: 'POST', body });
      setPicking(false); setChosen(null); setGiftMsg(''); setGiftKind(null); setAmount('');
      onGifted?.();
      alert('🎁 Presente enviado!');
    } catch (e) { alert(e.message); }
    setBusy(false);
  };

  const load = () => api(`/api/players/by-name/${encodeURIComponent(name)}`).then(setP).catch((e) => setErr(e.message));
  useEffect(() => { setP(null); setErr(null); load(); /* eslint-disable-next-line */ }, [name]);
  useEffect(() => {
    const sair = () => onClose?.();
    window.addEventListener('stik:closecard', sair);
    return () => window.removeEventListener('stik:closecard', sair);
    /* eslint-disable-next-line */
  }, []);

  const request = async () => {
    setBusy(true);
    try {
      await api('/api/friends/request', { method: 'POST', body: { name } });
      load(); // pending_out: o botão evapora — o modal de espera assume
    } catch (e) { alert(e.message); }
    setBusy(false);
  };
  const respond = async (accept) => {
    setBusy(true);
    try { await api('/api/friends/respond', { method: 'POST', body: { requestId: p.requestId, accept } }); load(); }
    catch (e) { alert(e.message); }
    setBusy(false);
  };

  return createPortal(
    <div className="pc-overlay" onClick={onClose}>
      <div className="pc-card" onClick={(e) => e.stopPropagation()}>
        <button className="pc-close" onClick={onClose}>✕</button>
        {err && <p className="em-err">{err}</p>}
        {!p && !err && <p className="dash-empty">Carregando lutador...</p>}
        {p && (
          <>
            {picking && (
              <div className="gift-picker" style={{ borderTop: 'none', marginTop: 0 }}>
                <h2 className="pc-name" style={{ fontSize: 22, textAlign: 'center' }}>🎁 PRESENTE PARA {p.name.toUpperCase()}</h2>
                {!giftKind && (
                  <div className="gift-kinds">
                    <button className="gift-kind" onClick={() => setGiftKind('item')}>🎒<b>Item do baú</b></button>
                    <button className="gift-kind" onClick={() => setGiftKind('coins')}>🪙<b>Moedas</b>{wallet && <small>tenho {Number(wallet.coins).toLocaleString('pt-BR')}</small>}</button>
                    <button className="gift-kind" onClick={() => setGiftKind('diamonds')}>💎<b>Diamantes</b>{wallet && <small>tenho {Number(wallet.diamonds).toLocaleString('pt-BR')}</small>}</button>
                  </div>
                )}
                {(giftKind === 'coins' || giftKind === 'diamonds') && (
                  <div className="gift-confirm">
                    <div className="gift-cur">{giftKind === 'coins' ? '🪙' : '💎'}</div>
                    <input
                      className="em-body" type="number" min="1" step="1"
                      placeholder={`Quantidade de ${giftKind === 'coins' ? 'moedas' : 'diamantes'}...`}
                      value={amount} onChange={(e) => setAmount(e.target.value)}
                      style={{ textAlign: 'center', fontSize: 18 }}
                    />
                    <div className="gift-quick">
                      {(giftKind === 'coins' ? [100, 500, 1000] : [10, 50, 100]).map((v) => (
                        <button key={v} className="adm-btn" onClick={() => setAmount(String(v))}>{v.toLocaleString('pt-BR')}</button>
                      ))}
                    </div>
                    <textarea
                      className="em-body" rows={2} maxLength={200}
                      placeholder="Mensagem para acompanhar o presente (opcional)..."
                      value={giftMsg} onChange={(e) => setGiftMsg(e.target.value)}
                    />
                    <div className="pc-actions" style={{ marginTop: 8, justifyContent: 'center' }}>
                      <button className="btn btn-blood" style={{ width: 'auto', padding: '10px 20px' }}
                        disabled={busy || !(Math.floor(Number(amount)) >= 1)} onClick={sendGift}>
                        🎁 Enviar {amount && Math.floor(Number(amount)) >= 1 ? Math.floor(Number(amount)).toLocaleString('pt-BR') : ''} {giftKind === 'coins' ? '🪙' : '💎'}
                      </button>
                      <button className="btn btn-ghost" style={{ width: 'auto', padding: '10px 16px' }} onClick={() => { setGiftKind(null); setAmount(''); }}>← Voltar</button>
                    </div>
                  </div>
                )}
                {giftKind === 'item' && !chosen ? (
                  <>
                    <h3 className="pc-section">ESCOLHA O ITEM (sai do seu baú)</h3>
                    {!chest && <p className="dash-empty">Abrindo seu baú...</p>}
                    {chest && chest.length === 0 && <p className="dash-empty">Seu baú está vazio.</p>}
                    <div className="pc-loadout">
                      {(chest || []).map((it, idx) => (
                        <button key={`${it.id}_${idx}`} className={`pc-item r-${it.rarity}`} disabled={busy} onClick={() => setChosen(it)} title={it.name}>
                          <ItemIcon item={it} />
                          <small>{it.name.slice(0, 14)}</small>
                        </button>
                      ))}
                    </div>
                  </>
                ) : null}
                {giftKind === 'item' && chosen && (
                  <div className="gift-confirm">
                    <div className={`pc-item r-${chosen.rarity}`} style={{ display: 'inline-block' }}>
                      <ItemIcon item={chosen} />
                      <small>{chosen.name.slice(0, 16)}</small>
                    </div>
                    <textarea
                      className="em-body" rows={2} maxLength={200}
                      placeholder="Mensagem para acompanhar o presente (opcional)..."
                      value={giftMsg} onChange={(e) => setGiftMsg(e.target.value)}
                    />
                    <div className="pc-actions" style={{ marginTop: 8, justifyContent: 'center' }}>
                      <button className="btn btn-blood" style={{ width: 'auto', padding: '10px 20px' }} disabled={busy} onClick={sendGift}>
                        🎁 Enviar presente
                      </button>
                      <button className="btn btn-ghost" style={{ width: 'auto', padding: '10px 16px' }} onClick={() => setChosen(null)}>← Trocar item</button>
                    </div>
                  </div>
                )}
                <button className="btn btn-ghost" style={{ width: 'auto', padding: '8px 16px', marginTop: 10 }} onClick={() => { setPicking(false); setChosen(null); }}>← Voltar ao perfil</button>
              </div>
            )}
            {!picking && (<>
            <div className="pc-head">
              <div>
                <h2 className="pc-name">
                  {p.name} {p.online && !p.away && <span className="pc-online" title="Online agora">●</span>}{p.online && p.away && <span className="pc-away" title="Ausente — aba em segundo plano">💤</span>}
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
            {(p.insano?.w > 0 || p.insano?.l > 0) && (
              <div className="pc-insano" title="O registro contra a máquina impiedosa">
                🤖 <b>VS BOT INSANO:</b>
                <span className="pi-w">{p.insano.w} vitória{p.insano.w === 1 ? '' : 's'}</span>
                <span className="pi-sep">·</span>
                <span className="pi-l">{p.insano.l} derrota{p.insano.l === 1 ? '' : 's'}</span>
                {p.insano.l >= 10 && p.insano.w === 0 && <span className="pi-zoeira">💀 a máquina agradece</span>}
                {p.insano.w >= 5 && <span className="pi-zoeira">⚡ domador de máquina</span>}
              </div>
            )}
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
            {(p.clan || p.clanHistory?.length > 0) && (
              <div className="pc-clas">
                <h4 className="pc-section" style={{ margin: '8px 0 4px' }}>🛡️ CLÃS</h4>
                {p.clan && (
                  <button className="pc-cla-chip atual" onClick={() => { onClose?.(); window.location.href = `/cla/${p.clan.id}`; }}>
                    {p.clan.name} <small>· atual</small>
                  </button>
                )}
                {p.clanHistory?.filter((h) => !h.atual).map((h, i) => (
                  h.id
                    ? <button key={i} className="pc-cla-chip" onClick={() => { onClose?.(); window.location.href = `/cla/${h.id}`; }}>{h.name}</button>
                    : <span key={i} className="pc-cla-chip morto" title="Clã dissolvido">{h.name} ✝</span>
                ))}
              </div>
            )}
            <div className="pc-actions">
              {p.friendship === 'none' && <button className="btn btn-blood" disabled={busy} onClick={request}>➕ Pedir amizade</button>}
              {p.friendship !== 'self' && (
                <button className="btn btn-ghost" style={{ width: 'auto' }} disabled={busy} title="Convidar para o seu clã (só o dono)"
                  onClick={async () => {
                    setBusy(true);
                    try { await api('/api/clans/invite', { method: 'POST', body: { name } }); setErr('✅ Convite de clã enviado!'); }
                    catch (e) { setErr(e.message || 'Não foi possível convidar.'); }
                    setBusy(false);
                  }}>🛡️ Clã</button>
              )}
              
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
            </>)}
          </>
        )}
      </div>
    </div>,
    document.body
  );
}
