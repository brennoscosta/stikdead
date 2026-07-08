// STIKDEAD :: pedido de amizade em tempo real — 15 segundos para o destino decidir 🤝⏱️
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { api } from './api.js';
import { getSocket } from './socket.js';

export default function FriendAskModal() {
  const [modal, setModal] = useState(null); // {mode:'ask'|'wait'|'result', requestId, name, accepted?, deadline}
  const [now, setNow] = useState(Date.now());
  const busyRef = useRef(false);

  useEffect(() => {
    const s = getSocket();
    const onAsk = (p) => setModal((m) => m ? m : { mode: 'ask', requestId: p.requestId, name: p.from, total: (p.ttl || 30) * 1000, deadline: Date.now() + (p.ttl || 30) * 1000 });
    const onWait = (p) => setModal({ mode: 'wait', requestId: p.requestId, name: p.to, total: (p.ttl || 30) * 1000, deadline: Date.now() + (p.ttl || 30) * 1000 });
    const onAnswer = (p) => setModal((m) => (m && m.requestId === p.requestId)
      ? { mode: 'result', requestId: p.requestId, name: p.with, accepted: p.accepted, deadline: Date.now() + 30000 }
      : m);
    const onExpired = (p) => setModal((m) => (m && m.requestId === p.requestId)
      ? { mode: 'result', requestId: p.requestId, name: m.name, accepted: null, deadline: Date.now() + 1800 }
      : m);
    s.on('friend:ask', onAsk);
    s.on('friend:waiting', onWait);
    s.on('friend:answer', onAnswer);
    s.on('friend:expired', onExpired);
    return () => { s.off('friend:ask', onAsk); s.off('friend:waiting', onWait); s.off('friend:answer', onAnswer); s.off('friend:expired', onExpired); };
  }, []);

  // relógio do modal
  useEffect(() => {
    if (!modal) return;
    const t = setInterval(() => setNow(Date.now()), 120);
    return () => clearInterval(t);
  }, [modal]);

  useEffect(() => {
    if (modal && now >= modal.deadline) setModal(null); // fecha sozinho (expirado ou resultado exibido)
  }, [now, modal]);

  if (!modal) return null;
  const restante = Math.max(0, Math.ceil((modal.deadline - now) / 1000));
  const frac = Math.max(0, (modal.deadline - now) / (modal.total || 30000));

  const respond = async (accept) => {
    if (busyRef.current) return;
    busyRef.current = true;
    try { await api('/api/friends/respond', { method: 'POST', body: { requestId: modal.requestId, accept } }); } catch { /* expirou no caminho */ }
    busyRef.current = false;
    if (accept) setModal((m) => m ? { ...m, mode: 'result', accepted: true, deadline: Date.now() + 30000 } : m);
    else setModal(null);
  };

  return createPortal(
    <div className="pc-overlay" style={{ zIndex: 450 }}>
      <div className="fa-card">
        {modal.mode === 'ask' && (
          <>
            <div className="fa-icon">🤝</div>
            <h2 className="fa-title"><span className="fa-name">{modal.name}</span> quer ser seu amigo!</h2>
            <div className="fa-timerbar"><div style={{ width: `${frac * 100}%` }} /></div>
            <div className="fa-count">{restante}s</div>
            <div className="pc-actions" style={{ justifyContent: 'center' }}>
              <button className="btn btn-blood" style={{ width: 'auto', padding: '11px 26px' }} onClick={() => respond(true)}>✓ Aceitar</button>
              <button className="btn btn-ghost" style={{ width: 'auto', padding: '11px 22px' }} onClick={() => respond(false)}>✕ Recusar</button>
            </div>
          </>
        )}
        {modal.mode === 'wait' && (
          <>
            <div className="fa-icon fa-pulse">📨</div>
            <h2 className="fa-title">Pedido enviado para <span className="fa-name">{modal.name}</span></h2>
            <p className="dash-empty" style={{ margin: '4px 0 8px' }}>aguardando resposta...</p>
            <div className="fa-timerbar"><div style={{ width: `${frac * 100}%` }} /></div>
            <div className="fa-count">{restante}s</div>
          </>
        )}
        {modal.mode === 'result' && (
          <>
            <div className="fa-icon">{modal.accepted === true ? '🎉' : modal.accepted === false ? '💔' : '⏱️'}</div>
            <h2 className="fa-title">
              {modal.accepted === true && <><span className="fa-name">{modal.name}</span> aceitou! Vocês agora são amigos</>}
              {modal.accepted === false && <><span className="fa-name">{modal.name}</span> recusou o pedido</>}
              {modal.accepted === null && <>Tempo esgotado — a proposta evaporou</>}
            </h2>
            <button className="btn btn-ghost" style={{ width: 'auto', padding: '10px 26px', marginTop: 8 }} onClick={() => setModal(null)}>
              Fechar
            </button>
          </>
        )}
      </div>
    </div>,
    document.body
  );
}
