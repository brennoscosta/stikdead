// ============================================================
// STIKDEAD DS — <Icon /> : o único jeito oficial de desenhar ícone.
// <Icon name="espada" size="md" weight="medio" rarity="lendario" state="ativo" />
// Tamanhos: xs 16 · sm 20 · md 24 · lg 32 · xl 48 · hero 64 · banner 96 (ou número)
// Pesos de traço: fino 1.5 · medio 2 · forte 2.6
// Estados via CSS: normal · hover · ativo · desabilitado · selecionado · glow
// ============================================================
import { ICONS } from './icons.js';

const SIZES = { xs: 16, sm: 20, md: 24, lg: 32, xl: 48, hero: 64, banner: 96 };
const WEIGHTS = { fino: 1.5, medio: 2, forte: 2.6 };
const RARITY = {
  comum: 'var(--sd-r-comum)', incomum: 'var(--sd-r-incomum)', raro: 'var(--sd-r-raro)',
  epico: 'var(--sd-r-epico)', lendario: 'var(--sd-r-lendario)', mitico: 'var(--sd-r-mitico)',
  diamante: 'var(--sd-r-diamante)',
};

export default function Icon({ name, size = 'md', weight = 'medio', color, rarity, glow = false, className = '', title, style }) {
  const cmds = ICONS[name];
  if (!cmds) return null;
  const px = typeof size === 'number' ? size : SIZES[size] || 24;
  const sw = WEIGHTS[weight] || 2;
  const cor = rarity ? RARITY[rarity] : color || 'currentColor';
  const els = [];
  cmds.forEach((c, i) => {
    if (c.startsWith('CF:')) {
      const [x, y, r] = c.slice(3).split(',').map(Number);
      els.push(<circle key={i} cx={x} cy={y} r={r} fill={cor} stroke="none" />);
    } else if (c.startsWith('C:')) {
      const [x, y, r] = c.slice(2).split(',').map(Number);
      els.push(<circle key={i} cx={x} cy={y} r={r} />);
    } else if (c.startsWith('F:')) {
      els.push(<path key={i} d={c.slice(2)} fill={cor} stroke="none" />);
    } else {
      els.push(<path key={i} d={c} />);
    }
  });
  return (
    <svg
      className={`sd-icon ${glow || rarity ? 'sd-icon--glow' : ''} ${className}`}
      width={px} height={px} viewBox="0 0 24 24" fill="none"
      stroke={cor} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round"
      role={title ? 'img' : 'presentation'} aria-label={title}
      style={rarity || glow ? { '--sd-icon-cor': cor, ...style } : style}
    >
      {title ? <title>{title}</title> : null}
      {els}
    </svg>
  );
}
