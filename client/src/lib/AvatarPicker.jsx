// STIKDEAD :: seletor de avatar — galeria de Profile Icons na identidade da marca
import { AVATARS, avatarSrc } from '../ds/avatars.js';
import Icon from '../ds/Icon.jsx';
import { sfx, unlockAudio } from '../game/audio.js';

export default function AvatarPicker({ current = 'padrao', onPick, onClose, saving = false }) {
  return (
    <div className="av-overlay" onClick={onClose}>
      <div className="av-modal" onClick={(e) => e.stopPropagation()}>
        <button className="av-close" onClick={onClose} aria-label="Fechar"><Icon name="fechar" size={16} /></button>
        <h3 className="av-title sd-h3">Escolha seu avatar</h3>
        <p className="av-sub">Personalize o ícone do seu perfil</p>
        <div className="av-grid">
          {AVATARS.map((a) => (
            <button
              key={a.key}
              className={`av-cell ${current === a.key ? 'on' : ''}`}
              style={{ '--av-cor': a.cor }}
              onClick={() => { unlockAudio(); if (current !== a.key) sfx.drop(); onPick(a.key); }}
              disabled={saving}
            >
              <span className="av-frame"><img src={avatarSrc(a.key)} alt={a.label} loading="lazy" /></span>
              <span className="av-name">{a.label}</span>
              {current === a.key && <i className="av-sel" aria-hidden="true"><Icon name="conquista" size={12} weight="forte" /></i>}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
