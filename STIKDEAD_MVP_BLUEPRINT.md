# STIKDEAD — Blueprint do MVP (V1)

**Versão:** 1.0 · **Data:** 06/07/2026 · **Domínio:** stikdead.com
**Tagline:** LUTE. MORRA. EVOLUA.

---

## 1. Visão geral

StikDead é um jogo de luta 1v1 online que roda no navegador (PC e mobile), conectado ao site stikdead.com. O jogador cria uma conta, entra num lobby vivo com outros jogadores online, desafia oponentes (convite direto ou matchmaking às cegas) e luta em batalhas rápidas, violentas e estilizadas. Cada vitória rende XP, moedas e progresso de ranking. As moedas compram itens na loja; os itens vão para o baú; do baú o jogador arrasta para o inventário do boneco, montando sua build visual e funcional.

O jogo deve parecer um jogo de verdade dentro do browser — não uma página. Ao entrar em batalha, o site desaparece: fullscreen, sem header, sem scroll. No mobile, a luta só acontece em landscape.

**Princípio central de design:** todo jogador começa como um boneco preto anônimo, sem olhos, sem nada. Tudo é conquistado. A build equipada é o status social do jogo — quem tem itens raros e efeitos se destaca visualmente no lobby.

---

## 2. Identidade visual

Três pilares documentados por referências já produzidas:

| Pilar | Referência | Uso |
|---|---|---|
| Model sheet do personagem | "STIKDEAD — Modelo Base v1.0" | Rig de animação, proporções, slots de equipamento |
| Estilo nanquim das lutas | Vídeos de combate (sumi-ê, respingos de sangue) | Direção de arte das animações e efeitos de impacto |
| UI dark/neon | 10 telas (login, lobby, loja, batalha etc.) | Layout e estética de todas as interfaces |

**Paleta base:** preto #000000 (personagem), fundo escuro com acentos vermelhos (#D90429 / tons de sangue), dourado para moeda/CTAs, roxo para raridade épica e rank. Skills quebram a paleta de propósito (vermelho, roxo, azul, verde, laranja) nos momentos especiais.

**Proporções canônicas do boneco:** cabeça 1.0x · corpo 3.5x · pés 0.5x · altura total 5.0x.

**Raridades:** Comum (cinza) · Raro (azul) · Épico (roxo) · Lendário (dourado/vermelho com efeitos).

---

## 3. Escopo do V1

### Entra no MVP

- Conta: e-mail/senha + Google OAuth
- Perfil do jogador (nível, XP, win rate, histórico, build favorita)
- Lobby vivo: praça com bonecos animados dos jogadores online, nametags com rank, chat, balões de fala
- Lista de jogadores online com botão Desafiar
- Convites de confronto com timer de expiração (30s)
- Buscar Partida (matchmaking às cegas)
- Jogar com Bot (4 dificuldades: fácil, médio, difícil, insano)
- Batalha 1v1 ranked, melhor de 3 rounds, 99s por round, sudden death no round final
- 3 arenas jogáveis (Dojo, Temple, Prison) + Random; demais arenas visíveis com cadeado
- Game Mode: fullscreen, HUD, pause, sair da luta, tela de reconexão
- Mobile: lobby em vertical; batalha exige landscape com tela "Gire o celular para lutar"
- Controles: teclado, touch (joystick + botões) e gamepad
- Tela de resultado: vitória/derrota, estatísticas, XP, moedas, progresso de rank, revanche
- XP e níveis de conta
- Ranking com tiers (Bronze → Grandmaster), Top 100 global e Top Brasil
- Uma moeda (dourada), ganha em partidas e missões
- Loja com catálogo inicial (~40 itens em 9 slots + 5 estilos de skill)
- Baú (depósito de itens) e inventário do boneco com drag & drop
- Skills: 5 estilos compráveis (Muay Thai, Kickboxing, Karatê, Wing Chun, Kung Fu), cada um com moveset próprio de 3-4 golpes
- 3 missões diárias simples (ex.: vença 3 partidas, cause X de dano, use Y skills)
- Recompensa por sequência de vitórias (baú a cada N vitórias)

### Fica "Em breve" (visível na UI, bloqueado)

Clã, torneio, guerra de clãs, 2v2, passe de batalha, replay de partida, compras em dinheiro real (R$), segunda moeda (gemas), sistema de chaves/baús por raridade, árvore de skills nó a nó, espectador, emotes na luta, temporadas ranqueadas completas.

### Não aparece no V1

Login Apple/Discord (entra quando houver empacotamento para lojas), troca entre jogadores, leilão.

---

## 4. Fluxo do usuário

1. Usuário abre stikdead.com → landing com login
2. Cria conta ou entra (e-mail ou Google)
3. Primeiro acesso: tela de boas-vindas apresenta o boneco base + escolha do nome de lutador
4. Entra no lobby → vê jogadores online, chat, seus dados no topo
5. Desafia alguém, aceita um convite, busca partida ou joga com bot
6. Match aceito → seleção/confirmação de arena → transição cinematográfica (zoom nos dois lutadores, tremor de tela, poses de combate, countdown 3-2-1-FIGHT)
7. Site entra em Game Mode (fullscreen, UI do site oculta). No mobile: exige landscape antes do countdown
8. Batalha (melhor de 3)
9. Tela de resultado: placar, estatísticas, XP, moedas, rank ±pontos, botões Revanche / Novo adversário / Voltar ao lobby
10. Retorna ao lobby

**Regras de orientação mobile:**
- Lobby, loja, inventário, perfil: funcionam em vertical (retrato)
- Batalha: se vertical, tela fullscreen "Gire o celular para lutar" com ícone animado; countdown só dispara em landscape
- Se girar para vertical no meio da luta: pausa automática + tela de rotação (proteção contra dano às cegas)
- Navegador não força rotação; PWA futuro poderá travar landscape via manifest

---

## 5. Sistemas

### 5.1 Personagem e slots

Um único personagem base (boneco preto, sem olhos, sem detalhes). Toda diferenciação vem dos itens. Slots de equipamento:

| # | Slot | Exemplos |
|---|---|---|
| 1 | Cabeça | Cabelos, faixas, chapéus, coroas |
| 2 | Rosto | Olhos, máscaras (oni, caveira), bandanas |
| 3 | Corpo | Armaduras, coletes, cachecóis |
| 4 | Costas | Capas, bainhas, asas |
| 5 | Arma | Katana, nunchaku, bastão, foice, machado, lança, dual blades, arco |
| 6 | Braços | Luvas, manoplas, braçadeiras |
| 7 | Pernas | Calças, shorts, joelheiras |
| 8 | Pés | Tênis, botas |
| 9 | Efeitos | Auras, fumaça, partículas (slot mais raro) |

Slots funcionais adicionais: **Skill de luta** (estilo equipado) e **Reação de vitória** (finisher/emote pós-luta).

### 5.2 Baú e inventário

- Tudo comprado ou ganho vai para o **baú** (depósito geral, sem limite no V1)
- O jogador **arrasta** itens do baú para os slots do boneco (drag & drop; toque longo + arrastar no mobile)
- Preview em tempo real: o boneco atualiza na hora
- A build equipada aparece no lobby, no perfil e na batalha

### 5.3 Economia (uma moeda)

- **Moeda dourada**, ganha por: vitória (~300), derrota (~100), missões diárias (200-400), baú de sequência de vitórias
- Preços de referência: item comum 500-1.000 · raro 1.500-3.000 · épico 4.000-8.000 · lendário 10.000-20.000 · estilo de skill 5.000
- Meta de economia: jogador ativo compra 1 item comum/dia e 1 raro/semana. Ajustável por telemetria
- Gemas (segunda moeda) e preços em R$ só entram com monetização (V2+)

### 5.4 Skills (estilos de luta)

5 estilos compráveis. Cada estilo substitui o moveset básico e muda a pose/animações:

| Estilo | Identidade | Golpes (3-4) |
|---|---|---|
| Muay Thai | Joelhadas e cotovelos, dano bruto | Jab, joelhada, cotovelada, clinch |
| Kickboxing | Chutes rápidos, pressão | Front kick, roundhouse, spinning back kick |
| Karatê | Golpes secos, contra-ataque | Snap kick, enpi, mae geri |
| Wing Chun | Curta distância, sequências rápidas | Chain punch, pak sao, low kick |
| Kung Fu | Fluido, acrobático | Palm strike, sweep kick, crane kick |

Todo jogador começa com o estilo **Briga de Rua** (gratuito, básico). Árvore de skills nó a nó fica para V2.

### 5.5 XP, níveis e ranking

- **XP de conta**: base por partida (vitória 350 / derrota 120) + bônus de desempenho (MVP, perfeito, finalização, sem apanhar) + bônus de win streak
- **Níveis**: curva simples (nível N exige N × 500 XP); nível é exibido no perfil e nametag
- **Ranking**: pontos estilo Elo simplificado (vitória +20 a +35, derrota −15 a −25, ajustado pela diferença de rank)
- **Tiers**: Bronze, Prata, Ouro, Platina, Diamante, Master, Grandmaster (I-III cada)
- Placares: Top 100 Global e Top Brasil, atualizados a cada 10 minutos

### 5.6 Missões diárias

3 missões/dia, renovam à meia-noite (BRT). Pool inicial: vença N partidas, cause N de dano, bloqueie N ataques, use N skills, faça N knockdowns, jogue N partidas. Recompensas em moeda e XP. Completar as 3 libera um baú diário com item aleatório comum/raro.

### 5.7 Matchmaking e bots

- **Buscar partida**: fila por proximidade de rank (janela expande a cada 10s até ±2 tiers); é o "convite às cegas"
- **Desafio direto**: pelo lobby ou lista de jogadores; convite expira em 30s
- **Bots**: 4 dificuldades; treinam o jogador e garantem partida com lobby vazio. Partida vs bot rende XP/moeda reduzidos (50%) e não afeta ranking
- Fallback de lançamento: se a fila passar de 45s, oferecer bot automaticamente

---

## 6. Combate

### 6.1 Regras da partida

- 1v1, melhor de 3 rounds, 99 segundos por round
- Vida 100% no início de cada round; barra de energia (especial/ultimate) carrega ao dar e tomar dano
- Tempo esgotado: vence quem tiver mais vida; round final empatado → sudden death (primeiro hit vence)
- Eventos anunciados na tela: PRIMEIRO SANGUE, combos (contador de hits), K.O., PERFECT

### 6.2 Moveset básico (12 animações do model sheet)

Idle, andar, correr, pular, dash, ataque leve, ataque pesado, bloquear, tomar dano, finalização, vitória, derrotado. Esse conjunto cobre 100% do combate V1. Itens não criam animações novas — são acessórios presos aos ossos do mesmo rig.

### 6.3 Controles

**Desktop (teclado):**

| Ação | Tecla |
|---|---|
| Mover | WASD |
| Pular | Space (e W) |
| Ataque leve | J |
| Ataque pesado | K |
| Bloquear | L |
| Dash | Shift |
| Especial | O |
| Ultimate | P |
| Pausar | Esc |

**Mobile (touch, landscape):** joystick virtual à esquerda; à direita, cluster de botões: leve, pesado, pular, dash, bloquear, especial, ultimate (layout da tela de batalha de referência). Botões com feedback de toque e cooldown visual.

**Gamepad (API Gamepad do browser):** analógico esquerdo move; X/A leve, Y/B pesado, RB dash, LB bloqueio, RT especial, LT ultimate, Start pausa. Detectado automaticamente ao conectar.

### 6.4 HUD da batalha

Barras de vida no topo (com nome, título, rank e nível), timer central, indicador de rounds, barra de energia/ultimate na base, contador de combo lateral, FPS e ping discretos no canto. Botões Emoji e Pausar (mobile).

### 6.5 Arenas do V1

| Arena | Tema | Identidade |
|---|---|---|
| Dojo | Tradição, madeira, dia | Arena "limpa", ideal de aprendizado |
| Temple | Templo ancestral, dourado, noite | Espiritual, tochas, estátua ao fundo |
| Prison | Caos, grades, sombrio | Sem regras, atmosfera pesada |
| Random | Sorteia uma das 3 | Dado da sorte |

Arenas bloqueadas visíveis (Cyber, Factory, Volcano) com selo "Em breve". Arenas do V1 são cenário visual — sem hazards/interações (V2).

### 6.6 Game Mode (comportamento do browser)

- Requisição de Fullscreen API ao iniciar a batalha (com fallback se negado: viewport 100% com UI oculta)
- Header/nav do site ocultos, scroll travado, seleção de texto desativada
- Pause menu: continuar, controles, som, sair da luta (derrota por abandono após confirmação)
- Queda de conexão: tela "Reconectando..." com 15s de tolerância; o servidor pausa a sala; se não voltar, W.O.
- No mobile, tudo acima + trava de orientação por detecção (seção 4)

---

## 7. Arquitetura técnica

### 7.1 Stack

| Camada | Tecnologia | Papel |
|---|---|---|
| Site + UI (lobby, loja, perfil) | React + Vite | SPA rápida, componentes da UI dark/neon |
| Cena de batalha e lobby animado | PixiJS (WebGL 2D) | Render leve de sprites/rig, partículas, 60fps |
| Tempo real | Socket.io (cliente + servidor) | Presença, chat, convites, salas de batalha |
| Backend | Node.js (API REST + game server) | Contas, inventário, loja, matchmaking, simulação |
| Banco | PostgreSQL | Dados persistentes |
| Cache/estado volátil | Redis | Presença online, filas de matchmaking, salas |
| Processos | PM2 | web (API) e game (tempo real) separados |
| Borda | Nginx + Let's Encrypt | stikdead.com, SSL, proxy WebSocket, assets estáticos |

Assets em SVG/vetor e sprite sheets leves; alvo de carregamento inicial < 3s em 4G.

### 7.2 Servidor autoritativo (anti-cheat)

O cliente **só envia inputs** (botões pressionados) e renderiza o estado que o servidor manda. O servidor simula a luta (posições, colisões, dano, energia) a **20-30 ticks/s** e transmite snapshots; o cliente interpola/prediz para suavidade. XP, moedas e itens são creditados exclusivamente pelo servidor ao fim da partida validada. Nada de valor é calculado no browser.

### 7.3 Modelo de dados (esquema inicial)

- `users` — id, email, senha (hash), google_id, nome_lutador, criado_em
- `profiles` — user_id, nível, xp, moedas, rank_pontos, tier, vitórias, derrotas, win_streak, título
- `items` — catálogo: id, nome, slot, raridade, preço, asset_ref, atributos (JSON)
- `user_items` — baú: user_id, item_id, obtido_em
- `loadouts` — build equipada: user_id, slot → user_item_id (9 slots + skill + reação)
- `skill_styles` — catálogo dos 5 estilos e movesets
- `matches` — id, jogador_a, jogador_b (ou bot), arena, placar, duração, stats (JSON), rank_delta, criado_em
- `missions` / `user_missions` — pool de missões, progresso diário
- `rankings` — visão materializada do Top 100 / Top Brasil (refresh 10 min)

### 7.4 Serviços do tempo real (Socket.io)

- **Presença**: quem está online, posição/estado do boneco no lobby (idle, andando, emote)
- **Chat do lobby**: mensagens com rate limit e filtro básico
- **Convites**: desafio direto com TTL de 30s
- **Matchmaking**: fila no Redis, pareamento por rank
- **Salas de batalha**: 2 jogadores + simulação; ciclo de vida criar → countdown → rounds → resultado → destruir
- **Reconexão**: token de sala com 15s de graça

### 7.5 Deploy no VPS (Ubuntu 24.04, 8 vCPU / 32GB)

1. Node.js LTS, PostgreSQL, Redis, Nginx, PM2, Certbot
2. Usuário de sistema dedicado `stikdead`; app em `/opt/stikdead`
3. Dois processos PM2: `stikdead-api` (REST) e `stikdead-game` (Socket.io); frontend buildado servido pelo Nginx
4. Nginx: stikdead.com → estáticos + `/api` → API + `/socket` → WebSocket (upgrade), SSL Let's Encrypt, HTTP/2
5. Firewall (ufw): 80/443 apenas; Postgres e Redis só em localhost
6. Backups diários do PostgreSQL (pg_dump + retenção 14 dias)
7. Isolamento: se o VPS for compartilhado com outros serviços, limitar CPU deles (cgroups/docker) e fixar o processo `stikdead-game` em cores dedicados — engasgo de CPU vira lag para todos os jogadores
8. Observação de latência: público inicial BR → confirmar datacenter (ideal São Paulo). Se o VPS atual for fora da América do Sul, usar para dev/teste e avaliar VPS pequeno em SP só para o `stikdead-game` no lançamento

### 7.6 Preparado para expandir (sem retrabalho)

- Salas de batalha genéricas (N jogadores) → 2v2 e espectador entram como novos tipos de sala
- Snapshots da partida gravados → replay futuro
- Catálogo de itens data-driven (JSON no banco) → novos itens sem deploy
- Tiers/temporadas versionados → ranked seasons
- Campos de clã já previstos no schema (nullable) → clãs sem migração dolorosa
- Resultado da partida exportável → integração futura com YouTube Shorts (clipes de finalizações)

---

## 8. Catálogo inicial de itens (~40 + skills)

| Slot | Itens (raridade) |
|---|---|
| Cabeça | Faixa ninja (C), Cabelo espetado (C), Chapéu de palha (R), Capuz sombrio (E), Coroa (L) |
| Rosto | Olhos brancos (C), Olhos raivosos (C), Bandana (C), Máscara caveira (R), Máscara oni (E) |
| Corpo | Cachecol cinza (C), Cachecol vermelho (R), Colete (R), Armadura ronin (E), Armadura infernal (L) |
| Costas | Bainha de katana (C), Capa curta (R), Capa do guerreiro (E) |
| Arma | Bastão bō (C), Nunchaku (C), Katana (C), Machado (R), Lança (R), Foice (E), Dual blades (E), Arco (E), Katana infernal (L), Foice sangrenta (L) |
| Braços | Luvas simples (C), Braçadeiras (C), Luvas de combate (R), Manoplas (E) |
| Pernas | Shorts de treino (C), Calça ninja (C), Calça com joelheiras (R) |
| Pés | Tênis clássico (C), Botas (R), Botas sombrias (E) |
| Efeitos | Poeira nos pés (R), Aura vermelha (E), Aura do caos (L) |
| Reações de vitória | Guardar a katana (C), Pisar no derrotado (R), Risada com balão (R), Apontar e zoar (E) |
| Skills | Briga de Rua (grátis), Muay Thai, Kickboxing, Karatê, Wing Chun, Kung Fu |

C = comum · R = raro · E = épico · L = lendário. Lendários também caem do baú de win streak (chance baixa) para dar sonho a quem não compra.

---

## 9. Roadmap de construção

| Fase | Entrega | Critério de pronto |
|---|---|---|
| 1. Fundação | Projeto, banco, contas (e-mail + Google), perfil básico | Criar conta, logar, ver perfil em stikdead local |
| 2. Combate offline | Cena de batalha PixiJS, rig do boneco, 12 animações, controles (teclado/touch/gamepad), 1 arena, luta vs bot | Luta completa vs bot no desktop e mobile landscape |
| 3. Game Mode | Fullscreen, orientação mobile, pause, HUD completo, transição cinematográfica, tela de resultado | Fluxo lobby → luta → resultado polido |
| 4. Online | Socket.io, servidor autoritativo, salas, matchmaking, desafio direto, reconexão | 2 jogadores reais lutando em rede local/VPS |
| 5. Economia | Loja, baú, inventário drag & drop, catálogo de itens, XP/moedas pós-partida, missões diárias | Loop completo: lutar → ganhar → comprar → equipar |
| 6. Lobby vivo | Praça animada, presença, chat, ranking, 3 arenas, convites com timer | Lobby parece um jogo, não uma página |
| 7. Deploy | VPS configurado, SSL, domínio, monitoramento, backups | stikdead.com no ar, jogável publicamente |
| 8. Beta fechado | Convidados testam; telemetria de economia, latência e bugs | Ajustes de balanceamento antes da abertura |

---

## 10. Metas de qualidade

- 60 fps na batalha em celular intermediário; degradação graciosa de partículas em aparelhos fracos
- Carregamento inicial < 3s em 4G; cena de batalha < 2s adicionais
- Input-to-action < 50ms local; latência de rede alvo < 80ms (BR→SP)
- Zero cálculo de valor no cliente (servidor autoritativo em tudo que vale moeda/XP/rank)
- UI utilizável em telas de 360px (vertical) e 640px de altura (landscape)
