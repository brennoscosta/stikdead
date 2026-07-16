// STIKDEAD :: efeito do banner do herói — brasas subindo + brilho que ilumina a espada
// Puramente decorativo (aria-hidden). Concentrado à direita, onde está o samurai/lua.
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
  return (
    <div className="hero-fx" aria-hidden="true">
      <span className="hero-glow" />
      <span className="hero-glow hero-glow--blade" />
      {EMBERS.map((e, i) => (
        <i
          key={i}
          className="ember"
          style={{ '--x': e.x, '--s': `${e.s}px`, '--d': `${e.d}s`, '--delay': `${e.delay}s`, '--drift': e.drift }}
        />
      ))}
    </div>
  );
}
