// STIKDEAD :: ícone de item — arte IA (webp em /items/{id}.webp) com fallback SVG
import { useState } from 'react';

const col = (p, k, d) => p?.[k] || d;

function TemplateSvg({ template, params: p = {} }) {
  const stroke = '#080808';
  switch (template) {
    case 'katana':
      return (
        <svg viewBox="0 0 64 64">
          <line x1="14" y1="50" x2="50" y2="14" stroke={col(p, 'blade', '#d8d3c8')} strokeWidth="5" strokeLinecap="round" />
          {p.glow && <line x1="14" y1="50" x2="50" y2="14" stroke={p.glow} strokeWidth="10" strokeLinecap="round" opacity="0.35" />}
          <line x1="18" y1="42" x2="26" y2="50" stroke={stroke} strokeWidth="4" strokeLinecap="round" />
          <line x1="14" y1="50" x2="8" y2="56" stroke={col(p, 'grip', '#3a1216')} strokeWidth="6" strokeLinecap="round" />
        </svg>
      );
    case 'bo':
      return (
        <svg viewBox="0 0 64 64">
          <line x1="10" y1="54" x2="54" y2="10" stroke={col(p, 'color', '#6b4a2b')} strokeWidth="6" strokeLinecap="round" />
          <circle cx="32" cy="32" r="4" fill={col(p, 'band', '#d90429')} />
        </svg>
      );
    case 'nunchaku':
      return (
        <svg viewBox="0 0 64 64">
          <line x1="14" y1="18" x2="24" y2="40" stroke={col(p, 'color', '#241a12')} strokeWidth="8" strokeLinecap="round" />
          <line x1="40" y1="24" x2="50" y2="46" stroke={col(p, 'color', '#241a12')} strokeWidth="8" strokeLinecap="round" />
          <path d="M24 40 Q32 46 40 24" fill="none" stroke="#8a8a8a" strokeWidth="2.5" />
        </svg>
      );
    case 'axe':
      return (
        <svg viewBox="0 0 64 64">
          <line x1="20" y1="54" x2="44" y2="14" stroke={col(p, 'handle', '#4a341f')} strokeWidth="5" strokeLinecap="round" />
          <path d="M44 14 L58 22 Q60 32 52 38 L42 26 Z" fill={col(p, 'blade', '#8f8a80')} stroke={stroke} strokeWidth="2.5" />
        </svg>
      );
    case 'spear':
      return (
        <svg viewBox="0 0 64 64">
          <line x1="10" y1="56" x2="48" y2="16" stroke={col(p, 'color', '#5a4630')} strokeWidth="4.5" strokeLinecap="round" />
          <path d="M48 16 L58 6 L52 20 Z" fill={col(p, 'blade', '#c9c4b8')} stroke={stroke} strokeWidth="2" />
        </svg>
      );
    case 'scythe':
      return (
        <svg viewBox="0 0 64 64">
          <line x1="26" y1="58" x2="26" y2="14" stroke={col(p, 'handle', '#2b2b2b')} strokeWidth="5" strokeLinecap="round" />
          <path d="M26 14 Q48 8 56 26 Q46 16 26 22 Z" fill={col(p, 'blade', '#b8b2a6')} stroke={stroke} strokeWidth="2.5" />
          {p.glow && <circle cx="26" cy="14" r="5" fill={p.glow} opacity="0.85" />}
        </svg>
      );
    case 'dual':
      return (
        <svg viewBox="0 0 64 64">
          <line x1="12" y1="52" x2="38" y2="16" stroke={col(p, 'blade', '#d8d3c8')} strokeWidth="4.5" strokeLinecap="round" />
          <line x1="26" y1="56" x2="52" y2="20" stroke={col(p, 'blade', '#d8d3c8')} strokeWidth="4.5" strokeLinecap="round" />
          {p.glow && <line x1="12" y1="52" x2="38" y2="16" stroke={p.glow} strokeWidth="9" opacity="0.3" strokeLinecap="round" />}
        </svg>
      );
    case 'bow':
      return (
        <svg viewBox="0 0 64 64">
          <path d="M20 8 Q44 32 20 56" fill="none" stroke={col(p, 'color', '#4a341f')} strokeWidth="5" strokeLinecap="round" />
          <line x1="20" y1="8" x2="20" y2="56" stroke="#cfcabc" strokeWidth="1.5" />
        </svg>
      );
    case 'band':
      return (
        <svg viewBox="0 0 64 64">
          <rect x="10" y="26" width="44" height="12" rx="3" fill={col(p, 'color', '#d90429')} />
          <path d="M10 32 L-2 26 L2 40 Z" fill={col(p, 'color', '#d90429')} transform="translate(12,0)" />
        </svg>
      );
    case 'hat':
      return (
        <svg viewBox="0 0 64 64">
          <ellipse cx="32" cy="40" rx="26" ry="9" fill={col(p, 'color', '#c9a35a')} stroke={stroke} strokeWidth="2.5" />
          <path d="M18 38 L32 14 L46 38 Z" fill={col(p, 'color', '#c9a35a')} stroke={stroke} strokeWidth="2.5" />
        </svg>
      );
    case 'hood':
      return (
        <svg viewBox="0 0 64 64">
          <path d="M46 22 Q32 4 16 20 Q8 34 20 48 L28 40 Q18 32 30 20 Z" fill={col(p, 'color', '#161616')} stroke={stroke} strokeWidth="2.5" />
        </svg>
      );
    case 'crown':
      return (
        <svg viewBox="0 0 64 64">
          <path d="M14 44 L14 24 L24 32 L32 18 L40 32 L50 24 L50 44 Z" fill={col(p, 'color', '#e0a10b')} stroke={stroke} strokeWidth="2.5" />
          <circle cx="32" cy="22" r="3.5" fill="#d90429" />
        </svg>
      );
    case 'bandana':
      return (
        <svg viewBox="0 0 64 64">
          <path d="M10 26 Q32 38 54 26 L48 46 Q32 54 16 46 Z" fill={col(p, 'color', '#1a1a1a')} stroke={stroke} strokeWidth="2.5" />
        </svg>
      );
    case 'mask_skull':
      return (
        <svg viewBox="0 0 64 64">
          <ellipse cx="32" cy="30" rx="20" ry="18" fill="#e8e4da" stroke={stroke} strokeWidth="2.5" />
          <circle cx="24" cy="28" r="5" fill={stroke} /><circle cx="40" cy="28" r="5" fill={stroke} />
          <line x1="26" y1="44" x2="26" y2="50" stroke={stroke} strokeWidth="3" />
          <line x1="32" y1="45" x2="32" y2="52" stroke={stroke} strokeWidth="3" />
          <line x1="38" y1="44" x2="38" y2="50" stroke={stroke} strokeWidth="3" />
        </svg>
      );
    case 'mask_oni':
      return (
        <svg viewBox="0 0 64 64">
          <ellipse cx="32" cy="34" rx="20" ry="17" fill={col(p, 'color', '#b0031f')} stroke={stroke} strokeWidth="2.5" />
          <path d="M20 20 L14 6 L26 14 Z" fill="#e8e4da" stroke={stroke} strokeWidth="2" />
          <path d="M44 20 L50 6 L38 14 Z" fill="#e8e4da" stroke={stroke} strokeWidth="2" />
          <path d="M22 32 L30 28 L30 34 Z" fill="#fff" /><path d="M42 32 L34 28 L34 34 Z" fill="#fff" />
          <line x1="24" y1="44" x2="40" y2="44" stroke="#fff" strokeWidth="2.5" />
        </svg>
      );
    case 'mask_hockey':
      return (
        <svg viewBox="0 0 64 64">
          <ellipse cx="32" cy="32" rx="19" ry="20" fill="#dcd7cb" stroke={stroke} strokeWidth="2.5" />
          <ellipse cx="25" cy="27" rx="5" ry="3.5" fill={stroke} /><ellipse cx="39" cy="27" rx="5" ry="3.5" fill={stroke} />
          {[-6, 0, 6].map((o) => <circle key={o} cx={32 + o} cy={42} r="1.8" fill={stroke} />)}
        </svg>
      );
    case 'eyes_red':
      return (
        <svg viewBox="0 0 64 64">
          <path d="M12 34 L28 24 L30 36 Z" fill="#ff2244" />
          <path d="M52 34 L36 24 L34 36 Z" fill="#ff2244" />
        </svg>
      );
    case 'scarf':
      return (
        <svg viewBox="0 0 64 64">
          <path d="M14 22 Q32 34 50 22 L46 34 Q32 42 18 34 Z" fill={col(p, 'color', '#d90429')} stroke={stroke} strokeWidth="2.5" />
          <path d="M22 34 Q14 46 20 56 L30 52 Q26 42 30 36 Z" fill={col(p, 'color', '#d90429')} stroke={stroke} strokeWidth="2.5" />
        </svg>
      );
    case 'vest':
      return (
        <svg viewBox="0 0 64 64">
          <path d="M20 14 L44 14 L48 50 L16 50 Z" fill={col(p, 'color', '#2a2a2a')} stroke={stroke} strokeWidth="2.5" />
          {p.trim && <><circle cx="20" cy="18" r="5" fill={p.trim} /><circle cx="44" cy="18" r="5" fill={p.trim} /></>}
          {p.glow && <path d="M30 24 L36 32 L28 40" fill="none" stroke={p.glow} strokeWidth="3" />}
        </svg>
      );
    case 'cape':
      return (
        <svg viewBox="0 0 64 64">
          <path d="M22 10 L42 10 L52 54 Q32 62 12 54 Z" fill={col(p, 'color', '#8f0620')} stroke={stroke} strokeWidth="2.5" />
        </svg>
      );
    case 'sheath':
      return (
        <svg viewBox="0 0 64 64">
          <line x1="16" y1="14" x2="48" y2="52" stroke={col(p, 'color', '#141414')} strokeWidth="8" strokeLinecap="round" />
          <line x1="16" y1="14" x2="24" y2="24" stroke="#d90429" strokeWidth="8" strokeLinecap="round" />
        </svg>
      );
    case 'gloves':
      return (
        <svg viewBox="0 0 64 64">
          <circle cx="22" cy="36" r="12" fill={col(p, 'color', '#c1121f')} stroke={stroke} strokeWidth="3" />
          <circle cx="44" cy="30" r="12" fill={col(p, 'color', '#c1121f')} stroke={stroke} strokeWidth="3" />
        </svg>
      );
    case 'gauntlets':
      return (
        <svg viewBox="0 0 64 64">
          <rect x="12" y="24" width="18" height="24" rx="8" fill="#2f2f2f" stroke={stroke} strokeWidth="3" />
          <rect x="36" y="20" width="18" height="24" rx="8" fill="#2f2f2f" stroke={stroke} strokeWidth="3" />
          {p.studs && <><circle cx="21" cy="30" r="2" fill={p.studs} /><circle cx="45" cy="26" r="2" fill={p.studs} /></>}
        </svg>
      );
    case 'bands':
      return (
        <svg viewBox="0 0 64 64">
          <rect x="14" y="26" width="14" height="10" rx="4" fill={col(p, 'color', '#3a3a3a')} transform="rotate(-20 21 31)" />
          <rect x="38" y="28" width="14" height="10" rx="4" fill={col(p, 'color', '#3a3a3a')} transform="rotate(20 45 33)" />
        </svg>
      );
    case 'shorts':
      return (
        <svg viewBox="0 0 64 64">
          <path d="M18 18 L46 18 L50 42 L36 42 L32 30 L28 42 L14 42 Z" fill={col(p, 'color', '#242424')} stroke={stroke} strokeWidth="2.5" />
          {p.trim && <rect x="18" y="16" width="28" height="5" fill={p.trim} />}
        </svg>
      );
    case 'pants':
      return (
        <svg viewBox="0 0 64 64">
          <path d="M20 12 L44 12 L48 52 L36 52 L32 26 L28 52 L16 52 Z" fill={col(p, 'color', '#202020')} stroke={stroke} strokeWidth="2.5" />
        </svg>
      );
    case 'kneepads':
      return (
        <svg viewBox="0 0 64 64">
          <circle cx="24" cy="32" r="10" fill="#333" stroke={stroke} strokeWidth="3" />
          <circle cx="44" cy="32" r="10" fill="#333" stroke={stroke} strokeWidth="3" />
        </svg>
      );
    case 'shoes':
      return (
        <svg viewBox="0 0 64 64">
          <rect x="10" y="30" width="26" height="13" rx="6" fill={col(p, 'color', '#f2efe9')} stroke={stroke} strokeWidth="2.5" />
          <rect x="30" y="40" width="26" height="13" rx="6" fill={col(p, 'color', '#f2efe9')} stroke={stroke} strokeWidth="2.5" />
          {p.stripe && <><line x1="14" y1="37" x2="32" y2="37" stroke={p.stripe} strokeWidth="3" /><line x1="34" y1="47" x2="52" y2="47" stroke={p.stripe} strokeWidth="3" /></>}
        </svg>
      );
    case 'boots':
      return (
        <svg viewBox="0 0 64 64">
          <path d="M14 18 L28 18 L28 38 L38 38 L38 48 L14 48 Z" fill={col(p, 'color', '#241a12')} stroke={stroke} strokeWidth="2.5" />
          {p.glow && <circle cx="34" cy="44" r="3.4" fill={p.glow} />}
        </svg>
      );
    case 'aura':
      return (
        <svg viewBox="0 0 64 64">
          <ellipse cx="32" cy="48" rx="24" ry="8" fill={col(p, 'color', '#d90429')} opacity="0.3" />
          <path d="M32 8 Q44 24 36 34 Q46 32 42 46 Q32 54 22 46 Q18 32 28 34 Q20 24 32 8" fill={col(p, 'color', '#d90429')} opacity="0.55" />
        </svg>
      );
    case 'dust':
      return (
        <svg viewBox="0 0 64 64">
          <circle cx="18" cy="44" r="8" fill="#9a9080" opacity="0.6" />
          <circle cx="32" cy="48" r="6" fill="#9a9080" opacity="0.5" />
          <circle cx="44" cy="43" r="4.5" fill="#9a9080" opacity="0.4" />
        </svg>
      );
    default:
      return (
        <svg viewBox="0 0 64 64">
          <rect x="14" y="14" width="36" height="36" rx="8" fill="#2a2a2a" stroke={stroke} strokeWidth="2.5" />
        </svg>
      );
  }
}

export default function ItemIcon({ item, size = 56 }) {
  const [aiOk, setAiOk] = useState(true);
  return (
    <span className="item-icon" style={{ width: size, height: size }}>
      {aiOk && (
        <img
          src={`/items/${item.id}.webp`}
          alt=""
          onError={() => setAiOk(false)}
          style={{ width: '100%', height: '100%', objectFit: 'contain' }}
        />
      )}
      {!aiOk && <TemplateSvg template={item.template} params={item.params} />}
    </span>
  );
}
