// STIKDEAD :: diagnóstico da ElevenLabs — script LOCAL (nunca vira rota pública).
// Uso: cd server && node scripts/audio-doctor.js
// Confirma a chave, consulta GET /v1/user (custo zero) e reporta o plano.
// A chave NUNCA é impressa (só mascarada).
import 'dotenv/config';
import { hasKey, maskedKey } from '../src/services/elevenlabs/config.js';
import { elFetch } from '../src/services/elevenlabs/client.js';

console.log('== STIKDEAD audio-doctor ==');
console.log(`chave: ${maskedKey()}`);

if (!hasKey()) {
  console.log('FALHA: ELEVENLABS_API_KEY não está no ambiente.');
  console.log('Adicione ao server/.env do VPS:  ELEVENLABS_API_KEY=sua_chave');
  process.exit(1);
}

try {
  const user = await elFetch('/v1/user');
  const sub = user.subscription || {};
  console.log('OK: chave válida.');
  console.log(`plano: ${sub.tier || '?'}`);
  console.log(`caracteres: ${sub.character_count ?? '?'} / ${sub.character_limit ?? '?'}`);
  if (sub.next_character_count_reset_unix) {
    console.log(`reset da cota: ${new Date(sub.next_character_count_reset_unix * 1000).toISOString()}`);
  }
  process.exit(0);
} catch (err) {
  console.log(`FALHA: ${err.message}`);
  process.exit(2);
}
