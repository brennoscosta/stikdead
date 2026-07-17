// STIKDEAD :: sons globais de interface (Fase 7).
// Hover sutil em todo controle clicável, com cooldown (bíblia: 60–100ms,
// nunca metralhar em rolagem). Só mouse — em toque não existe hover.
// Sem fallback procedural de propósito: hover sintetizado soaria pior que silêncio.
import { playUi } from './audioLibrary.js';

const SELETOR = 'button, [role="button"], a.btn, .btn, .diff-btn, .estilo-card, .lobby-item';
let ultimoHover = 0;
let alterna = false;
let iniciado = false;

export function initUiSounds() {
  if (iniciado || typeof document === 'undefined') return;
  iniciado = true;
  document.addEventListener('pointerover', (e) => {
    if (e.pointerType && e.pointerType !== 'mouse') return; // toque não tem hover
    const alvo = e.target?.closest?.(SELETOR);
    if (!alvo || alvo.disabled || alvo.getAttribute?.('aria-disabled') === 'true') return;
    const agora = performance.now();
    if (agora - ultimoHover < 120) return; // cooldown próprio além do da biblioteca
    ultimoHover = agora;
    alterna = !alterna; // varia entre os dois hovers pra nunca soar mecânico
    playUi(alterna ? 'ui_hover_soft_01' : 'ui_hover_soft_02', { volume: 0.55 });
  }, { passive: true });
}
