// STIKDEAD :: CALIBRADOR DE PEÇAS (dev) — ajuste visual de pivôs, sem chute
// Carrega /parts/<nome>.webp, prende à âncora escolhida e exporta o JSON.
// Arrastar = offset · Roda = escala · Q/E = rotação · X espelha
import { useEffect, useRef, useState } from 'react';
import { Application, Container, Graphics, Sprite, Assets } from 'pixi.js';
import { drawFighter } from '../game/rig.js';
import { MOVES, createMatch, stepMatch, EMPTY_INPUT } from '../game/sim.js';

const ANCHORS = ['neck', 'hip', 'head', 'wristF', 'wristB', 'elbowF', 'elbowB', 'ankleF', 'ankleB', 'kneeF', 'kneeB'];

export default function Calibrador({ profile }) {
  const host = useRef(null);
  const [part, setPart] = useState('foot');
  const [partInput, setPartInput] = useState('foot');
  const [anchor, setAnchor] = useState('neck');
  const [cfg, setCfg] = useState({ dx: 0, dy: 0, scale: 1, rot: 0, flip: false });
  const cfgRef = useRef(cfg);
  cfgRef.current = cfg;
  const anchorRef = useRef(anchor);
  anchorRef.current = anchor;
  const [status, setStatus] = useState('carregando...');
  const [anim, setAnim] = useState(false);
  const animRef = useRef(anim);
  animRef.current = anim;
  const [ghost, setGhost] = useState(false);
  const ghostRef = useRef(ghost);
  ghostRef.current = ghost;

  useEffect(() => {
    let app = null;
    let alive = true;
    (async () => {
      app = new Application();
      await app.init({ background: 0x141114, width: 900, height: 620, antialias: true });
      if (!alive) return app.destroy(true);
      host.current.appendChild(app.canvas);

      const world = new Container();
      world.position.set(450, 480);
      world.scale.set(2.2);
      app.stage.addChild(world);
      const g = new Graphics();
      const spr = new Sprite();
      spr.anchor.set(0.5);
      const cross = new Graphics();
      world.addChild(g, spr, cross);

      let tex = null;
      try {
        tex = await Assets.load(`/parts/${part}.webp?v=${Date.now()}`);
        spr.texture = tex;
        setStatus(`peça: /parts/${part}.webp (${tex.width}x${tex.height})`);
      } catch {
        setStatus(`SEM ARQUIVO: /parts/${part}.webp — gere e instale com fetch-part`);
      }

      const match = createMatch({ styles: ['ronin', 'ronin'] });
      const f = match.fighters[0];
      f.x = 0;
      let elapsed = 0;

      app.ticker.add((tk) => {
        try {
        const dt = Math.min(0.05, tk.deltaMS / 1000);
        elapsed += dt;
        if (animRef.current) stepMatch(match, { ...EMPTY_INPUT, right: Math.sin(elapsed) > 0 }, EMPTY_INPUT, dt);
        g.alpha = ghostRef.current ? 0.22 : 1;
        const pose = drawFighter(g, f, MOVES, 0xd90429, elapsed, null);
        const c = cfgRef.current;
        const isHead = anchorRef.current === 'head';
        const a = isHead ? { x: pose.hx, y: pose.hy } : pose[anchorRef.current];
        const ax = a.x;
        const ay = a.y;
        if (tex) {
          spr.visible = true;
          spr.position.set(ax + c.dx * (c.flip ? -1 : 1), ay + c.dy);
          spr.scale.set((c.flip ? -1 : 1) * c.scale * 0.25, c.scale * 0.25);
          spr.rotation = (c.rot * Math.PI) / 180;
        }
        cross.clear();
        cross.moveTo(ax - 6, ay).lineTo(ax + 6, ay).stroke({ width: 1, color: 0x9fd8ff });
        cross.moveTo(ax, ay - 6).lineTo(ax, ay + 6).stroke({ width: 1, color: 0x9fd8ff });
        } catch (err) {
          setStatus('ERRO NO LOOP: ' + (err?.message || err));
        }
      });
      window.addEventListener('error', (e) => setStatus('ERRO GLOBAL: ' + e.message));

      // interações
      let drag = null;
      app.canvas.addEventListener('pointerdown', (e) => { drag = { x: e.clientX, y: e.clientY }; });
      window.addEventListener('pointermove', (e) => {
        if (!drag) return;
        const k = 1 / 2.2;
        const mx = (e.clientX - drag.x) * k;
        const my = (e.clientY - drag.y) * k;
        drag = { x: e.clientX, y: e.clientY };
        setCfg((c) => ({ ...c, dx: c.dx + mx, dy: c.dy + my }));
      });
      window.addEventListener('pointerup', () => { drag = null; });
      app.canvas.addEventListener('wheel', (e) => {
        e.preventDefault();
        setCfg((c) => ({ ...c, scale: Math.max(0.05, c.scale * (e.deltaY < 0 ? 1.04 : 0.96)) }));
      }, { passive: false });
      const onKey = (e) => {
        if (e.key === 'q') setCfg((c) => ({ ...c, rot: c.rot - 2 }));
        if (e.key === 'e') setCfg((c) => ({ ...c, rot: c.rot + 2 }));
        if (e.key === 'x') setCfg((c) => ({ ...c, flip: !c.flip }));
      };
      window.addEventListener('keydown', onKey);
    })();
    return () => { alive = false; app?.destroy(true, { children: true }); };
    // eslint-disable-next-line
  }, [part]);

  const exportar = () => {
    const out = JSON.stringify({ [part]: { anchor, ...cfg, scale: +cfg.scale.toFixed(3), dx: +cfg.dx.toFixed(1), dy: +cfg.dy.toFixed(1) } }, null, 2);
    navigator.clipboard?.writeText(out);
    alert('Config copiada:\n' + out);
  };

  if (profile?.email !== 'souzacostabrenno@gmail.com') return <div className="scene"><p>Página de desenvolvimento.</p></div>;

  return (
    <div className="scene" style={{ paddingTop: 20 }}>
      <h2 style={{ letterSpacing: '.1em' }}>CALIBRADOR <span className="red">DE PEÇAS</span></h2>
      <p className="dash-empty">{status} · arrasta=posição · roda=escala · Q/E=rotação · X=espelho</p>
      <div style={{ display: 'flex', gap: 10, marginBottom: 10, flexWrap: 'wrap', justifyContent: 'center' }}>
        <input
          value={partInput}
          onChange={(e) => setPartInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && setPart(partInput.trim())}
          onBlur={() => setPart(partInput.trim())}
          placeholder="peça + Enter"
          style={{ width: 110, padding: '6px 10px' }}
        />
        {ANCHORS.map((a) => (
          <button key={a} className={`filter ${anchor === a ? 'on' : ''}`} onClick={() => setAnchor(a)}>{a}</button>
        ))}
        <button className="filter" onClick={() => setAnim(!anim)}>{anim ? '⏸ parar' : '▶ animar'}</button>
        <button className={`filter ${ghost ? 'on' : ''}`} onClick={() => setGhost(!ghost)}>👻 gabarito</button>
        <button className="btn btn-blood" style={{ width: 'auto', padding: '8px 18px' }} onClick={exportar}>Exportar JSON</button>
      </div>
      <div ref={host} style={{ border: '1px solid #33161d', borderRadius: 12, overflow: 'hidden' }} />
      <p className="dash-empty" style={{ marginTop: 8 }}>
        offset {cfg.dx.toFixed(0)},{cfg.dy.toFixed(0)} · escala {cfg.scale.toFixed(2)} · rot {cfg.rot}° {cfg.flip ? '· espelhado' : ''}
      </p>
    </div>
  );
}
