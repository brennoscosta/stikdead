// STIKDEAD :: renderizador da batalha (PixiJS)
import { Application, Container, Graphics, Text } from 'pixi.js';
import { MOVES } from './sim.js';
import { drawFighter } from './rig.js';
import { buildArena, createFx, fxStep, fxHit, fxKo, fxDash, WORLD } from './arena.js';

export async function createRenderer(host, theme = 'dojo') {
  const app = new Application();
  await app.init({ background: '#e7dfcf', resizeTo: host, antialias: true });
  host.appendChild(app.canvas);
  app.canvas.style.display = 'block';

  const camera = new Container();
  app.stage.addChild(camera);

  const world = new Container();
  camera.addChild(world);

  world.addChild(buildArena(theme));
  const gA = new Graphics();
  const gB = new Graphics();
  world.addChild(gA, gB);
  const fx = createFx(world);

  const tagStyle = { fontFamily: 'Barlow Condensed, sans-serif', fontSize: 15, fill: 0x2b2620, letterSpacing: 1 };
  const tagA = new Text({ text: '', style: tagStyle });
  const tagB = new Text({ text: '', style: tagStyle });
  tagA.anchor.set(0.5, 1);
  tagB.anchor.set(0.5, 1);
  world.addChild(tagA, tagB);
  let loadouts = [null, null];
  let names = ['', ''];

  const flash = new Graphics();
  app.stage.addChild(flash);

  let elapsed = 0;

  const ease = (t) => t * t * (3 - 2 * t);

  function layout(match) {
    const w = app.renderer.width / app.renderer.resolution;
    const h = app.renderer.height / app.renderer.resolution;
    let scale = Math.min(w / (WORLD.width + 60), h / 420);
    let focusX = 0;
    if (match && match.phase === 'countdown') {
      // entrada cinematográfica: câmera fechada nos lutadores, abrindo até o LUTE!
      const k = ease(Math.min(1, match.phaseT / 3.0));
      scale *= 1.75 - 0.75 * k;
      const [a, b] = match.fighters;
      focusX = ((a.x + b.x) / 2) * (1 - k);
    }
    world.scale.set(scale);
    world.x = w / 2 - focusX * scale;
    world.y = h * 0.82 + (match && match.phase === 'countdown' ? 40 * (world.scale.x / scale) * 0 : 0);
  }

  function frame(match, events, dt) {
    elapsed += dt;
    layout(match);

    for (const e of events) {
      if (e.type === 'fightstart') fx.shake = Math.max(fx.shake, 10);
      if (e.type === 'hit') fxHit(fx, e.x, e.y, e.attacker === 0 ? 1 : -1, e);
      if (e.type === 'ko') fxKo(fx, e.x, e.y, e.winner === 0 ? 1 : -1);
      if (e.type === 'dash') fxDash(fx, e.x);
    }

    const [a, b] = match.fighters;
    drawFighter(gA, a, MOVES, 0xd90429, elapsed, loadouts[0]);
    drawFighter(gB, b, MOVES, 0x6e6e6e, elapsed, loadouts[1]);
    tagA.text = names[0];
    tagB.text = names[1];
    tagA.position.set(a.x, -(a.y + 152));
    tagB.position.set(b.x, -(b.y + 152));

    fxStep(fx, dt);

    // tremor de tela
    if (fx.shake > 0.3) {
      camera.x = (Math.random() - 0.5) * fx.shake;
      camera.y = (Math.random() - 0.5) * fx.shake;
    } else {
      camera.x = 0;
      camera.y = 0;
    }

    // flash de impacto
    flash.clear();
    if (fx.flash > 0) {
      const w = app.renderer.width / app.renderer.resolution;
      const h = app.renderer.height / app.renderer.resolution;
      flash.rect(0, 0, w, h).fill({ color: 0xffffff, alpha: Math.min(0.5, fx.flash * 6) });
    }
  }

  return {
    app,
    frame,
    setLoadouts(la, lb) { loadouts = [la || null, lb || null]; },
    setNames(na, nb) { names = [na || '', nb || '']; },
    destroy() {
      app.destroy(true, { children: true });
    },
  };
}
