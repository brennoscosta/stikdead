// STIKDEAD :: praça do lobby — jogadores online passeando com suas builds
import { Application, Container, Graphics, Text } from 'pixi.js';
import { drawFighter } from './rig.js';
import { MOVES } from './sim.js';

const MAX_WALKERS = 14;

export async function createPlaza(host) {
  const app = new Application();
  await app.init({ background: '#e7dfcf', resizeTo: host, antialias: true });
  host.appendChild(app.canvas);
  app.canvas.style.display = 'block';

  const world = new Container();
  app.stage.addChild(world);

  // cenário: papel, lua vermelha, faixa e chão
  const bg = new Graphics();
  world.addChild(bg);

  const actors = new Map(); // id -> { f, g, tag, name, speed, timer }
  const layer = new Container();
  world.addChild(layer);

  let elapsed = 0;
  let W = 0, H = 0;

  const drawBg = () => {
    bg.clear();
    bg.rect(0, 0, W, H).fill(0xece5d6);
    bg.circle(W * 0.82, H * 0.28, Math.min(64, H * 0.3)).fill({ color: 0xb0031f, alpha: 0.85 });
    bg.circle(W * 0.82, H * 0.28, Math.min(64, H * 0.3) + 10).stroke({ width: 3, color: 0xb0031f, alpha: 0.25 });
    // silhueta de templo ao fundo
    const tx = W * 0.14, ty = H - 46;
    bg.moveTo(tx - 60, ty).lineTo(tx - 60, ty - 54).lineTo(tx - 74, ty - 54).lineTo(tx, ty - 92)
      .lineTo(tx + 74, ty - 54).lineTo(tx + 60, ty - 54).lineTo(tx + 60, ty).closePath()
      .fill({ color: 0x2b2620, alpha: 0.16 });
    bg.rect(0, H - 40, W, 40).fill(0xcdb891);
    bg.moveTo(0, H - 40).lineTo(W, H - 40).stroke({ width: 4, color: 0x6d5a3c });
  };

  const spawn = (p) => {
    const g = new Graphics();
    const tag = new Text({
      text: p.name,
      style: { fontFamily: 'Barlow Condensed, sans-serif', fontSize: 13, fill: 0x2b2620, letterSpacing: 1 },
    });
    tag.anchor.set(0.5, 1);
    layer.addChild(g, tag);
    return {
      g, tag, name: p.name, loadout: p.loadout || [],
      f: {
        x: 60 + Math.random() * Math.max(120, W - 120), y: 0, vx: 0, vy: 0,
        face: Math.random() < 0.5 ? 1 : -1, hp: 100, state: 'walk', t: Math.random() * 3, hitstun: 0, combo: 0,
      },
      speed: 26 + Math.random() * 22,
      timer: 1 + Math.random() * 4,
    };
  };

  app.ticker.add((tk) => {
    const dt = Math.min(0.05, tk.deltaMS / 1000);
    elapsed += dt;
    const w = app.renderer.width / app.renderer.resolution;
    const h = app.renderer.height / app.renderer.resolution;
    if (w !== W || h !== H) { W = w; H = h; drawBg(); }

    const scale = Math.min(0.62, H / 300);
    for (const a of actors.values()) {
      a.f.t += dt;
      a.timer -= dt;
      if (a.timer <= 0) {
        a.f.state = a.f.state === 'walk' ? 'idle' : 'walk';
        a.f.t = 0;
        a.timer = a.f.state === 'walk' ? 2.5 + Math.random() * 4 : 1 + Math.random() * 2.5;
        if (a.f.state === 'walk' && Math.random() < 0.5) a.f.face *= -1;
      }
      if (a.f.state === 'walk') {
        a.f.x += a.f.face * a.speed * dt;
        const margin = 40;
        if (a.f.x < margin) { a.f.x = margin; a.f.face = 1; }
        if (a.f.x > W / scale - margin) { a.f.x = W / scale - margin; a.f.face = -1; }
      }
      a.g.position.set(0, H - 40);
      a.g.scale.set(scale);
      drawFighter(a.g, a.f, MOVES, 0xd90429, elapsed, a.loadout);
      a.tag.position.set(a.f.x * scale, H - 40 - 158 * scale);
      a.tag.text = a.name;
    }
  });

  return {
    setPlayers(players) {
      const keep = new Set();
      for (const p of players.slice(0, MAX_WALKERS)) {
        keep.add(p.id);
        const existing = actors.get(p.id);
        if (existing) {
          existing.loadout = p.loadout || [];
          existing.name = p.name;
        } else {
          actors.set(p.id, spawn(p));
        }
      }
      for (const [id, a] of actors) {
        if (!keep.has(id)) {
          a.g.destroy();
          a.tag.destroy();
          actors.delete(id);
        }
      }
    },
    destroy() { app.destroy(true, { children: true }); },
  };
}
