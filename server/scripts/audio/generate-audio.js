// STIKDEAD :: CLI administrativa de geração de áudio (ElevenLabs) — Fase 4.
// Roda SÓ manual, no VPS, dentro de server/. Nunca é exposta como rota HTTP.
//
// Uso (a partir de server/):
//   npm run audio:validate                              valida o manifesto, custo zero
//   npm run audio:generate                               gera CANDIDATAS pro que falta (pula o que já foi aprovado)
//   npm run audio:generate -- --id ui_confirm_01          gera candidatas só de 1 item específico
//   npm run audio:generate -- --category ui               gera candidatas só de uma categoria
//   npm run audio:generate -- --force                     regenera candidatas mesmo do que já foi aprovado
//   npm run audio:generate -- --dry-run                    simula (mostra o que geraria, 0 chamadas)
//   npm run audio:approve -- --id X --candidate N          promove a candidata N de X pro catálogo final
//   npm run audio:reject -- --id X                         marca X como rejeitado (rode generate --force depois)
//   npm run audio:review-clean                             apaga client/public/audio-review/ (limpeza pós-aprovação)
//   npm run audio:report                                   status do manifesto + revisão + última execução
//
// Regras (Bíblia Sonora / prompt mestre):
// - Cada execução é manual — o script nunca dispara sozinho nem em loop.
// - Nunca imprime a chave (só usa via services/elevenlabs, que já mascara em outro lugar).
// - Concorrência limitada (2 chamadas simultâneas) pra não estourar rate limit.
// - NADA é integrado automaticamente ao catálogo final (client/public/audio/...). "generate" só
//   produz CANDIDATAS em client/public/audio-review/ (fora do catálogo, fora do jogo). Só
//   "audio:approve" (decisão humana, um item de cada vez) copia uma candidata pro destino final.
// - Um item com "candidates" > 1 (sons críticos) gera até 3 candidatas pra comparação/audição.
// - --dry-run e --validate NUNCA chamam a API (zero créditos).
import 'dotenv/config';
import { readFile, writeFile, mkdir, rename, rm, copyFile } from 'node:fs/promises';
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
const STATE_PATH = path.join(TMP_DIR, 'candidates-state.json');
const REVIEW_DIR = path.join(ROOT, 'client', 'public', 'audio-review');
const REVIEW_INDEX_PATH = path.join(REVIEW_DIR, 'index.html');

const MIN_BYTES = 512; // abaixo disso o buffer é considerado inválido/corrompido — nada é salvo
const MAX_CANDIDATES = 3; // teto do prompt mestre pra sons críticos

// ---------------------------------------------------------------- args ----
function parseArgs(argv) {
  const args = { force: false, id: null, category: null, dryRun: false, candidate: null };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--force') args.force = true;
    else if (a === '--dry-run') args.dryRun = true;
    else if (a === '--id') args.id = argv[++i];
    else if (a === '--category') args.category = argv[++i];
    else if (a === '--candidate') args.candidate = Number(argv[++i]);
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
    if (item.candidates && (item.candidates < 1 || item.candidates > MAX_CANDIDATES)) {
      erros.push(`${onde}: "candidates" deve ser entre 1 e ${MAX_CANDIDATES} (é: ${item.candidates}).`);
    }
  });
  return erros;
}

// -------------------------------------------------------------- estado ----
async function carregarEstado() {
  if (!existsSync(STATE_PATH)) return {};
  try {
    return JSON.parse(await readFile(STATE_PATH, 'utf8'));
  } catch {
    return {};
  }
}

async function salvarEstado(estado) {
  await mkdir(TMP_DIR, { recursive: true });
  await writeFile(STATE_PATH, JSON.stringify(estado, null, 2));
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

function caminhoCandidata(item, n) {
  const relDir = path.join('client', 'public', 'audio-review', item.id);
  const relFile = path.join(relDir, `${item.id}__c${n}.mp3`);
  return { relDir, relFile, absDir: path.join(ROOT, relDir), absFile: path.join(ROOT, relFile) };
}

// Gera UMA candidata (n) de UM item e escreve em client/public/audio-review/<id>/.
// NUNCA escreve no destino final do catálogo — isso só acontece em cmdApprove.
async function gerarCandidata(item, n) {
  const { absDir, absFile, relFile } = caminhoCandidata(item, n);
  await mkdir(absDir, { recursive: true });
  await mkdir(TMP_DIR, { recursive: true });
  const tmpPath = path.join(TMP_DIR, `${item.id}__c${n}.tmp.mp3`);
  try {
    const buffer = await gerarBuffer(item);
    if (!buffer || buffer.length < MIN_BYTES) {
      throw new Error(`buffer inválido (${buffer ? buffer.length : 0} bytes) — nada foi salvo.`);
    }
    await writeFile(tmpPath, buffer);
    await rename(tmpPath, absFile);
    return { n, status: 'gerado', bytes: buffer.length, path: relFile, geradoEm: new Date().toISOString() };
  } catch (err) {
    await rm(tmpPath, { force: true });
    return { n, status: 'falhou', erro: err.message };
  }
}

// ------------------------------------------------ concorrência limitada ----
async function executarComConcorrencia(tarefas, worker, limite = 2) {
  const resultados = new Array(tarefas.length);
  let cursor = 0;
  async function proximo() {
    while (cursor < tarefas.length) {
      const i = cursor++;
      resultados[i] = await worker(tarefas[i]);
    }
  }
  const trabalhadores = Array.from({ length: Math.min(limite, tarefas.length) }, proximo);
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

// -------------------------------------------------- página de audição ----
function escapeHtml(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

async function gerarPaginaRevisao(manifestData, estado) {
  await mkdir(REVIEW_DIR, { recursive: true });
  const secoes = manifestData.items.map((item) => {
    const st = estado[item.id];
    const statusTxt = !st ? 'sem candidatas geradas ainda'
      : st.status === 'aprovado' ? `✅ aprovado — candidata ${st.aprovado} promovida ao catálogo em ${st.aprovadoEm}`
      : st.status === 'rejeitado' ? `❌ rejeitado em ${st.rejeitadoEm} — rode "audio:generate -- --id ${item.id} --force" pra gerar novas candidatas`
      : '⏳ pendente de revisão';
    const candidatosHtml = (st?.candidatos || [])
      .filter((c) => c.status === 'gerado')
      .map((c) => `
        <div class="candidata">
          <div><strong>candidata ${c.n}</strong> — ${c.bytes} bytes — gerada em ${c.geradoEm}</div>
          <audio controls preload="none" src="/${c.path.replace('client/public/', '')}"></audio>
          <div class="cmd">npm run audio:approve -- --id ${item.id} --candidate ${c.n}</div>
        </div>`)
      .join('\n');
    return `
      <section class="item">
        <h2>${escapeHtml(item.id)} <span class="cat">${escapeHtml(item.category || '')}</span></h2>
        <p class="prompt">${escapeHtml(item.prompt)}</p>
        <p class="meta">duração alvo: ${item.durationSeconds ?? '—'}s · destino final: <code>${escapeHtml(item.output)}</code></p>
        <p class="status">${statusTxt}</p>
        ${candidatosHtml || '<p class="vazio">(nenhuma candidata gerada — rode "npm run audio:generate -- --id ' + escapeHtml(item.id) + '")</p>'}
      </section>`;
  }).join('\n');

  const html = `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<title>STIKDEAD — audição interna de áudio (não faz parte do jogo)</title>
<meta name="robots" content="noindex, nofollow">
<style>
  body { font-family: system-ui, sans-serif; background: #14110f; color: #e8dfce; max-width: 860px; margin: 0 auto; padding: 24px; }
  h1 { color: #c9a24b; }
  .aviso { background: #3a1c1c; border: 1px solid #7a3535; padding: 10px 14px; border-radius: 6px; margin-bottom: 24px; }
  section.item { border-top: 1px solid #3a352c; padding: 16px 0; }
  h2 { margin-bottom: 4px; }
  .cat { font-size: 12px; color: #8a8072; text-transform: uppercase; }
  .prompt { color: #b9ad96; font-size: 14px; }
  .meta { color: #7d7566; font-size: 12px; }
  .status { font-weight: bold; }
  .candidata { background: #1e1a15; border-radius: 6px; padding: 10px; margin: 8px 0; }
  .cmd { font-family: monospace; background: #0c0a08; padding: 6px 8px; border-radius: 4px; margin-top: 6px; font-size: 12px; user-select: all; }
  audio { width: 100%; margin-top: 6px; }
  .vazio { color: #7d7566; font-style: italic; }
</style>
</head>
<body>
  <h1>STIKDEAD — ferramenta de audição (uso interno)</h1>
  <div class="aviso">
    Página de uso interno da equipe, gerada automaticamente pela Fase 4. Não é linkada de nenhum lugar do jogo
    e não deve ser divulgada. Depois de aprovar/rejeitar todas as candidatas, rode
    <code>npm run audio:review-clean</code> pra apagar esta pasta inteira (client/public/audio-review/).
  </div>
  ${secoes}
</body>
</html>`;
  await writeFile(REVIEW_INDEX_PATH, html);
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
  console.log(`arquivos já aprovados no catálogo final: ${existentes}/${data.items.length}`);
  const chamadasEstimadas = data.items.reduce((soma, it) => soma + (it.candidates || 1), 0);
  console.log(`chamadas estimadas se gerar candidatas de tudo do zero (soma de "candidates"): ${chamadasEstimadas}`);
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
  const itensFiltrados = filtrarItens(data.items, args);
  if (!itensFiltrados.length) {
    console.log('Nenhum item corresponde ao filtro (--id/--category).');
    return;
  }

  // Item já aprovado no catálogo final é pulado (a menos que --force), igual antes.
  // O que muda: o resultado de "gerar" nunca vai direto pro catálogo — só pra área de revisão.
  const itensAlvo = [];
  const puladosJaAprovados = [];
  for (const item of itensFiltrados) {
    const destino = path.join(ROOT, item.output);
    if (existsSync(destino) && !args.force) {
      puladosJaAprovados.push(item.id);
      continue;
    }
    itensAlvo.push(item);
  }

  console.log('== STIKDEAD audio: generate (candidatas pra revisão) ==');
  console.log(
    `itens selecionados: ${itensFiltrados.length} · a gerar candidatas: ${itensAlvo.length} · já aprovados (pulados): ${puladosJaAprovados.length}` +
    `${args.force ? ' (--force: regera candidatas mesmo do que já foi aprovado)' : ''}` +
    `${args.dryRun ? ' (--dry-run: nada será gerado nem chamado)' : ''}`
  );
  if (puladosJaAprovados.length) console.log(`  já aprovados: ${puladosJaAprovados.join(', ')}`);

  if (!itensAlvo.length) {
    console.log('\nNada a fazer — todos os itens selecionados já foram aprovados. Use --force pra regenerar candidatas.');
    return;
  }

  const tarefas = [];
  itensAlvo.forEach((item) => {
    const n = Math.min(item.candidates || 1, MAX_CANDIDATES);
    for (let i = 1; i <= n; i++) tarefas.push({ item, n: i });
  });

  if (args.dryRun) {
    tarefas.forEach((t) => console.log(`  [simulado] ${t.item.id} — candidata ${t.n} → client/public/audio-review/${t.item.id}/`));
    console.log(`\n(--dry-run: ${tarefas.length} chamada(s) seriam feitas, 0 chamadas reais, nenhum arquivo escrito.)`);
    return;
  }

  const resultadosBrutos = await executarComConcorrencia(
    tarefas,
    async (t) => ({ id: t.item.id, ...(await gerarCandidata(t.item, t.n)) }),
    2
  );
  resultadosBrutos.forEach((r) => {
    const rotulo = r.status === 'gerado' ? `OK (${r.bytes}B)` : `FALHOU: ${r.erro}`;
    console.log(`  ${r.id} — candidata ${r.n} — ${rotulo}`);
  });

  // Junta os resultados desta rodada no estado de revisão (não mexe no que não foi tocado agora).
  const estado = await carregarEstado();
  itensAlvo.forEach((item) => {
    const candidatosDoItem = resultadosBrutos.filter((r) => r.id === item.id).map(({ id, ...rest }) => rest);
    estado[item.id] = {
      status: 'pendente',
      candidatos: candidatosDoItem,
      aprovado: null,
      atualizadoEm: new Date().toISOString(),
    };
  });
  await salvarEstado(estado);
  await gerarPaginaRevisao(data, estado);

  const totalGerado = resultadosBrutos.filter((r) => r.status === 'gerado').length;
  const totalFalhou = resultadosBrutos.filter((r) => r.status === 'falhou').length;
  const relatorio = await salvarRelatorio(
    itensAlvo.map((item) => {
      const cands = resultadosBrutos.filter((r) => r.id === item.id);
      const falhou = cands.every((c) => c.status === 'falhou');
      return { id: item.id, status: falhou ? 'falhou' : 'gerado', candidatas: cands.length };
    })
  );
  console.log(`\nresumo: ${totalGerado} candidata(s) gerada(s), ${totalFalhou} falha(s) de candidata.`);
  console.log('NADA foi integrado ao catálogo final automaticamente.');
  console.log('Ouça em client/public/audio-review/ (depois de "npm run build" + deploy, fica em /audio-review/) e rode:');
  console.log('  npm run audio:approve -- --id <id> --candidate <n>   (pra aprovar)');
  console.log('  npm run audio:reject -- --id <id>                    (pra rejeitar e regenerar depois)');
  if (totalFalhou) process.exitCode = 1;
}

async function cmdApprove(args) {
  if (!args.id || !args.candidate) {
    console.log('Uso: npm run audio:approve -- --id <id> --candidate <n>');
    process.exitCode = 1;
    return;
  }
  const data = await loadManifest();
  const item = data.items.find((it) => it.id === args.id);
  if (!item) {
    console.log(`FALHA: item "${args.id}" não existe no manifesto.`);
    process.exitCode = 1;
    return;
  }
  const estado = await carregarEstado();
  const st = estado[args.id];
  const candidata = st?.candidatos?.find((c) => c.n === args.candidate && c.status === 'gerado');
  if (!candidata) {
    console.log(`FALHA: não existe candidata ${args.candidate} gerada pra "${args.id}". Rode "npm run audio:generate -- --id ${args.id}" primeiro.`);
    process.exitCode = 1;
    return;
  }
  const origem = path.join(ROOT, candidata.path);
  const destino = path.join(ROOT, item.output);
  await mkdir(path.dirname(destino), { recursive: true });
  await copyFile(origem, destino);
  estado[args.id] = { ...st, status: 'aprovado', aprovado: args.candidate, aprovadoEm: new Date().toISOString() };
  await salvarEstado(estado);
  await gerarPaginaRevisao(data, estado);
  console.log(`OK: candidata ${args.candidate} de "${args.id}" promovida para ${item.output}.`);
}

async function cmdReject(args) {
  if (!args.id) {
    console.log('Uso: npm run audio:reject -- --id <id>');
    process.exitCode = 1;
    return;
  }
  const estado = await carregarEstado();
  if (!estado[args.id]) {
    console.log(`FALHA: nenhuma candidata registrada pra "${args.id}" ainda.`);
    process.exitCode = 1;
    return;
  }
  estado[args.id] = { ...estado[args.id], status: 'rejeitado', aprovado: null, rejeitadoEm: new Date().toISOString() };
  await salvarEstado(estado);
  const data = await loadManifest();
  await gerarPaginaRevisao(data, estado);
  console.log(`OK: "${args.id}" marcado como rejeitado. Rode "npm run audio:generate -- --id ${args.id} --force" pra gerar novas candidatas.`);
}

async function cmdReviewClean() {
  if (!existsSync(REVIEW_DIR)) {
    console.log('(client/public/audio-review/ já não existe — nada a limpar.)');
    return;
  }
  await rm(REVIEW_DIR, { recursive: true, force: true });
  console.log('OK: client/public/audio-review/ apagada. Rode "npm run build" no client/ pra tirar do próximo deploy.');
}

async function cmdReport() {
  const data = await loadManifest();
  const total = data.items.length;
  const existentes = data.items.filter((it) => existsSync(path.join(ROOT, it.output)));
  const faltando = data.items.filter((it) => !existsSync(path.join(ROOT, it.output)));
  const estado = await carregarEstado();
  console.log('== STIKDEAD audio: report ==');
  console.log(`manifesto: ${total} item(ns) — ${existentes.length} aprovado(s) no catálogo / ${faltando.length} faltando`);
  if (faltando.length) {
    console.log('faltando (ainda não aprovados):');
    faltando.forEach((it) => {
      const st = estado[it.id];
      const statusTxt = !st ? 'sem candidatas geradas' : st.status === 'rejeitado' ? 'rejeitado' : `pendente de revisão (${(st.candidatos || []).filter((c) => c.status === 'gerado').length} candidata(s))`;
      console.log(`  - ${it.id} (${it.category || '?'}) → ${it.output} — ${statusTxt}`);
    });
  }
  if (existsSync(REPORT_PATH)) {
    const ultimo = JSON.parse(await readFile(REPORT_PATH, 'utf8'));
    console.log(`\núltima execução de generate: ${ultimo.executadoEm}`);
    console.log(`  itens processados ${ultimo.total} · com candidata gerada ${ultimo.gerados} · falhas ${ultimo.falhas}`);
  } else {
    console.log('\n(nenhuma execução de generate ainda — tmp/audio/report.json não existe.)');
  }
}

// ------------------------------------------------------------------ main ----
const [, , comando, ...resto] = process.argv;
const args = parseArgs(resto);

if (comando === 'validate') await cmdValidate();
else if (comando === 'generate') await cmdGenerate(args);
else if (comando === 'approve') await cmdApprove(args);
else if (comando === 'reject') await cmdReject(args);
else if (comando === 'review-clean') await cmdReviewClean();
else if (comando === 'report') await cmdReport();
else {
  console.log('Uso: node scripts/audio/generate-audio.js <validate|generate|approve|reject|review-clean|report> [--id X] [--category Y] [--candidate N] [--force] [--dry-run]');
  process.exitCode = 1;
}
