// STIKDEAD :: UPDATE 3.0 — retrato exclusivo de cada bot
// O jogador reconhece a dificuldade só de olhar o rosto do adversário.
// SVG puro (sem imagem), com a mesma linguagem glossy do boneco do jogo.
import { DIFF_META } from './DiffIcon.jsx';

// cabeça base: esfera preta glossy com rim light (a action figure do jogo)
const Head = ({ children }) => (
  <>
    <circle cx="40" cy="42" r="26" fill="#080808" />
    <circle cx="40" cy="42" r="23.4" fill="#1c1c1c" />
    <ellipse cx="43" cy="50" rx="18" ry="13" fill="#0a0a0c" opacity="0.5" />
    <ellipse cx="32" cy="33" rx="12" ry="9" fill="#3a3f46" opacity="0.75" />
    <ellipse cx="30" cy="30" rx="6.5" ry="4.6" fill="#596069" opacity="0.8" />
    <ellipse cx="29" cy="28" rx="3.2" ry="2.1" fill="#d9dfe6" opacity="0.95" />
    <path d="M56 28a23.4 23.4 0 0 1 6 18" fill="none" stroke="#5d7d9e" strokeWidth="2.6" strokeLinecap="round" opacity="0.35" />
    {children}
  </>
);

// olhos ferozes (os "quadrantes angulados" do rig), em qualquer cor
const Eyes = ({ cor = '#ffffff' }) => (
  <g>
    <circle cx="48" cy="44" r="9" fill={cor} opacity="0.14" />
    <circle cx="31" cy="44" r="7.5" fill={cor} opacity="0.12" />
    <path d="M41 47 47.5 40.6 54 47.4Z" fill={cor} />
    <path d="M25 47 30.5 41.4 36 47.4Z" fill={cor} />
  </g>
);

const FACES = {
  // FÁCIL — simples, olhos azuis, expressão neutra
  facil: (
    <Head>
      <Eyes cor="#57a8ff" />
    </Head>
  ),
  // MÉDIO — bandana + olhos amarelos
  medio: (
    <Head>
      <path d="M15 34c14-9 36-9 50 0l-2.5 9c-14-7.5-31-7.5-45 0Z" fill="#4a4f57" stroke="#080808" strokeWidth="2.4" />
      <path d="M62 36l10-5-5.5 10.5M64 40l9 1-7 6" fill="none" stroke="#4a4f57" strokeWidth="4" strokeLinecap="round" />
      <Eyes cor="#ffd76a" />
    </Head>
  ),
  // DIFÍCIL — máscara oni vermelha, presas, olhos brancos em fúria
  dificil: (
    <Head>
      <ellipse cx="41" cy="45" rx="20" ry="17.5" fill="#b0031f" stroke="#080808" strokeWidth="2.6" />
      <path d="M28 30 22 16l11 8ZM54 30l6-14-11 8Z" fill="#e8e4da" stroke="#080808" strokeWidth="2" />
      <path d="M43 42l8-3v6ZM31 42l-7-3v6Z" fill="#fff" />
      <path d="M33 55h16" stroke="#fff" strokeWidth="2.4" />
      <path d="M35 55v4M47 55v4" stroke="#e8e4da" strokeWidth="2.2" />
      <circle cx="41" cy="45" r="21" fill="none" stroke="#ff2244" strokeWidth="2" opacity="0.35" />
    </Head>
  ),
  // INSANO — o BOSS: oni negra, chifres longos, olhos vermelhos, fumaça
  insano: (
    <Head>
      <ellipse cx="41" cy="45" rx="20.5" ry="18" fill="#20060c" stroke="#080808" strokeWidth="2.6" />
      <path d="M27 30 16 10l14 11ZM55 30 66 10 52 21Z" fill="#e8e4da" stroke="#080808" strokeWidth="2" />
      <path d="M43 42l9-3.4v6.8ZM31 42l-8-3.4v6.8Z" fill="#ff2244" />
      <circle cx="47" cy="43" r="9" fill="#ff2244" opacity="0.22" />
      <circle cx="28" cy="43" r="7" fill="#ff2244" opacity="0.2" />
      <path d="M32 56h18" stroke="#ff2244" strokeWidth="2.4" />
      <path d="M35 56v5M41 56v6M47 56v5" stroke="#e8e4da" strokeWidth="2.2" />
      {/* fumaça subindo (anima via CSS .bp-fumo) */}
      <circle className="bp-fumo" cx="16" cy="60" r="5" fill="#3a2430" opacity="0.5" />
      <circle className="bp-fumo bp-fumo2" cx="66" cy="56" r="4" fill="#3a2430" opacity="0.45" />
      <circle className="bp-fumo bp-fumo3" cx="60" cy="66" r="6" fill="#2a1620" opacity="0.4" />
    </Head>
  ),
};

export default function BotPortrait({ d = 'facil', size = 76 }) {
  const cor = DIFF_META[d]?.cor || '#9a8f88';
  return (
    <span className={`bot-portrait bp-${d}`} style={{ '--diff-cor': cor, width: size, height: size }} aria-hidden="true">
      <svg viewBox="0 0 80 80" width={size} height={size} focusable="false">
        {/* aura da dificuldade atrás da cabeça */}
        <circle cx="40" cy="44" r="32" fill={cor} opacity={d === 'facil' ? 0.08 : 0.16} />
        {d !== 'facil' && <circle className="bp-aura" cx="40" cy="44" r="30" fill="none" stroke={cor} strokeWidth="2" opacity="0.4" />}
        {FACES[d] || FACES.facil}
      </svg>
    </span>
  );
}
