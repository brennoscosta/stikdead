// STIKDEAD :: balão da patente — no molde do balão dos itens (popover, não modal)
// Uso: window.dispatchEvent(new CustomEvent('stik:patenttip', { detail: { patent, unlocked, x, y } }))
import { useEffect, useState } from 'react';

export default function PatentTip() {
  const [tip, setTip] = useState(null);

  useEffect(() => {
    const on = (e) => setTip(e.detail);
    const off = () => setTip(null);
    window.addEventListener('stik:patenttip', on);
    window.addEventListener('pointerdown', off);
    window.addEventListener('keydown', off);
    return () => {
      window.removeEventListener('stik:patenttip', on);
      window.removeEventListener('pointerdown', off);
      window.removeEventListener('keydown', off);
    };
  }, []);

  if (!tip) return null;
  const { patent: p, unlocked, x, y } = tip;
  const W = 300;
  const left = Math.max(8, Math.min(x - W / 2, window.innerWidth - W - 8));
  const top = Math.max(8, Math.min(y + 14, window.innerHeight - 250));

  return (
    <div className={`pat-tip ${unlocked ? '' : 'locked'}`} style={{ left, top, width: W }} onPointerDown={(e) => e.stopPropagation()}>
      <div className="pat-tip-head">
        <span className="pat-tip-ico">
          {unlocked ? (
            <img src={p.icon} alt="" onError={(e) => { e.currentTarget.outerHTML = `<span class="pat-tip-emoji">${p.emoji}</span>`; }} />
          ) : <span className="pat-tip-emoji">🔒</span>}
        </span>
        <div>
          <div className="pat-tip-nome">{unlocked ? p.name : '? ? ?'}</div>
          <div className="pat-tip-ato">ATO: {p.ato}</div>
        </div>
      </div>
      <div className="pat-tip-sep" />
      <div className="pat-tip-desc">
        {unlocked ? p.desc : 'Esta lenda ainda não foi escrita. Continue lutando para revelá-la.'}
      </div>
      <div className="pat-tip-nivel">
        {unlocked ? `⭐ ALCANÇADO NO NÍVEL ${p.level}` : `🔒 DESBLOQUEIA NO NÍVEL ${p.level}`}
      </div>
    </div>
  );
}
