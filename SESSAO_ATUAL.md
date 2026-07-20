# STIKDEAD :: ESTADO DA SESSÃO (2026-07-20) — MIGRAÇÃO CAPROVER

## DEPLOY AGORA É CAPROVER (container único)
- Dockerfile multi-stage na raiz: builda client (Vite) → server Node serve client/dist + API + Socket.io na porta 80
- captain-definition + .dockerignore (preserva os 148 sprites de client/public/sprites; barra só /*.webp lixo da raiz)
- Migrações AUTOMÁTICAS no boot (migrate.js exporta runMigrations, reusa o pool do server; RUN_MIGRATIONS=false desliga)
- Ritual NOVO: assistente faz git push → webhook → CapRover builda e sobe. FIM dos scripts de sprite no VPS (filesystem efêmero: sprites entram pelo git).

## CHECKLIST DO PAINEL CAPROVER (o que o assistente NÃO alcança)
1. Env vars: DATABASE_URL, JWT_SECRET (openssl rand -hex 32), GOOGLE_CLIENT_ID (se usa), CORS_ORIGIN opcional (mesmo domínio)
2. HTTP Settings → **Websocket Support: ON** (crítico p/ Socket.io — sem isso praça/luta caem)
3. Container HTTP Port = 80
4. Deployment → webhook do GitHub ligado (senão push não builda)

## SEGURANÇA
- Token GitHub rotacionado 2026-07-20 (o antigo foi revogado). Higgsfield key antiga: AINDA revogar.

## PERSONAGEM
- VETORIAL (decisão do Brenno). Corpos diamante voltaram como sprite via rig em camadas (gFront). Braços corrigidos (bend positivo, sem hiperextensão).

## PENDÊNCIAS
- Revogar key Higgsfield antiga
- Redesign AAA da UI (/perfil) — briefing recebido, aguarda as 2 imagens de referência
- Empunhadura da arma (punho segurar o cabo) — se ainda fizer sentido no rig atual
