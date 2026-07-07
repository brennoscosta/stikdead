# STIKDEAD :: ESTADO DA SESSÃO (2026-07-07, dia épico)

## EM PRODUÇÃO (game.stikdead.com) — tudo estável
- Sistema de Skills (5 estilos, tecla **H** no desktop, botão só no toque)
- Economia de risco (-200 derrota), estilos pagos x4 (8k/10k/14k/20k)
- 136 itens, loja com aba Estilos (?slot=style)
- UI premium completa (Etapas 1-3), login com arte-pôster (login-bg.webp)
- Bottombar app-style global (recolhe em luta via body.in-fight), topo = logo+moedas+chip nome/Nv
- Painel admin /admin (souzacostabrenno@gmail.com) — dashboard/usuários/itens editáveis
- Carimbo de build no canto: div#bb (atual b:0707J+) + detector M/D — REMOVER no lançamento
- **Personagem: VETORIAL ORIGINAL** (decisão do Brenno após saga das peças)

## EXPERIMENTO CORPO PINTADO — DESLIGADO, preservado
- PARTS_ENABLED=false (bodyParts.js), HEAD_SPRITE_ENABLED=false (headSprite.js)
- Soul treinado: 5e7592af-d66c-4d32-8141-bfb5d6a6c8cb (stikdead-hero)
- Peças fatiadas no repo: torso/thigh/shin/forearm (kit preto, flood-fill)
- REGRA PARA RELIGAR: só após provador offline (script que monta peças em poses
  e gera PNGs que o assistente INSPECIONA antes de produção). Nunca mais iterar
  visual em produção com os olhos do Brenno de bancada.

## PENDÊNCIAS DO BRENNO
- Rotacionar chaves (token GitHub + key Higgsfield antiga) + history -c — CRÍTICO
- Cache nginx (index.html no-store, /assets immutable) — evita builds presos
- Assets: --group=arenas e --group=lote5 na fábrica (94 ícones)
- Playtest com 3-5 amigos

## PRÓXIMAS FRENTES (ordem sugerida)
1. Etapa 4 premium: movimentos dos lutadores (rig+sim, sessão isolada com testes)
2. Conquistas / Clãs / Fase 8 beta
3. (se quiser retomar) Provador offline → corpo pintado

## OPERACIONAL
- VPS: cd /opt/stikdead && git pull && cd client && npm run build (+ migrações com source .env)
- Push do assistente: sync /home/claude/stikdead → repo-stikdead, token no chat
- Patches SEMPRE com helper validado que grita ✗
