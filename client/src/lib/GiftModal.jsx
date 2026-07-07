// STIKDEAD :: presente recebido — entrega incansável, cerimônia educada 🎁
// Regras: persiste até entregar (login, reconexão, volta à aba, poll);
// nunca empilha modais; só aparece com o jogador DE OLHO na tela.
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { api } from './api.js';
import { getSocket } from './socket.js';
import ItemIcon from './ItemIcon.jsx';

const RARITY_LABEL = { comum: 'Comum', raro: 'Raro', epico: 'Épico', lendario: 'Lendário', diamante: 'Diamante 💎' };

export default function GiftModal({ onSenderClick }) {
  const [gift, setGift] = useState(null);
  const [phase, setPhase] = useState('closed'); // closed | opening | revealed
  const busyRef = useRef(false);

  useEffect(() => {
    let dead = false;
    const check = async () => {
      if (dead || document.hidden || busyRef.current) return; // com calma: só na tela, um por vez
      busyRef.current = true;
      try {
        const d = await api('/api/gifts/pending');
        if (!dead && d.gifts?.length) {
          setGift((g) => { if (g) return g; setPhase('closed'); return d.gifts[0]; });
        }
      } catch { /* tenta de novo no próximo gatilho */ }
      busyRef.current = false;
    };

    check();                                        // logou / recarregou
    const t = setInterval(check, 30000);            // rede de segurança
    const s = getSocket();
    s.on('gift:new', check);                        // chegada instantânea
    s.on('connect', check);                         // reconectou
    const onVis = () => { if (!document.hidden) setTimeout(check, 600); }; // voltou à aba
    document.addEventListener('visibilitychange', onVis);
    const onNext = () => setTimeout(check, 1400);   // respiro entre presentes da fila
    window.addEventListener('stik:giftnext', onNext);
    return () => {
      dead = true; clearInterval(t);
      s.off('gift:new', check); s.off('connect', check);
      document.removeEventListener('visibilitychange', onVis);
      window.removeEventListener('stik:giftnext', onNext);
    };
  }, []);

  if (!gift) return null;

  const open = async () => {
    setPhase('opening');
    try { await api(`/api/gifts/open/${gift.id}`, { method: 'POST' }); } catch { /* já era */ }
    setTimeout(() => setPhase('revealed'), 900);
  };
  const close = () => {
    setGift(null); setPhase('closed');
    window.dispatchEvent(new Event('stik:giftnext')); // tem mais na fila? entrega o próximo com calma
  };

  const isCur = gift.kind === 'coins' || gift.kind === 'diamonds';

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
            {!isCur ? (
              <>
                <div className={`gift-item r-${gift.rarity}`}>
                  <ItemIcon item={gift} />
                </div>
                <h2 className="gift-item-name">{gift.name}</h2>
                <div className="gift-rarity">{RARITY_LABEL[gift.rarity] || gift.rarity}</div>
              </>
            ) : (
              <>
                <div className="gift-item gift-item-cur">{gift.kind === 'coins' ? '🪙' : '💎'}</div>
                <h2 className="gift-item-name">{Number(gift.amount).toLocaleString('pt-BR')} {gift.kind === 'coins' ? 'MOEDAS' : 'DIAMANTES'}</h2>
                <div className="gift-rarity">{gift.kind === 'coins' ? 'já somadas à sua bolsa' : 'já somados ao seu cofre'}</div>
              </>
            )}
            {gift.message && (
              <p className="gift-msg">“{gift.message}”</p>
            )}
            <p className="gift-from">
              presente de{' '}
              <button className="fr-name" onClick={() => { onSenderClick?.(gift.from_name); close(); }}>
                {gift.from_name || 'um guerreiro anônimo'}
              </button>
            </p>
            {!isCur && <p className="dash-empty" style={{ marginTop: 2 }}>O item já está no seu baú! 🎒</p>}
            <button className="btn btn-ghost" style={{ width: 'auto', padding: '10px 22px' }} onClick={close}>Fechar</button>
          </>
        )}
      </div>
    </div>,
    document.body
  );
}
