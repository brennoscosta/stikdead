# STIKDEAD — Plano de implementação do sistema de áudio

*Fase 3 · registra o que já está no ar, o que está pendente e as decisões de arquitetura que a Fase 5 (AudioManager global) e seguintes vão precisar tomar. Nenhum código deste documento foi implementado ainda além do que já está listado como "concluído".*

## Status por fase (prompt mestre)

| Fase | Escopo | Status |
|---|---|---|
| 0 — Auditoria | `docs/audio/AUDIO_AUDIT.md` | ✅ concluída (commit `3c779a7`) |
| 1 — Config. segura ElevenLabs | `server/src/services/elevenlabs/*`, `audio-doctor.js` | ✅ concluída e validada (commit `a8f92eb`) |
| 2 — CLI administrativa | `server/scripts/audio/generate-audio.js`, `audio-manifest.json` | ✅ concluída e validada no VPS, zero créditos (commit `54c8ae1`) |
| 3 — Documentação da bíblia sonora | este documento + `STIKDEAD_SOUND_BIBLE.md` + `AUDIO_ASSET_CATALOG.md` + `ELEVENLABS_PROMPTS.md` | ✅ em andamento (este commit) |
| 4 — Primeiro lote de prova (geração real) | 20 áudios via API, **paga** | ⏳ aguardando aprovação explícita |
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

## Ferramenta de audição (pendência da Fase 4)

O prompt mestre exige "uma página ou ferramenta interna de audição, somente em desenvolvimento, para comparar candidatos e marcar: aprovado / rejeitado / regenerar" antes de qualquer candidata ser promovida a arquivo final oficial. Isso ainda não existe. Duas opções para quando a Fase 4 for aprovada:

- **Opção simples (recomendada para o lote de 20 itens)**: o `generate-audio.js` já grava as candidatas com sufixo (ex.: `ui_confirm_01.candidate1.mp3`, `.candidate2.mp3`, `.candidate3.mp3`) em `tmp/audio/candidates/`; o Brenno ouve localmente (baixando ou tocando direto no VPS) e aprova por CLI (`npm run audio:approve -- --id ui_confirm_01 --candidate 2`), que promove o arquivo escolhido pro caminho final do manifesto.
- **Opção completa**: uma rota/página `/admin/audio-review` (protegida, só em desenvolvimento) com player e botões aprovado/rejeitado/regenerar.

Recomendação: começar pela opção simples (menos código, zero risco de expor rota admin em produção) e só evoluir pra página se o volume de candidatas crescer muito nas fases seguintes.

## Riscos e decisões em aberto

- **Eleven Music (Fase 8)**: o plano `pro` deve ter acesso, mas não foi testado ainda (`composeMusic()` já trata o caso de acesso negado sem improvisar, retornando erro claro). Confirmar na hora.
- **Convivência arquivo real vs. procedural**: enquanto nem todo o catálogo tiver sido gerado, o jogo vai tocar uma mistura de sons sintetizados (telas ainda não migradas) e arquivos reais (telas já com asset aprovado) — aceitável e esperado durante a transição, mas vale registrar no changelog de cada fase pra não parecer inconsistência de qualidade.
- **Peso do bundle**: `client/public/**` é servido estático e versionado no git (56MB hoje, sem áudio). A biblioteca completa de áudio estimada (~60–95MB) mais que dobra o tamanho do repositório/deploy — sem problema técnico identificado (Nginx serve estático normalmente), mas cada deploy via patch fica proporcionalmente mais pesado; considerar excluir binários grandes do fluxo de patch textual e transferir via outro método (scp/rsync direto) quando o volume de áudio já gerado for grande.
