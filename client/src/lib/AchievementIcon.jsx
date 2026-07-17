// STIKDEAD :: AchievementIcon — ícone reutilizável de conquista/patente
// Estados: unlocked (borda de raridade + check + brilho discreto),
// bloqueada (cadeado + progresso fino), secreta (???), selected.
import { memo } from 'react';
import Icon from '../ds/Icon.jsx';

const AchievementIcon = memo(function AchievementIcon({
  patent, cor = '#9a8f88', unlocked = false, progress = 0, selected = false, secret = false, size = 46,
}) {
  return (
    <span
      className={`ach-ico ${unlocked ? 'won' : secret ? 'secret' : 'locked'} ${selected ? 'sel' : ''}`}
      style={{ '--rar-cor': cor, width: size, height: size }}
      aria-hidden="true"
    >
      {unlocked ? (
        <img src={patent.icon} alt="" loading="lazy" width={size} height={size} draggable="false"
          onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.nextSibling.style.display = 'grid'; }} />
      ) : (
        <span className="ach-lock"><Icon name="cadeado" size={Math.round(size * 0.34)} /></span>
      )}
      {unlocked && <span className="ach-fallback" style={{ display: 'none' }}>{patent.emoji}</span>}
      {/* obtida: só um check pequeno — nada de "100%" gritando */}
      {unlocked && (
        <i className="ach-check">
          <svg viewBox="0 0 10 10" width="8" height="8"><path d="M1.5 5.4 4 7.8 8.6 2.2" fill="none" stroke="#0b0709" strokeWidth="2" strokeLinecap="round" /></svg>
        </i>
      )}
      {/* bloqueada visível: progresso discreto */}
      {!unlocked && !secret && progress > 0 && (
        <i className="ach-prog"><span style={{ width: `${progress}%` }} /></i>
      )}
    </span>
  );
});

export default AchievementIcon;
