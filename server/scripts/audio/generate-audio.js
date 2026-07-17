// STIKDEAD :: CLI administrativa de geração de áudio (ElevenLabs) — Fase 2.
// Roda SÓ manual, no VPS, dentro de server/. Nunca é exposta como rota HTTP.
//
// Uso (a partir de server/):
//   npm run audio:validate                       valida o manifesto, custo zero
//   npm run audio:generate                        gera só o que falta (pula existentes)
//   npm run audio:generate -- --id ui_confirm_01   gera 1 item específico
//   npm run audio:generate -- --category ui        gera só uma categoria
//   npm run audio:generate -- --force              regenera mesmo o que já existe
//   npm run audio:generate -- --dry-run             simula (mostra o que geraria, 0 chamadas)
//   npm run audio:report                            status do manifesto + última execução
//
// Regras (Bíblia Sonora / prompt mestre):
// - Cada execução é manual — o script nunca dispara sozinho nem em loop.
// - Nunca imprime a chave (só usa via services/elevenlabs, que já mascara em outro lugar).
// - Concorrência limitada (2 chamadas simultâneas) pra não estourar rate limit.
// - Escreve em tmp/audio/ primeiro; só move pro destino final se o buffer vier válido.
// - Reaproveita o que já existe (cache por arquivo) a menos que --force.
// - --dry-run e --validate NUNCA chamam a API (zero créditos).
import 'dotenv/config';
import { readFile, writeFile, mkdir, rename, rm } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { hasKey } from '../../src/services/elevenlabs/config.js';
import { generateSoundEffect } from '../../src/services/elevenlabs/soundEffects.js';
import { composeMusic } from '../../src/services/elevenlabs/music.js';
import { textToSpeech } from '../../src/services/elevenlabs/speech.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../../../'); // server/scripts/audio -> raiz do repo
const MANIFEST_PATH = path.join(ROOT, 'audio-manifest.json');
const TMP_DIR = path.join(ROOT, 'tmp', 'audio');
const REPORT_PATH = path.join(TMP_DIR, 'report.json');

const MIN_BYTES = 512; // abaixo disso o buffer é considerado inválido/corrompido — nada é salvo

// ---------------------------------------------------------------- args ----
function parseArgs(argv) {
  const args = { force: false, id: null, category: null, dryRun: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--force') args.force = true;
    else if (a === '--dry-run') args.dryRun = true;
    else if (a === '--id') args.id = argv[++i];
    else if (a === '--category') args.category = argv[++i];
  }
  return args;
}

// ------------------------------------------------------------ manifest ----
async function loadManifest() {
  const raw = await readFile(MANIFEST_PATH, 'utf8');
  let data;
  try {
    data = JSON.parse(raw);
  } catch (err) {
    throw new Error(`audio-manifest.json inválido (JSON): ${err.message}`);
  }
  if (!Array.isArray(data.items)) throw new Error('audio-manifest.json: campo "items" ausente ou não é array.');
  return data;
}

function validateManifest(data) {
  const erros = [];
  const ids = new Set();
  const tiposValidos = new Set(['sound-effect', 'music', 'voice']);
  data.items.forEach((item, i) => {
    const onde = `items[${i}]${item.id ? ` (${item.id})` : ''}`;
    if (!item.id) erros.push(`${onde}: "id" ausente.`);
    else if (ids.has(item.id)) erros.push(`${onde}: id duplicado.`);
    else ids.add(item.id);
    if (!tiposValidos.has(item.type)) erros.push(`${onde}: "type" inválido (${item.type}).`);
    if (!item.prompt) erros.push(`${onde}: "prompt" ausente.`);
    if (!item.output) erros.push(`${onde}: "output" ausente.`);
    else if (!item.output.startsWith('client/public/audio/')) {
      erros.push(`${onde}: "output" deve ficar em client/public/audio/ (é: ${item.output}).`);
    }
    if (item.type === 'voice' && !item.voiceId) erros.push(`${onde}: type=voice exige "voiceId".`);
  });
  return erros;
}

// -------------------------------------------------------- geração de 1 ----
async function gerarBuffer(item) {
  if (item.type === 'sound-effect') {
    return generateSoundEffect({ text: item.prompt, durationSeconds: item.durationSeconds });
  }
  if (item.type === 'music') {
    return composeMusic({ prompt: item.prompt, musicLengthMs: item.musicLengthMs });
  }
  if (item.type === 'voice') {
    return textToSpeech({ voiceId: item.voiceId, text: item.prompt });
  }
  throw new Error(`tipo desconhecido: ${item.type}`);
}

async function processarItem(item, { force, dryRun }) {
  const destino = path.join(ROOT, item.output);
  const jaExiste = existsSync(destino);
  if (jaExiste && !force) {
    return { id: item.id, status: 'pulado', motivo: 'já existe (use --force para regenerar)' };
  }
  if (dryRun) {
    return { id: item.id, status: 'simulado', destino: item.output };
  }
  await mkdir(path.dirname(destino), { recursive: true });
  await mkdir(TMP_DIR, { recursive: true });
  const tmpPath = path.join(TMP_DIR, `${item.id}.tmp.mp3`);
  try {
    const buffer = await gerarBuffer(item);
    if (!buffer || buffer.length < MIN_BYTES) {
      throw new Error(`buffer inválido (${buffer ? buffer.length : 0} bytes) — nada foi salvo.`);
    }
    await writeFile(tmpPath, buffer);
    await rename(tmpPath, destino);
    return { id: item.id, status: 'gerado', bytes: buffer.length, destino: item.output };
  } catch (err) {
    await rm(tmpPath, { force: true });
    return { id: item.id, status: 'falhou', erro: err.message };
  }
}

// ------------------------------------------------ concorrência limitada ----
async function executarComConcorrencia(items, worker, limite = 2) {
  const resultados = new Array(items.length);
  let cursor = 0;
  async function proximo() {
    while (cursor < items.length) {
      const i = cursor++;
      resultados[i] = await worker(items[i]);
      const r = resultados[i];
      const rotulo =
        r.status === 'gerado' ? `OK (${r.bytes}B)` :
        r.status === 'pulado' ? 'pulado' :
        r.status === 'simulado' ? 'simulado' :
        `FALHOU: ${r.erro}`;
      console.log(`  [${i + 1}/${items.length}] ${r.id} — ${rotulo}`);
    }
  }
  const trabalhadores = Array.from({ length: Math.min(limite, items.length) }, proximo);
  await Promise.all(trabalhadores);
  return resultados;
}

function filtrarItens(items, { id, category }) {
  let filtrados = items;
  if (id) filtrados = filtrados.filter((it) => it.id === id);
  if (category) filtrados = filtrados.filter((it) => (it.category || '') === category);
  return filtrados;
}

async function salvarRelatorio(resultados) {
  await mkdir(TMP_DIR, { recursive: true });
  const relatorio = {
    executadoEm: new Date().toISOString(),
    total: resultados.length,
    gerados: resultados.filter((r) => r.status === 'gerado').length,
    pulados: resultados.filter((r) => r.status === 'pulado').length,
    falhas: resultados.filter((r) => r.status === 'falhou').length,
    itens: resultados,
  };
  await writeFile(REPORT_PATH, JSON.stringify(relatorio, null, 2));
  return relatorio;
}

// -------------------------------------------------------------- comandos ----
async function cmdValidate() {
  const data = await loadManifest();
  const erros = validateManifest(data);
  console.log('== STIKDEAD audio: validate ==');
  console.log(`itens no manifesto: ${data.items.length}`);
  if (erros.length) {
    console.log(`FALHA: ${erros.length} problema(s):`);
    erros.forEach((e) => console.log(`  - ${e}`));
    process.exitCode = 1;
    return;
  }
  console.log('OK: manifesto válido.');
  const porCategoria = {};
  data.items.forEach((it) => {
    const c = it.category || '(sem categoria)';
    porCategoria[c] = (porCategoria[c] || 0) + 1;
  });
  console.log('por categoria:', porCategoria);
  const existentes = data.items.filter((it) => existsSync(path.join(ROOT, it.output))).length;
  console.log(`arquivos já gerados: ${existentes}/${data.items.length}`);
  const chamadasEstimadas = data.items.reduce((soma, it) => soma + (it.candidates || 1), 0);
  console.log(`chamadas estimadas se gerar tudo do zero (soma de "candidates"): ${chamadasEstimadas}`);
}

async function cmdGenerate(args) {
  const data = await loadManifest();
  const erros = validateManifest(data);
  if (erros.length) {
    console.log('FALHA: manifesto inválido, rode "npm run audio:validate" primeiro.');
    erros.forEach((e) => console.log(`  - ${e}`));
    process.exitCode = 1;
    return;
  }
  if (!args.dryRun && !hasKey()) {
    console.log('FALHA: ELEVENLABS_API_KEY ausente no ambiente (server/.env do VPS).');
    process.exitCode = 1;
    return;
  }
  const itens = filtrarItens(data.items, args);
  if (!itens.length) {
    console.log('Nenhum item corresponde ao filtro (--id/--category).');
    return;
  }
  console.log('== STIKDEAD audio: generate ==');
  console.log(
    `itens selecionados: ${itens.length}` +
    `${args.force ? ' (--force: regera mesmo o que já existe)' : ''}` +
    `${args.dryRun ? ' (--dry-run: nada será gerado nem chamado)' : ''}`
  );
  const resultados = await executarComConcorrencia(itens, (it) => processarItem(it, args), 2);
  if (args.dryRun) {
    console.log('\n(--dry-run: nenhuma chamada à API foi feita, nenhum arquivo foi escrito.)');
    return;
  }
  const relatorio = await salvarRelatorio(resultados);
  console.log(`\nresumo: ${relatorio.gerados} gerado(s), ${relatorio.pulados} pulado(s), ${relatorio.falhas} falha(s).`);
  console.log('relatório salvo em tmp/audio/report.json');
  if (relatorio.falhas) process.exitCode = 1;
}

async function cmdReport() {
  const data = await loadManifest();
  const total = data.items.length;
  const existentes = data.items.filter((it) => existsSync(path.join(ROOT, it.output)));
  const faltando = data.items.filter((it) => !existsSync(path.join(ROOT, it.output)));
  console.log('== STIKDEAD audio: report ==');
  console.log(`manifesto: ${total} item(ns) — ${existentes.length} gerado(s) / ${faltando.length} faltando`);
  if (faltando.length) {
    console.log('faltando:');
    faltando.forEach((it) => console.log(`  - ${it.id} (${it.category || '?'}) → ${it.output}`));
  }
  if (existsSync(REPORT_PATH)) {
    const ultimo = JSON.parse(await readFile(REPORT_PATH, 'utf8'));
    console.log(`\núltima execução de generate: ${ultimo.executadoEm}`);
    console.log(`  gerados ${ultimo.gerados} · pulados ${ultimo.pulados} · falhas ${ultimo.falhas}`);
    const falhas = ultimo.itens.filter((r) => r.status === 'falhou');
    if (falhas.length) {
      console.log('  falhas da última execução:');
      falhas.forEach((f) => console.log(`    - ${f.id}: ${f.erro}`));
    }
  } else {
    console.log('\n(nenhuma execução de generate ainda — tmp/audio/report.json não existe.)');
  }
}

// ------------------------------------------------------------------ main ----
const [, , comando, ...resto] = process.argv;
const args = parseArgs(resto);

if (comando === 'validate') await cmdValidate();
else if (comando === 'generate') await cmdGenerate(args);
else if (comando === 'report') await cmdReport();
else {
  console.log('Uso: node scripts/audio/generate-audio.js <validate|generate|report> [--id X] [--category Y] [--force] [--dry-run]');
  process.exitCode = 1;
}
