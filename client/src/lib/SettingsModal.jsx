// STIKDEAD :: ⚙️ configurações do jogo — o jogador é dono da régua e do teclado
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { getBinds, setBind, resetBinds, keyLabel, BIND_ORDER, BIND_LABELS, RESERVED } from '../game/keybinds.js';

const IS_PC = typeof matchMedia !== 'undefined' && matchMedia('(pointer: fine)').matches;

export default function SettingsModal({ onClose }) {
  const [maxQ, setMaxQ] = useState((localStorage.getItem('stik_quality') || 'max') === 'max');
  const [binds, setBinds] = useState(getBinds());
  const [capturando, setCapturando] = useState(null); // ação aguardando tecla

  const toggle = () => {
    const novo = !maxQ;
    setMaxQ(novo);
    localStorage.setItem('stik_quality', novo ? 'max' : 'lite');
  };

  // captura da tecla: próxima tecla física vira o binding
  useEffect(() => {
    if (!capturando) return;
    const pega = (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (e.code === 'Escape') { setCapturando(null); return; }
      if (RESERVED.has(e.code)) return; // setas são do movimento
      setBinds(setBind(capturando, e.code));
      setCapturando(null);
    };
    window.addEventListener('keydown', pega, true);
    return () => window.removeEventListener('keydown', pega, true);
  }, [capturando]);

  return createPortal(
    <div className="pc-overlay" style={{ zIndex: 480 }} onClick={onClose}>
      <div className="fa-card" style={{ textAlign: 'left', maxWidth: 420 }} onClick={(e) => e.stopPropagation()}>
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

        {IS_PC && (
          <div className="cfg-keys">
            <div className="cfg-label" style={{ margin: '12px 0 2px' }}>⌨️ Teclas de combate</div>
            <div className="cfg-desc" style={{ marginBottom: 8 }}>
              Clique na tecla e pressione a nova. Setas movem, pulam (↑) e abaixam (↓) — fixas.
            </div>
            {BIND_ORDER.map((acao) => (
              <div className="cfg-key-row" key={acao}>
                <span className="cfg-key-acao">{BIND_LABELS[acao]}</span>
                <button
                  className={`cfg-key-btn ${capturando === acao ? 'is-capturing' : ''}`}
                  onClick={() => setCapturando(capturando === acao ? null : acao)}
                >
                  {capturando === acao ? 'pressione...' : keyLabel(binds[acao])}
                </button>
              </div>
            ))}
            <button className="btn-link" style={{ marginTop: 6 }} onClick={() => { setBinds(resetBinds()); setCapturando(null); }}>
              ↺ restaurar padrão (C V B N M · ESPAÇO)
            </button>
          </div>
        )}

        <p className="cfg-hint">Teclas valem na hora. A qualidade vale a partir da próxima luta.</p>

        <div style={{ textAlign: 'center' }}>
          <button className="btn btn-ghost" style={{ width: 'auto', padding: '10px 26px' }} onClick={onClose}>Fechar</button>
        </div>
      </div>
    </div>,
    document.body
  );
}
