// STIKDEAD :: HUD de teclas (desktop) — o manual do guerreiro + a recarga do especial
import { forwardRef } from 'react';

const KEYS = [
  { k: 'A D', acao: 'mover' },
  { k: 'W', acao: 'pular' },
  { k: 'J', acao: 'soco rápido' },
  { k: 'K', acao: 'golpe pesado' },
  { k: 'L', acao: 'bloquear' },
  { k: 'SHIFT', acao: 'dash' },
];

const KeysHud = forwardRef(function KeysHud({ skillName }, ref) {
  return (
    <aside className="keys-hud" aria-hidden="true">
      {KEYS.map((r) => (
        <div className="kh-row" key={r.k}>
          <span className="kh-keys">{r.k.split(' ').map((kk) => <kbd key={kk}>{kk}</kbd>)}</span>
          <span className="kh-acao">{r.acao}</span>
        </div>
      ))}
      <div className="kh-row kh-skill">
        <span className="kh-keys"><kbd className="kh-key-skill">H</kbd></span>
        <span className="kh-acao">
          <b>{skillName || 'ESPECIAL'}</b>
          <span className="kh-cdbar"><span ref={ref} /></span>
        </span>
      </div>
    </aside>
  );
});
export default KeysHud;
