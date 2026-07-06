// STIKDEAD :: hero da tela inicial — arte pintada + camadas vivas por código
// (arte IA por baixo; brasas, pulso da lua, névoa e parallax por cima)
import { Application, Container, Graphics, Sprite, Assets } from 'pixi.js';

const MOON = { x: 0.5, y: 0.245, r: 0.30 }; // posição relativa da lua na arte

export async function createHero(host) {
  const app = new Application();
  await app.init({ background: '#0b0709', resizeTo: host, antialias: true });
  host.appendChild(app.canvas);
  app.canvas.style.display = 'block';

  const root = new Container();
  app.stage.addChild(root);

  const tex = await Assets.load('/hero.webp');
  const art = new Sprite(tex);
  root.addChild(art);

  const glow = new Graphics();   // pulso da lua
  const fog = new Graphics();    // névoa
  const emberG = new Graphics(); // brasas
  const vig = new Graphics();    // respiração da vinheta
  root.addChild(glow, fog, emberG, vig);

  const embers = Array.from({ length: 40 }, () => ({
    x: Math.random(), y: Math.random(), s: 0.8 + Math.random() * 2.0,
    v: 10 + Math.random() * 26, drift: 6 + Math.random() * 22,
    ph: Math.random() * Math.PI * 2, red: Math.random() < 0.75,
  }));

  let elapsed = 0;
  let W = 0, H = 0;
  const pointer = { x: 0.5, y: 0.5, tx: 0.5, ty: 0.5 };

  const onMove = (e) => {
    const r = app.canvas.getBoundingClientRect();
    pointer.tx = (e.clientX - r.left) / r.width;
    pointer.ty = (e.clientY - r.top) / r.height;
  };
  app.canvas.addEventListener('pointermove', onMove);

  app.ticker.add((tk) => {
    const dt = Math.min(0.05, tk.deltaMS / 1000);
    elapsed += dt;
    const w = app.renderer.width / app.renderer.resolution;
    const h = app.renderer.height / app.renderer.resolution;
    W = w; H = h;

    // cover-fit + parallax suave (segue o ponteiro com atraso; deriva sozinho no toque)
    pointer.x += (pointer.tx - pointer.x) * Math.min(1, dt * 4);
    pointer.y += (pointer.ty - pointer.y) * Math.min(1, dt * 4);
    const idleX = Math.sin(elapsed * 0.4) * 0.5 + 0.5;
    const px = 0.35 * pointer.x + 0.65 * idleX;
    const over = 1.06; // 6% maior para sobrar margem de parallax
    const k = Math.max(W / tex.width, H / tex.height) * over;
    art.scale.set(k);
    art.position.set(
      (W - tex.width * k) / 2 - (px - 0.5) * W * 0.05,
      (H - tex.height * k) / 2 - (pointer.y - 0.5) * H * 0.03
    );

    const wind = Math.sin(elapsed * 1.2) * 0.5 + Math.sin(elapsed * 2.9) * 0.5;

    // pulso da lua (alinhado à arte)
    const mx = art.position.x + MOON.x * tex.width * k;
    const my = art.position.y + MOON.y * tex.height * k;
    const mr = MOON.r * tex.width * k * 0.5;
    glow.clear();
    const pulse = 0.05 + 0.05 * Math.sin(elapsed * 1.6);
    glow.circle(mx, my, mr * 1.05).stroke({ width: 8, color: 0xd90429, alpha: pulse });
    glow.circle(mx, my, mr * 1.3).fill({ color: 0xb0031f, alpha: pulse * 0.4 });

    // névoa rasteira
    fog.clear();
    const f1 = ((elapsed * 10) % (W + 360)) - 180;
    const f2 = W - (((elapsed * 6) + W * 0.5) % (W + 360)) + 180;
    fog.ellipse(f1, H * 0.82, 200, 26).fill({ color: 0x2a1218, alpha: 0.16 });
    fog.ellipse(f2, H * 0.7, 240, 32).fill({ color: 0x1c0d12, alpha: 0.13 });

    // brasas ao vento
    emberG.clear();
    for (const e of embers) {
      e.y -= (e.v * dt) / H;
      e.x -= ((e.drift * (1 + wind * 0.5)) * dt) / W;
      if (e.y < -0.05 || e.x < -0.05) { e.y = 1.02; e.x = 0.15 + Math.random() * 0.9; }
      const flick = 0.4 + 0.4 * Math.sin(elapsed * 6 + e.ph);
      emberG.circle(e.x * W, e.y * H, e.s).fill({
        color: e.red ? 0xd90429 : 0x8a8377,
        alpha: flick * (e.red ? 0.75 : 0.35),
      });
    }

    // vinheta respirando
    vig.clear();
    const breathe = 0.42 + 0.05 * Math.sin(elapsed * 0.8);
    vig.rect(0, 0, W, H * 0.1).fill({ color: 0x000000, alpha: breathe * 0.7 });
    vig.rect(0, H * 0.86, W, H * 0.14).fill({ color: 0x000000, alpha: breathe });
  });

  return {
    destroy() {
      app.canvas.removeEventListener('pointermove', onMove);
      app.destroy(true, { children: true });
    },
  };
}
