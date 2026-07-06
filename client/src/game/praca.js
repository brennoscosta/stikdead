// STIKDEAD :: praça do lobby — jogadores online passeando com suas builds
import { Application, Container, Graphics, Text, Sprite, Assets } from 'pixi.js';
import { drawFighter } from './rig.js';
import { MOVES } from './sim.js';

const MAX_WALKERS = 14;

export async function createPlaza(host) {
  const app = new Application();
  await app.init({ background: '#120a0e', resizeTo: host, antialias: true });
  host.appendChild(app.canvas);
  app.canvas.style.display = 'block';

  const world = new Container();
  app.stage.addChild(world);

  // cenário: pintado (se existir) com fallback vetorial noturno
  const bg = new Graphics();
  world.addChild(bg);
  let paintedSpr = null;
  Assets.load('/arenas/praca.webp').then((tex) => {
    paintedSpr = new Sprite(tex);
    world.addChildAt(paintedSpr, 1);
  }).catch(() => {});

  const actors = new Map(); // id -> { f, g, tag, name, speed, timer }
  const halos = new Graphics();
  const layer = new Container();
  world.addChild(halos, layer);

  let elapsed = 0;
  let W = 0, H = 0;

  const drawBg = () => {
    bg.clear();
    bg.rect(0, 0, W, H).fill(0x120a0e);
    // lua vermelha grande
    const mx = W * 0.5, my = H * 0.3, mr = Math.min(H * 0.42, 90);
    bg.circle(mx, my, mr * 1.5).fill({ color: 0x3d0713, alpha: 0.5 });
    bg.circle(mx, my, mr).fill(0x8f0620);
    bg.circle(mx, my, mr).fill({ color: 0xb0031f, alpha: 0.6 });
    bg.circle(mx - mr * 0.3, my - mr * 0.2, mr * 0.2).fill({ color: 0x6b0417, alpha: 0.5 });
    // templo em silhueta atrás da lua
    const ty = H - 44;
    for (const [tx, sc] of [[W * 0.14, 1], [W * 0.86, 0.8]]) {
      bg.moveTo(tx - 60 * sc, ty).lineTo(tx - 60 * sc, ty - 50 * sc).lineTo(tx - 76 * sc, ty - 50 * sc)
        .lineTo(tx, ty - 90 * sc).lineTo(tx + 76 * sc, ty - 50 * sc).lineTo(tx + 60 * sc, ty - 50 * sc)
        .lineTo(tx + 60 * sc, ty).closePath().fill({ color: 0x1c1014, alpha: 0.95 });
      // lanternas penduradas
      for (const lx of [-40 * sc, 40 * sc]) {
        bg.circle(tx + lx, ty - 34 * sc, 5).fill({ color: 0xff5a3c, alpha: 0.85 });
        bg.circle(tx + lx, ty - 34 * sc, 11).fill({ color: 0xd93c1f, alpha: 0.16 });
      }
    }
    // faixa STIKDEAD ao fundo
    bg.rect(mx - 90, my - mr - 26, 180, 6).fill({ color: 0x2a161c, alpha: 0.9 });
    // chão de pedra escuro
    bg.rect(0, H - 40, W, 40).fill(0x1c1216);
    bg.moveTo(0, H - 40).lineTo(W, H - 40).stroke({ width: 3, color: 0x8f0620, alpha: 0.6 });
    for (let i = 0; i < Math.ceil(W / 90); i++)
      bg.moveTo(i * 90 + 20, H - 40).lineTo(i * 90, H).stroke({ width: 2, color: 0x2a1a20 });
  };

  const spawn = (p) => {
    const g = new Graphics();
    const tag = new Text({
      text: p.name,
      style: { fontFamily: 'Barlow Condensed, sans-serif', fontSize: 13, fill: 0xe8e4da, letterSpacing: 1 },
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
    if (paintedSpr) {
      bg.visible = false;
      const k = Math.max(W / paintedSpr.texture.width, H / paintedSpr.texture.height);
      paintedSpr.scale.set(k);
      paintedSpr.position.set((W - paintedSpr.texture.width * k) / 2, (H - paintedSpr.texture.height * k) / 2);
    }

    const scale = Math.min(0.62, H / 300);
    halos.clear();
    for (const a of actors.values()) {
      halos.ellipse(a.f.x * scale, H - 40 - 60 * scale, 40 * scale, 70 * scale).fill({ color: 0xffe8d6, alpha: 0.045 });
      halos.ellipse(a.f.x * scale, H - 42, 30 * scale, 6).fill({ color: 0xd90429, alpha: 0.12 });
    }
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
      // halo de luz da lua atrás do boneco (contraste no escuro)
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
