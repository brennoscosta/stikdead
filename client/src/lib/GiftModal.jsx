// STIKDEAD :: presente recebido — a cerimônia da revelação 🎁
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { api } from './api.js';
import { getSocket } from './socket.js';
import ItemIcon from './ItemIcon.jsx';
import { RARITY_LABEL } from '../pages/Shop.jsx';

export default function GiftModal({ onSenderClick }) {
  const [gift, setGift] = useState(null);
  const [phase, setPhase] = useState('closed'); // closed | opening | revealed

  useEffect(() => {
    let dead = false;
    const check = async () => {
      try {
        const d = await api('/api/gifts/pending');
        if (!dead && d.gifts?.length && !gift) { setGift(d.gifts[0]); setPhase('closed'); }
      } catch { /* segue */ }
    };
    check();
    const t = setInterval(check, 30000); // rede de segurança
    const s = getSocket();
    s.on('gift:new', check);
    return () => { dead = true; clearInterval(t); s.off('gift:new', check); };
    // eslint-disable-next-line
  }, [gift]);

  if (!gift) return null;

  const open = async () => {
    setPhase('opening');
    try { await api(`/api/gifts/open/${gift.id}`, { method: 'POST' }); } catch { /* já era */ }
    setTimeout(() => setPhase('revealed'), 900);
  };
  const close = () => { setGift(null); setPhase('closed'); };

  return createPortal(
    <div className="pc-overlay" style={{ zIndex: 400 }}>
      <div className="gift-card" onClick={(e) => e.stopPropagation()}>
        {phase !== 'revealed' ? (
          <>
            <h2 className="gift-title">VOCÊ GANHOU UM PRESENTE!!</h2>
            <div className={`gift-box ${phase === 'opening' ? 'opening' : ''}`}>🎁</div>
            <button className="btn btn-blood gift-open" onClick={open} disabled={phase === 'opening'}>
              {phase === 'opening' ? 'Abrindo...' : '✨ ABRIR'}
            </button>
          </>
        ) : (
          <>
            <div className="gift-burst">✦</div>
            <div className={`gift-item r-${gift.rarity}`}>
              <ItemIcon item={gift} />
            </div>
            <h2 className="gift-item-name">{gift.name}</h2>
            <div className="gift-rarity">{RARITY_LABEL[gift.rarity] || gift.rarity}</div>
            {gift.message && (
              <p className="gift-msg">“{gift.message}”</p>
            )}
            <p className="gift-from">
              presente de{' '}
              <button className="fr-name" onClick={() => { onSenderClick?.(gift.from_name); close(); }}>
                {gift.from_name || 'um guerreiro anônimo'}
              </button>
            </p>
            <p className="dash-empty" style={{ marginTop: 2 }}>O item já está no seu baú! 🎒</p>
            <button className="btn btn-ghost" style={{ width: 'auto', padding: '10px 22px' }} onClick={close}>Fechar</button>
          </>
        )}
      </div>
    </div>,
    document.body
  );
}
