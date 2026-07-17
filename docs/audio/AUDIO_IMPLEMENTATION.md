# STIKDEAD — Plano de implementação do sistema de áudio

*Fase 4 · registra o que já está no ar, o que está pendente e as decisões de arquitetura que a Fase 5 (AudioManager global) e seguintes vão precisar tomar.*

## Status por fase (prompt mestre)

| Fase | Escopo | Status |
|---|---|---|
| 0 — Auditoria | `docs/audio/AUDIO_AUDIT.md` | ✅ concluída (commit `3c779a7`) |
| 1 — Config. segura ElevenLabs | `server/src/services/elevenlabs/*`, `audio-doctor.js` | ✅ concluída e validada (commit `a8f92eb`) |
| 2 — CLI administrativa | `server/scripts/audio/generate-audio.js`, `audio-manifest.json` | ✅ concluída e validada no VPS, zero créditos (commit `54c8ae1`) |
| 3 — Documentação da bíblia sonora | `STIKDEAD_SOUND_BIBLE.md` + `AUDIO_ASSET_CATALOG.md` + `ELEVENLABS_PROMPTS.md` | ✅ concluída e validada no VPS, zero créditos (commit `eab8da0`) |
| 4 — Primeiro lote de prova (geração real) | ferramenta de candidatas/audição/aprovação (zero custo) ✅ pronta e testada; geração real dos 20 áudios via API (**paga**, ~36 chamadas) | ⏳ ferramenta pronta, geração real ainda não disparada nesta sessão |
| 5 — AudioManager global | 6 canais, preload/cache/pooling/crossfade | ⏳ pendente |
| 6 — Configurações (canal Voice) | expandir seção Áudio já existente | ⏳ pendente |
| 7 — Integração no Lobby | replicar qualidade de "Seu Estilo de Luta" | ⏳ pendente |
| 8 — Música do lobby (Eleven Music) | 3 candidatas instrumentais | ⏳ pendente (confirmar acesso do plano `pro`) |
| 9+ | ambiente, narrador, demais telas | ⏳ pendente |

## O que já existe no jogo (não descartar)

O update de Configurações + Áudio (entregue antes deste plano ElevenLabs, commit `db2a7aa`) já implementa um **AudioManager procedural**, 100% sintetizado por WebAudio (zero arquivos):

- `client/src/game/audioManager.js` — 1 `AudioContext`, `masterGain` + barramentos `music`/`sfx`/`ambience`, cada um com `GainNode` próprio; `muteOnBlur` com ramp assimétrico; persistência `localStorage` + backend (`profiles.audio_settings` via `PATCH /api/auth/me`); API pública (`setMasterEnabled/Volume`, `setMusicEnabled/Volume`, `setSfxEnabled/Volume`, `setAmbienceEnabled/Volume`, `getAudioSettings`, `onAudioChange`, `applyRemoteSettings`, `getBus`).
- `client/src/game/audio.js` — motor de SFX sintetizado (punch, heavy, block, hurt, dash, ko, click, etc.), hoje roteado pelo barramento `sfx` do AudioManager.
- `client/src/game/music.js` / `client/src/game/ambience.js` — trilha de menu e ambiente do lobby, também 100% sintetizados.
- Tela de Configurações (`SettingsModal.jsx`) já tem seção ÁUDIO completa: Som geral, Volume geral, Música, Efeitos, Ambiente, Silenciar em segundo plano — **persistida por usuário**.

**Decisão de arquitetura para a Fase 5**: o AudioManager global desta bíblia (6 canais: master/music/ambience/ui/gameplay/voice) não é construído do zero — ele **evolui** o `audioManager.js` atual:

1. Separar o barramento `sfx` atual em `ui` e `gameplay` (dois `GainNode` novos, ambos ainda descendentes de `master`).
2. Adicionar o barramento `voice`.
3. Adicionar suporte a **amostras de arquivo** (os MP3s gerados pela ElevenLabs) ao lado da síntese procedural — os dois convivem: UI/estilos/bots/recompensas passam a tocar arquivo real quando disponível (com fallback pro som sintetizado atual se o arquivo ainda não existir, evitando quebrar telas que ainda não têm asset gerado).
4. Adicionar a API sugerida pelo prompt mestre (`playUi`, `playGameplay`, `playVoice`, `playMusic(id, options)`, `playAmbience(id, options)`, `stopMusic`, `stopAmbience`, `setChannelVolume(channel, value)`, `preload(ids)`) como camada por cima da API atual — sem remover os métodos existentes (`setMusicEnabled` etc. continuam usados pela tela de Configurações).
5. **Preservar 100%** as preferências e o schema `audioSettings` já persistidos no backend — qualquer campo novo (volume de `ui`/`gameplay`/`voice` separados) é aditivo, nunca substitui os campos atuais (`masterEnabled`, `masterVolume`, `musicEnabled`, `musicVolume`, `sfxEnabled`, `sfxVolume`, `ambienceEnabled`, `ambienceVolume`, `muteOnBlur`).
6. Pooling/crossfade/cooldown/limite de vozes simultâneas (regras da seção "Limites de simultaneidade" da bíblia) entram como utilitários novos dentro do próprio `audioManager.js`, reaproveitando o padrão de singleton que `music.js`/`ambience.js` já usam para não duplicar loops.

Isso significa que a Fase 4 (gerar os 20 arquivos) pode acontecer **antes** da Fase 5 sem risco: os arquivos ficam parados em `client/public/audio/` até o AudioManager evoluído saber consumi-los.

## Ferramenta de audição (implementada na Fase 4)

O prompt mestre exige "uma página ou ferramenta interna de audição, somente em desenvolvimento, para comparar candidatos e marcar: aprovado / rejeitado / regenerar" antes de qualquer candidata ser promovida a arquivo final oficial. Implementado assim:

- `npm run audio:generate` **nunca mais escreve direto no catálogo final** (`client/public/audio/...`). Ele gera `item.candidates` candidata(s) por item (até 3, pro teto do prompt mestre) e grava cada uma em `client/public/audio-review/<id>/<id>__cN.mp3`, fora do catálogo e fora do jogo.
- Um estado de revisão (`tmp/audio/candidates-state.json`, no VPS, nunca commitado) guarda por item: candidatas geradas (bytes, caminho, data), status (`pendente` / `aprovado` / `rejeitado`) e qual candidata foi aprovada.
- Uma página estática `client/public/audio-review/index.html` é (re)gerada a cada `generate`/`approve`/`reject`, com um `<audio controls>` por candidata, o status atual de cada item e o comando exato de aprovação pra copiar/colar. Não é linkada de nenhum lugar do jogo, tem `<meta name="robots" content="noindex,nofollow">`, e a pasta inteira está no `.gitignore` (nunca é commitada). Depois de `npm run build` no client, ela fica acessível em `/audio-review/` — é assim que o Brenno consegue ouvir os candidatos sem precisar baixar arquivo por arquivo ou abrir um túnel SSH.
- `npm run audio:approve -- --id X --candidate N` copia a candidata escolhida pro caminho final do manifesto (só então o arquivo entra no catálogo real). `npm run audio:reject -- --id X` marca como rejeitado sem tocar em arquivo nenhum (aí basta rodar `generate -- --id X --force` depois pra gerar candidatas novas). `npm run audio:review-clean` apaga `client/public/audio-review/` inteira depois que todas as decisões de um lote foram tomadas, pra não carregar áudio descartável nos próximos builds/deploys.
- Um item já aprovado (arquivo já existe no caminho final) é pulado automaticamente em execuções futuras de `generate`, a menos que `--force` seja passado — preserva o comportamento de cache das Fases 2/3, só que agora "existir" significa "aprovado por humano", não "gerado pela API".
- Testado localmente nesta fase com a API da ElevenLabs mockada (sem gastar créditos): candidata gerada só na área de revisão, catálogo final intocado até `approve`; `approve` promove certo; item aprovado é pulado em execução seguinte sem nenhuma chamada de rede; `reject`/`review-clean` funcionam como esperado.

## Riscos e decisões em aberto

- **Eleven Music (Fase 8)**: o plano `pro` deve ter acesso, mas não foi testado ainda (`composeMusic()` já trata o caso de acesso negado sem improvisar, retornando erro claro). Confirmar na hora.
- **Convivência arquivo real vs. procedural**: enquanto nem todo o catálogo tiver sido gerado, o jogo vai tocar uma mistura de sons sintetizados (telas ainda não migradas) e arquivos reais (telas já com asset aprovado) — aceitável e esperado durante a transição, mas vale registrar no changelog de cada fase pra não parecer inconsistência de qualidade.
- **Peso do bundle**: `client/public/**` é servido estático e versionado no git (56MB hoje, sem áudio). A biblioteca completa de áudio estimada (~60–95MB) mais que dobra o tamanho do repositório/deploy — sem problema técnico identificado (Nginx serve estático normalmente), mas cada deploy via patch fica proporcionalmente mais pesado; considerar excluir binários grandes do fluxo de patch textual e transferir via outro método (scp/rsync direto) quando o volume de áudio já gerado for grande.
