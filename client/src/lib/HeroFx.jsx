// STIKDEAD :: efeito do banner do herói — brasas + brilho + névoa/fumaça + parallax
// Puramente decorativo (aria-hidden). Concentrado à direita, onde está o samurai/lua.
// UPDATE 2.9: névoa e fumaça em camadas + leve parallax no mouse (transform apenas).
import { useEffect, useRef } from 'react';

const EMBERS = [
  { x: '52%', s: 3, d: 7.0, delay: 0.0, drift: '10px' },
  { x: '58%', s: 2, d: 6.0, delay: 1.5, drift: '-8px' },
  { x: '63%', s: 4, d: 8.0, delay: 0.7, drift: '16px' },
  { x: '67%', s: 2, d: 5.5, delay: 3.0, drift: '-12px' },
  { x: '71%', s: 3, d: 7.5, delay: 2.0, drift: '8px' },
  { x: '74%', s: 5, d: 9.0, delay: 0.3, drift: '20px' },
  { x: '77%', s: 2, d: 6.0, delay: 4.0, drift: '-6px' },
  { x: '80%', s: 3, d: 7.0, delay: 1.0, drift: '12px' },
  { x: '82%', s: 4, d: 8.5, delay: 2.5, drift: '-16px' },
  { x: '85%', s: 2, d: 5.0, delay: 3.5, drift: '6px' },
  { x: '88%', s: 3, d: 7.0, delay: 0.5, drift: '-10px' },
  { x: '90%', s: 4, d: 8.0, delay: 1.8, drift: '14px' },
  { x: '92%', s: 2, d: 6.5, delay: 4.5, drift: '-8px' },
  { x: '94%', s: 3, d: 7.2, delay: 2.2, drift: '10px' },
  { x: '69%', s: 2, d: 6.0, delay: 5.0, drift: '-14px' },
  { x: '86%', s: 3, d: 8.0, delay: 5.5, drift: '18px' },
];

export default function HeroFx() {
  const ref = useRef(null);

  // leve parallax: as camadas seguem o mouse com atraso (transform, 60fps)
  useEffect(() => {
    const el = ref.current;
    const host = el?.parentElement;
    if (!el || !host || window.matchMedia?.('(pointer: coarse)').matches) return undefined;
    let raf = 0, tx = 0, ty = 0, cx = 0, cy = 0, ativo = false;
    const tick = () => {
      cx += (tx - cx) * 0.08;
      cy += (ty - cy) * 0.08;
      el.style.setProperty('--par-x', cx.toFixed(3));
      el.style.setProperty('--par-y', cy.toFixed(3));
      if (Math.abs(tx - cx) > 0.001 || Math.abs(ty - cy) > 0.001) raf = requestAnimationFrame(tick);
      else { ativo = false; }
    };
    const arma = () => { if (!ativo) { ativo = true; raf = requestAnimationFrame(tick); } };
    const onMove = (e) => {
      const r = host.getBoundingClientRect();
      tx = ((e.clientX - r.left) / r.width - 0.5) * 2;
      ty = ((e.clientY - r.top) / r.height - 0.5) * 2;
      arma();
    };
    const onLeave = () => { tx = 0; ty = 0; arma(); };
    host.addEventListener('pointermove', onMove);
    host.addEventListener('pointerleave', onLeave);
    return () => {
      cancelAnimationFrame(raf);
      host.removeEventListener('pointermove', onMove);
      host.removeEventListener('pointerleave', onLeave);
    };
  }, []);

  return (
    <div className="hero-fx" aria-hidden="true" ref={ref}>
      {/* névoa e fumaça: camadas com parallax próprio */}
      <span className="hero-par hero-par--fundo">
        <i className="hero-nevoa" />
        <i className="hero-nevoa hero-nevoa--2" />
      </span>
      <span className="hero-par hero-par--meio">
        <span className="hero-glow" />
        <span className="hero-glow hero-glow--blade" />
        <i className="hero-fumaca" />
      </span>
      <span className="hero-par hero-par--frente">
        {EMBERS.map((e, i) => (
          <i
            key={i}
            className="ember"
            style={{ '--x': e.x, '--s': `${e.s}px`, '--d': `${e.d}s`, '--delay': `${e.delay}s`, '--drift': e.drift }}
          />
        ))}
      </span>
    </div>
  );
}
