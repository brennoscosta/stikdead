// STIKDEAD :: renderizador da batalha (PixiJS)
import { Texture, Application, Container, Graphics, Text, Sprite, Assets } from 'pixi.js';
import { MOVES } from './sim.js';
import { drawFighter, drawEyes } from './rig.js';
import { loadHeadTexture } from './headSprite.js';
import { loadPartTextures, createFighterParts, updateFighterParts } from './bodyParts.js';
import { createWeaponSprite, filterForVector } from './itemSprites.js';
import { buildArena, createFx, fxStep, fxHit, fxKo, fxDash, WORLD } from './arena.js';

const withTimeout = (p, ms, label) =>
  Promise.race([p, new Promise((_, rej) => setTimeout(() => rej(new Error(`timeout: ${label}`)), ms))]);

export async function createRenderer(host, theme = 'dojo') {
  console.log('[stikdead] renderer v7.4 — iniciando, arena =', theme);
  const app = new Application();
  const IS_TOUCH = matchMedia('(pointer: coarse)').matches;
  await withTimeout(app.init({ background: '#e7dfcf', resizeTo: host, antialias: !IS_TOUCH }), 10000, 'pixi init');
  console.log('[stikdead] pixi ok');
  host.appendChild(app.canvas);
  app.canvas.style.display = 'block';

  const camera = new Container();
  app.stage.addChild(camera);

  const world = new Container();
  camera.addChild(world);

  // arenas VIVAS: vídeo em loop (se existir) -> pintura webp -> vetorial
  // regra simples: qualidade máxima = vídeo em alta em QUALQUER dispositivo; modo leve = foto
  const VIDEO_THEMES = ['dojo', 'temple', 'prison', 'neve', 'deserto', 'praia', 'cidade_rio', 'cemiterio'];
  const VIDEO_ARENAS = Object.fromEntries(VIDEO_THEMES.map((t) => [t, `/arenas/${t}.mp4`]));
  const loadArenaVideo = (src, ms = 8000) => new Promise((resolve, reject) => {
    const v = document.createElement('video');
    v.src = src; v.muted = true; v.loop = true; v.playsInline = true;
    v.autoplay = true; v.crossOrigin = 'anonymous'; v.preload = 'auto';
    const to = setTimeout(() => reject(new Error('vídeo demorou')), ms);
    v.addEventListener('error', () => { clearTimeout(to); reject(new Error('vídeo indisponível')); }, { once: true });
    v.addEventListener('canplay', () => {
      clearTimeout(to);
      v.play().then(() => resolve(v)).catch(() => resolve(v)); // autoplay mudo é permitido
    }, { once: true });
  });

  const ANIMATED_THEMES = new Set(['dojo', 'temple', 'prison', 'neve', 'deserto', 'praia', 'cidade_rio', 'cemiterio']);
  let painted = false;
  let arenaSpr = null;
  try {
    let tex;
    const LITE = (localStorage.getItem('stik_quality') || 'lite') === 'lite';
    if (!LITE && VIDEO_ARENAS[theme]) {
      try {
        // celular: vídeo SD (25-80KB) no lugar do full (0,7-2,6MB) — mata o congelamento
        // do início de partida em conexão móvel; desktop segue em alta.
        const src = IS_TOUCH ? VIDEO_ARENAS[theme].replace('.mp4', '_sd.mp4') : VIDEO_ARENAS[theme];
        const vid = await loadArenaVideo(src, IS_TOUCH ? 5000 : 8000);
        tex = Texture.from(vid);
        // o jogo roda a 60fps, mas a textura do vídeo só sobe à GPU 24x/s
        try { if (tex.source && 'updateFPS' in tex.source) tex.source.updateFPS = IS_TOUCH ? 18 : 24; } catch { /* versão sem a alavanca */ }
        console.log('[stikdead] arena em VÍDEO alta resolução 🎬');
      } catch (e) {
        console.warn('[stikdead] vídeo indisponível — foto assume:', e.message);
      }
    }
    if (!tex) console.log(LITE ? '[stikdead] modo leve: arena em FOTO 🖼️' : '[stikdead] arena em FOTO (fallback) 🖼️');
    if (!tex) tex = await withTimeout(Assets.load(`/arenas/${theme}.webp`), 8000, 'arte da arena');
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
    const vec = buildArena(theme);
    world.addChild(vec);
    if (typeof vec.tick === 'function') app.ticker.add((tk) => vec.tick(tk.deltaMS));
  }
  const fighterHalos = new Graphics();
  world.addChild(fighterHalos);

  const slashG = new Graphics();
  const ghostA = new Graphics();
  const ghostB = new Graphics();
  const ghostA2 = new Graphics();
  const ghostB2 = new Graphics();
  ghostA.alpha = 0.22;
  ghostB.alpha = 0.22;
  ghostA2.alpha = 0.1;
  ghostB2.alpha = 0.1;
  world.addChild(ghostA2, ghostB2, ghostA, ghostB, slashG);
  // ===== a linha de trás: a luta da dupla irmã, na MESMA arena =====
  const sisLayer = new Container();
  sisLayer.position.set(0, -20); // chão levemente mais fundo
  sisLayer.scale.set(0.9);
  sisLayer.alpha = 0.95;
  world.addChild(sisLayer);
  const gC = new Graphics();
  const gD = new Graphics();
  sisLayer.addChild(gC, gD);
  const gA = new Graphics();
  const gB = new Graphics();
  // P1: cabeças pintadas (opcional) + olhos vetoriais vivos por cima
  const headA = new Sprite(); headA.anchor.set(0.5); headA.visible = false;
  const headB = new Sprite(); headB.anchor.set(0.5); headB.visible = false;
  const eyesA = new Graphics();
  const eyesB = new Graphics();
  loadHeadTexture().then((t) => { if (t) { headA.texture = t; headB.texture = t; } });
  const partsA = createFighterParts(world);
  const partsB = createFighterParts(world);
  let partTexs = null;
  loadPartTextures().then((t) => { partTexs = t; });
  world.addChild(gA, gB);
    world.addChild(headA, eyesA, headB, eyesB);
  const wsA = createWeaponSprite(world, gA);
  const wsB = createWeaponSprite(world, gB);
  const wsC = createWeaponSprite(sisLayer, gC);
  const wsD = createWeaponSprite(sisLayer, gD);
  const fx = createFx(world);
  const fxRef = fx;

  const tagStyle = { fontFamily: 'Barlow Condensed, sans-serif', fontSize: 15, fill: 0x2b2620, letterSpacing: 1 };
  const tagA = new Text({ text: '', style: tagStyle });
  const tagB = new Text({ text: '', style: tagStyle });
  tagA.anchor.set(0.5, 1);
  tagB.anchor.set(0.5, 1);
  world.addChild(tagA, tagB);
  const tagSisStyle = { fontFamily: 'Barlow Condensed, sans-serif', fontSize: 13, fill: 0x2b2620, letterSpacing: 1 };
  const tagC = new Text({ text: '', style: tagSisStyle });
  const tagD = new Text({ text: '', style: tagSisStyle });
  tagC.anchor.set(0.5, 1);
  tagD.anchor.set(0.5, 1);
  sisLayer.addChild(tagC, tagD);

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
  // UM balão por golpe, na perspectiva do jogador:
  // eu ataquei -> +X verde sobre o oponente | fui atacado -> -X vermelho sobre mim
  let mySide = 0;
  const spawnDmg = (e, match) => {
    const def = match?.fighters?.[e.target ?? (1 - e.attacker)];
    if (!def) return;
    const sc = e.blocked ? 0.7 : e.heavy ? 1.3 : 1;
    const iAttacked = e.attacker === mySide;
    spawnOne(def.x, (def.y || 0) + 178, iAttacked ? `+${e.dmg}` : `-${e.dmg}`,
      iAttacked ? 0x4ade80 : 0xff3b52, sc);
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

  // ===== COMBO no mundo: "×N" estourando no ponto do impacto, escalando com o combo =====
  const comboLayer = new Container();
  world.addChild(comboLayer);
  const comboPool = [];
  const comboLive = [];
  const spawnCombo = (e) => {
    if (e.blocked || !e.combo || e.combo < 3) return;
    const tier = e.combo >= 8 ? 3 : e.combo >= 5 ? 2 : 1;
    const cor = tier === 3 ? 0xff2244 : tier === 2 ? 0xff9f1c : 0xffd166;
    const t = comboPool.pop() || new Text({
      text: '',
      style: {
        fontFamily: 'Oswald, Barlow Condensed, sans-serif', fontWeight: '700', fontSize: 34,
        fill: 0xffffff, letterSpacing: 1,
        stroke: { color: 0x080808, width: 6, join: 'round' },
      },
    });
    t.anchor.set(0.5);
    t.text = `×${e.combo}`;
    t.style.fill = cor;
    t.rotation = (Math.random() - 0.5) * 0.24;
    t.visible = true;
    comboLayer.addChild(t);
    comboLive.push({ t, wx: e.x, wy: e.y + 66, life: 0.7, maxLife: 0.7, sc: 0.8 + tier * 0.25 });
  };
  const stepCombo = (dt) => {
    for (let i = comboLive.length - 1; i >= 0; i--) {
      const d = comboLive[i];
      d.life -= dt;
      if (d.life <= 0) {
        d.t.visible = false;
        comboPool.push(d.t);
        comboLive.splice(i, 1);
        continue;
      }
      const age = d.maxLife - d.life;
      // POP com overshoot: nasce grande, assenta, sobe e some
      const pop = age < 0.12 ? 1.7 - (age / 0.12) * 0.7 : 1;
      d.wy += 46 * dt;
      d.t.scale.set(d.sc * pop);
      d.t.position.set(d.wx, -d.wy);
      d.t.alpha = Math.min(1, d.life / 0.25);
    }
  };
  if (painted) {
    for (const t of [tagA, tagB, tagC, tagD]) {
      t.style.fill = 0xf2efe9;
      t.style.dropShadow = { distance: 2, blur: 3, alpha: 0.8, color: 0x000000 };
    }
  }
  let loadouts = [null, null];
  let names = ['', ''];
  let sisNames = ['', ''];
  let sisLoKey = '';
  let squad = null; // { names: [4], loadouts: [4] } => 2v2 real

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
    // punch-in do impacto: a câmera mergulha suavemente no ponto do golpe
    if (fxRef && fxRef.focusK > 0.01) {
      const k2 = Math.min(0.5, fxRef.focusK);
      focusX += (fxRef.focusX - focusX) * k2 * 1.5;
    }
    world.scale.set(scale * (1 + (fxRef?.kick || 0)));
    world.x = w / 2 - focusX * scale;
    world.y = h * 0.82 + (match && match.phase === 'countdown' ? 40 * (world.scale.x / scale) * 0 : 0);
  }

  function frame(match, events, dt, sis) {
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
      if (e.type === 'hit') { fxHit(fx, e.x, e.y, e.attacker === 0 ? 1 : -1, e); spawnDmg(e, match); spawnCombo(e); }
      if (e.type === 'ko') fxKo(fx, e.x, e.y, e.winner === 0 ? 1 : -1);
      if (e.type === 'dash') fxDash(fx, e.x);
      if (e.type === 'rasteira') { fxDash(fx, e.x); fxDash(fx, e.x + 24); }
      if (e.type === 'dodge') fxDash(fx, e.x);
      if (e.type === 'skill') {
        const col = { ronin: 0xffffff, shinobi: 0x8b5cf6, monge: 0xffc14d, berserker: 0xff2244, espectro: 0x9fd8ff }[e.style] || 0xffffff;
        fx.rings.push({ x: e.x, y: e.y, r: 8, vr: 460, life: 0.32, maxLife: 0.32, color: col, w: 4 });
        fx.sparks.push({ x: e.x, y: e.y, life: 0.2, maxLife: 0.2, size: 24, color: col });
      }
      if (e.type === 'skillwave')
        fx.rings.push({ x: e.x, y: e.y || 60, r: 12, vr: 900, life: 0.4, maxLife: 0.4, color: 0xffc14d, w: 6 });
      if (e.type === 'skillslam') {
        fx.rings.push({ x: e.x, y: 8, r: 10, vr: 700, life: 0.35, maxLife: 0.35, color: 0x9fd8ff, w: 5 });
        fx.shake = Math.max(fx.shake, 9);
      }
    }

    const [a, b] = match.fighters;
    fighterHalos.clear();
    for (const f of [a, b]) {
      if (f.fury > 0) {
        const pulse = 0.16 + 0.1 * Math.sin(elapsed * 12);
        fighterHalos.ellipse(f.x, -(f.y + 80), 46, 96).fill({ color: 0xd90429, alpha: pulse });
        fighterHalos.ellipse(f.x, -(f.y + 80), 30, 70).fill({ color: 0xff2244, alpha: pulse * 0.7 });
      }
    }
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
      // aura de energia por baixo do arco (o rastro "de cinema" da referência)
      {
        const s0 = f.face === 1 ? start : Math.PI - start - sweep;
        slashG.arc(cx, cy, R - (heavy ? 8 : 6), s0, s0 + sweep)
          .stroke({ width: heavy ? 20 : 13, color: col, alpha: (1 - p) * 0.22, cap: 'round' });
      }
      for (let i = 0; i < 3; i++) {
        const rr = R - i * (heavy ? 9 : 7);
        const alpha = (1 - p) * (0.75 - i * 0.22);
        if (alpha <= 0) continue;
        const s0 = f.face === 1 ? start : Math.PI - start - sweep;
        slashG.arc(cx, cy, rr, s0, s0 + sweep).stroke({ width: (heavy ? 7 : 5) - i * 1.5, color: col, alpha, cap: 'round' });
      }
      // gume branco-quente na borda externa
      {
        const s0 = f.face === 1 ? start : Math.PI - start - sweep;
        slashG.arc(cx, cy, R + 2, s0, s0 + sweep)
          .stroke({ width: 2, color: 0xffffff, alpha: (1 - p) * 0.9, cap: 'round' });
      }
      // gume brilhante na ponta do arco
      const tipA = (f.face === 1 ? start : Math.PI - start - sweep) + (f.face === 1 ? sweep : 0);
      slashG.circle(cx + Math.cos(tipA) * R, cy + Math.sin(tipA) * R, heavy ? 5 : 3.5)
        .fill({ color: 0xffffff, alpha: (1 - p) * 0.9 });
    };
    // WIND-UP: anel convergente telegrafando o golpe pesado (antecipação de cinema)
    const drawWindup = (f) => {
      const mv = MOVES[f.state];
      if (!mv || !mv.active || f.state !== 'heavy' || f.t >= mv.startup) return;
      const p = Math.min(1, f.t / mv.startup);
      const wx = f.x + f.face * 26, wy = -(f.y + 96);
      const R = 34 * (1 - p) + 9;
      slashG.circle(wx, wy, R).stroke({ width: 2 + p * 2.5, color: 0xffb84d, alpha: 0.12 + p * 0.55 });
      // fagulhas sendo SUGADAS para o punho (energia juntando)
      for (let i = 0; i < 3; i++) {
        const ang = elapsed * 9 + i * 2.09;
        const rr = R + 8 - p * 6;
        slashG.circle(wx + Math.cos(ang) * rr, wy + Math.sin(ang) * rr, 2 * (0.5 + p * 0.8))
          .fill({ color: 0xffd166, alpha: 0.3 + p * 0.6 });
      }
      if (p > 0.8) slashG.circle(wx, wy, 5).fill({ color: 0xffffff, alpha: (p - 0.8) * 4 });
    };
    drawSlash(a, loadouts[0]);
    drawSlash(b, loadouts[1]);
    drawWindup(a);
    drawWindup(b);

    // fantasmas de velocidade (afterimage): dash E golpes deixam rastro do corpo
    const GHOST_STATES = { dash: 20, light: 11, heavy: 15, kick: 13 };
    const drawGhosts = (g1, g2, f, col) => {
      g1.clear();
      g2.clear();
      const off = GHOST_STATES[f.state];
      if (!off) return;
      const mv = MOVES[f.state];
      // no golpe, o rastro só aparece do meio do startup em diante (leitura de arranque)
      if (mv && mv.active && f.t < mv.startup * 0.5) return;
      drawFighter(g1, { ...f, x: f.x - f.face * off }, MOVES, col, elapsed, null);
      if (f.state === 'dash' || f.state === 'heavy' || (f.combo || 0) >= 5)
        drawFighter(g2, { ...f, x: f.x - f.face * off * 2 }, MOVES, col, elapsed, null);
    };
    drawGhosts(ghostA, ghostA2, a, 0xd90429);
    drawGhosts(ghostB, ghostB2, b, 0x6e6e6e);

    const hasHeadTex = !!(headA.texture && headA.texture.width > 1);
    const hasBody = !!(partTexs && partTexs.torso);
    const optsF = { skipHead: hasHeadTex, skipBody: hasBody };
    const poseA = drawFighter(gA, a, MOVES, 0xd90429, elapsed, filterForVector(loadouts[0], wsA), optsF);
    const poseB = drawFighter(gB, b, MOVES, 0x6e6e6e, elapsed, filterForVector(loadouts[1], wsB), optsF);
    updateFighterParts(partsA, poseA, partTexs);
    updateFighterParts(partsB, poseB, partTexs);
    for (const [spr, eg, f, pose] of [[headA, eyesA, a, poseA], [headB, eyesB, b, poseB]]) {
      if (spr.texture && spr.texture.width > 1 && pose) {
        spr.visible = true;
        const d = pose.headR * 2.16;
        spr.width = d; spr.height = d;
        spr.scale.x = Math.abs(spr.scale.x) * (pose.face < 0 ? -1 : 1);
        spr.position.set(pose.hx, pose.hy);
        eg.clear(); // olhos pintados na própria esfera — vetor aposentado
      } else {
        spr.visible = false;
        eg.clear();
      }
    }
    wsA.update(a, MOVES);
    wsB.update(b, MOVES);
    tagA.text = names[0];
    tagB.text = names[1];
    tagA.position.set(a.x, -(a.y + 152));
    tagB.position.set(b.x, -(b.y + 152));

    // ===== 2v2 real: lutadores 2 e 3 do PRÓPRIO match, tamanho real =====
    if (squad && match.fighters.length >= 4) {
      sisLayer.visible = true;
      const [, , c, d] = match.fighters;
      const poseC2 = drawFighter(gC, c, MOVES, 0xe0a10b, elapsed, filterForVector(squad.loadouts[2], wsC), {});
      const poseD2 = drawFighter(gD, d, MOVES, 0x5a7d9e, elapsed, filterForVector(squad.loadouts[3], wsD), {});
      void poseC2; void poseD2;
      wsC.update(c, MOVES);
      wsD.update(d, MOVES);
      tagC.text = squad.names[2] || '';
      tagD.text = squad.names[3] || '';
      tagC.position.set(c.x, -(c.y + 152));
      tagD.position.set(d.x, -(d.y + 152));
      drawSlash(c, squad.loadouts[2]);
      drawSlash(d, squad.loadouts[3]);
      for (const f of [c, d]) {
        if (f.fury > 0) {
          const pulse = 0.16 + 0.1 * Math.sin(elapsed * 12);
          fighterHalos.ellipse(f.x, -(f.y + 80), 46, 96).fill({ color: 0xd90429, alpha: pulse });
        }
      }
    } else if (sis && sis.f && sis.f.length === 2) {
      sisLayer.visible = true;
      const key = (sis.lo || []).map((L) => (L || []).map((it) => it.id).join(',')).join('|');
      if (key !== sisLoKey) {
        sisLoKey = key;
        wsC.setLoadout(sis.lo?.[0] || []);
        wsD.setLoadout(sis.lo?.[1] || []);
      }
      const [c, d] = sis.f;
      const poseC = drawFighter(gC, c, MOVES, 0xe0a10b, elapsed, filterForVector(sis.lo?.[0], wsC), {});
      const poseD = drawFighter(gD, d, MOVES, 0x5a7d9e, elapsed, filterForVector(sis.lo?.[1], wsD), {});
      void poseC; void poseD;
      wsC.update(c, MOVES);
      wsD.update(d, MOVES);
      tagC.text = sisNames[0];
      tagD.text = sisNames[1];
      tagC.position.set(c.x, -(c.y + 152));
      tagD.position.set(d.x, -(d.y + 152));
      sisLayer.alpha = sis.over ? 0.45 : 0.95; // duelo irmão terminou? vira lembrança
    } else {
      sisLayer.visible = false;
      gC.clear(); gD.clear();
    }

    fxStep(fx, dt);
    stepDmg(dt);
    stepCombo(dt);

    // tremor de tela: direcional (empurra no sentido do golpe) + micro-rotação
    if (fx.shake > 0.3) {
      camera.x = (Math.random() - 0.5) * fx.shake + (fx.shakeDir || 0) * fx.shake * 0.45;
      camera.y = (Math.random() - 0.5) * fx.shake * 0.7;
      camera.rotation = (Math.random() - 0.5) * fx.shake * 0.0014;
    } else {
      camera.x = 0;
      camera.y = 0;
      camera.rotation = 0;
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

  // sobe as texturas para a GPU AINDA na tela de loading — sem isso, o primeiro
  // frame da luta congela os toques no celular enquanto a GPU digere arena+atlas.
  try { await app.renderer?.prepare?.upload?.(app.stage); } catch { /* sem prepare, segue */ }
  try { app.renderer?.render?.(app.stage); } catch { /* warm-up opcional */ }

  return {
    setMySide(side) { mySide = side; },
    app,
    frame,
    setLoadouts(la, lb) {
      wsA.setLoadout(arguments[0]);
      wsB.setLoadout(arguments[1]); loadouts = [la || null, lb || null]; },
    setNames(na, nb) { names = [na || '', nb || '']; },
    setSister(ns) { sisNames = [ns?.[0] || '', ns?.[1] || '']; },
    setSquad(ns, los) {
      squad = { names: ns || [], loadouts: los || [] };
      sisLayer.position.set(0, 0); // linha única: os 4 no MESMO chão
      sisLayer.scale.set(1);
      sisLayer.alpha = 1;
      wsC.setLoadout(los?.[2] || []);
      wsD.setLoadout(los?.[3] || []);
      loadouts = [los?.[0] || null, los?.[1] || null];
    },
    destroy() {
      app.destroy(true, { children: true });
    },
  };
}
