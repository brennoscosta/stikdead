// STIKDEAD :: ElevenLabs — cliente HTTP mínimo (fetch nativo do Node 18+).
// Sem SDK: o projeto é ESM puro e o fetch cobre tudo que precisamos.
// Regras: chave só no header xi-api-key; 429/5xx com backoff; erros amigáveis
// que NUNCA incluem a chave.
import { BASE_URL, assertKey } from './config.js';

const espera = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * Chama a API da ElevenLabs.
 * @param {string} path        ex.: '/v1/user'
 * @param {object} [opts]
 * @param {string} [opts.method]   GET/POST...
 * @param {object} [opts.body]     JSON a enviar
 * @param {'json'|'buffer'} [opts.expect]  formato da resposta (default json)
 * @param {number} [opts.timeoutMs]        default 30s (gerações usam mais)
 * @returns {Promise<any|Buffer>}
 */
export async function elFetch(path, { method = 'GET', body, expect = 'json', timeoutMs = 30000 } = {}) {
  const key = assertKey();
  let tentativa = 0;
  // até 3 tentativas extras para 429/5xx, com backoff
  for (;;) {
    const ctl = new AbortController();
    const timer = setTimeout(() => ctl.abort(), timeoutMs);
    let res;
    try {
      res = await fetch(`${BASE_URL}${path}`, {
        method,
        headers: {
          'xi-api-key': key,
          ...(body ? { 'Content-Type': 'application/json' } : {}),
        },
        body: body ? JSON.stringify(body) : undefined,
        signal: ctl.signal,
      });
    } catch (err) {
      clearTimeout(timer);
      if (err.name === 'AbortError') throw new Error(`ElevenLabs: tempo esgotado em ${path} (${timeoutMs}ms).`);
      throw new Error(`ElevenLabs: falha de rede em ${path}: ${err.message}`);
    }
    clearTimeout(timer);

    if (res.status === 429 || res.status >= 500) {
      tentativa += 1;
      if (tentativa > 3) throw new Error(`ElevenLabs: ${res.status} em ${path} após ${tentativa} tentativas.`);
      const retryAfter = Number(res.headers.get('retry-after')) || 0;
      await espera(Math.max(retryAfter * 1000, 1500 * tentativa));
      continue;
    }
    if (res.status === 401) throw new Error('ElevenLabs: chave inválida ou expirada (401). Confira o server/.env.');
    if (!res.ok) {
      let det = '';
      try { det = JSON.stringify((await res.json())?.detail ?? ''); } catch { /* sem corpo */ }
      throw new Error(`ElevenLabs: erro ${res.status} em ${path}. ${det}`.trim());
    }

    if (expect === 'buffer') return Buffer.from(await res.arrayBuffer());
    return res.json();
  }
}
