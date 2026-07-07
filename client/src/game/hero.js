// STIKDEAD :: fundo vivo da tela inicial — a arte É a tela (fullscreen, sem bordas)
// Arte pintada no topo fundindo no escuro; brasas, névoa, pulso da lua e
// respingos por todo o viewport; parallax global.
import { Application, Container, Graphics, Sprite, Assets } from 'pixi.js';

const ART = { w: 1024, h: 660 };
const MOON = { x: 0.5, y: 0.245, r: 0.30 };
const BG = 0x0b0709;

export async function createHero(host) {
  const app = new Application();
  await app.init({ background: BG, resizeTo: window, antialias: true });
  host.appendChild(app.canvas);
  app.canvas.style.display = 'block';

  const root = new Container();
  app.stage.addChild(root);

  const tex = await Assets.load('/hero.webp');
  const art = new Sprite(tex);
  const seam = new Graphics();    // fusão arte → escuro (sem emenda)
  const splat = new Graphics();   // respingos de tinta no viewport todo
  const glow = new Graphics();    // pulso da lua
  const fog = new Graphics();     // névoa
  const emberG = new Graphics();  // brasas
  root.addChild(art, seam, splat, glow, fog, emberG);

  const embers = Array.from({ length: 60 }, () => ({
    x: Math.random(), y: Math.random(), s: 0.8 + Math.random() * 2.2,
    v: 10 + Math.random() * 28, drift: 6 + Math.random() * 24,
    ph: Math.random() * Math.PI * 2, red: Math.random() < 0.7,
  }));

  let elapsed = 0;
  let W = 0, H = 0;
  const pointer = { x: 0.5, y: 0.5, tx: 0.5, ty: 0.5 };
  const onMove = (e) => {
    pointer.tx = e.clientX / window.innerWidth;
    pointer.ty = e.clientY / window.innerHeight;
  };
  window.addEventListener('pointermove', onMove, { passive: true });

  const layout = () => {
    // mesma regra do .hero-spacer no CSS: largura total, altura cap em 58vh
    const artH = W * (ART.h / ART.w); // full-bleed: borda lateral não existe
    const k = artH / ART.h;
    const artW = ART.w * k;
    return { k, artW, artH, ox: (W - artW) / 2 };
  };

  const drawStatic = () => {
    const { artH } = layout();
    // respingos de tinta espalhados pela tela inteira (determinísticos)
    splat.clear();
    for (let i = 0; i < 42; i++) {
      const sx = (i * 197.3) % W;
      const sy = (i * 173.7) % H;
      const below = sy > artH;
      splat.circle(sx, sy, 1 + (i % 4)).fill({
        color: i % 3 === 0 ? 0x8f0620 : 0x3a1218,
        alpha: (below ? 0.5 : 0.3) * (0.35 + (i % 4) * 0.12),
      });
      if (i % 7 === 0)
        splat.moveTo(sx, sy).lineTo(sx + 6 + (i % 5) * 3, sy + 3 + (i % 3) * 4)
          .stroke({ width: 1.5, color: 0x8f0620, alpha: 0.28 });
    }
    // fusão: degradê da arte para o fundo em ~30% finais (zero emenda)
    seam.clear();
    const bandTop = artH * 0.7;
    const steps = 14;
    for (let i = 0; i < steps; i++) {
      const y = bandTop + (artH - bandTop) * (i / steps);
      const a = Math.pow(i / (steps - 1), 1.6);
      seam.rect(0, y, W, (artH - bandTop) / steps + 1).fill({ color: BG, alpha: a });
    }
    // laterais (quando a arte não cobre a largura toda em telas largas)
    seam.rect(0, artH - 1, W, H - artH + 1).fill(BG);
  };

  app.ticker.add((tk) => {
    const dt = Math.min(0.05, tk.deltaMS / 1000);
    elapsed += dt;
    const w = app.renderer.width / app.renderer.resolution;
    const h = app.renderer.height / app.renderer.resolution;
    if (w !== W || h !== H) { W = w; H = h; drawStatic(); }

    const { k, artW, artH, ox } = layout();

    // parallax global suave (ponteiro + deriva autônoma)
    pointer.x += (pointer.tx - pointer.x) * Math.min(1, dt * 4);
    pointer.y += (pointer.ty - pointer.y) * Math.min(1, dt * 4);
    const idle = Math.sin(elapsed * 0.35) * 0.5 + 0.5;
    const px = 0.4 * pointer.x + 0.6 * idle;
    const over = 1.05;
    art.scale.set(k * over);
    art.position.set(
      ox - (ART.w * k * (over - 1)) / 2 - (px - 0.5) * 14,
      -(ART.h * k * (over - 1)) / 2 - (pointer.y - 0.5) * 8
    );

    const wind = Math.sin(elapsed * 1.2) * 0.5 + Math.sin(elapsed * 2.9) * 0.5;

    // pulso da lua alinhado à arte
    const mx = art.position.x + MOON.x * ART.w * k * over;
    const my = art.position.y + MOON.y * ART.h * k * over;
    const mr = MOON.r * ART.w * k * 0.5;
    glow.clear();
    const pulse = 0.05 + 0.05 * Math.sin(elapsed * 1.6);
    glow.circle(mx, my, mr * 1.05).stroke({ width: 8, color: 0xd90429, alpha: pulse });
    glow.circle(mx, my, mr * 1.35).fill({ color: 0xb0031f, alpha: pulse * 0.35 });

    // névoa: na base da arte e no rodapé da tela
    fog.clear();
    const f1 = ((elapsed * 10) % (W + 400)) - 200;
    const f2 = W - (((elapsed * 6) + W * 0.4) % (W + 400)) + 200;
    const f3 = ((elapsed * 8 + W * 0.7) % (W + 400)) - 200;
    fog.ellipse(f1, artH * 0.92, 220, 26).fill({ color: 0x2a1218, alpha: 0.14 });
    fog.ellipse(f2, artH * 0.75, 260, 32).fill({ color: 0x1c0d12, alpha: 0.12 });
    fog.ellipse(f3, H * 0.94, 300, 36).fill({ color: 0x1c0d12, alpha: 0.1 });

    // brasas pela tela INTEIRA
    emberG.clear();
    for (const e of embers) {
      e.y -= (e.v * dt) / H;
      e.x -= ((e.drift * (1 + wind * 0.5)) * dt) / W;
      if (e.y < -0.05 || e.x < -0.05) { e.y = 1.02; e.x = 0.1 + Math.random() * 0.95; }
      const flick = 0.4 + 0.4 * Math.sin(elapsed * 6 + e.ph);
      emberG.circle(e.x * W, e.y * H, e.s).fill({
        color: e.red ? 0xd90429 : 0x8a8377,
        alpha: flick * (e.red ? 0.7 : 0.32),
      });
    }
  });

  return {
    destroy() {
      window.removeEventListener('pointermove', onMove);
      app.destroy(true, { children: true });
    },
  };
}
