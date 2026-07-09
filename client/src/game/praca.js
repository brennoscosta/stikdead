// STIKDEAD :: praça do lobby — jogadores online passeando com suas builds
import { Application, Container, Graphics, Text, Sprite, Assets } from 'pixi.js';
import { drawFighter } from './rig.js';
import { createWeaponSprite, filterForVector } from './itemSprites.js';
import { MOVES } from './sim.js';

const MAX_WALKERS = 14;

export async function createPlaza(host, opts = {}) {
  const VARIANT = opts.variant || 'praca';
  const onNameClick = opts.onNameClick || null;
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
  Assets.load(`/arenas/${VARIANT}.webp`).then((tex) => {
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
    const PAL = VARIANT === 'cla'
      ? { ceu: 0x160b08, lua: 0xc2571a, chao: 0x241410 }
      : { ceu: 0x120a0e, lua: 0x8f0620, chao: 0x1c1216 };
    bg.rect(0, 0, W, H).fill(PAL.ceu);
    // lua vermelha grande
    const mx = W * 0.5, my = H * 0.3, mr = Math.min(H * 0.42, 90);
    bg.circle(mx, my, mr * 1.5).fill({ color: 0x3d0713, alpha: 0.5 });
    bg.circle(mx, my, mr).fill(PAL.lua);
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
    bg.rect(0, H - 40, W, 40).fill(PAL.chao);
    bg.moveTo(0, H - 40).lineTo(W, H - 40).stroke({ width: 3, color: 0x8f0620, alpha: 0.6 });
    for (let i = 0; i < Math.ceil(W / 90); i++)
      bg.moveTo(i * 90 + 20, H - 40).lineTo(i * 90, H).stroke({ width: 2, color: 0x2a1a20 });
  };

  const spawn = (p) => {
    const wrap = new Container();
    const g = new Graphics();
    wrap.addChild(g);
    const ws = createWeaponSprite(wrap, g);
    ws.setLoadout(p.loadout || []);
    const tag = new Text({
      text: p.name,
      style: { fontFamily: 'Barlow Condensed, sans-serif', fontSize: 13, fill: 0xe8e4da, letterSpacing: 1 },
    });
    tag.anchor.set(0.5, 1);
    if (onNameClick && !p.npc) {
      tag.eventMode = 'static';
      tag.cursor = 'pointer';
      tag.on('pointertap', () => onNameClick(p.name));
    }
    layer.addChild(wrap, tag);
    // estandarte do clã: bandeirinha na cor + nome em azul claro, acima do nome do lutador
    let clanTag = null;
    if (p.clan?.name) {
      clanTag = new Container();
      const fl = new Graphics();
      fl.moveTo(0, 0).lineTo(11, 0).lineTo(11, 8).lineTo(8, 6).lineTo(0, 8).closePath()
        .fill(parseInt(String(p.clan.color || '#d90429').replace('#', ''), 16))
        .stroke({ width: 1, color: 0x080808 });
      fl.rect(-1.5, 0, 1.5, 10).fill(0x8a7a66);
      // a IMAGEM real da bandeira do clã, recortada dentro do triângulo
      if (p.clan.id) {
        Assets.load(`/api/clans/flag/${p.clan.id}`).then((tex) => {
          if (!clanTag || clanTag.destroyed) return;
          const bandImg = new Sprite(tex);
          bandImg.width = 11; bandImg.height = 9;
          bandImg.position.set(0, 0);
          const mask = new Graphics();
          mask.moveTo(0, 0).lineTo(11, 0).lineTo(11, 8).lineTo(8, 6).lineTo(0, 8).closePath().fill(0xffffff);
          bandImg.mask = mask;
          clanTag.addChildAt(mask, 0);
          clanTag.addChildAt(bandImg, 1);
        }).catch(() => { /* sem imagem: fica a cor sólida */ });
      }
      const ct = new Text({
        text: p.clan.name.toUpperCase(),
        style: { fontFamily: 'Barlow Condensed, sans-serif', fontSize: 10, fill: 0x9fd8ff, letterSpacing: 1.2, fontWeight: '700' },
      });
      ct.anchor.set(0, 0.5);
      ct.position.set(14, 4.5);
      clanTag.addChild(fl, ct);
      clanTag.pivot.set((14 + ct.width) / 2, 4.5);
      layer.addChild(clanTag);
    }
    return {
      wrap, g, ws, tag, clanTag, name: p.name, away: !!p.away, loadout: p.loadout || [], bubble: null, bubbleUntil: 0,
      f: {
        x: 60 + Math.random() * Math.max(120, W - 120), y: 0, vx: 0, vy: 0,
        face: Math.random() < 0.5 ? 1 : -1, hp: 100, state: 'walk', t: Math.random() * 3, hitstun: 0, combo: 0,
      },
      speed: 26 + Math.random() * 22,
      timer: 1 + Math.random() * 4,
    };
  };

  app.ticker.add((tk) => {
    const nowB = performance.now();
    for (const a of actors.values()) {
      if (a.bubble) {
        a.bubble.position.set(a.tag.x, a.tag.y - 18);
        if (nowB > a.bubbleUntil) {
          layer.removeChild(a.bubble); a.bubble.destroy({ children: true }); a.bubble = null;
        }
      }
    }
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
      a.wrap.position.set(0, H - 40);
      a.wrap.scale.set(scale);
      drawFighter(a.g, a.f, MOVES, 0xd90429, elapsed, filterForVector(a.loadout, a.ws));
      a.ws.update(a.f, MOVES);
      a.tag.position.set(a.f.x * scale, H - 40 - 158 * scale);
      if (a.clanTag) a.clanTag.position.set(a.f.x * scale, H - 40 - 158 * scale - 16);
      a.tag.text = a.away ? `${a.name} 💤` : a.name;
    }
  });

  const showBubble = (actor, text) => {
    if (actor.bubble) { actor.wrap.removeChild(actor.bubble); actor.bubble.destroy({ children: true }); }
    const holder = new Container();
    const label = new Text({
      text: String(text).slice(0, 90),
      style: {
        fontFamily: 'Arial', fontSize: 12, fill: 0x120a0e, wordWrap: true, wordWrapWidth: 150, align: 'center',
      },
    });
    const pad = 7;
    const bw = label.width + pad * 2, bh = label.height + pad * 2;
    const bg2 = new Graphics();
    bg2.roundRect(-bw / 2, -bh, bw, bh, 8).fill(0xf2efe9).stroke({ width: 2, color: 0x120a0e });
    bg2.moveTo(-5, 0).lineTo(5, 0).lineTo(0, 7).closePath().fill(0xf2efe9).stroke({ width: 2, color: 0x120a0e });
    label.x = -label.width / 2;
    label.y = -bh + pad;
    holder.addChild(bg2, label);
    layer.addChild(holder);
    actor.bubble = holder;
    actor.bubbleUntil = performance.now() + 3000 + Math.min(3500, String(text).length * 45);
  };

  return {
    say(name, text) {
      for (const a of actors.values()) {
        if (a.name === name) { showBubble(a, text); return; }
      }
    },
    setPlayers(players) {
      const keep = new Set();
      for (const p of players.slice(0, MAX_WALKERS)) {
        keep.add(p.id);
        const existing = actors.get(p.id);
        if (existing) {
          existing.loadout = p.loadout || [];
          existing.ws.setLoadout(existing.loadout);
          existing.name = p.name;
          existing.away = !!p.away;
        } else {
          actors.set(p.id, spawn(p));
        }
      }
      for (const [id, a] of actors) {
        if (!keep.has(id)) {
          a.ws.destroy();
          a.wrap.destroy({ children: true });
          a.tag.destroy();
          if (a.clanTag) a.clanTag.destroy({ children: true });
          actors.delete(id);
        }
      }
    },
    destroy() { app.destroy(true, { children: true }); },
  };
}
