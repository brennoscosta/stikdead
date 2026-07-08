// STIKDEAD :: vigia de versão — bundle velho não sobrevive a um F5 🪪
// Compara o carimbo embutido no bundle com o version.json do servidor
// (buscado SEMPRE fresco). Divergiu → recarrega uma vez, sem loop.

const MEU_BUILD = typeof __BUILD_ID__ !== 'undefined' ? __BUILD_ID__ : 'dev';

async function checar() {
  try {
    const r = await fetch(`/version.json?t=${Date.now()}`, { cache: 'no-store' });
    if (!r.ok) return;
    const { build } = await r.json();
    if (!build || build === MEU_BUILD) return;
    // anti-loop: só recarrega 1x por versão nova
    const chave = `stik_reload_${build}`;
    if (sessionStorage.getItem(chave)) return;
    sessionStorage.setItem(chave, '1');
    console.log(`[stikdead] nova versão no ar (${MEU_BUILD} → ${build}) — atualizando 🪪`);
    location.reload();
  } catch { /* offline ou dev — segue o jogo */ }
}

export function startVersionGuard() {
  if (MEU_BUILD === 'dev') return;
  checar(); // no carregamento
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) checar(); // voltou para a aba
  });
  setInterval(checar, 5 * 60 * 1000); // ronda a cada 5 min
}
