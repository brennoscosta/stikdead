// STIKDEAD :: ⚙️ configurações do jogo — o jogador é dono da régua
import { useState } from 'react';
import { createPortal } from 'react-dom';

export default function SettingsModal({ onClose }) {
  const [maxQ, setMaxQ] = useState((localStorage.getItem('stik_quality') || 'max') === 'max');

  const toggle = () => {
    const novo = !maxQ;
    setMaxQ(novo);
    localStorage.setItem('stik_quality', novo ? 'max' : 'lite');
  };

  return createPortal(
    <div className="pc-overlay" style={{ zIndex: 480 }} onClick={onClose}>
      <div className="fa-card" style={{ textAlign: 'left', maxWidth: 400 }} onClick={(e) => e.stopPropagation()}>
        <h2 className="fa-title" style={{ textAlign: 'center' }}>⚙️ Configurações</h2>

        <div className="cfg-row" onClick={toggle} role="button">
          <div>
            <div className="cfg-label">🎬 Qualidade máxima</div>
            <div className="cfg-desc">
              {maxQ
                ? 'Arenas em vídeo cinematográfico. Se o jogo estiver lento no seu aparelho, desligue.'
                : 'Modo leve: arenas em imagem — máxima fluidez em qualquer aparelho.'}
            </div>
          </div>
          <div className={`cfg-switch ${maxQ ? 'on' : ''}`}><span /></div>
        </div>

        <p className="cfg-hint">A mudança vale a partir da próxima luta.</p>

        <div style={{ textAlign: 'center' }}>
          <button className="btn btn-ghost" style={{ width: 'auto', padding: '10px 26px' }} onClick={onClose}>Fechar</button>
        </div>
      </div>
    </div>,
    document.body
  );
}
