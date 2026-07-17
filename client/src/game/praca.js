// STIKDEAD :: LOBBY V2 — praça viva (LobbyManager)
// Orquestra as camadas do hub social:
//   pintura → céu dinâmico → lanternas → atores (jogadores reais + protagonista) → frente → partículas
// Cada camada tem parallax próprio. Tudo pausa quando a aba fica oculta.
import { Application, Container, Graphics, Text, Sprite, Assets } from 'pixi.js';
import { drawFighter } from './rig.js';
import { createWeaponSprite, filterForVector } from './itemSprites.js';
import { MOVES } from './sim.js';
import { createParticulas } from './lobby/particulas.js';
import { createCenario } from './lobby/cenario.js';

const MAX_WALKERS = 16;

export async function createPlaza(host, opts = {}) {
  const VARIANT = opts.variant || 'praca';
  const onNameClick = opts.onNameClick || null;
  const TOUCH = typeof window !== 'undefined' && window.matchMedia?.('(pointer: coarse)').matches;
  const app = new Application();
  await app.init({ background: '#120a0e', resizeTo: host, antialias: true });
  host.appendChild(app.canvas);
  app.canvas.style.display = 'block';

  const world = new Container();
  app.stage.addChild(world);

  // ===== camadas (ordem de desenho) =====
  const camPintura = new Container();
  const camFundo = new Graphics();
  const camMeio = new Graphics();
  const camAtores = new Container();
  const camFrente = new Graphics();
  const camPart = new Graphics();
  world.addChild(camPintura, camFundo, camMeio, camAtores, camFrente, camPart);

  // cenário pintado (se existir) com fallback vetorial noturno
  const bg = new Graphics();
  camPintura.addChild(bg);
  let paintedSpr = null;
  Assets.load(`/arenas/${VARIANT}.webp`).then((tex) => {
    paintedSpr = new Sprite(tex);
    camPintura.addChildAt(paintedSpr, 1);
  }).catch(() => {});

  const halos = new Graphics();
  const layer = new Container();
  camAtores.addChild(halos, layer);

  const particulas = createParticulas(camPart, { leve: TOUCH });
  const cenario = createCenario(camFundo, camMeio, camFrente);

  const actors = new Map(); // id -> ator
  let protagonista = null;  // ator especial, sempre ao centro
  let scale = 0.6;

  let elapsed = 0;
  let W = 0, H = 0;

  const drawBg = () => {
    bg.clear();
    const PAL = VARIANT === 'cla'
      ? { ceu: 0x160b08, lua: 0xc2571a, chao: 0x241410 }
      : { ceu: 0x120a0e, lua: 0x8f0620, chao: 0x1c1216 };
    bg.rect(-24, -8, W + 48, H + 16).fill(PAL.ceu);
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
      for (const lx of [-40 * sc, 40 * sc]) {
        bg.circle(tx + lx, ty - 34 * sc, 5).fill({ color: 0xff5a3c, alpha: 0.85 });
        bg.circle(tx + lx, ty - 34 * sc, 11).fill({ color: 0xd93c1f, alpha: 0.16 });
      }
    }
    bg.rect(mx - 90, my - mr - 26, 180, 6).fill({ color: 0x2a161c, alpha: 0.9 });
    bg.rect(-24, H - 40, W + 48, 48).fill(PAL.chao);
    bg.moveTo(0, H - 40).lineTo(W, H - 40).stroke({ width: 3, color: 0x8f0620, alpha: 0.6 });
    for (let i = 0; i < Math.ceil(W / 90); i++)
      bg.moveTo(i * 90 + 20, H - 40).lineTo(i * 90, H).stroke({ width: 2, color: 0x2a1a20 });
  };

  // ===== atores =====
  const spawn = (p) => {
    const wrap = new Container();
    const g = new Graphics();
    wrap.addChild(g);
    const ws = createWeaponSprite(wrap, g);
    ws.setLoadout(p.loadout || []);
    const dourado = p.protagonista;
    const tag = new Text({
      text: p.protagonista ? `★ ${p.name}` : p.name,
      style: {
        fontFamily: 'Barlow Condensed, sans-serif', fontSize: p.protagonista ? 15 : 13,
        fill: dourado ? 0xffd166 : 0xe8e4da, letterSpacing: 1, fontWeight: dourado ? '700' : '400',
      },
    });
    tag.anchor.set(0.5, 1);
    if (onNameClick && !p.protagonista) {
      tag.eventMode = 'static';
      tag.cursor = 'pointer';
      tag.on('pointertap', () => onNameClick(p.name));
    }
    layer.addChild(wrap, tag);
    // estandarte do clã: bandeirinha na cor + nome, acima do nome do lutador
    let clanTag = null;
    if (p.clan?.name) {
      clanTag = new Container();
      const fl = new Graphics();
      fl.moveTo(0, 0).lineTo(11, 0).lineTo(11, 8).lineTo(8, 6).lineTo(0, 8).closePath()
        .fill(parseInt(String(p.clan.color || '#d90429').replace('#', ''), 16))
        .stroke({ width: 1, color: 0x080808 });
      fl.rect(-1.5, 0, 1.5, 10).fill(0x8a7a66);
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
        }).catch(() => {});
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
      id: p.id, wrap, g, ws, tag, clanTag, name: p.name, away: !!p.away,
      protagonista: !!p.protagonista,
      loadout: p.loadout || [], bubble: null, bubbleUntil: 0,
      f: {
        x: p.fx ?? (60 + Math.random() * Math.max(120, W - 120)), y: 0, vx: 0, vy: 0,
        face: Math.random() < 0.5 ? 1 : -1, hp: 100,
        state: p.protagonista ? 'idle' : 'walk',
        t: Math.random() * 3, hitstun: 0, combo: 0,
      },
      speed: 26 + Math.random() * 22,
      timer: 1 + Math.random() * 4,
    };
  };

  const remove = (a) => {
    a.ws.destroy();
    a.wrap.destroy({ children: true });
    a.tag.destroy();
    if (a.clanTag) a.clanTag.destroy({ children: true });
    if (a.bubble) { a.bubble.destroy({ children: true }); a.bubble = null; }
    actors.delete(a.id);
  };

  // ===== UPDATE 2.8: Idle Random State Machine do protagonista =====
  // enquanto aguarda partida o boneco vive: respira (pose idle), olha para os
  // lados, dá pequenos passos, gira a katana (flourish), ajeita a postura…
  // A cada 5~10s executa uma ação aleatória — nunca a mesma duas vezes seguidas.
  const IDLE_ACTS = [
    { id: 'espiar',   state: 'idle',    dur: [1.6, 2.6] }, // vira o rosto para um lado
    { id: 'lua',      state: 'idle',    dur: [1.8, 3.0] }, // olha para cima (a lua)
    { id: 'passos',   state: 'walk',    dur: [0.9, 1.5] }, // pequenos passos laterais
    { id: 'flourish', state: 'victory', dur: [1.2, 1.7] }, // ergue/gira a katana
    { id: 'postura',  state: 'crouch',  dur: [0.8, 1.2] }, // agacha e ajeita a postura
    { id: 'guarda',   state: 'block',   dur: [0.7, 1.0] }, // reajusta a guarda
    { id: 'ombro',    state: 'idle',    dur: [1.2, 1.8] }, // solta o braço (coça o ombro)
  ];
  const idle = {
    wait: 4 + Math.random() * 4, // próximo ato em 5~10s (primeiro mais cedo)
    act: null, actT: 0, actDur: 0, lastId: null,
    lookAlvo: 0, homeX: 0, stepDir: 1,
  };
  const idleTick = (a, dt) => {
    const f = a.f;
    if (!idle.act) {
      idle.wait -= dt;
      if (idle.wait <= 0) {
        // sorteia um ato diferente do anterior
        let pick;
        do { pick = IDLE_ACTS[Math.floor(Math.random() * IDLE_ACTS.length)]; }
        while (pick.id === idle.lastId && IDLE_ACTS.length > 1);
        idle.act = pick; idle.lastId = pick.id;
        idle.actT = 0;
        idle.actDur = pick.dur[0] + Math.random() * (pick.dur[1] - pick.dur[0]);
        idle.homeX = f.x;
        idle.stepDir = Math.random() < 0.5 ? -1 : 1;
        f.state = pick.state; f.t = 0;
        if (pick.id === 'espiar') { idle.lookAlvo = (Math.random() < 0.5 ? -1 : 1) * (0.16 + Math.random() * 0.14); if (Math.random() < 0.4) f.face *= -1; }
        else if (pick.id === 'lua') idle.lookAlvo = -(0.24 + Math.random() * 0.12);
        else idle.lookAlvo = 0;
      }
    } else {
      idle.actT += dt;
      if (idle.act.id === 'passos') {
        // vai e volta em torno do centro (movimenta pés + katana naturalmente)
        const meio = idle.actDur / 2;
        f.face = idle.actT < meio ? idle.stepDir : -idle.stepDir;
        f.x += f.face * 34 * dt;
      }
      if (idle.act.id === 'ombro') f.armFx = Math.sin(idle.actT * 5) * 0.22; // solta o braço
      if (idle.actT >= idle.actDur) {
        // fim do ato: volta ao idle respirando e agenda o próximo (5~10s)
        if (idle.act.id === 'passos') f.face = f.x >= idle.homeX ? -1 : 1;
        f.state = 'idle'; f.t = Math.random() * 2;
        f.armFx = 0; idle.lookAlvo = 0;
        idle.act = null;
        idle.wait = 5 + Math.random() * 5;
      }
    }
    // olhar com suavização (60fps, só matemática — nada de re-render)
    f.look = (f.look || 0) + ((idle.lookAlvo || 0) - (f.look || 0)) * Math.min(1, 4 * dt);
    // micro giro do corpo, bem sutil, contínuo
    f.leanFx = Math.sin(elapsed * 0.55) * 0.018;
  };

  // partículas vermelhas do destaque do protagonista (canvas, custo mínimo)
  const motes = Array.from({ length: 9 }, () => ({
    a: Math.random() * Math.PI * 2, r: 26 + Math.random() * 26,
    v: 0.35 + Math.random() * 0.5, up: 8 + Math.random() * 26, s: 1 + Math.random() * 1.6,
  }));

  // ===== emotes flutuantes =====
  const emotes = [];
  const mostraEmote = (ator, emoji) => {
    if (!ator) return;
    const t = new Text({ text: emoji, style: { fontSize: 20 } });
    t.anchor.set(0.5, 1);
    layer.addChild(t);
    emotes.push({ t, ator, vida: 0, dur: 1.9 });
  };

  // ===== balões de fala =====
  const showBubble = (actor, text) => {
    if (actor.bubble) { layer.removeChild(actor.bubble); actor.bubble.destroy({ children: true }); }
    const holder = new Container();
    const label = new Text({
      text: String(text).slice(0, 90),
      style: { fontFamily: 'Arial', fontSize: 12, fill: 0x120a0e, wordWrap: true, wordWrapWidth: 150, align: 'center' },
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

  // ===== parallax =====
  const par = { x: 0, y: 0, tx: 0, ty: 0 };
  const onMove = (e) => {
    const r = app.canvas.getBoundingClientRect();
    par.tx = ((e.clientX - r.left) / r.width - 0.5) * 2;
    par.ty = ((e.clientY - r.top) / r.height - 0.5) * 2;
  };
  if (!TOUCH) {
    app.canvas.addEventListener('pointermove', onMove);
    app.canvas.addEventListener('pointerleave', () => { par.tx = 0; par.ty = 0; });
  }

  // pausa total quando a aba está oculta
  const onVis = () => { if (document.hidden) app.ticker.stop(); else app.ticker.start(); };
  document.addEventListener('visibilitychange', onVis);

  app.ticker.add((tk) => {
    const nowB = performance.now();
    const dt = Math.min(0.05, tk.deltaMS / 1000);
    elapsed += dt;
    const w = app.renderer.width / app.renderer.resolution;
    const h = app.renderer.height / app.renderer.resolution;
    if (w !== W || h !== H) {
      W = w; H = h;
      scale = Math.min(0.62, H / 300);
      drawBg();
      cenario.resize(W, H);
      particulas.resize(W, H);
      if (protagonista) protagonista.f.x = W / scale / 2;
    }

    // vento global: brisa com rajadas
    const vento = Math.sin(elapsed * 0.23) * 0.6 + Math.sin(elapsed * 0.11 + 2) * 0.4;

    // parallax suave
    if (TOUCH) { par.tx = Math.sin(elapsed * 0.07) * 0.35; par.ty = 0; }
    par.x += (par.tx - par.x) * Math.min(1, 3 * dt);
    par.y += (par.ty - par.y) * Math.min(1, 3 * dt);
    camPintura.position.set(par.x * -5, par.y * -2);
    camFundo.position.set(par.x * -9, par.y * -3);
    camMeio.position.set(par.x * -14, par.y * -4);
    camFrente.position.set(par.x * -20, par.y * -5);

    if (paintedSpr) {
      bg.visible = false;
      const k = Math.max(W / paintedSpr.texture.width, H / paintedSpr.texture.height) * 1.05;
      paintedSpr.scale.set(k);
      paintedSpr.position.set((W - paintedSpr.texture.width * k) / 2, (H - paintedSpr.texture.height * k) / 2);
    }

    cenario.tick(elapsed, vento);
    particulas.tick(dt, vento);

    halos.clear();
    for (const a of actors.values()) {
      const s = a.protagonista ? scale * 1.32 : scale;
      halos.ellipse(a.f.x * scale, H - 40 - 60 * s, 40 * s, 70 * s).fill({ color: 0xffe8d6, alpha: 0.045 });
      halos.ellipse(a.f.x * scale, H - 42, 30 * s, 6).fill({ color: 0xd90429, alpha: a.protagonista ? 0.2 : 0.12 });
      if (a.protagonista) {
        const pulso = 0.5 + 0.5 * Math.sin(elapsed * 2.2);
        const px = a.f.x * scale, py = H - 40;
        // UPDATE 2.8 — destaque do jogador: círculo luminoso discreto atrás
        halos.circle(px, py - 62 * s, 74 * s).fill({ color: 0xd90429, alpha: 0.05 + pulso * 0.03 });
        halos.circle(px, py - 62 * s, 46 * s).fill({ color: 0xff2244, alpha: 0.04 + pulso * 0.025 });
        // sombra dinâmica: acompanha a "respiração" do destaque
        halos.ellipse(px, py - 2, (34 + pulso * 4) * s, 7).fill({ color: 0x000000, alpha: 0.22 + pulso * 0.08 });
        halos.ellipse(px, py, 46 * s + pulso * 6, 9).stroke({ width: 2, color: 0xffd166, alpha: 0.28 + pulso * 0.2 });
        // partículas vermelhas subindo ao redor do personagem
        for (const m of motes) {
          const t = (elapsed * m.v + m.a) % 1;
          const mx = px + Math.cos(m.a * 7 + elapsed * m.v) * m.r * s;
          const my = py - (t * (90 + m.up)) * s;
          halos.circle(mx, my, m.s * s).fill({ color: t < 0.5 ? 0xff4a5e : 0xd90429, alpha: (1 - t) * 0.5 });
        }
      }
    }

    for (const a of actors.values()) {
      if (a.bubble) {
        a.bubble.position.set(a.tag.x, a.tag.y - 18);
        if (nowB > a.bubbleUntil) {
          layer.removeChild(a.bubble); a.bubble.destroy({ children: true }); a.bubble = null;
        }
      }
      a.f.t += dt;

      if (a.protagonista) {
        idleTick(a, dt);
        // mantém o herói perto do centro do palco
        const cx = (W / scale) / 2;
        if (a.f.x < cx - 70) { a.f.x = cx - 70; }
        if (a.f.x > cx + 70) { a.f.x = cx + 70; }
      }

      if (!a.protagonista) {
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
      }

      const s = a.protagonista ? scale * 1.32 : scale;
      a.wrap.position.set(0, H - 40);
      a.wrap.scale.set(s);
      drawFighter(a.g, a.f, MOVES, 0xd90429, elapsed, filterForVector(a.loadout, a.ws));
      a.ws.update(a.f, MOVES);
      a.tag.position.set(a.f.x * scale, H - 40 - 158 * s);
      // o wrap desenha em coordenadas do lutador; corrige o x do protagonista (escala maior)
      if (a.protagonista) a.wrap.position.set(a.f.x * scale - a.f.x * s, H - 40);
      if (a.clanTag) a.clanTag.position.set(a.f.x * scale, H - 40 - 158 * s - 16);
      a.tag.text = a.protagonista ? `★ ${a.name}` : a.away ? `${a.name} 💤` : a.name;
    }

    // emotes flutuantes
    for (let i = emotes.length - 1; i >= 0; i--) {
      const e = emotes[i];
      e.vida += dt;
      if (e.vida >= e.dur || !e.ator || e.ator.tag.destroyed) {
        layer.removeChild(e.t); e.t.destroy(); emotes.splice(i, 1); continue;
      }
      const pop = Math.min(1, e.vida * 5);
      e.t.scale.set(0.6 + pop * 0.4 + Math.sin(e.vida * 10) * 0.02);
      e.t.alpha = e.vida > e.dur - 0.5 ? (e.dur - e.vida) * 2 : 1;
      e.t.position.set(e.ator.tag.x, e.ator.tag.y - 20 - e.vida * 16);
    }
  });

  return {
    say(name, text) {
      for (const a of actors.values()) {
        if (a.name === name) { showBubble(a, text); return; }
      }
    },
    emote(name, emoji) {
      for (const a of actors.values()) if (a.name === name) { mostraEmote(a, emoji); return; }
    },
    setProtagonist(p) {
      if (!p?.name) return;
      if (protagonista) {
        protagonista.loadout = p.loadout || [];
        protagonista.ws.setLoadout(protagonista.loadout);
        protagonista.name = p.name;
        return;
      }
      // se o próprio jogador já entrou como caminhante comum, sai de cena
      for (const a of [...actors.values()])
        if (!a.protagonista && a.name === p.name) remove(a);
      const a = spawn({
        id: 'protagonista', name: p.name, loadout: p.loadout || [],
        protagonista: true, fx: Math.max(120, (W / scale) / 2 || 220),
      });
      actors.set(a.id, a);
      protagonista = a;
    },
    setPlayers(players) {
      const meu = protagonista?.name;
      const lista = players.filter((p) => p.name !== meu);
      const keep = new Set();
      for (const p of lista.slice(0, MAX_WALKERS)) {
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
        if (!a.protagonista && !keep.has(id)) remove(a);
      }
    },
    destroy() {
      document.removeEventListener('visibilitychange', onVis);
      if (!TOUCH) app.canvas.removeEventListener('pointermove', onMove);
      app.destroy(true, { children: true });
    },
  };
}
