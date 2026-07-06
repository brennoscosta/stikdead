// STIKDEAD :: entrada unificada — teclado, gamepad e touch produzem o mesmo input

const KEYMAP = {
  KeyA: 'left', ArrowLeft: 'left',
  KeyD: 'right', ArrowRight: 'right',
  KeyW: 'jump', Space: 'jump', ArrowUp: 'jump',
  KeyJ: 'light',
  KeyK: 'heavy',
  KeyL: 'block',
  KeyE: 'skill', ShiftLeft: 'skill',
  ShiftLeft: 'dash', ShiftRight: 'dash',
};

export function createInput() {
  const keys = { left: false, right: false, jump: false, light: false, heavy: false, block: false, dash: false, skill: false };
  const touch = { ...keys };

  const down = (e) => {
    const k = KEYMAP[e.code];
    if (k) { keys[k] = true; e.preventDefault(); }
  };
  const up = (e) => {
    const k = KEYMAP[e.code];
    if (k) { keys[k] = false; e.preventDefault(); }
  };
  window.addEventListener('keydown', down);
  window.addEventListener('keyup', up);

  const readGamepad = () => {
    const gp = navigator.getGamepads?.()[0];
    if (!gp) return null;
    const ax = gp.axes[0] || 0;
    const b = (i) => !!gp.buttons[i]?.pressed;
    return {
      left: ax < -0.35 || b(14),
      right: ax > 0.35 || b(15),
      jump: b(0) || b(12),          // A / cima
      light: b(2),                  // X
      heavy: b(3),                  // Y
      block: b(4) || b(6),          // LB / LT
      dash: b(5) || b(7) || b(1),   // RB / RT / B
    };
  };

  return {
    touch,
    get() {
      const gp = readGamepad();
      const out = {};
      for (const k of Object.keys(keys)) out[k] = keys[k] || touch[k] || (gp ? gp[k] : false);
      return out;
    },
    destroy() {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
    },
  };
}
