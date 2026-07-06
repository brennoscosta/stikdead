# STIKDEAD — Fase 1: Fundação

Contas, login (e-mail + Google), perfil do lutador. Base do jogo conforme o Blueprint do MVP.

## Estrutura

```
stikdead/
├── server/          API Node.js (Express + PostgreSQL)
│   ├── src/         index.js, auth.js, db.js
│   ├── migrations/  SQL versionado (001_init.sql)
│   └── scripts/     migrate.js
└── client/          Site React (Vite)
    └── src/         páginas: Login, Criar conta, Perfil
```

## Requisitos

- Node.js 20+ (testado no 22)
- PostgreSQL 14+ (testado no 16)

## Subindo localmente

**1. Banco de dados**

```bash
sudo -u postgres psql -c "CREATE USER stikdead WITH PASSWORD 'stikdead'"
sudo -u postgres createdb -O stikdead stikdead
```

**2. Servidor**

```bash
cd server
cp .env.example .env      # edite JWT_SECRET (obrigatório) e DATABASE_URL se necessário
npm install
npm run migrate           # aplica as migrações
npm run dev               # API em http://localhost:3001
```

**3. Cliente**

```bash
cd client
npm install
npm run dev               # site em http://localhost:5173 (proxy /api → 3001)
```

Abra http://localhost:5173, crie uma conta e veja o perfil do lutador.

## Login com Google (opcional nesta fase)

1. Crie um projeto em https://console.cloud.google.com → APIs e serviços → Credenciais
2. Crie um **ID do cliente OAuth** tipo "Aplicativo da Web"
3. Origens JavaScript autorizadas: `http://localhost:5173` (e depois `https://stikdead.com`)
4. Coloque o Client ID em:
   - `server/.env` → `GOOGLE_CLIENT_ID=...`
   - `client/.env` → `VITE_GOOGLE_CLIENT_ID=...` (crie o arquivo)
5. Reinicie os dois. O botão do Google aparece sozinho quando configurado.

Sem configurar, o login por e-mail funciona normalmente — o botão do Google só fica oculto.

## API desta fase

| Método | Rota | Descrição |
|---|---|---|
| POST | /api/auth/register | Cria conta (email, password, fighterName) |
| POST | /api/auth/login | Login por e-mail/senha → JWT |
| POST | /api/auth/google | Login com Google (idToken do GIS) |
| GET | /api/auth/me | Perfil do jogador autenticado |
| PATCH | /api/auth/me | Renomeia o lutador |
| GET | /api/health | Saúde da API + banco |

Todas as respostas de erro vêm como `{ "error": "mensagem em português" }`.

## Decisões já preparadas para as próximas fases

- `profiles` já tem xp, coins, rank_points, tier, wins/losses, win_streak, title e clan_id (nullable)
- Novos jogadores começam com 500 moedas (bônus de boas-vindas para a primeira compra na loja)
- Migrações versionadas: cada fase adiciona `00N_*.sql` sem tocar nas anteriores
- JWT no header Authorization — o mesmo token vai autenticar o Socket.io na Fase 4

## Fase 2 — Combate offline (incluída neste pacote)

Depois de logar, o botão **"Modo treino — lutar contra bot"** no perfil abre a batalha (`/treino`).

- **Simulação pura** (`client/src/game/sim.js`): melhor de 3 rounds, 99s, morte súbita, soco/pesado/bloqueio/dash/pulo, knockback, hitstop, combos. Separada da renderização — é o mesmo código que o servidor autoritativo vai rodar na Fase 4.
- **Bot** (`bot.js`): 4 dificuldades (fácil → insano), com reação, bloqueio e recuo configuráveis.
- **Rig procedural** (`rig.js`): um esqueleto, todas as animações por pose (idle, andar, pulo, dash, soco, chute pesado, bloqueio, dano, K.O., vitória).
- **Renderização PixiJS** (`renderer.js` + `arena.js`): arena Dojo em estilo nanquim, sangue, faíscas, tremor de tela, flash de impacto, câmera lenta no K.O.
- **Controles**: teclado (WASD move, Space/W pula, J soco, K pesado, L bloqueia, Shift dash, Esc pausa), gamepad (detecção automática) e touch (joystick + botões, só aparece em telas de toque).
- **Mobile**: em modo retrato a luta pausa e mostra "GIRE O CELULAR PARA LUTAR" com animação.
- **Teste headless**: `cd client/src/game && node sim.test.mjs` roda partidas bot vs bot completas sem browser.

## Fase 3 — Game Mode (incluída neste pacote)

- **Fullscreen**: ao escolher a dificuldade, o browser entra em tela cheia (sai ao voltar). Fallback silencioso se o navegador negar.
- **Entrada cinematográfica**: câmera começa fechada nos dois lutadores e abre durante o countdown; banner **VS** com os nomes deslizando; tremor de tela no LUTE!; "ROUND 2/3" anunciado entre rounds.
- **Estatísticas da luta** (na simulação): dano causado, golpes, combo máximo, bloqueios, duração e finalização.
- **Recompensas reais**: no fim da luta o cliente reporta o resultado e o **servidor calcula** XP e moedas (nunca o cliente): vitória 350 XP / derrota 120, bônus de Perfeito (+50), Combo insano (+30) e Finalização (+20), multiplicador por dificuldade (insano +50%), fator de treino 50%. Level-ups automáticos. Payloads adulterados (placar impossível, duração absurda, stats fora de faixa) são rejeitados.
- **Tela de resultado**: VITÓRIA/DERROTA, placar, +EXP, +MOEDAS, bônus listados, barra de progresso de nível animada e selo LEVEL UP!.
- **Novas rotas**: `POST /api/matches/training` e `GET /api/matches/history` (migração `002_matches.sql`).

## Fase 4 — Online (incluída neste pacote)

O jogo agora é multiplayer de verdade. Botão **"Lobby online"** no perfil.

- **Simulação compartilhada** (`shared/sim.js`): cliente e servidor rodam exatamente o mesmo código de combate. O servidor é autoritativo — simula a luta a 30 ticks/s, valida tudo e transmite snapshots; o cliente só envia inputs e renderiza com interpolação.
- **Lobby (protótipo funcional)**: lista de jogadores online com nível/tier, status EM LUTA, botão Desafiar, Buscar Partida (fila de matchmaking) e modal de convite recebido com timer de 30s.
- **Salas de batalha**: criação, countdown, rounds, resultado e destruição automáticas.
- **Reconexão**: caiu no meio da luta? A sala pausa por 15s; o oponente vê "aguardando reconexão"; volte e a luta continua. Timeout = W.O. (desistente não ganha nada).
- **Desistir**: menu na luta permite abandonar (derrota + vitória por W.O. para o oponente).
- **Recompensas PvP**: XP/moedas integrais (treino é 50%), bônus de sequência de vitórias, ranking Elo (+15..35 / -8..28 conforme diferença de pontos), tiers Bronze → Grandmaster, W/L e streak no perfil.
- **Testes de integração inclusos** (`server/scripts/`): `pvp.test.mjs` (2 clientes socket lutam partida completa via desafio) e `reconnect.test.mjs` (fila + queda + reconexão + término). Rode com o servidor de pé.

### Deploy no VPS

Este é o momento de subir: siga o **DEPLOY.md** (Nginx + SSL + PM2 + firewall + backup prontos em `deploy/`).

## Fase 5 — Economia (incluída neste pacote)

O loop central está fechado: lutar → ganhar → comprar → equipar → lutar mais estiloso.

- **Boneco glossy**: o lutador ganhou o acabamento do model sheet (contorno, volume, brilho) — desenhado por código a cada frame, e nametags sobre os lutadores.
- **Catálogo de 42 itens** (migração `003_economy.sql`): armas, cabeça, rosto, corpo, costas, braços, pernas, pés e efeitos, em 4 raridades com preços do blueprint. Cada item = template paramétrico desenhado **preso aos ossos do rig** (`itemsArt.js`) — a katana balança com o braço, a capa voa, a aura pulsa.
- **Loja** (`/loja`): cards com borda de raridade, filtro por slot, compra validada no servidor (saldo, duplicata).
- **Baú + inventário** (`/inventario`): preview ao vivo do boneco equipado (com botões de pose), arrastar do baú para o slot (ou clique/toque para equipar), validação de slot no servidor.
- **Itens em combate**: sua build aparece na luta (treino e online — o oponente vê a sua). O bot usa cachecol cinza.
- **Baú de sequência**: a cada 3 vitórias seguidas no PvP, o servidor sorteia um item comum/raro que você ainda não tem — "🎁 NOVO ITEM" na tela de resultado.
- **Arte IA plugável**: coloque `client/public/items/{id}.webp` (gerados no Higgsfield) e o ícone ilustrado substitui o vetor automaticamente.
- **Rotas novas**: `GET /api/shop`, `POST /api/shop/buy`, `GET /api/inventory`, `PUT /api/loadout`.

## Fase 6 — Lobby vivo (incluída neste pacote)

- **3 arenas em nanquim** (`arena.js`): Dojo, Templo (estátua, colunas, incenso) e Prisão (grades, correntes, marca de garra). No treino você escolhe (ou 🎲 Aleatória); no online o servidor sorteia por sala e todos veem a mesma.
- **Praça viva no lobby** (`praca.js`): os jogadores online passeiam como bonecos glossy **usando as builds reais** (a presença agora carrega o loadout, atualizado ao equipar), com nametag, lua vermelha e templo ao fundo.
- **Chat do lobby**: histórico de 50 mensagens, envio via socket com limite de 1 msg/s e 200 caracteres.
- **Missões diárias** (migração `004_missions.sql`): 3 por dia sorteadas de um pool de 6, progresso alimentado pelas estatísticas reais de treino e PvP no servidor. Coleta paga moedas; completar as 3 libera o **baú diário** (item comum inédito, ou +300 moedas se já tiver todos).
- **Ranking Top 100** (`/rankings`): tabela com tier colorido, vitórias/derrotas, pontos, medalhas no top 3, sua linha destacada e sua posição global.
- **Ícones IA**: as 10 armas já têm arte ilustrada do Higgsfield em `client/public/items/`.
- **Rotas novas**: `GET /api/missions`, `POST /api/missions/claim`, `POST /api/missions/chest`, `GET /api/rankings`.

## Próxima fase

**Fase 7 — Polimento e deploy final:** sons, tela de carregamento, ajustes de balanceamento e revisão de produção. Depois, **Fase 8 — beta fechado**.
