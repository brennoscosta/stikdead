// STIKDEAD :: UPDATE 2.8 — badge do ESTILO ATUAL (lobby) + tooltip premium
// Ícones SVG próprios por classe (sem emoji), cor temática e glow.
import { STYLES } from '../game/sim.js';

// cor temática de cada classe
export const STYLE_COR = {
  ronin: '#ff5a4e',      // fogo
  shinobi: '#b98cff',    // sombra roxa
  monge: '#ffd76a',      // ki dourado
  berserker: '#d90429',  // sangue
  espectro: '#a78bfa',   // espectral
};

// ícones vetoriais 16x16 (stroke = currentColor)
const P = {
  // katana inclinada
  ronin: (
    <g fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round">
      <path d="M3.2 12.8 12.4 3.6" />
      <path d="M11 5 13.8 2.2" strokeWidth="2.3" />
      <path d="M4.6 9.6 6.4 11.4" />
      <path d="M2.4 13.6 3.6 12.4" strokeWidth="2.6" />
    </g>
  ),
  // shuriken de 4 pontas
  shinobi: (
    <g fill="currentColor">
      <path d="M8 1.6 9.6 6.4 14.4 8 9.6 9.6 8 14.4 6.4 9.6 1.6 8 6.4 6.4Z" />
      <circle cx="8" cy="8" r="1.4" fill="#0b0709" />
    </g>
  ),
  // círculo de ki com onda
  monge: (
    <g fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round">
      <circle cx="8" cy="8" r="5.6" />
      <path d="M4.8 8c1.2-1.6 2.4 1.6 3.2 0s2-1.6 3.2 0" />
    </g>
  ),
  // machado do carrasco
  berserker: (
    <g fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round">
      <path d="M6.4 6.4 13 13" />
      <path d="M9.8 2.2A6 6 0 0 0 2.2 9.8C3.4 7 5 5 9.8 2.2Z" fill="currentColor" stroke="none" />
    </g>
  ),
  // chama espectral
  espectro: (
    <g fill="currentColor">
      <path d="M8 1.8c2.6 2.6 4.4 4.8 4.4 7.3A4.4 4.4 0 0 1 8 13.6 4.4 4.4 0 0 1 3.6 9.1C3.6 6.6 5.4 4.4 8 1.8Z" opacity="0.55" />
      <path d="M8 5c1.5 1.6 2.5 2.9 2.5 4.3A2.5 2.5 0 0 1 8 11.8a2.5 2.5 0 0 1-2.5-2.5C5.5 7.9 6.5 6.6 8 5Z" />
    </g>
  ),
};

export function StyleIcon({ styleKey, size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" aria-hidden="true" focusable="false">
      {P[styleKey] || P.ronin}
    </svg>
  );
}

// separa a descrição em golpe + passiva (o texto oficial usa "Passivo:")
const splitDesc = (desc = '') => {
  const i = desc.indexOf('Passiv');
  if (i < 0) return { golpe: desc, passiva: null };
  return { golpe: desc.slice(0, i).trim(), passiva: desc.slice(i).replace(/^Passivo:\s*/, '').trim() };
};

export default function StyleBadge({ styleKey = 'ronin' }) {
  const st = STYLES[styleKey] || STYLES.ronin;
  const cor = STYLE_COR[styleKey] || STYLE_COR.ronin;
  const { golpe, passiva } = splitDesc(st.desc);
  return (
    <span className="pc-estilo" style={{ '--est-cor': cor }} tabIndex={0} aria-label={`Estilo atual: ${st.label}`}>
      <span className="pc-estilo-badge">
        <StyleIcon styleKey={styleKey} size={13} />
        <b>{st.label}</b>
      </span>
      {/* tooltip elegante (estilo Diablo IV) — só CSS, aparece no hover/focus */}
      <span className="est-tip" role="tooltip">
        <b className="est-tip-nome">{st.label.toUpperCase()}</b>
        <em className="est-tip-skill"><StyleIcon styleKey={styleKey} size={12} /> {st.skill}</em>
        <span className="est-tip-desc">{golpe}</span>
        {passiva && <span className="est-tip-passiva"><small>PASSIVA</small>{passiva}</span>}
      </span>
    </span>
  );
}
