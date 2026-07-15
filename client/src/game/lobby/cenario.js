// STIKDEAD :: LOBBY V2 — cenário vivo da praça
// Camadas dinâmicas por cima da pintura: pulso da lua, neblina, lanternas
// balançando, estandarte ondulando. Cada camada tem seu fator de parallax.

export function createCenario(camadaFundo, camadaMeio, camadaFrente) {
  let W = 0, H = 0;
  const lanternas = [];

  const monta = () => {
    lanternas.length = 0;
    const n = Math.max(3, Math.round(W / 260));
    for (let i = 0; i < n; i++) {
      lanternas.push({
        x: (W / (n + 1)) * (i + 1) + (Math.random() - 0.5) * 40,
        corda: 26 + Math.random() * 26,
        fase: Math.random() * Math.PI * 2,
        tom: Math.random() < 0.3 ? 0xffd166 : 0xff5a3c,
      });
    }
  };

  return {
    resize(w, h) { W = w; H = h; monta(); },

    tick(t, vento) {
      if (!W) return;

      // ===== FUNDO: pulso da lua + neblina alta =====
      camadaFundo.clear();
      const pulso = 0.5 + 0.5 * Math.sin(t * 0.7);
      const mx = W * 0.5, my = H * 0.3;
      camadaFundo.circle(mx, my, 70 + pulso * 22).fill({ color: 0xb0031f, alpha: 0.05 + pulso * 0.05 });
      camadaFundo.circle(mx, my, 130 + pulso * 30).fill({ color: 0x8f0620, alpha: 0.03 + pulso * 0.03 });
      // faixas de neblina que atravessam devagar
      for (let i = 0; i < 3; i++) {
        const ny = H * (0.34 + i * 0.16);
        const nx = ((t * (7 + i * 4) * (i % 2 ? 1 : -1)) % (W + 340)) - 170 + (i % 2 ? 0 : W);
        const resp = 0.5 + 0.5 * Math.sin(t * 0.5 + i * 2.1);
        camadaFundo.ellipse(nx, ny, 170, 17 + i * 6).fill({ color: 0x3a2a30, alpha: 0.05 + resp * 0.05 });
      }

      // ===== MEIO: lanternas penduradas balançando =====
      camadaMeio.clear();
      for (const l of lanternas) {
        const ang = Math.sin(t * 1.15 + l.fase) * (0.09 + Math.abs(vento) * 0.16);
        const px = l.x + Math.sin(ang) * l.corda;
        const py = l.corda * Math.cos(ang);
        camadaMeio.moveTo(l.x, 0).lineTo(px, py).stroke({ width: 1.5, color: 0x241318 });
        const cintila = 0.72 + 0.28 * Math.sin(t * 7 + l.fase * 3);
        camadaMeio.circle(px, py + 16, 26).fill({ color: l.tom, alpha: 0.05 * cintila });
        camadaMeio.circle(px, py + 16, 13).fill({ color: l.tom, alpha: 0.1 * cintila });
        camadaMeio.roundRect(px - 6, py, 12, 17, 4).fill({ color: 0x1c0f13 }).stroke({ width: 1.5, color: 0x33202a });
        camadaMeio.roundRect(px - 4, py + 3, 8, 11, 3).fill({ color: l.tom, alpha: 0.55 + 0.4 * cintila });
        camadaMeio.rect(px - 3, py - 3, 6, 3).fill(0x33202a);
      }

      // ===== FRENTE: estandarte ondulando + neblina rasteira =====
      camadaFrente.clear();
      const bx = W * 0.085, bw = 34, bh = 66, topo = 8;
      camadaFrente.moveTo(bx - 2, topo - 4).lineTo(bx + bw + 8, topo - 4).stroke({ width: 3, color: 0x2a161c });
      const ondas = 7;
      camadaFrente.moveTo(bx, topo);
      for (let i = 0; i <= ondas; i++) {
        const yy = topo + (bh / ondas) * i;
        const dx = Math.sin(t * 2.4 + i * 0.9) * (2.5 + Math.abs(vento) * 5) * (i / ondas);
        camadaFrente.lineTo(bx + dx, yy);
      }
      const pontaY = topo + bh, dxP = Math.sin(t * 2.4 + ondas * 0.9) * (2.5 + Math.abs(vento) * 5);
      camadaFrente.lineTo(bx + bw / 2 + dxP, pontaY + 10)
        .lineTo(bx + bw + dxP, pontaY);
      for (let i = ondas; i >= 0; i--) {
        const yy = topo + (bh / ondas) * i;
        const dx = Math.sin(t * 2.4 + i * 0.9) * (2.5 + Math.abs(vento) * 5) * (i / ondas);
        camadaFrente.lineTo(bx + bw + dx, yy);
      }
      camadaFrente.closePath().fill({ color: 0x5e0517, alpha: 0.92 }).stroke({ width: 1.5, color: 0x120a0e });
      camadaFrente.circle(bx + bw / 2 + dxP * 0.6, topo + bh * 0.42, 7).fill({ color: 0xd90429, alpha: 0.85 });

      // neblina rasteira no chão
      for (let i = 0; i < 2; i++) {
        const nx = ((t * (10 + i * 6) * (i % 2 ? -1 : 1)) % (W + 300)) - 150 + (i % 2 ? W : 0);
        camadaFrente.ellipse(nx, H - 26 - i * 9, 150, 13).fill({ color: 0x4a3038, alpha: 0.07 });
      }
    },
  };
}
