// STIKDEAD :: renderizador da batalha (PixiJS)
import { Application, Container, Graphics, Text, Sprite, Assets } from 'pixi.js';
import { MOVES } from './sim.js';
import { drawFighter } from './rig.js';
import { createWeaponSprite, filterForVector } from './itemSprites.js';
import { buildArena, createFx, fxStep, fxHit, fxKo, fxDash, WORLD } from './arena.js';

const withTimeout = (p, ms, label) =>
  Promise.race([p, new Promise((_, rej) => setTimeout(() => rej(new Error(`timeout: ${label}`)), ms))]);

export async function createRenderer(host, theme = 'dojo') {
  console.log('[stikdead] renderer v7.4 — iniciando, arena =', theme);
  const app = new Application();
  await withTimeout(app.init({ background: '#e7dfcf', resizeTo: host, antialias: true }), 10000, 'pixi init');
  console.log('[stikdead] pixi ok');
  host.appendChild(app.canvas);
  app.canvas.style.display = 'block';

  const camera = new Container();
  app.stage.addChild(camera);

  const world = new Container();
  camera.addChild(world);

  // arena pintada (se existir em /arenas/{tema}.webp) com fallback vetorial
  let painted = false;
  let arenaSpr = null;
  try {
    const tex = await withTimeout(Assets.load(`/arenas/${theme}.webp`), 8000, 'arte da arena');
    console.log('[stikdead] arena pintada carregada');
    const backing = new Graphics();
    backing.rect(-6000, -6000, 12000, 12000).fill(0x0b0709);
    world.addChild(backing);
    arenaSpr = new Sprite(tex);
    world.addChild(arenaSpr);
    painted = true;
    app.renderer.background.color = 0x0b0709; // qualquer folga fica escura, nunca branca
  } catch (err) {
    console.warn('[stikdead] arte indisponível, usando arena vetorial:', err.message);
    world.addChild(buildArena(theme));
  }
  const fighterHalos = new Graphics();
  world.addChild(fighterHalos);

  const slashG = new Graphics();
  const ghostA = new Graphics();
  const ghostB = new Graphics();
  ghostA.alpha = 0.22;
  ghostB.alpha = 0.22;
  world.addChild(ghostA, ghostB, slashG);
  const gA = new Graphics();
  const gB = new Graphics();
  world.addChild(gA, gB);
  const wsA = createWeaponSprite(world);
  const wsB = createWeaponSprite(world);
  const fx = createFx(world);
  const fxRef = fx;

  const tagStyle = { fontFamily: 'Barlow Condensed, sans-serif', fontSize: 15, fill: 0x2b2620, letterSpacing: 1 };
  const tagA = new Text({ text: '', style: tagStyle });
  const tagB = new Text({ text: '', style: tagStyle });
  tagA.anchor.set(0.5, 1);
  tagB.anchor.set(0.5, 1);
  world.addChild(tagA, tagB);

  // balões de dano
  const dmgLayer = new Container();
  world.addChild(dmgLayer);
  const dmgPool = [];
  const dmgLive = [];
  const spawnOne = (wx, wy0, text, color, scale) => {
    const stack = dmgLive.filter((d) => Math.abs(d.wx - wx) < 50 && d.life > 0.3).length;
    const t = dmgPool.pop() || new Text({
      text: '',
      style: {
        fontFamily: 'Barlow Condensed, sans-serif', fontWeight: '700', fontSize: 26,
        fill: 0xffffff, letterSpacing: 1,
        stroke: { color: 0x080808, width: 5, join: 'round' },
      },
    });
    t.anchor.set(0.5);
    t.text = text;
    t.style.fill = color;
    t.scale.set(scale);
    t.visible = true;
    dmgLayer.addChild(t);
    dmgLive.push({ t, wx, wy: wy0 + stack * 24, vy: 95, life: 0.95, maxLife: 0.95 });
  };
  // vermelho sobre a cabeça de quem PERDEU; verde sobre quem CAUSOU
  const spawnDmg = (e, match) => {
    const atk = match?.fighters?.[e.attacker];
    const def = match?.fighters?.[1 - e.attacker];
    const headY = (f) => (f?.y || 0) + 178;
    const sc = e.blocked ? 0.7 : e.heavy ? 1.3 : 1;
    if (def) spawnOne(def.x, headY(def), `-${e.dmg}`, 0xff3b52, sc);
    if (atk && !e.blocked) spawnOne(atk.x, headY(atk), `+${e.dmg}`, 0x4ade80, sc * 0.85);
  };
  const stepDmg = (dt) => {
    for (let i = dmgLive.length - 1; i >= 0; i--) {
      const d = dmgLive[i];
      d.life -= dt;
      if (d.life <= 0) {
        d.t.visible = false;
        dmgPool.push(d.t);
        dmgLive.splice(i, 1);
        continue;
      }
      d.vy *= 1 - dt * 1.6;
      d.wy += d.vy * dt;
      d.t.position.set(d.wx, -d.wy);
      d.t.alpha = Math.min(1, d.life / 0.3);
    }
  };
  if (painted) {
    for (const t of [tagA, tagB]) {
      t.style.fill = 0xf2efe9;
      t.style.dropShadow = { distance: 2, blur: 3, alpha: 0.8, color: 0x000000 };
    }
  }
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
    world.scale.set(scale * (1 + (fxRef?.kick || 0)));
    world.x = w / 2 - focusX * scale;
    world.y = h * 0.82 + (match && match.phase === 'countdown' ? 40 * (world.scale.x / scale) * 0 : 0);
  }

  function frame(match, events, dt) {
    elapsed += dt;
    layout(match);

    // a arte pintada cobre SEMPRE o retângulo visível da câmera (âncora no chão)
    if (arenaSpr) {
      const w = app.renderer.width / app.renderer.resolution;
      const h = app.renderer.height / app.renderer.resolution;
      const s = world.scale.x;
      const vx0 = (0 - world.x) / s;
      const vy1 = (h - world.y) / s;
      const vw = w / s;
      const vh = h / s;
      const tw = arenaSpr.texture.width;
      const th = arenaSpr.texture.height;
      const k = Math.max(vw / tw, vh / th);
      arenaSpr.scale.set(k);
      arenaSpr.position.set(vx0 - (tw * k - vw) / 2, vy1 - th * k);
    }

    for (const e of events) {
      if (e.type === 'fightstart') fx.shake = Math.max(fx.shake, 10);
      if (e.type === 'hit') { fxHit(fx, e.x, e.y, e.attacker === 0 ? 1 : -1, e); spawnDmg(e, match); }
      if (e.type === 'ko') fxKo(fx, e.x, e.y, e.winner === 0 ? 1 : -1);
      if (e.type === 'dash') fxDash(fx, e.x);
    }

    const [a, b] = match.fighters;
    fighterHalos.clear();
    if (painted) {
      for (const f of [a, b]) {
        fighterHalos.ellipse(f.x, -(f.y + 66), 44, 78).fill({ color: 0xffe8d6, alpha: 0.05 });
        fighterHalos.ellipse(f.x, -2, 34, 7).fill({ color: 0xd90429, alpha: 0.14 });
      }
    }
    // arcos de corte durante a janela ativa dos golpes
    slashG.clear();
    const weaponGlow = (lo) => {
      const w = (lo || []).find((it) => it.slot === 'weapon');
      const hex = w?.params?.glow || w?.params?.blade;
      return hex ? parseInt(hex.replace('#', ''), 16) : null;
    };
    const drawSlash = (f, lo) => {
      const mv = MOVES[f.state];
      if (!mv || !mv.active) return;
      const t0 = mv.startup * 0.55;
      const t1 = mv.startup + mv.active + 0.05;
      if (f.t < t0 || f.t > t1) return;
      const p = (f.t - t0) / (t1 - t0);
      const heavy = f.state === 'heavy';
      const col = weaponGlow(lo) ?? (heavy ? 0xff2244 : 0xffffff);
      const cx = f.x + f.face * 14;
      const cy = -(f.y + 96);
      const R = heavy ? 62 : 46;
      const a0 = f.face === 1 ? -1.9 + p * 2.4 : Math.PI - 0.5 - p * 2.4 + 1.9 - 1.9;
      const start = f.face === 1 ? -1.9 : Math.PI + 1.9 - 2.4;
      const sweep = 2.4 * p;
      for (let i = 0; i < 3; i++) {
        const rr = R - i * (heavy ? 9 : 7);
        const alpha = (1 - p) * (0.75 - i * 0.22);
        if (alpha <= 0) continue;
        const s0 = f.face === 1 ? start : Math.PI - start - sweep;
        slashG.arc(cx, cy, rr, s0, s0 + sweep).stroke({ width: (heavy ? 7 : 5) - i * 1.5, color: col, alpha, cap: 'round' });
      }
      // gume brilhante na ponta do arco
      const tipA = (f.face === 1 ? start : Math.PI - start - sweep) + (f.face === 1 ? sweep : 0);
      slashG.circle(cx + Math.cos(tipA) * R, cy + Math.sin(tipA) * R, heavy ? 5 : 3.5)
        .fill({ color: 0xffffff, alpha: (1 - p) * 0.9 });
    };
    drawSlash(a, loadouts[0]);
    drawSlash(b, loadouts[1]);

    // fantasmas de dash (afterimage)
    ghostA.clear();
    ghostB.clear();
    if (a.state === 'dash') drawFighter(ghostA, { ...a, x: a.x - a.face * 20 }, MOVES, 0xd90429, elapsed, null);
    if (b.state === 'dash') drawFighter(ghostB, { ...b, x: b.x - b.face * 20 }, MOVES, 0x6e6e6e, elapsed, null);

    drawFighter(gA, a, MOVES, 0xd90429, elapsed, filterForVector(loadouts[0], wsA));
    drawFighter(gB, b, MOVES, 0x6e6e6e, elapsed, filterForVector(loadouts[1], wsB));
    wsA.update(a, MOVES);
    wsB.update(b, MOVES);
    tagA.text = names[0];
    tagB.text = names[1];
    tagA.position.set(a.x, -(a.y + 152));
    tagB.position.set(b.x, -(b.y + 152));

    fxStep(fx, dt);
    stepDmg(dt);

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
    if (fx.flashRed > 0) {
      const w = app.renderer.width / app.renderer.resolution;
      const h = app.renderer.height / app.renderer.resolution;
      flash.rect(0, 0, w, h).fill({ color: 0xd90429, alpha: Math.min(0.3, fx.flashRed * 0.8) });
    }
  }

  return {
    app,
    frame,
    setLoadouts(la, lb) {
      wsA.setLoadout(arguments[0]);
      wsB.setLoadout(arguments[1]); loadouts = [la || null, lb || null]; },
    setNames(na, nb) { names = [na || '', nb || '']; },
    destroy() {
      app.destroy(true, { children: true });
    },
  };
}
