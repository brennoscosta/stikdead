// STIKDEAD :: renderizador da batalha (PixiJS)
import { Application, Container, Graphics } from 'pixi.js';
import { MOVES } from './sim.js';
import { drawFighter } from './rig.js';
import { buildDojo, createFx, fxStep, fxHit, fxKo, fxDash, WORLD } from './arena.js';

export async function createRenderer(host) {
  const app = new Application();
  await app.init({ background: '#e7dfcf', resizeTo: host, antialias: true });
  host.appendChild(app.canvas);
  app.canvas.style.display = 'block';

  const camera = new Container();
  app.stage.addChild(camera);

  const world = new Container();
  camera.addChild(world);

  world.addChild(buildDojo());
  const gA = new Graphics();
  const gB = new Graphics();
  world.addChild(gA, gB);
  const fx = createFx(world);

  const flash = new Graphics();
  app.stage.addChild(flash);

  let elapsed = 0;

  function layout() {
    const w = app.renderer.width / app.renderer.resolution;
    const h = app.renderer.height / app.renderer.resolution;
    const scale = Math.min(w / (WORLD.width + 60), h / 420);
    world.scale.set(scale);
    world.x = w / 2;
    world.y = h * 0.82;
  }

  function frame(match, events, dt) {
    elapsed += dt;
    layout();

    for (const e of events) {
      if (e.type === 'hit') fxHit(fx, e.x, e.y, e.attacker === 0 ? 1 : -1, e);
      if (e.type === 'ko') fxKo(fx, e.x, e.y, e.winner === 0 ? 1 : -1);
      if (e.type === 'dash') fxDash(fx, e.x);
    }

    const [a, b] = match.fighters;
    drawFighter(gA, a, MOVES, 0xd90429, elapsed);
    drawFighter(gB, b, MOVES, 0x6e6e6e, elapsed);

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
    destroy() {
      app.destroy(true, { children: true });
    },
  };
}
