// STIKDEAD :: arte dos itens equipados — templates paramétricos presos aos ossos
// Cada item do catálogo = { slot, template, params }. Camadas: back → body → front.

const C = (hex) => (typeof hex === 'string' ? parseInt(hex.replace('#', ''), 16) : hex ?? 0xd90429);
const OUT = 0x080808;

const LAYER = {
  cape: 'back', aura: 'back', sheath: 'back',
  vest: 'body', scarf: 'body', gloves: 'body', gauntlets: 'body', bands: 'body',
  shorts: 'body', pants: 'body', kneepads: 'body', shoes: 'body', boots: 'body',
  band: 'front', hat: 'front', hood: 'front', crown: 'front',
  bandana: 'front', mask_skull: 'front', mask_oni: 'front', mask_hockey: 'front', eyes_red: 'front',
  katana: 'front', bo: 'front', nunchaku: 'front', axe: 'front', spear: 'front',
  scythe: 'front', dual: 'front', bow: 'front',
  dust: 'front',
};

export function drawItems(ctx, loadout, layer) {
  for (const item of loadout) {
    const fn = TEMPLATES[item.template];
    if (fn && (LAYER[item.template] || 'front') === layer) fn(ctx, item.params || {});
  }
}

// ===== helpers =====
function dir(a, b) {
  const dx = b[0] - a[0], dy = b[1] - a[1];
  const L = Math.hypot(dx, dy) || 1;
  return [dx / L, dy / L, L];
}
function seg(g, a, b, w, color, outline = true, hi = false) {
  if (outline) g.moveTo(a[0], a[1]).lineTo(b[0], b[1]).stroke({ width: w + 4, color: OUT, cap: 'round' });
  g.moveTo(a[0], a[1]).lineTo(b[0], b[1]).stroke({ width: w, color, cap: 'round' });
  if (hi) {
    const ux = b[0] - a[0], uy = b[1] - a[1];
    const L = Math.hypot(ux, uy) || 1;
    const nx = -uy / L, ny = ux / L;
    const off = w * 0.2;
    g.moveTo(a[0] + ux * 0.15 + nx * off, a[1] + uy * 0.15 + ny * off)
      .lineTo(a[0] + ux * 0.5 + nx * off, a[1] + uy * 0.5 + ny * off)
      .stroke({ width: Math.max(2, w * 0.28), color: 0xffffff, alpha: 0.3, cap: 'round' });
  }
}
// fio de luz na borda de uma lâmina
function edge(g, a, b, w) {
  const ux = b[0] - a[0], uy = b[1] - a[1];
  const L = Math.hypot(ux, uy) || 1;
  const nx = -uy / L, ny = ux / L;
  const off = w * 0.32;
  g.moveTo(a[0] + nx * off, a[1] + ny * off).lineTo(b[0] + nx * off, b[1] + ny * off)
    .stroke({ width: 1.6, color: 0xffffff, alpha: 0.55, cap: 'round' });
}
// glow em duas camadas (halo largo + núcleo)
function glow2(g, a, b, w, color) {
  g.moveTo(a[0], a[1]).lineTo(b[0], b[1]).stroke({ width: w * 3.2, color, alpha: 0.16, cap: 'round' });
  g.moveTo(a[0], a[1]).lineTo(b[0], b[1]).stroke({ width: w * 1.4, color, alpha: 0.35, cap: 'round' });
  g.moveTo(a[0], a[1]).lineTo(b[0], b[1]).stroke({ width: 2, color, alpha: 0.95, cap: 'round' });
}

// ===== templates =====
const TEMPLATES = {
  // -------- costas --------
  cape({ g, T, sk, face, elapsed, ko }, p) {
    if (ko) return;
    const col = C(p.color);
    const [nx, ny] = T(sk.neck);
    const [hx2, hy2] = T(sk.hip);
    const w1 = Math.sin(elapsed * 5) * 7;
    const w2 = Math.sin(elapsed * 5 + 1.2) * 10;
    const bx = -face;
    g.moveTo(nx - face * 4, ny - 2)
      .lineTo(nx + bx * 26 + w1 * 0.4, ny + 24)
      .lineTo(hx2 + bx * 34 + w2, hy2 + 14)
      .lineTo(hx2 + bx * 12 + w2 * 0.5, hy2 + 10)
      .lineTo(nx + bx * 6, ny + 20)
      .closePath()
      .fill(col)
      .stroke({ width: 3, color: OUT });
    g.moveTo(nx + bx * 10, ny + 8)
      .quadraticCurveTo(nx + bx * 20 + w1 * 0.4, (ny + hy2) / 2 + 10, hx2 + bx * 24 + w2 * 0.8, hy2 + 8)
      .stroke({ width: 2.5, color: 0x000000, alpha: 0.3 });
    g.moveTo(nx + bx * 5, ny + 2)
      .lineTo(nx + bx * 14 + w1 * 0.3, ny + 18)
      .stroke({ width: 2, color: 0xffffff, alpha: 0.2 });
  },
  sheath({ g, T, sk, face }, p) {
    const [nx, ny] = T(sk.neck);
    const [hx2, hy2] = T(sk.hip);
    seg(g, [nx - face * 8, ny + 4], [hx2 + face * 10, hy2 - 6], 7, C(p.color ?? '#141414'));
  },
  aura({ g, T, sk, f, elapsed }, p) {
    const col = C(p.color);
    const pulse = 0.5 + 0.5 * Math.sin(elapsed * 4);
    const gx = f.x, gy = -f.y;
    g.ellipse(gx, gy - 2, 42 + pulse * 8, 10).fill({ color: col, alpha: 0.18 + pulse * 0.1 });
    const [hx2, hy2] = T(sk.hip);
    g.circle(hx2, hy2 - 10, 40 + pulse * 6).fill({ color: col, alpha: 0.07 });
    for (let i = 0; i < 4; i++) {
      const ph = (elapsed * 1.4 + i * 0.25) % 1;
      g.circle(gx + Math.sin(i * 2.4 + elapsed) * 26, gy - 8 - ph * 78, 3.5 * (1 - ph)).fill({ color: col, alpha: 0.5 * (1 - ph) });
    }
  },

  // -------- corpo --------
  scarf({ g, T, sk, face, elapsed, ko }, p) {
    const col = C(p.color);
    const [nx, ny] = T(sk.neck);
    g.moveTo(nx - 12, ny - 2).quadraticCurveTo(nx, ny + 10, nx + 12, ny - 2)
      .lineTo(nx + 9, ny + 8).quadraticCurveTo(nx, ny + 14, nx - 9, ny + 8)
      .closePath().fill(col).stroke({ width: 2.5, color: OUT });
    g.moveTo(nx - 9, ny + 1).quadraticCurveTo(nx, ny + 8, nx + 9, ny + 1)
      .stroke({ width: 1.6, color: 0x000000, alpha: 0.3 });
    g.moveTo(nx - 8, ny - 1).quadraticCurveTo(nx, ny + 4, nx + 8, ny - 1)
      .stroke({ width: 1.6, color: 0xffffff, alpha: 0.25 });
    if (!ko) {
      const w = Math.sin(elapsed * 7) * 6;
      g.moveTo(nx - face * 8, ny + 4)
        .quadraticCurveTo(nx - face * 26, ny + 18 + w, nx - face * 22, ny + 34 + w)
        .lineTo(nx - face * 12, ny + 30 + w * 0.5)
        .quadraticCurveTo(nx - face * 14, ny + 16, nx - face * 4, ny + 8)
        .closePath().fill(col).stroke({ width: 2.5, color: OUT });
    }
  },
  vest({ g, T, sk }, p) {
    const col = C(p.color ?? '#2a2a2a');
    seg(g, T(sk.neck), T(sk.hip), 26, col, true, true);
    if (p.trim) {
      const [nx, ny] = T(sk.neck);
      g.circle(nx - 12, ny + 4, 6).fill(C(p.trim));
      g.circle(nx + 12, ny + 4, 6).fill(C(p.trim));
    }
    if (p.glow) {
      const [nx, ny] = T(sk.neck);
      const [hx2, hy2] = T(sk.hip);
      g.moveTo((nx + hx2) / 2 - 5, (ny + hy2) / 2 - 8)
        .lineTo((nx + hx2) / 2 + 5, (ny + hy2) / 2)
        .lineTo((nx + hx2) / 2 - 3, (ny + hy2) / 2 + 8)
        .stroke({ width: 3, color: C(p.glow), alpha: 0.9 });
    }
  },
  gloves({ g, T, sk }, p) {
    const col = C(p.color);
    for (const h of [sk.handB, sk.handF]) {
      const [x, y] = T(h);
      g.circle(x, y, 9).fill(OUT);
      g.circle(x, y, 7).fill(col);
      g.ellipse(x - 2.2, y - 2.6, 2.4, 1.6).fill({ color: 0xffffff, alpha: 0.35 });
    }
  },
  gauntlets({ g, T, sk }, p) {
    const col = C(p.color ?? '#2f2f2f');
    for (const [e, h] of [[sk.elbB, sk.handB], [sk.elbF, sk.handF]]) {
      const a = T(e), b = T(h);
      seg(g, [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2], b, 15, col);
      const [x, y] = b;
      g.circle(x, y, 10).fill(col).stroke({ width: 3, color: OUT });
      if (p.studs) {
        g.circle(x - 3, y - 4, 1.8).fill(C(p.studs));
        g.circle(x + 3, y - 4, 1.8).fill(C(p.studs));
      }
    }
  },
  bands({ g, T, sk }, p) {
    const col = C(p.color);
    for (const [e, h] of [[sk.elbB, sk.handB], [sk.elbF, sk.handF]]) {
      const a = T(e), b = T(h);
      const m = [a[0] + (b[0] - a[0]) * 0.55, a[1] + (b[1] - a[1]) * 0.55];
      const m2 = [a[0] + (b[0] - a[0]) * 0.75, a[1] + (b[1] - a[1]) * 0.75];
      seg(g, m, m2, 13, col, false);
    }
  },
  shorts({ g, T, sk }, p) {
    const col = C(p.color ?? '#242424');
    for (const [hip, kne] of [[sk.hip, sk.kneB], [sk.hip, sk.kneF]]) {
      const a = T(hip), b = T(kne);
      seg(g, a, [a[0] + (b[0] - a[0]) * 0.6, a[1] + (b[1] - a[1]) * 0.6], 16, col);
    }
    if (p.trim) {
      const a = T(sk.hip);
      g.rect(a[0] - 12, a[1] - 3, 24, 5).fill(C(p.trim));
    }
  },
  pants({ g, T, sk }, p) {
    const col = C(p.color ?? '#202020');
    for (const [hip, kne, foot] of [[sk.hip, sk.kneB, sk.footB], [sk.hip, sk.kneF, sk.footF]]) {
      seg(g, T(hip), T(kne), 15, col);
      const k = T(kne), ft = T(foot);
      seg(g, k, [k[0] + (ft[0] - k[0]) * 0.8, k[1] + (ft[1] - k[1]) * 0.8], 13, col);
    }
  },
  kneepads({ g, T, sk }, p) {
    const col = C(p.color ?? '#333333');
    for (const kne of [sk.kneB, sk.kneF]) {
      const [x, y] = T(kne);
      g.circle(x, y, 8).fill(col).stroke({ width: 2.5, color: OUT });
    }
  },
  shoes({ g, T, sk, face }, p) {
    const col = C(p.color ?? '#f2efe9');
    for (const [kne, foot] of [[sk.kneB, sk.footB], [sk.kneF, sk.footF]]) {
      const k = T(kne), ft = T(foot);
      const [dx, dy] = dir(k, ft);
      const tip = [ft[0] + dx * 4 + face * 6, ft[1] + dy * 4];
      seg(g, [ft[0] - dx * 4, ft[1] - dy * 4], tip, 12, col, true, true);
      if (p.stripe) g.circle((ft[0] + tip[0]) / 2, (ft[1] + tip[1]) / 2, 2.6).fill(C(p.stripe));
    }
  },
  boots({ g, T, sk, face }, p) {
    const col = C(p.color ?? '#1a1a1a');
    for (const [kne, foot] of [[sk.kneB, sk.footB], [sk.kneF, sk.footF]]) {
      const k = T(kne), ft = T(foot);
      const [dx, dy] = dir(k, ft);
      seg(g, [ft[0] - dx * 14, ft[1] - dy * 14], [ft[0] + dx * 3 + face * 6, ft[1] + dy * 3], 14, col, true, true);
      if (p.glow) g.circle(ft[0], ft[1], 3).fill({ color: C(p.glow), alpha: 0.9 });
    }
  },

  // -------- cabeça / rosto --------
  band({ g, T, sk, face, elapsed }, p) {
    const col = C(p.color);
    const [hx, hy] = T(sk.head);
    const R = 16;
    g.rect(hx - R, hy - 5, R * 2, 8).fill(col);
    const wind = Math.sin(elapsed * 9) * 5;
    const bx = hx - face * R;
    g.moveTo(bx, hy - 1).lineTo(bx - face * 16, hy - 6 + wind).lineTo(bx - face * 13, hy + 2 + wind * 0.5).closePath().fill(col);
    g.moveTo(bx, hy + 1).lineTo(bx - face * 13, hy + 7 - wind * 0.6).lineTo(bx - face * 9, hy + 10).closePath().fill(col);
  },
  hat({ g, T, sk }, p) {
    const col = C(p.color ?? '#c9a35a');
    const [hx, hy] = T(sk.head);
    g.ellipse(hx, hy - 10, 26, 8).fill(col).stroke({ width: 2.5, color: OUT });
    g.moveTo(hx - 14, hy - 11).lineTo(hx, hy - 26).lineTo(hx + 14, hy - 11).closePath().fill(col).stroke({ width: 2.5, color: OUT });
  },
  hood({ g, T, sk, face }, p) {
    const col = C(p.color ?? '#161616');
    const [hx, hy] = T(sk.head);
    g.moveTo(hx + face * 12, hy - 12)
      .quadraticCurveTo(hx, hy - 26, hx - face * 18, hy - 8)
      .quadraticCurveTo(hx - face * 22, hy + 8, hx - face * 10, hy + 16)
      .lineTo(hx - face * 6, hy + 8)
      .quadraticCurveTo(hx - face * 12, hy - 2, hx - face * 2, hy - 12)
      .closePath().fill(col).stroke({ width: 2.5, color: OUT });
  },
  crown({ g, T, sk }, p) {
    const col = C(p.color ?? '#e0a10b');
    const [hx, hy] = T(sk.head);
    const y0 = hy - 14;
    g.moveTo(hx - 13, y0).lineTo(hx - 13, y0 - 8).lineTo(hx - 7, y0 - 3).lineTo(hx, y0 - 10)
      .lineTo(hx + 7, y0 - 3).lineTo(hx + 13, y0 - 8).lineTo(hx + 13, y0).closePath()
      .fill(col).stroke({ width: 2.5, color: OUT });
    g.circle(hx, y0 - 8, 2.2).fill(0xd90429);
  },
  bandana({ g, T, sk }, p) {
    const col = C(p.color);
    const [hx, hy] = T(sk.head);
    g.moveTo(hx - 15, hy + 3).quadraticCurveTo(hx, hy + 9, hx + 15, hy + 3)
      .lineTo(hx + 12, hy + 15).quadraticCurveTo(hx, hy + 20, hx - 12, hy + 15)
      .closePath().fill(col).stroke({ width: 2.5, color: OUT });
  },
  mask_skull({ g, T, sk, face }) {
    const [hx, hy] = T(sk.head);
    g.ellipse(hx + face * 2, hy + 4, 13, 11).fill(0xe8e4da).stroke({ width: 2.5, color: OUT });
    g.circle(hx + face * 7, hy + 1, 3.4).fill(OUT);
    g.circle(hx - face * 3, hy + 1, 3).fill(OUT);
    for (let i = -1; i <= 1; i++)
      g.moveTo(hx + face * 2 + i * 4, hy + 10).lineTo(hx + face * 2 + i * 4, hy + 14).stroke({ width: 2, color: OUT });
  },
  mask_oni({ g, T, sk, face }, p) {
    const col = C(p.color ?? '#b0031f');
    const [hx, hy] = T(sk.head);
    g.ellipse(hx + face * 2, hy + 3, 14, 12).fill(col).stroke({ width: 2.5, color: OUT });
    g.moveTo(hx - 8, hy - 9).lineTo(hx - 12, hy - 19).lineTo(hx - 4, hy - 12).closePath().fill(0xe8e4da).stroke({ width: 2, color: OUT });
    g.moveTo(hx + 8, hy - 9).lineTo(hx + 12, hy - 19).lineTo(hx + 4, hy - 12).closePath().fill(0xe8e4da).stroke({ width: 2, color: OUT });
    g.moveTo(hx + face * 8 - 4, hy).lineTo(hx + face * 8 + 3, hy - 2.5).lineTo(hx + face * 8 + 3, hy + 2).closePath().fill(0xffffff);
    g.moveTo(hx - face * 2 - 4, hy).lineTo(hx - face * 2 + 3, hy - 2.5).lineTo(hx - face * 2 + 3, hy + 2).closePath().fill(0xffffff);
    g.moveTo(hx + face * 2 - 6, hy + 9).lineTo(hx + face * 2 + 6, hy + 9).stroke({ width: 2, color: 0xffffff });
  },
  mask_hockey({ g, T, sk, face }) {
    const [hx, hy] = T(sk.head);
    g.ellipse(hx + face * 2, hy + 2, 12.5, 12).fill(0xdcd7cb).stroke({ width: 2.5, color: OUT });
    g.ellipse(hx + face * 7, hy, 3.4, 2.6).fill(OUT);
    g.ellipse(hx - face * 3, hy, 3, 2.4).fill(OUT);
    for (const [ox, oy] of [[-4, 7], [2, 8], [7, 6], [-1, 12]])
      g.circle(hx + ox, hy + oy, 1.1).fill(OUT);
  },
  eyes_red({ g, T, sk, face, f, ko }) {
    if (ko) return;
    const [hx, hy] = T(sk.head);
    const ey = hy + 2;
    const angry = (cx, w) => {
      g.moveTo(cx - w, ey + 2).lineTo(cx + w * 0.5, ey - 3.4).lineTo(cx + w, ey + 2.4).closePath().fill(0xff2244);
      g.circle(cx, ey, w * 1.4).fill({ color: 0xd90429, alpha: 0.12 });
    };
    angry(hx + face * 6, 6);
    angry(hx - face * 3, 5);
  },

  // -------- armas (na mão da frente) --------
  katana(ctx, p) {
    weaponAlongArm(ctx, (g, h, d2, face) => {
      const blade = C(p.blade ?? '#d8d3c8');
      const tip = [h[0] + d2[0] * 52, h[1] + d2[1] * 52];
      seg(g, [h[0] - d2[0] * 10, h[1] - d2[1] * 10], h, 5, C(p.grip ?? '#3a1216'), true, true);
      g.moveTo(h[0] - d2[1] * 6, h[1] + d2[0] * 6).lineTo(h[0] + d2[1] * 6, h[1] - d2[0] * 6).stroke({ width: 4, color: OUT });
      if (p.glow) glow2(g, h, tip, 4.5, C(p.glow));
      seg(g, h, tip, 4.5, blade);
      edge(g, h, tip, 4.5);
    });
  },
  bo(ctx, p) {
    weaponAlongArm(ctx, (g, h, d2) => {
      seg(g, [h[0] - d2[0] * 34, h[1] - d2[1] * 34], [h[0] + d2[0] * 34, h[1] + d2[1] * 34], 5.5, C(p.color ?? '#6b4a2b'));
      g.circle(h[0], h[1], 3.4).fill(C(p.band ?? '#d90429'));
    });
  },
  nunchaku(ctx, p) {
    weaponAlongArm(ctx, (g, h, d2, face, elapsed) => {
      const col = C(p.color ?? '#241a12');
      const a2 = [h[0] + d2[0] * 4, h[1] + d2[1] * 4];
      const sw = Math.sin(elapsed * 10) * 0.6;
      const d3 = [d2[0] * Math.cos(sw) - d2[1] * Math.sin(sw), d2[0] * Math.sin(sw) + d2[1] * Math.cos(sw)];
      const mid = [a2[0] + d3[0] * 22, a2[1] + d3[1] * 22];
      const end = [mid[0] + d3[0] * 24, mid[1] + d3[1] * 24];
      seg(g, [h[0] - d2[0] * 18, h[1] - d2[1] * 18], a2, 6, col);
      g.moveTo(a2[0], a2[1]).lineTo(mid[0], mid[1]).stroke({ width: 2, color: 0x8a8a8a });
      seg(g, mid, end, 6, col);
    });
  },
  axe(ctx, p) {
    weaponAlongArm(ctx, (g, h, d2, face) => {
      const tip = [h[0] + d2[0] * 40, h[1] + d2[1] * 40];
      seg(g, [h[0] - d2[0] * 8, h[1] - d2[1] * 8], tip, 5, C(p.handle ?? '#4a341f'));
      const n = [-d2[1] * face, d2[0] * face];
      g.moveTo(tip[0], tip[1])
        .lineTo(tip[0] + n[0] * 20 + d2[0] * 6, tip[1] + n[1] * 20 + d2[1] * 6)
        .quadraticCurveTo(tip[0] + n[0] * 24 - d2[0] * 10, tip[1] + n[1] * 24 - d2[1] * 10, tip[0] + n[0] * 16 - d2[0] * 14, tip[1] + n[1] * 16 - d2[1] * 14)
        .closePath().fill(C(p.blade ?? '#8f8a80')).stroke({ width: 3, color: OUT });
      g.moveTo(tip[0] + n[0] * 19, tip[1] + n[1] * 19 + 2)
        .lineTo(tip[0] + n[0] * 15 - d2[0] * 11, tip[1] + n[1] * 15 - d2[1] * 11)
        .stroke({ width: 1.6, color: 0xffffff, alpha: 0.5, cap: 'round' });
    });
  },
  spear(ctx, p) {
    weaponAlongArm(ctx, (g, h, d2) => {
      const tip = [h[0] + d2[0] * 58, h[1] + d2[1] * 58];
      seg(g, [h[0] - d2[0] * 26, h[1] - d2[1] * 26], tip, 4.5, C(p.color ?? '#5a4630'), true, true);
      g.moveTo(tip[0] + d2[0] * 14, tip[1] + d2[1] * 14)
        .lineTo(tip[0] - d2[1] * 5, tip[1] + d2[0] * 5)
        .lineTo(tip[0] + d2[1] * 5, tip[1] - d2[0] * 5)
        .closePath().fill(C(p.blade ?? '#c9c4b8')).stroke({ width: 2.5, color: OUT });
    });
  },
  scythe(ctx, p) {
    weaponAlongArm(ctx, (g, h, d2, face) => {
      const top = [h[0] + d2[0] * 46, h[1] + d2[1] * 46];
      seg(g, [h[0] - d2[0] * 16, h[1] - d2[1] * 16], top, 5, C(p.handle ?? '#2b2b2b'), true, true);
      const n = [-d2[1] * face, d2[0] * face];
      g.moveTo(top[0], top[1])
        .quadraticCurveTo(top[0] + n[0] * 34, top[1] + n[1] * 34, top[0] + n[0] * 30 + d2[0] * 26, top[1] + n[1] * 30 + d2[1] * 26)
        .quadraticCurveTo(top[0] + n[0] * 22, top[1] + n[1] * 22, top[0] + d2[0] * 2, top[1] + d2[1] * 2)
        .closePath().fill(C(p.blade ?? '#b8b2a6')).stroke({ width: 3, color: OUT });
      g.moveTo(top[0] + n[0] * 30, top[1] + n[1] * 30)
        .quadraticCurveTo(top[0] + n[0] * 30 + d2[0] * 14, top[1] + n[1] * 30 + d2[1] * 14, top[0] + n[0] * 27 + d2[0] * 24, top[1] + n[1] * 27 + d2[1] * 24)
        .stroke({ width: 1.6, color: 0xffffff, alpha: 0.5, cap: 'round' });
      if (p.glow) {
        g.circle(top[0], top[1], 9).fill({ color: C(p.glow), alpha: 0.25 });
        g.circle(top[0], top[1], 4).fill({ color: C(p.glow), alpha: 0.9 });
      }
    });
  },
  dual({ g, T, sk, face, elapsed }, p) {
    const blade = C(p.blade ?? '#d8d3c8');
    for (const [e, h] of [[sk.elbF, sk.handF], [sk.elbB, sk.handB]]) {
      const eh = T(e), hh = T(h);
      const [dx, dy] = dir(eh, hh);
      const tip = [hh[0] + dx * 38, hh[1] + dy * 38];
      if (p.glow) glow2(g, hh, tip, 4, C(p.glow));
      seg(g, [hh[0] - dx * 6, hh[1] - dy * 6], tip, 4, blade);
      edge(g, [hh[0], hh[1]], tip, 4);
    }
  },
  bow(ctx, p) {
    weaponAlongArm(ctx, (g, h, d2, face) => {
      const col = C(p.color ?? '#4a341f');
      const n = [-d2[1], d2[0]];
      g.moveTo(h[0] + n[0] * 26, h[1] + n[1] * 26)
        .quadraticCurveTo(h[0] + d2[0] * 16, h[1] + d2[1] * 16, h[0] - n[0] * 26, h[1] - n[1] * 26)
        .stroke({ width: 5, color: col, cap: 'round' });
      g.moveTo(h[0] + n[0] * 26, h[1] + n[1] * 26).lineTo(h[0] - n[0] * 26, h[1] - n[1] * 26)
        .stroke({ width: 1.5, color: 0xcfcabc });
    });
  },

  // -------- efeitos frontais --------
  dust({ g, f, elapsed }, p) {
    if (!['walk', 'dash'].includes(f.state)) return;
    const col = C(p.color ?? '#9a9080');
    for (let i = 0; i < 3; i++) {
      const ph = (elapsed * 3 + i * 0.33) % 1;
      g.circle(f.x - f.face * (10 + ph * 26), -f.y - 4 - ph * 8, 4 * (1 - ph)).fill({ color: col, alpha: 0.4 * (1 - ph) });
    }
  },
};

function weaponAlongArm(ctx, draw) {
  const { g, T, sk, face, elapsed, ko } = ctx;
  if (ko) return;
  const e = T(sk.elbF);
  const h = T(sk.handF);
  const [dx, dy] = dir(e, h);
  draw(g, h, [dx, dy], face, elapsed);
}
