// STIKDEAD :: balão Excellent — as letrinhas verdes que valem ouro (homenagem ao MU)
// Uso: qualquer lugar dispara window.dispatchEvent(new CustomEvent('stik:itemtip', { detail: { item, x, y } }))
import { useEffect, useState } from 'react';
const RARITY_LABEL = { comum: 'Comum', raro: 'Raro', epico: 'Épico', lendario: 'Lendário', diamante: 'Diamante 💎' };

export default function ExcellentTip() {
  const [tip, setTip] = useState(null);

  useEffect(() => {
    const on = (e) => setTip(e.detail);
    const off = () => setTip(null);
    window.addEventListener('stik:itemtip', on);
    window.addEventListener('pointerdown', off);
    window.addEventListener('keydown', off);
    return () => {
      window.removeEventListener('stik:itemtip', on);
      window.removeEventListener('pointerdown', off);
      window.removeEventListener('keydown', off);
    };
  }, []);

  if (!tip) return null;
  const { item, x, y } = tip;
  const gold = item.rarity !== 'diamante';
  const W = 300;
  const left = Math.max(8, Math.min(x - W / 2, window.innerWidth - W - 8));
  const top = Math.max(8, Math.min(y + 14, window.innerHeight - 260));

  return (
    <div className={`exc-tip ${gold ? 'gold' : ''}`} style={{ left, top, width: W }} onPointerDown={(e) => e.stopPropagation()}>
      <div className="exc-name">{item.name}</div>
      <div className="exc-rarity">{RARITY_LABEL[item.rarity] || item.rarity} · {gold ? 'ITEM SUPERIOR' : 'ITEM EXCELLENT'}</div>
      <div className="exc-sep" />
      {item.excellents.map((fx, i) => (
        <div key={i} className="exc-line">{i + 1}. {fx}</div>
      ))}
    </div>
  );
}
