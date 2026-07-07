# PIPELINE 2.5D — A MIGRAÇÃO VISUAL (decisão de arquitetura)

**Objetivo:** elevar os lutadores ao nível das referências (02_REFERENCIAS/) — stickman
3D estilizado com armaduras detalhadas, materiais glossy e efeitos — SEM abandonar o
esqueleto procedural que anima tudo hoje.

## Decisão: Rota A — boneco modular pintado por partes
Cada parte do corpo (cabeça, torso, braço, antebraço, coxa, canela, bota) e cada item
é um sprite PINTADO de perfil, preso ao esqueleto existente (estilo Brawlhalla/Spine).
Animações, skills, física e hitboxes: intocados. Itens = troca de parte.

- Rota B (3D real/Three.js): documentada em FUTURO.md — v2, exige semanas e novo renderer.
- Rota C (sprite sheets): DESCARTADA — mata os 136 itens combináveis.

## As duas peças que faltavam na tentativa anterior (agora existem)
1. **Contrato de canvas** (bible.json > sprites_em_jogo) + tools/normalize-sprites.mjs
2. **Soul ID** — consistência entre gerações; toda parte sai do MESMO personagem.

## Parâmetros canônicos
- **soul_id:** `5e7592af-d66c-4d32-8141-bfb5d6a6c8cb` (nome: stikdead-hero, modelo soul-2)
- treinado com: modelo-3d-principal.png (folha 360°), personagem-principal-poster.jpg,
  login-bg.webp, hero.webp
- geração: via CLI autenticado no VPS (`higgsfield generate ...`) ou API na fábrica
- workspace: 35e17ca7-8c1a-402a-990f-1e4fde83d837

## Fases (cada uma entrega valor e é reversível)
- **P1 — Cabeça** (~10-15 gerações): esfera de obsidiana glossy; olhos ficam como camada
  vetorial separada (expressões vivas). 1 sprite, 1 âncora, zero juntas. MENOR risco.
- **P2 — Corpo base** (~40-60): torso+membros; construir ferramenta de calibração visual
  de pivôs (arrastar na tela, exportar offsets) antes de calibrar qualquer parte.
- **P3 — Itens como partes** (~150-300, em lotes): armadura troca torso, bota troca pé...
- **P4 — Glow/efeitos** (~0): camadas aditivas em código para itens de energia.

## Regras herdadas (pagas com sangue)
- NENHUMA parte entra no jogo sem passar pelo normalize (trim 45 + quadrado + altura padrão).
- Âncoras/pivôs calibrados visualmente, nunca no chute.
- Interruptor de segurança: SPRITES_ENABLED em itemSprites.js — rollback instantâneo.
- Prompts de partes derivam do bible.json (materiais, roughness 0.18, rim light).
