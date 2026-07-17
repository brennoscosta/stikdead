// STIKDEAD :: UPDATE 2.9 — identidade das dificuldades do bot
// Cada dificuldade tem cor própria + ícone SVG exclusivo (sem emoji).
export const DIFF_META = {
  facil:   { label: 'FÁCIL',   cor: '#1fbf65' },
  medio:   { label: 'MÉDIO',   cor: '#3e8cff' },
  dificil: { label: 'DIFÍCIL', cor: '#ff8a00' },
  insano:  { label: 'INSANO',  cor: '#d40028' },
};
export const DIFF_KEYS = ['facil', 'medio', 'dificil', 'insano'];

const P = {
  // escudo (fácil)
  facil: (
    <path
      d="M8 1.6 13.4 3.6v4.2c0 3.4-2.2 5.6-5.4 6.9C4.8 13.4 2.6 11.2 2.6 7.8V3.6Z"
      fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round"
    />
  ),
  // espada (médio)
  medio: (
    <g fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round">
      <path d="M3.4 12.6 11.6 4.4 12.2 1.8 9.6 2.4 1.4 10.6" fill="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
      <path d="M4.6 9.4 6.6 11.4" />
      <path d="M2.2 13.8 3.8 12.2" strokeWidth="2.4" />
    </g>
  ),
  // duas espadas cruzadas (difícil)
  dificil: (
    <g fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
      <path d="M2.4 2.4 12 12" />
      <path d="M13.6 2.4 4 12" />
      <path d="M1.6 13.2 3.4 11.4M14.4 13.2 12.6 11.4" strokeWidth="2.2" />
      <path d="M2 2 4.6 2.6 2.6 4.6Z M14 2 11.4 2.6 13.4 4.6Z" fill="currentColor" stroke="none" />
    </g>
  ),
  // crânio (insano)
  insano: (
    <g fill="currentColor">
      <path d="M8 1.4a5.6 5.6 0 0 0-5.6 5.6c0 2 .9 3.4 2.2 4.3v2.1c0 .6.4 1 1 1h4.8c.6 0 1-.4 1-1v-2.1c1.3-.9 2.2-2.3 2.2-4.3A5.6 5.6 0 0 0 8 1.4Z" />
      <circle cx="5.8" cy="6.8" r="1.5" fill="#0b0709" />
      <circle cx="10.2" cy="6.8" r="1.5" fill="#0b0709" />
      <path d="M8 8.4 9 10.2H7Z" fill="#0b0709" />
      <path d="M6.4 12.2v1.6M8 12.2v1.6M9.6 12.2v1.6" stroke="#0b0709" strokeWidth="0.9" />
    </g>
  ),
};

export default function DiffIcon({ d = 'facil', size = 15 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" aria-hidden="true" focusable="false">
      {P[d] || P.facil}
    </svg>
  );
}
