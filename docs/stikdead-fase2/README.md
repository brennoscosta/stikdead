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

## Próxima fase

**Fase 3 — Game Mode:** fullscreen, transição cinematográfica de entrada, HUD polida, tela de resultado com XP/moedas (integrada ao banco).
