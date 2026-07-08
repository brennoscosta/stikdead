// STIKDEAD :: teclas configuráveis (PC) — o teclado é do jogador 🎹
const KEY = 'stik_keys';

export const DEFAULT_BINDS = {
  skill: 'KeyC',   // especial
  light: 'KeyV',   // soco
  heavy: 'KeyB',   // chute
  dash:  'KeyN',   // dash
  block: 'KeyM',   // bloquear
  jump:  'Space',  // pular (a seta ↑ também pula)
};

export const BIND_ORDER = ['skill', 'light', 'heavy', 'dash', 'block', 'jump'];
export const BIND_LABELS = {
  skill: '⚡ Especial', light: '👊 Soco', heavy: '🦵 Chute',
  dash: '💨 Dash', block: '🛡️ Bloquear', jump: '⬆️ Pular',
};

export function getBinds() {
  try { return { ...DEFAULT_BINDS, ...JSON.parse(localStorage.getItem(KEY) || '{}') }; }
  catch { return { ...DEFAULT_BINDS }; }
}

export function setBind(action, code) {
  const b = getBinds();
  // a tecla já pertence a outra ação? elas trocam de lugar (sem conflito possível)
  const dona = Object.keys(b).find((a) => b[a] === code && a !== action);
  if (dona) b[dona] = b[action];
  b[action] = code;
  localStorage.setItem(KEY, JSON.stringify(b));
  window.dispatchEvent(new Event('stik:keyschanged'));
  return b;
}

export function resetBinds() {
  localStorage.removeItem(KEY);
  window.dispatchEvent(new Event('stik:keyschanged'));
  return { ...DEFAULT_BINDS };
}

// nome bonito da tecla para exibir
export function keyLabel(code) {
  if (!code) return '—';
  if (code.startsWith('Key')) return code.slice(3);
  if (code.startsWith('Digit')) return code.slice(5);
  const mapa = {
    Space: 'ESPAÇO', ShiftLeft: 'SHIFT', ShiftRight: 'SHIFT DIR',
    ControlLeft: 'CTRL', AltLeft: 'ALT', Tab: 'TAB', Enter: 'ENTER',
    ArrowUp: '↑', ArrowDown: '↓', ArrowLeft: '←', ArrowRight: '→',
    Semicolon: ';', Quote: "'", Comma: ',', Period: '.', Slash: '/',
    BracketLeft: '[', BracketRight: ']', Backquote: '`', Backslash: '\\',
    Minus: '-', Equal: '=',
  };
  return mapa[code] || code.toUpperCase();
}

// as setas são sagradas (movimento) — não podem ser capturadas
export const RESERVED = new Set(['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Escape']);
