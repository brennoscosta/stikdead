// STIKDEAD :: ElevenLabs — geração de efeitos sonoros (Sound Effects API).
// Usada SÓ pela CLI administrativa (Fase 2). O jogo nunca chama isto.
import { elFetch } from './client.js';

/**
 * Gera um efeito sonoro e devolve o áudio (Buffer mp3 44.1kHz).
 * @param {object} p
 * @param {string} p.text              prompt do efeito (em inglês rende melhor)
 * @param {number} [p.durationSeconds] 0.5–22s; omitir deixa o modelo decidir
 * @param {number} [p.promptInfluence] 0–1 (default 0.3): quanto seguir o texto à risca
 * @returns {Promise<Buffer>}
 */
export function generateSoundEffect({ text, durationSeconds, promptInfluence = 0.3 }) {
  if (!text) throw new Error('generateSoundEffect: prompt (text) obrigatório.');
  return elFetch('/v1/sound-generation', {
    method: 'POST',
    body: {
      text,
      ...(durationSeconds ? { duration_seconds: durationSeconds } : {}),
      prompt_influence: promptInfluence,
    },
    expect: 'buffer',
    timeoutMs: 120000,
  });
}
