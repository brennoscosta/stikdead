// STIKDEAD :: preview do boneco equipado (inventário/perfil)
import { Application, Container, Graphics } from 'pixi.js';
import { drawFighter } from './rig.js';
import { createWeaponSprite, filterForVector } from './itemSprites.js';
import { MOVES } from './sim.js';

export async function createPreview(host) {
  const app = new Application();
  await app.init({ background: '#141414', antialias: true, resizeTo: host });
  host.appendChild(app.canvas);
  app.canvas.style.display = 'block';

  const stage = new Container();
  app.stage.addChild(stage);
  const g = new Graphics();
  stage.addChild(g);
  const ws = createWeaponSprite(stage, g); // arma pintada na mesma transformação do boneco

  const fighter = { x: 0, y: 0, vx: 0, vy: 0, face: 1, hp: 100, state: 'idle', t: 0, hitstun: 0, combo: 0 };
  let loadout = [];
  let elapsed = 0;

  app.ticker.add((tk) => {
    const dt = tk.deltaMS / 1000;
    elapsed += dt;
    fighter.t += dt;
    const w = app.renderer.width / app.renderer.resolution;
    const h = app.renderer.height / app.renderer.resolution;
    const scale = Math.min(w / 220, h / 200);
    stage.position.set(w / 2, h * 0.9);
    stage.scale.set(scale);
    drawFighter(g, fighter, MOVES, null, elapsed, filterForVector(loadout, ws));
    ws.update(fighter, MOVES);
  });

  return {
    setLoadout(l) { loadout = l || []; ws.setLoadout(loadout); },
    setPose(state) { fighter.state = state; fighter.t = 0; },
    destroy() { ws.destroy(); app.destroy(true, { children: true }); },
  };
}
