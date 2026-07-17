# STIKDEAD — Catálogo de Assets de Áudio

*Fase 3 · referência viva do que existe, o que está planejado e onde cada arquivo mora. Atualizar sempre que o manifesto (`audio-manifest.json`) ou a estrutura de pastas mudar.*

## Estrutura de pastas oficial

Ver seção 11 de `STIKDEAD_SOUND_BIBLE.md` para a árvore completa. Resumo dos subdiretórios usados pelo lote atual:

- `client/public/audio/ui/{buttons,errors,modal,notifications,navigation}/`
- `client/public/audio/styles/{ronin,shinobi,monk,berserker,reaper}/`
- `client/public/audio/bots/{easy,medium,hard,insane}/`
- `client/public/audio/rewards/` (flat, sem subpasta)
- `client/public/audio/music/`, `client/public/audio/ambience/`, `client/public/audio/combat/`, `client/public/audio/voice/` — ainda vazios, reservados para fases futuras.

## Convenção de nomes

`<categoria>_<contexto>_<variação>_<sequência>.mp3` — ver seção 12 da bíblia sonora. Efeitos pontuais usam `_01`, `_02`...; música/ambiente usam `_v01`, `_v02`...

## Lote atual — "primeiro lote de prova" (Fase 4, 20 itens)

Fonte de verdade: `audio-manifest.json` (raiz do repo). Tabela abaixo é um espelho legível para revisão — **nenhum destes arquivos existe ainda**; todos aguardam aprovação explícita da Fase 4 para gerar.

| id | tipo | candidatas | duração alvo | caminho final |
|---|---|---|---|---|
| ui_hover_soft_01 | sound-effect | 1 | 0.35s | `client/public/audio/ui/buttons/ui_hover_soft_01.mp3` |
| ui_hover_soft_02 | sound-effect | 1 | 0.35s | `client/public/audio/ui/buttons/ui_hover_soft_02.mp3` |
| ui_click_primary_01 | sound-effect | 3 | 0.35s | `client/public/audio/ui/buttons/ui_click_primary_01.mp3` |
| ui_click_secondary_01 | sound-effect | 1 | 0.30s | `client/public/audio/ui/buttons/ui_click_secondary_01.mp3` |
| ui_confirm_01 | sound-effect | 3 | 0.60s | `client/public/audio/ui/buttons/ui_confirm_01.mp3` |
| ui_cancel_01 | sound-effect | 1 | 0.45s | `client/public/audio/ui/buttons/ui_cancel_01.mp3` |
| ui_error_01 | sound-effect | 1 | 0.50s | `client/public/audio/ui/errors/ui_error_01.mp3` |
| ui_panel_open_01 | sound-effect | 1 | 0.55s | `client/public/audio/ui/modal/ui_panel_open_01.mp3` |
| ui_panel_close_01 | sound-effect | 1 | 0.45s | `client/public/audio/ui/modal/ui_panel_close_01.mp3` |
| style_ronin_select_01 | sound-effect | 3 | 1.0s | `client/public/audio/styles/ronin/style_ronin_select_01.mp3` |
| style_shinobi_select_01 | sound-effect | 3 | 1.0s | `client/public/audio/styles/shinobi/style_shinobi_select_01.mp3` |
| style_monk_select_01 | sound-effect | 3 | 1.1s | `client/public/audio/styles/monk/style_monk_select_01.mp3` |
| bot_easy_select_01 | sound-effect | 1 | 0.6s | `client/public/audio/bots/easy/bot_easy_select_01.mp3` |
| bot_medium_select_01 | sound-effect | 1 | 0.7s | `client/public/audio/bots/medium/bot_medium_select_01.mp3` |
| bot_hard_select_01 | sound-effect | 1 | 0.9s | `client/public/audio/bots/hard/bot_hard_select_01.mp3` |
| bot_insane_select_01 | sound-effect | 3 | 1.5s | `client/public/audio/bots/insane/bot_insane_select_01.mp3` |
| reward_coin_01 | sound-effect | 1 | 0.5s | `client/public/audio/rewards/reward_coin_01.mp3` |
| reward_diamond_01 | sound-effect | 1 | 0.6s | `client/public/audio/rewards/reward_diamond_01.mp3` |
| reward_achievement_01 | sound-effect | 3 | 1.5s | `client/public/audio/rewards/reward_achievement_01.mp3` |
| matchmaking_found_01 | sound-effect | 3 | 1.0s | `client/public/audio/ui/notifications/matchmaking_found_01.mp3` |

**Total do lote**: 20 arquivos finais, 36 chamadas de API estimadas (somando `candidates`), ~2–4MB estimados (ver `AUDIO_AUDIT.md` seção 6).

Rodar `npm run audio:report` a qualquer momento (dentro de `server/`) mostra o estado real (gerado/faltando) direto do disco.

## O que falta mapear (fases futuras)

Cobertura ainda **não** representada em nenhum manifesto — cada fase abaixo precisa do seu próprio lote em `audio-manifest.json` antes de gerar (nunca em massa, por regra #10 do prompt mestre):

| Fase | Conteúdo | Pastas envolvidas |
|---|---|---|
| 6/7 — UI restante do Lobby | ~15–20 efeitos: navegação da header, troca de aba, paginação, notificações, chat | `ui/navigation/`, `ui/notifications/` |
| 6 — Berserker e Ceifador | 2 sons de seleção de estilo restantes | `styles/berserker/`, `styles/reaper/` |
| 8 — Música do lobby | 3 candidatas instrumentais (Eleven Music, se o plano permitir) | `music/lobby/` |
| 9 — Ambiente do lobby | ~10 camadas (vento, brasas, lanternas, passos, espadas de treino, gongo, corvo, multidão, tecido) | `ambience/lobby/` |
| 10 — Narrador | 3 amostras de voz + ~11 falas aprovadas (lista na bíblia seção 9) | `voice/` |
| 11+ — Home/Perfil/Inventário/Loja/Ranking/Matchmaking/Resultados | 6–10 faixas de música por tela + efeitos de gameplay (combate/habilidades) | `music/{home,profile,inventory,shop,ranking,matchmaking,results}/`, `combat/` |

Estimativa de peso final da biblioteca completa: **~60–95MB** (ver `AUDIO_AUDIT.md`).
