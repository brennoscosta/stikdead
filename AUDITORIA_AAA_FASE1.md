# STIKDEAD AAA REMASTER — FASE 1: AUDITORIA TÉCNICA
*Principal Game Director · 14/07/2026 · base: commit `189c3b6` (main) · produção verificada ao vivo*

---

## 0. SUMÁRIO EXECUTIVO

O StikDead tem uma **fundação técnica rara para um jogo indie web**: simulação server-authoritative, economia segura, 136+ itens, 8 arenas, clãs, missões e um rig vetorial 2.5D próprio. O problema que esta missão ataca é real e está corretamente diagnosticado: **a camada de apresentação é um site que contém um jogo, e não um jogo**.

O diagnóstico em uma frase: **o jogo dentro do canvas (luta, arenas, personagem, FX) já está a ~70% do padrão da referência; o cromo em volta dele (lobby, perfil, loja, inventário, navegação) está a ~25%.** A distância não é de tecnologia — React+CSS dá conta de 100% da referência — é de *design system, densidade, motion e direção de arte aplicada com consistência*.

O que a referência (Arquivo 01) tem e nós não temos hoje, em ordem de impacto:

1. **Densidade e hierarquia de informação** — cada tela da referência tem 3 níveis de leitura (herói → módulos → detalhes); nossas telas têm 1–2 e muito espaço morto.
2. **Presença social permanente** — jogadores online, convites, chat e clã visíveis no lobby o tempo todo; hoje isso existe mas espalhado e com cara de lista HTML.
3. **Moldura de jogo** — painéis chanfrados, bordas metálicas, texturas, cantos trabalhados; hoje 80% dos painéis são `border-radius` + cor chapada.
4. **Motion em tudo** — a referência implica hover com glow, transições entre telas, contadores animados; hoje temos 33 keyframes no theme.css mas concentrados em login/HUD, quase nada nas telas de meta-game.
5. **Cerimônia** — matchmaking, level up, novo item, vitória/derrota como *momentos* de tela cheia; hoje são modais simples.

---

## 1. ARQUITETURA & ESTRUTURA

```
client/src/
├── App.jsx (130 l) — rotas; guard por profile; rota * → redirect silencioso
├── main.jsx
├── theme.css (1.411 l)  ← "design system" de fato
├── styles.css (807 l)   ← estilos históricos por tela
├── battle.css (366 l)   ← HUD da luta
├── pages/ (19 telas)    ← Lobby 1.005 l (crítico), Battle 524 l, Profile 299 l...
├── lib/ (13 componentes) ← Navbar, ItemIcon, PlayerCard, modais...
└── game/ (18 módulos PixiJS) ← renderer, rig, arena, itemsArt, sim, praca, hero...
```

**Pontos fortes:**
- Separação clara jogo (PixiJS) × meta-game (React). O canvas é soberano na luta.
- `shared/sim.js` intocável e bem isolado — o remaster visual não encosta nele.
- Componentes de jogo já "vivos": `hero.js` (fundo animado do login com brasas/lua/parallax), `praca.js` (jogadores online passeando no lobby com builds reais) — **esses dois são a semente do lobby AAA e já existem**.
- Convenção de comentários e nomenclatura PT-BR consistente.

**Dívidas estruturais (visual-layer):**
| Problema | Evidência | Risco p/ remaster |
|---|---|---|
| `Lobby.jsx` com 1.005 linhas mistura praça, fila, apostas, desafios, chat, HUD online | 30+ classes CSS distintas no mesmo arquivo | Fase 4 exige quebrar em módulos antes de redesenhar |
| CSS em 3 arquivos com sobreposição de responsabilidade | lobby aparece em styles.css §303 E theme.css §219 | Regras duplicadas/ conflitantes; refatorar em tokens+componentes |
| Sem biblioteca de componentes | botão/painel/card re-declarados por tela | Fase 2 cria `ui/` (Panel, Button, Card, Stat, Modal, Tabs) |
| Navegação dupla (topnav desktop + bottombar mobile) com ícones **emoji** | Navbar.jsx usa ⚔️🎒🛒📜🏆 | Emoji = "site". Precisa de iconografia própria (SVG) |
| Rota `*` redireciona mudo para `/` | App.jsx:123 | 404 temático é oportunidade de identidade |

---

## 2. DESIGN SYSTEM ATUAL (theme.css)

**O que JÁ existe e está certo** (aproveitar, não jogar fora):
- Paleta canônica com nome de universo: `--blood #d90429`, `--blood-hot #ff2244`, `--void #8b5cf6`, `--gold #e0a10b`, `--ice #9fd8ff`, `--ink #0b0709`, `--bone #f2efe9` — **bate com a referência** (preto profundo + vermelho sangue + acentos dourado/roxo).
- Sombras de luz: `--glow-blood/gold/void`, `--metal-edge` (gradiente metálico), `--panel-grad`, `--depth`.
- CTA canônico `.btn-blood` com estados; cards `.card-metal`; raridades com aura (`comum/raro/epico/lendario/diamante`); "EQUIPADO = ACESO" pulsando na cor da raridade.
- 28 keyframes, 33 transitions, 40 hovers no theme.css; `prefers-reduced-motion` respeitado (4 blocos) — maturidade acima da média.

**O que FALTA para ser um design system de estúdio:**
1. **Tokens de espaçamento/tipo/z-index/raio inexistentes** — valores mágicos por toda parte (`14px`, `26px`, `0.62em`...). Precisa de escala (`--s1..s8`, `--radius-panel`, `--z-hud`...).
2. **Só 2 fontes**: Barlow Condensed (tudo) + Rubik Wet Paint (títulos sujos). A referência usa 3 vozes: display agressiva / condensada de UI / numeral tabular para stats. Falta a voz numeral (contadores, dano, moedas).
3. **Painéis são retângulos arredondados** — a referência usa chanfros (`clip-path`), filetes internos duplos, cantos com detalhe, headers de painel com faixa. Nenhum componente `Panel` padronizado existe.
4. **Iconografia**: emoji na navegação e em labels (🪙 💎 nas moedas). Zero SVGs próprios.
5. **Sem transições de rota** — troca de tela é corte seco (React Router puro).
6. **Sem contadores animados** — moedas/XP/pontos mudam por substituição de texto.
7. **Sem camada de partículas no chrome** — brasas/névoa existem só no login (hero.js). A referência tem atmosfera em TODAS as telas.

---

## 3. AUDITORIA TELA A TELA

### 3.1 Login — **nota 8/10** (a melhor tela)
`hero.js`: arte fullscreen com lua pulsando, brasas, névoa, parallax; "a arte É a tela". **Já é AAA.** Ajustes: tipografia do form (inputs de vidro ok, labels genéricas), botão Google destoa.

### 3.2 Lobby — **nota 4/10** (o coração; maior gap)
Existe: praça PixiJS com até 14 jogadores online passeando com builds reais (ativo!), chat, fila ranqueada/casual, apostas, desafios 1v1, treino.
Contra a referência (tela 01): sem coluna de jogadores online com botões DESAFIAR; sem painel de evento/torneio; sem card "SUA BUILD ATUAL" com slots; CTA "BUSCAR PARTIDA" sem destaque cerimonial; chat parece widget; tudo empilhado verticalmente com respiro demais. **A praça é nosso diferencial** (a referência não tem personagens vivos no lobby!) — o redesign deve orbitar em volta dela, não escondê-la.

### 3.3 Perfil — **nota 5/10**
Dashboard 2.0 existe (dash-cards: build favorita com preview do boneco, carreira, conquistas em strip, resumo de clã). Contra a referência (tela 02): sem "cartão de jogador" hero com pose do personagem grande; stats em texto plano (sem medidores/anéis); rank sem emblema cerimonial grande; últimas partidas como lista simples (bug conhecido: título sobrepõe o "ver todas →" em 1568px); conquistas sem raridade visual.

### 3.4 Inventário — **nota 5/10**
Grid de cards por slot com ícones AI (webp por item, fallback SVG), aura por raridade, "equipado aceso". Contra a referência (tela 03): **sem painel de detalhes do item** (stats, habilidade passiva, botão EQUIPAR grande) — hoje equipar é clique direto no card; sem filtros em tabs cerimoniais; sem contagem "84/350"; sem preview do boneco vestindo em destaque (existe preview pequeno).

### 3.5 Loja — **nota 5/10**
Filtros por slot, vitrine de diamantes própria, ofertas. Contra a referência (tela 05): sem seção DESTAQUE com cards grandes de pacote; sem "ofertas diárias" com timer regressivo; sem selos de desconto (-30%); compra sem cerimônia (confirm → toast).

### 3.6 Ranking — **nota 4/10**
Top 10 com placas e patentes. Layout com coluna desalinhada (bug conhecido). Contra a referência: sem pódio top-3 destacado, sem a "sua posição" fixa, sem ligas visuais (Diamond/Platinum com gemas).

### 3.7 Missões — **nota 4/10**
Lista com progresso e recompensas. Referência (widget no lobby): barras de progresso finas, chips de recompensa, reset diário com timer. Falta timer, falta celebração ao completar.

### 3.8 Social/Clã — **nota 5/10**
ClanHall com bandeira, membros, histórico; sistema de presentes; amigos com status. Contra a referência (tela 12): sem header cerimonial do clã (brasão grande + lema + posição no ranking), sem guerra de clãs (feature nova — fora de escopo visual), tabela de membros é tabela.

### 3.9 HUD da luta — **nota 7/10** (pós Fase 2 + combos de hoje)
Já tem: barras espelhadas, timer central em placa, VS splash, combo counter com tiers/pop/rage, ×N no mundo, dano flutuante, slow-mo de KO, shake direcional, punch-in, sangue persistente, wind-up, afterimages, arcos com aura. Contra a referência: retratos/avatares nas barras (referência tela 01/04 usa cabeças), barra de skill/ki mais cerimonial, placa de round com material metálico, announcer ("LUTE!") com tipografia display maior.

### 3.10 Cerimônias (matchmaking/level up/recompensa/novo item/vitória/derrota) — **nota 3/10** (maior ROI depois do lobby)
Referência telas 04, 07–11: cada momento é uma tela/overlay dedicada com arte, glow e motion. Hoje: matchmaking é um painel com contador; level up e drops são modais (`bt-levelup`, `bt-reward`); vitória/derrota é painel de resultado com stats. **Nenhum é ruim, todos são pequenos demais para o peso emocional que carregam.**

### 3.11 Admin — fora de escopo do remaster (interno), manter.

---

## 4. SISTEMA DE EQUIPAMENTOS (visual) — estado atual

- 136+ itens, 5 raridades com hierarquia visual já codificada (aura, glow, série diamante com brilho na silhueta via `CUR_GLOW`).
- **Hoje (189c3b6)**: lendárias ganharam alma própria (fogo/sangue/vazio/fantasma/brasa + glint) — em jogo.
- Ícones: 264 webp gerados por IA em `/public/items` (38 MB) + fallback SVG paramétrico por template. Qualidade dos webp é boa mas inconsistente entre lotes (fundos, enquadramento, iluminação variam) — a referência tela 03 mostra ícones uniformes com fundo/moldura padronizados por raridade. **Padronizar moldura via CSS (não regerar tudo): moldura + fundo radial por raridade no card.**
- Falta no meta-game: painel de detalhe do item com stats/lore (dados existem: `excellents`, raridade, slot).

## 5. SISTEMA DE ANIMAÇÕES — estado atual

- Sim: idle/walk/dash/light/heavy/kick/rasteira/hit/block/KO/vitória, hit stop, timescale de KO — **timing e weight já vivem na sim, e a instrução é não tocar**. ✔
- Camada de cinema visual: poses com anticipação/follow-through (export-poses `cinema()`), afterimages, wind-up ring — deployados.
- Gaps visuais (sem tocar na sim): reação de hit mais expressiva (flash branco no corpo do atingido — 1 frame), pose de vitória com cerimônia de câmera, entrada dos lutadores no countdown (hoje eles já estão em cena; referência sugere walk-in/pose).

## 6. RESPONSIVIDADE

- Estratégia: topnav (desktop) + bottombar (mobile, app-like) + `pointer: coarse` para toque + trava de zoom robusta no index.html. Boa base.
- **13 breakpoints diferentes** (760, 640, 980, 900, 820, 720, 700, 600, 560...) = crescimento orgânico sem grade. Fase 2 fixa 3 pontos canônicos (ex.: 1280 / 900 / 640) e migra gradualmente.
- Battle é `resizeTo: host` e funciona em paisagem; retrato pausa (correto).
- Referência tela 12 (mobile) é essencialmente o que a bottombar já faz — gap menor no mobile do que no desktop.

## 7. PERFORMANCE & RENDERIZAÇÃO

| Métrica | Valor | Veredito |
|---|---|---|
| JS total (dist) | ~1.03 MB (main 434 KB) | OK para jogo; code-split do PixiJS já ocorre |
| CSS | 96 KB | OK |
| `public/items` | **38 MB** (264 webp) | Maior peso; cache 30d ajuda, mas comprimir p/ ~50% e lazy-load fora da viewport |
| `public/arenas` | 12 MB (webp) + mp4 por arena | mp4 só carrega no modo qualidade; OK |
| Revisita | DOM ~57 ms (medido na pré-análise) | Excelente |
| Luta | 60 fps desktop; `updateFPS` do vídeo limitado a 18–24 | Saudável |

Riscos do remaster: (a) partículas/atmosfera em telas de meta-game devem ser **um** canvas Pixi compartilhado ou CSS puro — nunca um Application por widget; (b) blur/glow em excesso derruba mobile — usar `will-change` com parcimônia e testar em `pointer: coarse`; (c) contador animado via rAF, não setInterval.

## 8. RESTRIÇÕES CONFIRMADAS (o que NÃO muda)

Gameplay, combate, `shared/sim.js`, backend, network, banco, PvP, lógica de inventário/economia, salvamento. Somente camada visual (JSX/CSS/PixiJS de apresentação). Bugs de segurança da pré-análise (CORS, rate-limit, chaves) permanecem no backlog paralelo — não entram no remaster.

---

## 9. PLANO DE FASES (2→10) — escopo fechado por fase

**F2 — Design System "SANGUE & AÇO"** *(fundação; nada muda de tela ainda)*
Tokens completos (espaço/tipo/raio/z/motion), 3ª fonte (numeral display), biblioteca `ui/`: `Panel` (chanfro + filete + header), `BloodButton` (3 tamanhos), `Card` (raridades), `StatBlock`, `Tabs`, `Modal` cerimonial, `AnimatedNumber`, `Icon` (SVG set próprio substituindo emoji), transição de rota (fade+rise 180ms), atmosfera global opcional (brasas CSS). Página `/vitrine` interna para aprovação visual dos componentes.
*Critério de aceite: você aprova a vitrine antes de qualquer tela mudar.*

**F3 — Refatoração da UI** — migrar telas existentes para os componentes F2 **sem redesenhar** (troca de fundação). Elimina styles duplicados, unifica breakpoints. Risco baixo, diff grande.

**F4 — Novo Lobby** — praça como palco central; coluna social (online/desafiar/convites); painel evento; build atual com slots; CTA cerimonial; chat integrado. *Quebrar Lobby.jsx em 5 módulos.*

**F5 — Novo Perfil** — cartão de jogador hero (pose grande do boneco), rank com emblema, stats com medidores, partidas com placar visual, conquistas com raridade.

**F6 — Novo Inventário** — painel de detalhe do item (stats/passiva/EQUIPAR), tabs por slot, molduras uniformes por raridade, contagem, preview grande.

**F7 — Nova Loja** — destaque com cards grandes, ofertas diárias com timer, selos de desconto, cerimônia de compra.

**F8 — HUD da luta** — retratos nas barras, placa de timer metálica, announcer display, skill/ki cerimonial. (FX de combate já estão no padrão.)

**F9 — Animações & Cerimônias** — matchmaking dedicado, level up/novo item/vitória/derrota como momentos fullscreen, flash de hit no corpo, walk-in no countdown.

**F10 — Polimento** — passada fina em tudo: microinterações, sons de UI, 404 temático, ranking/missões refinados, compressão dos webp, auditoria de fps mobile.

Cada fase: decisões explicadas → arquivos listados → screenshots antes/depois (harness headless que já uso) → ganhos de UX/perf → **sua aprovação** → próxima.

---

## 10. DECISÕES QUE PRECISO DE VOCÊ (antes da Fase 2)

1. **Fonte display**: sugiro adicionar uma exibição agressiva para números/títulos de impacto (ex.: "Bebas Neue" ou similar licença livre) mantendo Barlow p/ UI e Rubik Wet Paint p/ momentos "sujos". Aprova a direção de 3 vozes?
2. **Atmosfera global** (brasas/névoa sutis em todas as telas de meta-game): quero ligado por padrão com toggle no modo leve. Ok?
3. **Emoji → SVG**: substituir toda a iconografia por um set próprio (20–25 ícones). Ok?
4. A tela `/vitrine` (interna, só admin) como ponto de aprovação do design system — ok?
