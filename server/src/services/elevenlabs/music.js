// STIKDEAD :: ElevenLabs — Eleven Music (trilhas).
// A API de música exige plano compatível. Se o acesso não existir, NÃO
// improvisamos: reportamos a limitação com clareza (regra da especificação).
import { elFetch } from './client.js';

/**
 * Gera uma faixa musical. Lança erro claro se o plano não tiver acesso.
 * @param {object} p
 * @param {string} p.prompt        descrição da faixa (instrumental etc.)
 * @param {number} [p.musicLengthMs] duração desejada em ms (ex.: 150000)
 * @returns {Promise<Buffer>}
 */
export async function composeMusic({ prompt, musicLengthMs }) {
  if (!prompt) throw new Error('composeMusic: prompt obrigatório.');
  try {
    return await elFetch('/v1/music', {
      method: 'POST',
      body: { prompt, ...(musicLengthMs ? { music_length_ms: musicLengthMs } : {}) },
      expect: 'buffer',
      timeoutMs: 300000,
    });
  } catch (err) {
    if (/erro 4\d\d/.test(err.message)) {
      throw new Error(
        `Eleven Music indisponível para este plano/conta (${err.message}). ` +
        'Registre a limitação e gere manualmente no site — o manifesto continua válido.'
      );
    }
    throw err;
  }
}
