# STIKDEAD ICON SYSTEM
*Versão 1.0 · biblioteca: `client/src/ds/icons.js` · componente: `client/src/ds/Icon.jsx`*

Iconografia própria do universo StikDead — dark, samurai, underground. **Emojis estão proibidos como solução definitiva**; podem sobreviver apenas durante a migração da Fase 3.

## Direção de arte
- Grade **24×24**, traço `round` (bordas levemente arredondadas), formas fortes e legíveis de 16 px até 128 px.
- Desenhado para tema escuro (traço claro sobre `--sd-ink`); cor via `currentColor` — herda do texto por padrão.
- Preenchimentos (`fill`) só para acentos de peso (estrela do ranking, olhos da caveira, gema do token).

## Catálogo (36 ícones)
| Categoria | Nomes |
|---|---|
| Navegação | `lobby` (torii) · `perfil` (caveira) · `inventario` (baú) · `loja` (saco de moedas) · `missoes` (pergaminho) · `ranking` (pódio) · `cla` (brasão) · `config` (engrenagem) |
| Combate | `espada` (katana) · `foice` · `soco` · `chute` · `escudo` · `esquiva` · `combo` · `ultimate` |
| Equipamentos | `mascara` (kitsune) · `armadura` · `aura` (chama) · `pet` (corvo) |
| Economia | `moeda` · `diamante` · `token` · `passe` |
| Progressão | `xp` · `nivel` · `liga` (coroa) · `conquista` (medalha) · `trofeu` |
| Social | `amigos` · `chat` · `grupo` · `convite` |
| Interface | `fechar` · `voltar` · `editar` · `buscar` · `filtro` · `favorito` · `cadeado` |

## API
```jsx
<Icon name="espada" size="md" weight="medio" />
<Icon name="foice" size="xl" rarity="lendario" />       // cor + glow da raridade
<Icon name="ultimate" size="hero" glow className="sd-anim-glow" />
<Icon name="perfil" size={28} color="var(--sd-gold)" title="Seu perfil" />
```

### Tokens de tamanho
`xs 16 · sm 20 · md 24 · lg 32 · xl 48 · hero 64 · banner 96` (ou número em px).
Uso: xs em badges/tabs · sm em botões/inputs/painéis · md padrão · lg em cards · xl/hero em vitrines e modais · banner em cerimônias.

### Pesos de traço
`fino 1.5` (decorativo grande) · `medio 2` (padrão) · `forte 2.6` (navegação, botões, tamanhos pequenos).
Regra: quanto menor o ícone, mais forte o traço.

### Estados (via CSS, sem novos desenhos)
`normal` (cor herdada) · `hover` (drop-shadow na própria cor, automático dentro de botão/tab) · `ativo/selecionado` (`is-on`/`is-selected` no pai → glow) · `desabilitado` (opacidade 0.42 + dessaturação via `.sd-disabled`) · `destaque` (`glow` ou `sd-anim-glow` pulsante).

### Raridades
`rarity="comum|incomum|raro|epico|lendario|mitico|diamante"` aplica cor do token `--sd-r-*` + glow — **sem criar ícone novo**.

## Regras de contribuição
1. Novo ícone entra em `icons.js` no formato de comandos (`'M...'` traço · `'F:M...'` fill · `'C:x,y,r'` círculo · `'CF:x,y,r'` círculo cheio), grade 24×24, e aparece na `/vitrine` para aprovação.
2. Nome em PT-BR, minúsculo, sem prefixo (o contexto é o registro).
3. Nunca importar SVG externo/biblioteca de terceiros — a linguagem visual é única.
4. Testar legibilidade em 16 px antes de aprovar.
