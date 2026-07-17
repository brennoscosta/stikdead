# STIKDEAD — Bíblia Sonora Oficial v1.0

*Fase 3 do plano de áudio ElevenLabs · base obrigatória para todo prompt de geração e toda decisão de mixagem daqui em diante.*

Este documento organiza a "Bíblia Sonora Oficial do StikDead v1.0" fornecida pelo Brenno em um formato de referência técnica. Qualquer prompt enviado à ElevenLabs (Fase 4+) e qualquer decisão de implementação do AudioManager (Fase 5+) deve estar de acordo com o que está aqui. Divergências precisam ser justificadas e registradas em `AUDIO_IMPLEMENTATION.md`.

## 1. Identidade sonora

O universo sonoro do StikDead mistura:

RPG oriental sombrio, Japão feudal fantástico, arena underground, samurais e shinobis, percussão Taiko, shamisen processado, flautas shakuhachi, gongos graves, metais cinematográficos, cordas tensas, corais discretos, drones sombrios, fogo, vento, madeira, correntes e aço.

**Evitar**: alegre, infantil, medieval europeia genérica, eletrônica futurista demais.

**Assinatura sonora principal**: impacto metálico + corte de katana + pulso grave + reverberação oriental curta. Pode aparecer em botões importantes, transições, conquistas, subida de nível e matchmaking.

## 2. Canais oficiais de áudio

| Canal | Função | Volume inicial |
|---|---|---|
| Master | Volume geral | 80% |
| Music | Trilha musical | 55% |
| Ambience | Ambiente contínuo | 30% |
| UI SFX | Interface e navegação | 65% |
| Gameplay SFX | Luta e habilidades | 80% |
| Voice | Narrador e anúncios | 75% |

UI e Gameplay podem compartilhar internamente o barramento `sfx`, mas a arquitetura do AudioManager (Fase 5) precisa estar preparada para separá-los em canais/volumes independentes.

> Nota de compatibilidade: o AudioManager atual (`client/src/game/audioManager.js`, entregue no update de Configurações) já implementa 4 barramentos — `master`, `music`, `sfx`, `ambience` — mais `muteOnBlur`. Ele precisará evoluir para os 6 canais desta bíblia (separando `sfx` em `ui`/`gameplay` e adicionando `voice`) sem quebrar as preferências já persistidas dos jogadores. Detalhado em `AUDIO_IMPLEMENTATION.md`.

## 3. Trilha por tela

| Tela | Sensação | Elementos | Duração |
|---|---|---|---|
| Home | Entrada em um mundo perigoso | drone grave, shamisen espaçado, vento, um sino distante, batimentos lentos de Taiko | 90–150s, instrumental, loop |
| Lobby | Centro social vivo antes da batalha | percussão oriental moderada, shamisen rítmico, flauta distante, coro masculino muito discreto, tensão sem parecer combate ativo | 120–180s — **trilha principal e mais reconhecível do jogo** |
| Perfil e conquistas | Honra, progresso e identidade | cordas, sino metálico, percussão leve, textura heroica porém sombria | — |
| Inventário | Preparação de guerreiro | oficina, metal, shamisen minimalista, pulsos graves suaves | — |
| Loja | Relíquias raras e comércio clandestino | sinos metálicos, moedas, textura misteriosa, cordas dedilhadas | — |
| Ranking | Competição, poder e status | Taikos, metais, coro discreto, tensão crescente | — |
| Matchmaking | Camadas progressivas | busca iniciada → pulso rítmico → aumento gradual de tensão → silêncio curto → impacto de "partida encontrada" | — |
| Vitória | Fanfarra curta | corte de espada, impacto grave, Taiko, sino, acorde heroico sombrio | 4–7s |
| Derrota | Stinger, sem melodrama excessivo | impacto grave, metal caindo, vento, acorde descendente | 3–5s |

## 4. Ambiente do lobby

Camadas **separadas e independentes** (nunca um único arquivo com tudo misturado, para permitir variar volume/frequência de cada uma):

vento noturno; brasas e fogo; lanternas e madeira; passos distantes; espadas de treino; gongos ocasionais; corvos raros; multidão distante; tecido e bandeiras ao vento.

**Regras de repetição / simultaneidade do ambiente**:
- nenhum som ambiente pode distrair da interface;
- eventos raros (corvo, sino, aço, treino) precisam de **cooldown** — não podem repetir seguido;
- loops precisam ser perfeitamente contínuos (sem clique/salto no ponto de emenda);
- nunca iniciar vários loops duplicados ao navegar entre telas (guardar por singleton/flag, como já é feito em `game/ambience.js`).

## 5. Sons da interface (UI SFX)

| Evento | Som |
|---|---|
| Hover comum | deslocamento de ar muito curto |
| Clique comum | madeira + metal curto |
| Confirmar | corte limpo + brilho |
| Cancelar | golpe metálico abafado |
| Erro | impacto grave seco |
| Abrir painel | tecido + whoosh |
| Fechar painel | whoosh reverso |
| Trocar aba | pequeno movimento de lâmina |
| Paginação | toque de madeira |
| Modal importante | impacto cinematográfico curto |

**Regra de repetição/simultaneidade da UI**: não tocar som de hover em cada pixel ou durante rolagem contínua. Cooldown de **~60–100ms** entre disparos de hover.

## 6. Estilos de luta

O som já existente em "Seu Estilo de Luta" é a **referência de qualidade obrigatória** para todo o resto do jogo.

| Estilo | Elementos |
|---|---|
| Ronin | katana rápida, corte limpo, pequeno vento vermelho |
| Shinobi | deslocamento rápido, fumaça, shuriken metálica discreta |
| Monge | pulso de energia, sino, impacto de palma |
| Berserker | impacto pesado, metal, rosnado/respiração não verbal discreta |
| Ceifador | corrente, lâmina longa, energia espectral |

Ao selecionar um estilo: som de foco → card move para o início → som exclusivo do estilo → confirmação curta de equipado. **Não tocar todos os efeitos ao mesmo tempo** (evitar sobreposição/cacofonia).

> O primeiro lote (Fase 4) cobre 3 dos 5 estilos (Ronin, Shinobi, Monge); Berserker e Ceifador ficam para um lote seguinte.

## 7. Dificuldades dos bots

Cada bot precisa de **assinatura sonora própria**, com prévia curta só ao selecionar (a confirmação principal fica no botão Iniciar Partida):

| Dificuldade | Elementos | Tom |
|---|---|---|
| Fácil | eletrônico suave, confirmação leve | azul |
| Médio | metal curto, pulso firme | neutro |
| Difícil | corte de espada, impacto | laranja |
| Insano | impacto subgrave, distorção demoníaca, corrente, respiração grave não verbal | vermelho |

## 8. Progressão e recompensas

| Evento | Direção |
|---|---|
| XP recebido | energia crescente curta |
| Moedas | 2–3 variações metálicas |
| Diamantes | cristal brilhante |
| Item comum | clique discreto |
| Item raro | brilho azul |
| Item épico | pulso roxo |
| Item lendário | fogo + metal + impacto |
| Conquista | medalha + sino |
| Level up | fanfarra de 2–4s |
| Novo rank | fanfarra especial de 4–6s |

Usar **variações aleatórias** para moedas, recompensas, cliques e equipamentos — evitar repetição mecânica perceptível.

## 9. Voz do narrador

Etapa futura (Fase 10). Direção: masculina, grave, firme, poucas palavras, português do Brasil, **sem caricatura de sotaque oriental**, sem gritar o tempo todo, autoridade e mistério.

Falas iniciais planejadas:
"A batalha começou." · "Primeiro round." · "Round final." · "Morte súbita." · "Oponente encontrado." · "Vitória." · "Derrota." · "Novo item desbloqueado." · "Novo nível alcançado." · "Você avançou no ranking." · "Torneio disponível."

## 10. Formatos e processamento

- fonte de produção: WAV quando possível (a ElevenLabs entrega MP3 44,1kHz ou WAV 48kHz no playground de efeitos);
- entrega web: WebM/Opus e MP3 como fallback;
- música: estéreo;
- efeitos de interface: mono ou estéreo muito estreito;
- ambiente: estéreo;
- normalização consistente entre todos os assets;
- remover silêncio desnecessário no início/fim;
- aplicar fade mínimo em loops (evitar clique de emenda);
- **nunca** aumentar volume via CSS/HTML — sempre no `GainNode` do AudioManager.

> Nota de implementação: os módulos server-side (`generateSoundEffect`, `composeMusic`, `textToSpeech`) hoje devolvem sempre MP3 (é o formato padrão da API ElevenLabs para esses endpoints). Conversão para WebM/Opus como fallback adicional fica para a Fase 5 (pipeline de pós-processamento), quando os primeiros arquivos reais já existirem para testar.

## 11. Estrutura de pastas

```
client/public/audio/
├── music/
│   ├── home/
│   ├── lobby/
│   ├── profile/
│   ├── inventory/
│   ├── shop/
│   ├── ranking/
│   ├── matchmaking/
│   └── results/
├── ambience/
│   ├── lobby/
│   ├── dojo/
│   ├── temple/
│   ├── prison/
│   ├── cyber/
│   ├── factory/
│   └── volcano/
├── ui/
│   ├── navigation/
│   ├── buttons/
│   ├── modal/
│   ├── notifications/
│   └── errors/
├── styles/
│   ├── ronin/
│   ├── shinobi/
│   ├── monk/
│   ├── berserker/
│   └── reaper/
├── bots/
│   ├── easy/
│   ├── medium/
│   ├── hard/
│   └── insane/
├── rewards/
├── combat/
└── voice/
```

Ver `AUDIO_ASSET_CATALOG.md` para o mapeamento exato de cada item do manifesto atual a este layout.

## 12. Convenção de nomes

```
music_lobby_main_v01.mp3
music_matchmaking_tension_v01.mp3
amb_lobby_wind_loop_v01.mp3
amb_lobby_embers_loop_v01.mp3
ui_hover_soft_01.mp3
ui_hover_soft_02.mp3
ui_click_confirm_01.mp3
ui_error_01.mp3
style_ronin_select_01.mp3
style_shinobi_equip_01.mp3
bot_easy_select_01.mp3
bot_insane_confirm_01.mp3
reward_coin_01.mp3
reward_coin_02.mp3
reward_legendary_01.mp3
voice_match_found_ptbr_01.mp3
```

Padrão: `<categoria>_<contexto>_<variação/tipo>_<sequência>.mp3`. Música e ambiente (assets longos, versionáveis) usam sufixo `_vNN`; efeitos pontuais (UI/estilos/bots/recompensas/voz) usam sufixo numérico simples `_NN` — já é exatamente o padrão usado nos 20 ids do lote de prova (`audio-manifest.json`).

## Limites de simultaneidade (síntese, para a Fase 5)

Reunindo as regras espalhadas pela bíblia e pelos requisitos do AudioManager global (Fase 5 do prompt mestre):

- **Hover**: cooldown ~60–100ms por elemento (não tocar em rolagem/movimento contínuo do mouse).
- **Eventos raros de ambiente** (corvo, sino distante, aço, treino): cooldown randomizado por evento (o `game/ambience.js` atual já usa 9–25s — manter/ajustar por evento na Fase 9).
- **Vozes simultâneas**: limitar quantas instâncias do mesmo SFX podem tocar ao mesmo tempo (ex.: múltiplos cliques rápidos não devem empilhar 10 vozes do mesmo som — usar *voice stealing* ou debounce por id).
- **Loops**: nunca iniciar um loop (música/ambiente) se outro do mesmo tipo já está tocando — checagem por singleton, como hoje em `music.js`/`ambience.js`.
- **Autoplay**: nenhum áudio pode iniciar antes de uma interação válida do usuário quando o navegador exigir (Chrome/Safari autoplay policy) — o `AudioContext` só é resumido em gesto do usuário, como já é feito hoje.
