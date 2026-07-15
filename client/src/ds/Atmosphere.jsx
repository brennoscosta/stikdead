// ============================================================
// STIKDEAD DS — Atmosphere Manager
// Atmosfera contextual em 3 intensidades, com escala automática
// por dispositivo. 100% CSS (zero canvas por tela — orçamento de fps).
//   alta  → cerimônias, login, lobby, matchmaking, vitória/derrota
//   media → perfil, inventário, loja, clã, ranking, missões
//   baixa → configurações, formulários, admin
// Uso: <Atmosphere level="media" /> (uma por tela, atrás do conteúdo)
// A configuração central por rota vive em ATMO_POR_TELA (Fase 3 liga).
// ============================================================
import { useMemo } from 'react';

export const ATMO_POR_TELA = {
  '/': 'alta', '/lobby': 'alta',
  '/perfil': 'media', '/inventario': 'media', '/loja': 'media', '/missoes': 'media',
  '/rankings': 'media', '/social': 'media', '/social/cla': 'media', '/social/amigos': 'media',
  '/carreira': 'media', '/atividades': 'media', '/partidas': 'media',
  '/admin': 'baixa', '/calibrador': 'baixa',
};

// orçamento por intensidade: [brasas, fiapos de névoa, brilho da lua]
const NIVEIS = {
  alta:  { brasas: 26, nevoa: 3, lua: true },
  media: { brasas: 10, nevoa: 2, lua: false },
  baixa: { brasas: 0,  nevoa: 1, lua: false },
};

// escala automática pelo hardware — nunca acima do que a tela pede
function fatorDoDispositivo() {
  if (typeof window === 'undefined') return 1;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return 0;
  const coarse = window.matchMedia('(pointer: coarse)').matches;
  const mem = navigator.deviceMemory || 8;
  if (coarse && mem <= 4) return 0.3;   // mobile fraco → quase só iluminação
  if (coarse) return 0.6;               // mobile bom → efeitos médios
  if (mem <= 4) return 0.7;             // desktop médio
  return 1;                             // desktop forte → tudo
}

// determinístico por índice (sem Math.random → sem re-render flicker)
const h = (i, s) => ((i * 2654435761 + s * 40503) % 1000) / 1000;

export default function Atmosphere({ level = 'media' }) {
  const cfg = NIVEIS[level] || NIVEIS.media;
  const fator = useMemo(fatorDoDispositivo, []);
  const nBrasas = Math.round(cfg.brasas * fator);
  const nNevoa = fator === 0 ? 0 : cfg.nevoa;
  const brasas = useMemo(() => Array.from({ length: nBrasas }, (_, i) => ({
    left: `${h(i, 1) * 100}%`,
    size: 2 + h(i, 2) * 3,
    dur: 7 + h(i, 3) * 9,
    delay: -h(i, 4) * 16,
    drift: (h(i, 5) - 0.5) * 120,
    gold: h(i, 6) > 0.72,
  })), [nBrasas]);

  return (
    <div className={`sd-atmo sd-atmo--${level}`} aria-hidden="true">
      <div className="sd-atmo-luz" />
      {cfg.lua && fator > 0 && <div className="sd-atmo-lua" />}
      {Array.from({ length: nNevoa }, (_, i) => (
        <div key={`n${i}`} className={`sd-atmo-nevoa sd-atmo-nevoa--${i}`} />
      ))}
      {brasas.map((b, i) => (
        <span
          key={i}
          className={`sd-atmo-brasa ${b.gold ? 'is-ouro' : ''}`}
          style={{
            left: b.left, width: b.size, height: b.size,
            animationDuration: `${b.dur}s`, animationDelay: `${b.delay}s`,
            '--drift': `${b.drift}px`,
          }}
        />
      ))}
      <div className="sd-atmo-vinheta" />
    </div>
  );
}
