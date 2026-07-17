// STIKDEAD :: ElevenLabs — formatos compartilhados (JSDoc; o projeto é JS puro).

/**
 * Item do manifesto de áudio (audio-manifest.json, Fase 2).
 * @typedef {object} AudioManifestItem
 * @property {string} id                ex.: 'ui_click_confirm_01'
 * @property {'sound-effect'|'music'|'voice'} type
 * @property {string} prompt            prompt de geração (ou texto da fala)
 * @property {number} [durationSeconds] duração alvo (sound-effect)
 * @property {number} [musicLengthMs]   duração alvo (music)
 * @property {string} [voiceId]         voz (voice)
 * @property {string} output            caminho final, ex.: 'client/public/audio/ui/buttons/ui_click_confirm_01.mp3'
 * @property {number} [candidates]      quantas candidatas gerar (default 1)
 */

/**
 * Resultado do diagnóstico (audio-doctor).
 * @typedef {object} DoctorReport
 * @property {boolean} keyPresent
 * @property {string}  maskedKey
 * @property {string}  [tier]
 * @property {number}  [charactersUsed]
 * @property {number}  [charactersLimit]
 * @property {string}  [error]
 */

export {};
