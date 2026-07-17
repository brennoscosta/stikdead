// STIKDEAD :: ElevenLabs — configuração. A chave vive SÓ em process.env.
// Nunca é logada, nunca vai ao cliente, nunca aparece em erro.
export const BASE_URL = 'https://api.elevenlabs.io';

export const hasKey = () => Boolean(process.env.ELEVENLABS_API_KEY);

export function assertKey() {
  if (!hasKey()) {
    throw new Error(
      'ELEVENLABS_API_KEY ausente. Configure no server/.env do VPS (nunca no cliente, nunca no git).'
    );
  }
  return process.env.ELEVENLABS_API_KEY;
}

// para diagnósticos: mostra só o comecinho, o resto vira asteriscos
export function maskedKey() {
  const k = process.env.ELEVENLABS_API_KEY || '';
  return k ? `${k.slice(0, 4)}${'*'.repeat(Math.max(0, k.length - 4))}` : '(não configurada)';
}
