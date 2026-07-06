// STIKDEAD :: hero animado da tela inicial — lua vermelha, vento, brasas e o mascote
import { Application, Container, Graphics, Text } from 'pixi.js';
import { drawFighter } from './rig.js';
import { MOVES } from './sim.js';

export async function createHero(host) {
  const app = new Application();
  await app.init({ background: '#0b0709', resizeTo: host, antialias: true });
  host.appendChild(app.canvas);
  app.canvas.style.display = 'block';

  const stage = app.stage;
  const bg = new Graphics();       // lua, pagodes, chão
  const fog = new Graphics();      // névoa
  const banner = new Graphics();   // faixa com kanji
  const ribbons = new Graphics();  // panos vermelhos ao vento
  const gFighter = new Graphics(); // mascote
  const emberG = new Graphics();   // brasas
  const vig = new Graphics();      // vinheta
  stage.addChild(bg, fog, banner, gFighter, ribbons, emberG, vig);

  const kanji = new Text({
    text: '死',
    style: { fontFamily: 'serif', fontSize: 44, fill: 0xb0031f, fontWeight: 'bold' },
  });
  kanji.anchor.set(0.5);
  stage.addChild(kanji);

  const fighter = {
    x: 0, y: 0, vx: 0, vy: 0, face: 1, hp: 100,
    state: 'idle', t: 0, hitstun: 0, combo: 0,
  };
  const loadout = [
    { slot: 'body', template: 'scarf', params: { color: '#d90429' } },
    { slot: 'back', template: 'sheath', params: {} },
  ];

  // brasas: sobem à esquerda com o vento
  const embers = Array.from({ length: 46 }, () => ({
    x: Math.random(), y: Math.random(), s: 1 + Math.random() * 2.4,
    v: 14 + Math.random() * 30, drift: 8 + Math.random() * 26,
    ph: Math.random() * Math.PI * 2, red: Math.random() < 0.7,
  }));

  let elapsed = 0;
  let W = 0, H = 0;

  const drawStatic = () => {
    bg.clear();
    bg.rect(0, 0, W, H).fill(0x0b0709);

    // lua vermelha com halo
    const mx = W / 2, my = H * 0.34, mr = Math.min(W, H) * 0.30;
    bg.circle(mx, my, mr * 1.45).fill({ color: 0x3d0713, alpha: 0.5 });
    bg.circle(mx, my, mr * 1.2).fill({ color: 0x5c0a1c, alpha: 0.55 });
    bg.circle(mx, my, mr).fill(0x8f0620);
    bg.circle(mx, my, mr).fill({ color: 0xb0031f, alpha: 0.65 });
    // manchas da lua
    bg.circle(mx - mr * 0.3, my - mr * 0.25, mr * 0.22).fill({ color: 0x6b0417, alpha: 0.5 });
    bg.circle(mx + mr * 0.28, my + mr * 0.18, mr * 0.16).fill({ color: 0x6b0417, alpha: 0.45 });
    bg.circle(mx + mr * 0.05, my - mr * 0.42, mr * 0.1).fill({ color: 0x6b0417, alpha: 0.4 });

    // pagodes em silhueta
    const pag = (px, py, s, alpha) => {
      for (let lvl = 0; lvl < 3; lvl++) {
        const w = (86 - lvl * 22) * s, h2 = 16 * s, y = py - lvl * 26 * s;
        bg.moveTo(px - w / 2 - 10 * s, y).lineTo(px, y - h2 - 8 * s).lineTo(px + w / 2 + 10 * s, y)
          .closePath().fill({ color: 0x140b0e, alpha });
        bg.rect(px - w / 2 + 8 * s, y, w - 16 * s, 18 * s).fill({ color: 0x140b0e, alpha });
      }
    };
    pag(W * 0.13, H * 0.62, 1, 0.9);
    pag(W * 0.87, H * 0.58, 0.8, 0.85);
    pag(W * 0.72, H * 0.66, 0.55, 0.7);

    // chão
    bg.rect(0, H * 0.78, W, H * 0.22).fill(0x0e0a0c);
    bg.moveTo(0, H * 0.78).lineTo(W, H * 0.78).stroke({ width: 3, color: 0x1c1216 });

    // respingos de tinta fixos
    for (let i = 0; i < 26; i++) {
      const sx = (i * 137.5) % W, sy = (i * 89.3) % (H * 0.9);
      bg.circle(sx, sy, 1 + (i % 3)).fill({ color: 0x8f0620, alpha: 0.25 + (i % 4) * 0.08 });
    }

    // vinheta
    vig.clear();
    vig.rect(0, 0, W, H * 0.16).fill({ color: 0x000000, alpha: 0.55 });
    vig.rect(0, H * 0.84, W, H * 0.16).fill({ color: 0x000000, alpha: 0.55 });
    vig.rect(0, 0, W * 0.1, H).fill({ color: 0x000000, alpha: 0.35 });
    vig.rect(W * 0.9, 0, W * 0.1, H).fill({ color: 0x000000, alpha: 0.35 });
  };

  app.ticker.add((tk) => {
    const dt = Math.min(0.05, tk.deltaMS / 1000);
    elapsed += dt;
    const w = app.renderer.width / app.renderer.resolution;
    const h = app.renderer.height / app.renderer.resolution;
    if (w !== W || h !== H) { W = w; H = h; drawStatic(); }

    const wind = Math.sin(elapsed * 1.3) * 0.5 + Math.sin(elapsed * 3.1) * 0.5;

    // névoa deslizando
    fog.clear();
    const f1 = ((elapsed * 12) % (W + 400)) - 200;
    const f2 = ((elapsed * 7 + W * 0.6) % (W + 400)) - 200;
    fog.ellipse(f1, H * 0.72, 220, 34).fill({ color: 0x2a1218, alpha: 0.22 });
    fog.ellipse(W - f2, H * 0.6, 260, 40).fill({ color: 0x1c0d12, alpha: 0.18 });

    // faixa com kanji balançando
    banner.clear();
    const bx = W * 0.82, by = H * 0.18, bw = 64, bh = 170;
    const sway = wind * 10;
    banner.moveTo(bx - bw / 2, by).lineTo(bx + bw / 2, by)
      .lineTo(bx + bw / 2 + sway, by + bh)
      .lineTo(bx + sway * 1.2, by + bh + 16)
      .lineTo(bx - bw / 2 + sway, by + bh)
      .closePath().fill({ color: 0x140b0e, alpha: 0.95 }).stroke({ width: 2.5, color: 0x2a161c });
    banner.rect(bx - bw / 2 - 6, by - 8, bw + 12, 10).fill(0x2a161c);
    kanji.position.set(bx + sway * 0.5, by + bh * 0.42);
    kanji.rotation = sway * 0.004;

    // mascote: idle respirando, cachecol no vento (o template scarf já ondula)
    fighter.t += dt;
    const scale = Math.min(1.15, H / 300);
    gFighter.position.set(W / 2, H * 0.885);
    gFighter.scale.set(scale);
    drawFighter(gFighter, fighter, MOVES, null, elapsed, loadout);

    // panos vermelhos voando ao redor (tiras bezier)
    ribbons.clear();
    for (let i = 0; i < 3; i++) {
      const side = i % 2 === 0 ? -1 : 1;
      const ox = W / 2 + side * (90 + i * 34) * scale;
      const oy = H * 0.55 - i * 30;
      const ph = elapsed * (2 + i * 0.5) + i * 2;
      const amp = (10 + i * 5) * (1 + wind * 0.4);
      ribbons.moveTo(ox, oy)
        .bezierCurveTo(
          ox + side * 30, oy - 18 + Math.sin(ph) * amp,
          ox + side * 62, oy + 8 + Math.cos(ph * 1.2) * amp,
          ox + side * 96, oy - 6 + Math.sin(ph * 0.8) * amp * 1.4
        )
        .stroke({ width: 7 - i, color: 0x8f0620, alpha: 0.5 - i * 0.1, cap: 'round' });
    }

    // brasas subindo
    emberG.clear();
    for (const e of embers) {
      e.y -= (e.v * dt) / H;
      e.x -= ((e.drift * (1 + wind * 0.5)) * dt) / W;
      if (e.y < -0.05 || e.x < -0.05) { e.y = 1.02; e.x = 0.2 + Math.random() * 0.85; }
      const flick = 0.45 + 0.4 * Math.sin(elapsed * 6 + e.ph);
      emberG.circle(e.x * W, e.y * H, e.s).fill({ color: e.red ? 0xd90429 : 0x8a8377, alpha: flick * (e.red ? 0.8 : 0.4) });
    }

    // pulso da lua (halo por cima, barato)
    const pulse = 0.06 + 0.05 * Math.sin(elapsed * 1.7);
    emberG.circle(W / 2, H * 0.34, Math.min(W, H) * 0.30 * 1.06).stroke({ width: 6, color: 0xd90429, alpha: pulse });
  });

  return { destroy() { app.destroy(true, { children: true }); } };
}
