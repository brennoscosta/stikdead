// STIKDEAD :: ElevenLabs — voz do narrador (Text to Speech).
// Fase 10: primeiro listamos vozes e geramos amostras; nada em massa sem aprovação.
import { elFetch } from './client.js';

/** Lista as vozes disponíveis na conta. */
export async function listVoices() {
  const data = await elFetch('/v1/voices');
  return (data.voices || []).map((v) => ({
    id: v.voice_id,
    name: v.name,
    labels: v.labels || {},
    preview: v.preview_url || null,
    category: v.category || '',
  }));
}

/**
 * Gera fala e devolve o áudio (Buffer mp3).
 * @param {object} p
 * @param {string} p.voiceId
 * @param {string} p.text            ex.: 'A batalha começou.'
 * @param {string} [p.modelId]       default eleven_multilingual_v2 (pt-BR ok)
 * @param {object} [p.voiceSettings] {stability, similarity_boost, style, speed}
 * @returns {Promise<Buffer>}
 */
export function textToSpeech({ voiceId, text, modelId = 'eleven_multilingual_v2', voiceSettings }) {
  if (!voiceId || !text) throw new Error('textToSpeech: voiceId e text obrigatórios.');
  return elFetch(`/v1/text-to-speech/${voiceId}`, {
    method: 'POST',
    body: { text, model_id: modelId, ...(voiceSettings ? { voice_settings: voiceSettings } : {}) },
    expect: 'buffer',
    timeoutMs: 120000,
  });
}
