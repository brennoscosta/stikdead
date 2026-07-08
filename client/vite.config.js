import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

// carimbo único por build — vira o passaporte da versão
const BUILD_ID = String(Date.now());

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'stikdead-version-stamp',
      transformIndexHtml(html) {
        // o marcador #bb agora é automático: b:MMDD-HHMM (Brasília) a cada build
        const d = new Date(Number(BUILD_ID) - 3 * 3600 * 1000);
        const p = (n) => String(n).padStart(2, '0');
        const stamp = `b:${p(d.getUTCMonth() + 1)}${p(d.getUTCDate())}-${p(d.getUTCHours())}${p(d.getUTCMinutes())}`;
        return html.replace(/<div id="bb">[^<]*<\/div>/, `<div id="bb">${stamp}</div>`);
      },
      closeBundle() {
        writeFileSync(
          resolve(__dirname, 'dist/version.json'),
          JSON.stringify({ build: BUILD_ID })
        );
        console.log(`\n  🪪 version.json carimbado: ${BUILD_ID}\n`);
      },
    },
  ],
  define: { __BUILD_ID__: JSON.stringify(BUILD_ID) },
  server: {
    proxy: {
      '/api': 'http://localhost:3001',
      '/socket.io': { target: 'http://localhost:3001', ws: true },
    },
    fs: { allow: ['..'] },
  },
});
