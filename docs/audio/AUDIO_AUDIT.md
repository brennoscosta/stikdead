# STIKDEAD — Auditoria de Áudio (Fase 0)

Data: 2026-07-17 · Escopo: leitura completa do repositório, sem alterações de comportamento.

## 1. Arquitetura atual

### Stack
| Camada | Tecnologia | Versão | Observação |
|---|---|---|---|
| Cliente | React | 18.3.1 | SPA, **JavaScript puro (SEM TypeScript)** |
| Bundler | Vite | 6.0.5 | `@vitejs/plugin-react`; sem plugin de áudio |
| Rotas | react-router-dom | 6.28.0 | `BrowserRouter` em `client/src/App.jsx` |
| Jogo | PixiJS | 8.19.0 | renderização da luta e da praça do lobby |
| Realtime | socket.io-client / socket.io | 4.8.x | PvP, chat, presença |
| Servidor | Express | 4.21.2 | ESM (`"type":"module"`), Node puro (sem TS, sem build) |
| Banco | PostgreSQL (pg 8.13.1) | — | migrações SQL numeradas em `server/migrations/` (40 arquivos) via `npm run migrate` |
| Deploy | VPS Ubuntu + Nginx + PM2 | — | app `stikdead`; Nginx serve `client/dist` (estático) e faz proxy da API/socket |

**Implicação para a ElevenLabs**: os módulos do serviço devem ser **`.js` ESM** (não `.ts` como sugere o esqueleto da especificação — o projeto não tem TypeScript nem etapa de build no servidor). A CLI administrativa também deve ser Node/ESM puro.

### Fluxo de assets estáticos
`client/public/**` → copiado pelo Vite para `client/dist/**` no build → servido pelo Nginx com o domínio do jogo. Não há `express.static` no servidor Node (API pura). Hoje `client/public` tem **56 MB** (itens 38 MB, arenas 12 MB, arte/patentes/sprites o resto) e os binários **são versionados no git** — o padrão do projeto é commitar assets. `client/public/audio/**` seguirá o mesmo fluxo sem nenhuma configuração nova.

### Sistema de áudio existente (importante: já há uma fundação)
O jogo **não tem nenhum arquivo de áudio**. Todo o som é **100% sintetizado em tempo real com WebAudio**:

| Arquivo | Papel |
|---|---|
| `client/src/game/audioManager.js` | **Mesa de som central** (novo, 2026-07-17). Um `AudioContext`; barramentos `master → destination` e `music / sfx / ambience → master`; trims internos por canal; setters (`setMasterEnabled/Volume`, `setMusicEnabled/Volume`, `setSfxEnabled/Volume`, `setAmbienceEnabled/Volume`, `setMuteOnBlur`); mudo em segundo plano (visibilitychange/blur/focus com ramps); persistência (ver §Persistência); espia de QA `window.__sdAudio` |
| `client/src/game/audio.js` | Motor de SFX procedural (thump/noise/tone) com ~18 efeitos (`sfx.punch/heavy/block/ko/click/drop/victory/defeat/dark/skill/…`) e `playEvent()` que roteia eventos da simulação de luta. Sai pelo canal `sfx` do manager |
| `client/src/game/music.js` | Trilha procedural dos menus (drone + sinos pentatônicos + taiko), singleton `startMusic/stopMusic`, canal `music` |
| `client/src/game/ambience.js` | Ambiente procedural (vento contínuo + brasas + eventos raros: sino, corvo, aço, treino), singleton, canal `ambience`, `previewAmbience()` |
| `client/src/App.jsx` → `<AudioMood />` | Liga música+ambiente nos menus e desliga em `/`, auth, `/treino`, `/vitrine`, `/calibrador`; retry no 1º gesto (autoplay policy) |

Não existe `new Audio()`, `<audio>`, Howler ou qualquer biblioteca de áudio em lugar nenhum — **zero pontos espalhados a migrar**, todo consumidor passa pelo módulo `sfx`.

### “Seu Estilo de Luta” — a referência de qualidade
Local: `client/src/pages/Profile.jsx`, seção SUA BUILD (`.estilo-grid`, cards `.estilo-card`). Sequência sonora/visual ao equipar:
1. clique no card → `unlockAudio()` + `sfx.click()` (foco);
2. animação `.equipando` no card clicado (~480 ms, `Promise.all` com o `PATCH /api/auth/me {style}`);
3. só então o card sobe para a 1ª posição (scroll resetado a 0 no mesmo frame) e toca `sfx.drop()` (confirmação de equipado).

Padrão a replicar: **som de foco → ação → som de confirmação**, com o som amarrado ao momento da animação, nunca solto. A Fase 4 deve mapear `style_*_select/equip` exatamente nesses dois pontos.

### Pontos de som atuais (call sites de `sfx.*`)
- `Profile.jsx`: click (avatar, estilo), drop (equipar estilo)
- `Inventory.jsx`: click/drop (equipar item)
- `Lobby.jsx`: click (dificuldade bot), dash (iniciar), drop (recompensa streak), victory/defeat (fim de partida via `playEvent`)
- `Battle.jsx`: click (seleção), `playEvent` (luta inteira: socos, bloqueios, KO, skills)
- `AvatarPicker.jsx`: drop (trocar avatar)
- `PatentToast.jsx`: drop+victory (conquista desbloqueada)
- `SettingsModal.jsx`: click (preview de volume), drop (testar efeito)
- `Login.jsx`: dark (drone de entrada)

### Configurações e persistência
- **Tela**: `client/src/lib/SettingsModal.jsx` — seções GRÁFICOS (Qualidade máxima, `localStorage stik_quality`), ÁUDIO (switches+sliders dos 4 canais, testar efeito/ambiente, Silenciar em segundo plano), CONTROLES (teclas de combate, `client/src/game/keybinds.js`, `localStorage`). Acesso pela engrenagem `.topnav-cfg` na barra superior (todas as telas) e pelo gear do hero do Perfil. ESC fecha; animações de entrada/saída; responsivo ≤560 px.
- **Persistência de áudio por usuário**: `localStorage stikdead:audio` (aplicado ANTES do primeiro som) + backend `profiles.audio_settings JSONB` via `PATCH /api/auth/me {audioSettings}` (sanitização campo a campo com clamp 0..1 em `server/src/auth.js`; coluna criada por ALTER idempotente no boot em `server/src/index.js`). No login o backend vence o localStorage (aplicado 1× por sessão).

### Navegação entre telas
SPA com rotas: `/perfil` (Home do jogador), `/lobby`, `/inventario`, `/loja`, `/missoes`, `/rankings`, `/atividades`, `/carreira`, `/social(/amigos|/cla)`, `/partidas`, `/treino` (luta), `/` (login). Matchmaking acontece DENTRO do `/lobby` (botão BUSCAR PARTIDA → estado de busca → navega para a luta). Vitória/derrota são overlays dentro de `/treino` (não são rotas). `<AudioMood />` e `ATMO_POR_TELA` (atmosfera visual) já fazem mapeamento por rota — o mapa de trilha por tela da Bíblia Sonora pode seguir o mesmo padrão.

### Servidor e segredos
`server/src/index.js` carrega `dotenv/config`; `.env` está no `.gitignore` da raiz; existe `server/.env.example` (PORT, DATABASE_URL, JWT_SECRET, GOOGLE_CLIENT_ID, CORS_ORIGIN) — **`ELEVENLABS_API_KEY=` deve ser adicionada aí** e configurada no `.env` do VPS. Nenhuma variável `VITE_*` sensível existe hoje (apenas `VITE_API_URL` opcional, não sensível).

## 2. Sons existentes (inventário)
Sintetizados (WebAudio, sem arquivos): `punch, heavy, block, hurt, dash, ko, firstblood, round, dark, victory, defeat, drop, click, skill, skillHeavy` + trilha procedural de menu + ambiente procedural (vento, brasas, sino, corvo, aço, treino). **Arquivos de áudio: 0.** Diretório `client/public/audio/`: não existe.

## 3. Problemas encontrados
1. **UI SFX e Gameplay SFX compartilham o canal `sfx`** — a Bíblia pede canais preparados para separação (ui / gameplay) e não existe canal `voice`. O manager precisa ganhar `ui`, `gameplay` e `voice` (com `sfx` como alias de compatibilidade durante a migração).
2. **Paleta de UI pequena**: `click` e `drop` cobrem quase tudo (hover, confirmar, cancelar, erro, abrir/fechar painel não têm sons próprios — alguns nem existem).
3. **Sem infraestrutura de arquivos**: nenhum loader/preload/cache/pool para assets; será construído na Fase 5 (o manager atual toca apenas síntese).
4. **Volumes iniciais divergem da Bíblia**: hoje music 65% / ambience 45% / sfx 80% / master 80%; a Bíblia pede music 55% / ambience 30% / UI 65% / gameplay 80% / voice 75%. Ajustar defaults quando os canais forem separados (preservando preferências já salvas).
5. **Sem cooldown de hover** (hoje não há som de hover; ao introduzir, aplicar 60–100 ms de cooldown desde o início).
6. **`client/dist` duplica os assets no disco do VPS** (build copia `public/` inteiro). 56 MB hoje; áudio adicionará ~10–20 MB. Sem risco imediato, mas monitorar o disco.
7. **Especificação sugere `.ts`** — incompatível com o projeto (JS/ESM puro, sem build no servidor). Adaptar para `.js`.

## 4. Riscos
| Risco | Mitigação |
|---|---|
| Vazamento da API key | Chave SÓ em `server/.env` (VPS) e no ambiente do script admin; nunca em `VITE_*`, nunca commitada; funções nunca logam a chave |
| Custo de créditos ElevenLabs | CLI com manifesto + `--force` para regenerar + lote de prova de 20 antes de qualquer volume; aprovação humana por lote |
| Autoplay bloqueado | Já resolvido no manager (retry no 1º gesto); manter para arquivos |
| Loops duplicados ao navegar | Padrão singleton já usado (music/ambience procedurais); manter para os players de arquivo |
| Regressão nas telas atuais | `sfx` continua como alias; teclas/qualidade intocadas; migração componente a componente |
| Peso no primeiro carregamento | Preload seletivo (UI essencial primeiro), música por demanda com crossfade; WebM/Opus + MP3 fallback |
| Um jogador dispara geração na API | Impossível por construção: geração só via CLI administrativa no servidor/local; o jogo consome arquivos estáticos |

## 5. Plano preciso da Fase 1 (Configuração segura da ElevenLabs)
1. `server/.env.example` → adicionar `ELEVENLABS_API_KEY=` (documentada, vazia).
2. Criar `server/src/services/elevenlabs/` **em JS ESM**: `config.js` (lê `process.env.ELEVENLABS_API_KEY`, nunca loga), `client.js` (fetch com header `xi-api-key`, timeout, tratamento de rate limit 429 com backoff, erros amigáveis), `soundEffects.js` (`POST /v1/sound-generation`), `music.js` (stub que detecta indisponibilidade do plano e reporta, sem improvisar), `speech.js` (`POST /v1/text-to-speech/{voiceId}`), `types.js` (JSDoc dos formatos).
3. Diagnóstico: `node server/scripts/audio-doctor.js` — verifica presença da chave, chama `GET /v1/user` (custo zero) e reporta plano/limites SEM imprimir a chave; **não exposto como rota pública** (script local no VPS, não endpoint).
4. `.gitignore`: já cobre `.env`; adicionar `tmp/audio/` (arquivos temporários de geração).
5. SDK oficial: **não instalar** — o servidor é fetch-friendly e o SDK (TS-first) não traz benefício que justifique a dependência; decisão registrada.
6. Pedir ao Brenno: colar a chave no `.env` do VPS (via terminal Hostinger, `nano server/.env`), nunca no chat/git. Depois rodo o doctor para validar.
7. Nenhum áudio gerado nesta fase.

## 6. Estimativa de assets por fase
| Fase | Conteúdo | Qtde de gerações (com candidatas) | Peso estimado |
|---|---|---|---|
| 4 — Lote de prova | 20 efeitos de UI/estilos/bots/recompensas (até 3 candidatas nos críticos) | ~30–40 chamadas SFX | ~2–4 MB |
| 7 — Lobby completo | +15–20 efeitos de UI restantes | ~25 chamadas | ~2 MB |
| 8 — Música do lobby | 3 candidatas de 120–180 s (Eleven Music, se o plano permitir) | 3 chamadas music | ~15–25 MB (antes da edição) |
| 9 — Ambiente | ~10 camadas de loop + eventos | ~15–20 chamadas | ~8–12 MB |
| 10 — Narrador | 3 amostras de voz + ~11 falas aprovadas | ~14 chamadas TTS | ~2 MB |
| 11+ — Demais telas | música home/perfil/loja/ranking/matchmaking/resultados | 6–10 faixas | ~30–50 MB |

Total estimado da biblioteca final: **~60–95 MB** em `client/public/audio/` (entregue em Opus/MP3; fontes WAV ficam fora do git, em `tmp/audio/`).
