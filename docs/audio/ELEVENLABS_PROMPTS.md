# STIKDEAD — Diretrizes e prompts para a ElevenLabs (Sound Effects)

*Fase 3 · documenta como escrever prompts para a API de Sound Effects da ElevenLabs e revisa, para aprovação, os 20 prompts já escritos no `audio-manifest.json` (lote de prova da Fase 4). Nenhum destes prompts foi enviado à API ainda.*

## Regras obrigatórias por prompt (Fase 4 do prompt mestre)

Todo prompt de efeito sonoro precisa especificar, quando fizer sentido para o som:

- **duração** — curto e preciso (a API aceita `duration_seconds` explícito; usamos isso no manifesto, não só texto);
- **ataque e decay** — como o som começa (seco/instantâneo vs. crescente) e como termina (corte seco vs. cauda);
- **material** — madeira, metal, tecido, papel, pedra, cristal, etc.;
- **intensidade** — sutil/discreto vs. impactante/cinematográfico;
- **ausência de fala** — nenhum efeito de UI deve conter voz;
- **ausência de música** — efeitos pontuais não devem soar como trecho musical;
- **uso** — deixar claro que é para interface/seleção de jogo, não para trilha;
- **estética** — reforçar "oriental dark fantasy RPG" em todo prompt, para manter consistência de timbre entre os 20 itens;
- **clareza em volume baixo** — o efeito precisa ser identificável mesmo tocando baixo (muitos jogadores jogam com volume reduzido).

Parâmetro `prompt_influence` (0–1, no `server/src/services/elevenlabs/soundEffects.js`): usamos o default `0.3`, que dá à IA liberdade para interpretar o texto sem ficar presa demais a cada palavra — ajustável por item se um resultado vier destoante.

## Revisão dos 20 prompts do lote de prova

Fonte de verdade: `audio-manifest.json`. Copiados aqui só para leitura/aprovação — editar sempre no manifesto, nunca só aqui.

### UI (9)

| id | prompt |
|---|---|
| ui_hover_soft_01 | Extremely soft and short UI hover tick, delicate wood block tap with faint paper rustle, subtle oriental dark fantasy menu sound, no reverb tail, very low volume, under half a second. |
| ui_hover_soft_02 | Alternate soft UI hover tick, gentle bamboo click with a hint of temple bell shimmer, oriental dark fantasy menu, minimal and short, under half a second. |
| ui_click_primary_01 | Confident primary UI button click, wooden hanko stamp hitting paper with a light metallic accent, oriental dark fantasy RPG menu, short and punchy, no long reverb. |
| ui_click_secondary_01 | Secondary UI button click, softer wooden tap than the primary click, oriental dark fantasy menu, short, subtle, low volume. |
| ui_confirm_01 | Positive UI confirmation sound, a small temple bell chime rising in pitch with light shimmer, oriental dark fantasy RPG, warm and short, under one second. |
| ui_cancel_01 | UI cancel or back sound, a short low wooden thud with a soft downward tone, oriental dark fantasy menu, brief and neutral, not harsh. |
| ui_error_01 | UI error or invalid action sound, a dull cracked wood knock with a dissonant low buzz, oriental dark fantasy RPG, short, clearly negative but not jarring. |
| ui_panel_open_01 | UI panel opening sound, sliding paper shoji screen with a soft whoosh and faint wood creak, oriental dark fantasy RPG, smooth, around half a second. |
| ui_panel_close_01 | UI panel closing sound, mirror of a paper shoji screen slide but reversed and slightly shorter, oriental dark fantasy RPG, soft thud at the end. |

### Estilos de luta (3)

| id | prompt |
|---|---|
| style_ronin_select_01 | Fighting style selection sound for a Ronin swordsman, a single sharp katana unsheathing (iaido draw) with a metallic ring, oriental dark fantasy RPG, confident and sharp, around one second. |
| style_shinobi_select_01 | Fighting style selection sound for a Shinobi assassin, a quick fabric whip and soft metallic kunai chime, oriental dark fantasy RPG, fast and stealthy, around one second. |
| style_monk_select_01 | Fighting style selection sound for a Monk fighter, a deep temple bell strike layered with a soft breath and wooden prayer beads clack, oriental dark fantasy RPG, calm and powerful, around one second. |

### Bots (4)

| id | prompt |
|---|---|
| bot_easy_select_01 | Selection sound for an easy difficulty opponent, light and playful wooden xylophone-like tap, oriental dark fantasy RPG, friendly and short. |
| bot_medium_select_01 | Selection sound for a medium difficulty opponent, a firmer taiko drum hit with a short metallic edge, oriental dark fantasy RPG, moderate weight. |
| bot_hard_select_01 | Selection sound for a hard difficulty opponent, a low taiko drum hit layered with a subtle demonic growl undertone, oriental dark fantasy RPG, ominous and heavy. |
| bot_insane_select_01 | Selection sound for the insane boss-tier opponent, a deep resonant gong strike layered with a menacing low growl and distant thunder rumble, oriental dark fantasy RPG, intense and threatening, around one and a half seconds. |

### Recompensas (3)

| id | prompt |
|---|---|
| reward_coin_01 | Reward pickup sound for a coin, a bright short metallic clink with a light chime, oriental dark fantasy RPG, crisp and satisfying, under one second. |
| reward_diamond_01 | Reward pickup sound for a diamond gem, a sharp crystalline sparkle with a higher pitched shimmer than a coin sound, oriental dark fantasy RPG, premium feel, under one second. |
| reward_achievement_01 | Achievement unlocked fanfare, a short triumphant sequence of temple bells and a soft gong swell, oriental dark fantasy RPG, grand but brief, around one and a half seconds. |

### Matchmaking (1)

| id | prompt |
|---|---|
| matchmaking_found_01 | Match found notification sound, a rising tension riser resolving into a sharp bell hit, oriental dark fantasy RPG, alerting but not jarring, around one second. |

## Itens marcados para 3 candidatas (`candidates: 3`)

Critério usado: sons "críticos" — tocam com muita frequência (`ui_click_primary_01`, `ui_confirm_01`) ou definem identidade (os 3 estilos, o bot insano, a conquista, o matchmaking). Os outros 12 itens ficam com 1 candidata por serem efeitos menores/menos expostos. Isso soma **36 chamadas** para o lote inteiro — ajustável antes de rodar `npm run audio:generate` se o Brenno quiser mais ou menos candidatas em algum item.

## Fluxo de aprovação (Fase 4)

1. Brenno revisa/ajusta prompts aqui ou direto no `audio-manifest.json`.
2. Rodar `npm run audio:generate -- --dry-run` para confirmar o que vai ser chamado (zero custo).
3. Aprovação explícita → `npm run audio:generate` (ou por `--id`/`--category` para ir aos poucos). Isso **nunca** escreve no catálogo final — só gera candidatas em `client/public/audio-review/<id>/`.
4. Depois de `npm run build` no client e deploy, as candidatas ficam ouvíveis em `/audio-review/` (página interna, não linkada no jogo, `noindex`). Brenno ouve e decide, item por item: aprovado (e qual candidata) / rejeitado / regenerar.
5. Pra cada decisão: `npm run audio:approve -- --id <id> --candidate <n>` promove a candidata escolhida pro caminho final do manifesto; `npm run audio:reject -- --id <id>` marca como rejeitado (regenerar depois com `generate -- --id <id> --force`).
6. Depois que todo o lote estiver decidido, `npm run audio:review-clean` apaga `client/public/audio-review/` inteira antes do próximo build de produção, pra não carregar candidatas descartáveis pro jogo real.

Detalhes de implementação da ferramenta em `AUDIO_IMPLEMENTATION.md`.
