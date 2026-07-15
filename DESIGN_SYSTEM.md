# STIKDEAD DESIGN SYSTEM — "SANGUE & AÇO"
*Versão 1.0 · Fase 2 do AAA Remaster · fonte de verdade: `client/src/ds/`*

> **A regra que governa todas as outras:** nenhuma tela cria componente, cor,
> espaçamento ou animação próprios. Se não está em `ds/`, não existe.
> Toda interface nova é composta EXCLUSIVAMENTE a partir desta biblioteca.

---

## 1. Arquivos

| Arquivo | Papel |
|---|---|
| `ds/tokens.css` | Tokens: cor, raridade, espaço, raio/chanfro, z-index, sombra, glow, matéria, movimento, ícones, grid |
| `ds/typography.css` | As 3 vozes tipográficas e a hierarquia completa |
| `ds/icons.js` + `ds/Icon.jsx` | StikDead Icon System (ver `ICON_SYSTEM.md`) |
| `ds/components.jsx` + `ds/components.css` | Biblioteca oficial de componentes |
| `ds/Atmosphere.jsx` + `ds/atmosphere.css` | Atmosphere Manager contextual |
| `ds/index.js` | Ponto único de import: `import { Panel, Button } from '../ds'` |
| `pages/Vitrine.jsx` (`/vitrine`) | Sala de aprovação: todo componente novo entra lá ANTES de entrar numa tela |

## 2. Paleta oficial (tokens `--sd-*`)

**Dark:** `ink #0b0709` (fundo) · `coal #141114` · `iron #1d181c` (painéis) · `steel #2a242b` · `edge #3a333c` (bordas)
**Blood Red:** `blood #d90429` · `blood-hot #ff2244` · `blood-deep #7a0e1c`
**Neon:** `neon #ff3d5e` · `ice #9fd8ff`
**Ouro:** `gold #e0a10b` · `gold-hot #ffd66b`
**Texto:** `bone #f2efe9` · `muted #9a938a` · `faint #5f5a55`
**Raridades:** comum `#9a938a` · incomum `#4dee98` · raro `#4da3ff` · épico `#8b5cf6` · lendário `#ff7a1a` · mítico `#ff2244` · diamante `#7fd9ff`

Regras: fundo é sempre `ink`; painéis usam `--sd-panel-grad`; vermelho puro é reservado a CTA, dano e momentos de sangue — nunca decoração gratuita; ouro é recompensa; roxo é skill/void; gelo é defesa/informação.

## 3. Tipografia — 3 vozes POR FUNÇÃO

| Voz | Fonte | Uso EXCLUSIVO |
|---|---|---|
| **UI** | Barlow Condensed (400–800) | menus, config, inventário, missões, chat, tooltips, descrições, textos longos, estatísticas |
| **Display** | Rubik Wet Paint | STIKDEAD, títulos de tela, lobby, vitória, derrota, matchmaking, eventos, clãs, torneios |
| **Impact** | Bebas Neue | SÓ números e feedback: dano, crítico, combo ×12, KO, +XP, ouro, diamantes, contadores, cronômetro, nível, ranking, recompensas, números de barras |

**Hierarquia** (classes prontas): `sd-h1` (Display, clamp 30–46) · `sd-h2` (UI 800 caps 22–30) · `sd-h3` (UI 700 caps 17–21, cabeçalho de painel) · `sd-h4` (UI 700 caps 14, rótulo de seção) · `sd-body-l/m/s` (18/16/14, line-height 1.45–1.5) · `sd-caption` (12) · `sd-label` (12 caps tracking 0.16em) · `sd-btn-text` (16 caps) · `sd-impact / -sm / -xl` (34 / 22 / 44–76, tabular-nums).
Variações de cor do Impact: `sd-impact--blood/gold/ice`.
**A Impact é reservada** — usar fora de número/feedback é bug de design.

## 4. Espaço, raio, chanfro, z-index

- Escala de 4px: `--sd-s1..s8` = 4·8·12·16·24·32·48·64. Proibido px avulso.
- Raio: `s 6 · m 10 · l 16`. **Chanfro canônico** (`--sd-clip-panel`, corte de 14px em cantos opostos) é a assinatura de painel/card/botão — é ele que mata a cara de "site".
- Z-index nomeado: base 0 · atmo 1 · content 2 · nav 40 · dropdown 50 · tooltip 60 · modal 80 · toast 90 · cerimônia 100.

## 5. Luz e matéria

- Profundidade: `--sd-depth-1/2/3` (hover-card → painel → modal).
- Glow: `--sd-glow-blood/gold/void/ice/text` — glow marca INTERATIVIDADE ou RARIDADE, nunca tudo ao mesmo tempo.
- Matéria: `--sd-metal-edge` (borda metálica de painel) · `--sd-panel-grad` / `--sd-panel-grad-red`.

## 6. Movimento (microanimações)

Durações: `fast 120ms` (hover/press) · `base 180ms` (padrão) · `slow 320ms` (modal) · `cine 650ms` (cerimônia). Easings: `--sd-ease-out` (expressivo) e `--sd-ease-snap` (overshoot de impacto).
Biblioteca pronta: **Hover** (lift −1px + brightness), **Click** (ripple radial + squash 0.985), **Fade** (`sd-anim-fade`), **Slide/Rise** (`sd-anim-rise`), **Counter** (`<AnimatedNumber>` via rAF), **Glow** (`sd-anim-glow` pulsante), **Varredura** de brilho em barras, **transição de rota** (`sd-tela`).
`prefers-reduced-motion` desliga tudo — obrigatório manter.

## 7. Componentes (API resumida)

- `<Panel title icon actions tone>` — moldura canônica: chanfro + borda metálica + filete interno + header com faixa de sangue.
- `<Button variant=blood|gold|void|ghost size=sm|md|lg icon>` — CTA chanfrado com borda de luz, hover lift, ripple.
- `<Card rarity selected equipado>` — raridade define borda/fundo/glow via `--rar`; `equipado` pulsa (regra "EQUIPADO = ACESO").
- `<Input label icon>` · `<Dropdown label options value onChange>` — vidro escuro, foco sangue.
- `<ProgressBar value max tone label showNumber>` · `<HealthBar hp lado nome>` (com trilho de dano fantasma dourado) · `<XpBar nivel xp max>`.
- `<Badge tone icon>` · `<Tabs tabs value onChange>` · `<Tooltip text>` · `<Modal open onClose title icon actions>` (cerimonial).
- `<ToastProvider>` + `useToast()(msg, tone, icon)`.
- `<StatBlock icon label value tone>` · `<AnimatedNumber value duration format>`.

## 8. Grid responsivo

3 breakpoints canônicos: **desktop 1280 · tablet 900 · mobile 640** (únicos permitidos daqui em diante; os 13 antigos serão migrados na Fase 3).
`sd-page` (max 1240, gutter s4) · `sd-grid` 12 col → 6 (≤900) → 4 (≤640) · `sd-col-3/4/6/8/12`.

## 9. Atmosphere Manager

`<Atmosphere level="alta|media|baixa" />` — uma por tela, atrás do conteúdo.
- **alta** (26 brasas, 3 névoas, lua de sangue): splash, login, lobby, matchmaking, vitória/derrota, level up, novo item, eventos.
- **media** (10 brasas, 2 névoas): perfil, inventário, loja, clã, ranking, missões, replay.
- **baixa** (0 brasas, 1 névoa leve, só iluminação): configurações, formulários, admin.
Escala automática por hardware (nunca acima do que a tela pede): reduced-motion→0 · mobile fraco→0.3 · mobile→0.6 · desktop médio→0.7 · desktop→1. Mapa central por rota em `ATMO_POR_TELA` (Fase 3 liga no App). 100% CSS compositor — proibido canvas por tela para atmosfera.

## 10. Acessibilidade

- Contraste mínimo: texto corpo `bone` sobre `ink/iron` (≥ 12:1); `muted` só para secundário ≥ 14px; **nunca** `faint` para informação essencial.
- Alvo de toque mínimo 44×44px em `pointer: coarse`.
- Foco visível: outline 2px `--sd-neon` (`:focus-visible`) em todo interativo.
- `aria`: progressbar com valores, modal `role=dialog aria-modal`, tooltip `role=tooltip`, toasts em `aria-live=polite`, ícones decorativos `role=presentation` (com `title` viram `img`).
- Motion: tudo respeita `prefers-reduced-motion`.

## 11. Nomenclatura

- Prefixo global `sd-` (StikDead). Componentes React em PascalCase; classes em kebab-case.
- Padrão BEM-curto: `sd-bloco`, `sd-bloco-parte`, modificador `sd-bloco--variante`, estado `is-*` (`is-on`, `is-selected`, `is-equipado`, `is-open`).
- Tokens sempre `--sd-categoria-nome`. Nomes de conceito do universo em PT-BR (`vida`, `brasa`, `nevoa`, `vinheta`).

## 12. Processo

1. Componente novo? Nasce em `ds/`, aparece na `/vitrine`, é aprovado, só então entra em tela.
2. PR de tela que declara cor/px/fonte fora de token → reprovado.
3. A `/vitrine` é atualizada junto com qualquer mudança no DS — ela É a documentação viva.
