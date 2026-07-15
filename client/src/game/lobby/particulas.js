// STIKDEAD :: LOBBY V2 — partículas da praça (object pool, zero alocação por frame)
// Tipos: brasas (sobem), folhas (caem ao vento), fumaça (baforadas), faíscas (duelos/ferreiro)

const POOL_MAX = { brasa: 46, folha: 22, fumaca: 14, faisca: 60 };

export function createParticulas(g, opts = {}) {
  const fator = opts.leve ? 0.5 : 1; // mobile: metade da densidade
  const pool = [];
  const ativas = [];
  let W = 0, H = 0;

  const pega = () => (pool.length ? pool.pop() : {});
  const solta = (p) => { pool.push(p); };

  const contagem = { brasa: 0, folha: 0, fumaca: 0, faisca: 0 };

  const emite = (tipo, cfg) => {
    if (contagem[tipo] >= Math.ceil(POOL_MAX[tipo] * fator)) return;
    const p = pega();
    Object.assign(p, { tipo, vida: 0, ...cfg });
    contagem[tipo]++;
    ativas.push(p);
  };

  const mata = (i) => {
    const p = ativas[i];
    contagem[p.tipo]--;
    ativas[i] = ativas[ativas.length - 1];
    ativas.pop();
    solta(p);
  };

  let tBrasa = 0, tFolha = 0, tFumaca = 0;

  return {
    resize(w, h) { W = w; H = h; },

    // rajada de faíscas num ponto (golpe de duelo, martelo do ferreiro)
    faiscas(x, y, n = 8, cor = 0xffb84d) {
      for (let i = 0; i < n; i++) {
        const a = Math.random() * Math.PI * 2;
        const v = 40 + Math.random() * 120;
        emite('faisca', {
          x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 60,
          dur: 0.35 + Math.random() * 0.4, r: 1 + Math.random() * 1.8, cor,
        });
      }
    },

    tick(dt, vento) {
      if (!W) return;
      // emissão contínua
      tBrasa -= dt; tFolha -= dt; tFumaca -= dt;
      if (tBrasa <= 0) {
        tBrasa = 0.16 + Math.random() * 0.3;
        emite('brasa', {
          x: Math.random() * W, y: H - 20 - Math.random() * 30,
          vx: 0, vy: -(14 + Math.random() * 26),
          dur: 3 + Math.random() * 3, r: 0.8 + Math.random() * 1.6,
          fase: Math.random() * Math.PI * 2,
        });
      }
      if (tFolha <= 0) {
        tFolha = 0.8 + Math.random() * 1.6;
        emite('folha', {
          x: vento >= 0 ? -10 : W + 10, y: Math.random() * H * 0.55,
          vx: 0, vy: 12 + Math.random() * 14,
          dur: 7 + Math.random() * 5, r: 2 + Math.random() * 2,
          fase: Math.random() * Math.PI * 2, giro: Math.random() * Math.PI * 2,
        });
      }
      if (tFumaca <= 0) {
        tFumaca = 1.4 + Math.random() * 2.2;
        const lado = Math.random() < 0.5 ? 0.06 : 0.94;
        emite('fumaca', {
          x: W * lado + (Math.random() - 0.5) * 30, y: H - 34,
          vx: 0, vy: -(8 + Math.random() * 8),
          dur: 4.5 + Math.random() * 3, r: 5 + Math.random() * 7,
          fase: Math.random() * Math.PI * 2,
        });
      }

      g.clear();
      for (let i = ativas.length - 1; i >= 0; i--) {
        const p = ativas[i];
        p.vida += dt;
        if (p.vida >= p.dur) { mata(i); continue; }
        const k = p.vida / p.dur; // 0→1
        switch (p.tipo) {
          case 'brasa': {
            p.x += (Math.sin(p.vida * 2 + p.fase) * 9 + vento * 14) * dt;
            p.y += p.vy * dt;
            const tremula = 0.55 + 0.45 * Math.sin(p.vida * 9 + p.fase);
            const a = (1 - k) * 0.85 * tremula;
            g.circle(p.x, p.y, p.r * (1 - k * 0.4)).fill({ color: 0xff6a2a, alpha: a });
            g.circle(p.x, p.y, p.r * 2.4).fill({ color: 0xd93c1f, alpha: a * 0.22 });
            break;
          }
          case 'folha': {
            p.x += (vento * 46 + Math.sin(p.vida * 1.7 + p.fase) * 16) * dt;
            p.y += (p.vy + Math.sin(p.vida * 2.6 + p.fase) * 10) * dt;
            p.giro += dt * (1.4 + Math.sin(p.fase));
            if (p.x < -20 || p.x > W + 20 || p.y > H) { mata(i); continue; }
            const a = Math.min(1, (1 - k) * 1.6) * 0.5;
            const c = Math.cos(p.giro), s = Math.sin(p.giro);
            g.moveTo(p.x - c * p.r * 2, p.y - s * p.r)
              .quadraticCurveTo(p.x + s * p.r * 2, p.y - c * p.r * 2, p.x + c * p.r * 2, p.y + s * p.r)
              .quadraticCurveTo(p.x - s * p.r, p.y + c * p.r * 1.6, p.x - c * p.r * 2, p.y - s * p.r)
              .fill({ color: 0x6b2d1a, alpha: a });
            break;
          }
          case 'fumaca': {
            p.x += (vento * 20 + Math.sin(p.vida * 0.9 + p.fase) * 6) * dt;
            p.y += p.vy * dt;
            const a = Math.sin(Math.min(1, k * 3) * Math.PI * 0.5) * (1 - k) * 0.12;
            g.circle(p.x, p.y, p.r * (1 + k * 2.2)).fill({ color: 0x8a8078, alpha: a });
            break;
          }
          case 'faisca': {
            p.vy += 260 * dt; // gravidade
            p.x += p.vx * dt; p.y += p.vy * dt;
            const a = (1 - k) * 0.95;
            g.circle(p.x, p.y, p.r * (1 - k * 0.6)).fill({ color: p.cor, alpha: a });
            break;
          }
        }
      }
    },
  };
}
