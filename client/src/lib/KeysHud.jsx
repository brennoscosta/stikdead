// STIKDEAD :: HUD de teclas (desktop) — espelha as teclas configuradas pelo jogador
import { forwardRef, useEffect, useState } from 'react';
import { getBinds, keyLabel } from '../game/keybinds.js';

const KeysHud = forwardRef(function KeysHud({ skillName }, ref) {
  const [b, setB] = useState(getBinds());
  useEffect(() => {
    const re = () => setB(getBinds());
    window.addEventListener('stik:keyschanged', re);
    return () => window.removeEventListener('stik:keyschanged', re);
  }, []);

  const rows = [
    { k: '← →', acao: 'mover' },
    { k: `↑ ${keyLabel(b.jump)}`, acao: 'pular' },
    { k: '↓', acao: 'abaixar (esquiva o soco)' },
    { k: keyLabel(b.light), acao: 'soco' },
    { k: keyLabel(b.heavy), acao: 'chute' },
    { k: keyLabel(b.dash), acao: 'dash' },
    { k: `${keyLabel(b.dash)} ${keyLabel(b.heavy)}`, acao: 'rasteira' },
    { k: keyLabel(b.block), acao: 'bloquear' },
  ];

  return (
    <aside className="keys-hud" aria-hidden="true">
      {rows.map((r) => (
        <div className="kh-row" key={r.acao}>
          <span className="kh-keys">{r.k.split(' ').map((kk, i) => <kbd key={kk + i}>{kk}</kbd>)}</span>
          <span className="kh-acao">{r.acao}</span>
        </div>
      ))}
      <div className="kh-row kh-skill">
        <span className="kh-keys"><kbd className="kh-key-skill">{keyLabel(b.skill)}</kbd></span>
        <span className="kh-acao">
          <b>{skillName || 'ESPECIAL'}</b>
          <span className="kh-cdbar"><span ref={ref} /></span>
        </span>
      </div>
    </aside>
  );
});
export default KeysHud;
