// STIKDEAD :: o balão da glória — cada patente conta sua lenda 🎖️
import { useEffect } from 'react';
import { createPortal } from 'react-dom';

export default function PatentTip({ patent, unlocked, onClose }) {
  useEffect(() => {
    const esc = (e) => { if (e.code === 'Escape') onClose(); };
    window.addEventListener('keydown', esc);
    return () => window.removeEventListener('keydown', esc);
  }, [onClose]);

  if (!patent) return null;
  return createPortal(
    <div className="pc-overlay" style={{ zIndex: 470 }} onClick={onClose}>
      <div className={`pt-card ${unlocked ? '' : 'pt-locked'}`} onClick={(e) => e.stopPropagation()}>
        <div className="pt-rays" aria-hidden="true" />
        <div className="pt-insignia">
          {unlocked ? (
            <>
              <img src={patent.icon} alt="" onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.nextSibling.style.display = 'flex'; }} />
              <span className="pt-emoji" style={{ display: 'none' }}>{patent.emoji}</span>
            </>
          ) : (
            <span className="pt-emoji">🔒</span>
          )}
        </div>
        <div className="pt-ato">{patent.ato}</div>
        <h2 className="pt-nome">{unlocked ? patent.name : '? ? ?'}</h2>
        <p className="pt-desc">
          {unlocked ? patent.desc : 'Esta lenda ainda não foi escrita. Continue lutando para revelá-la.'}
        </p>
        <div className="pt-nivel">
          {unlocked ? <>⭐ ALCANÇADO NO NÍVEL {patent.level}</> : <>🔒 DESBLOQUEIA NO NÍVEL {patent.level}</>}
        </div>
        <button className="btn btn-ghost pt-fechar" onClick={onClose}>Fechar</button>
      </div>
    </div>,
    document.body
  );
}
