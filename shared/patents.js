// STIKDEAD :: PATENTES — a jornada de Saco de Pancada até a própria MORTE 💀
// Uma patente a cada 2 níveis. Nível máximo: 100. Conquista permanente: nunca desce.

export const MAX_LEVEL = 100;

const N = [
  // ATO I — A RUA (nv 2-20)
  'Saco de Pancada', 'Pé de Chinelo', 'Novato', 'Brigão de Beco', 'Quebra-Galho',
  'Casca Grossa', 'Valentão', 'Cão de Briga', 'Rei da Viela', 'Terror do Bairro',
  // ATO II — O DOJO (nv 22-40)
  'Discípulo', 'Punho de Ferro', 'Perna Voadora', 'Sombra do Mestre', 'Faixa de Sangue',
  'Guardião do Tatame', 'Mão de Pedra', 'Osso Duro', 'Mestre Jovem', 'Senhor do Dojo',
  // ATO III — A ARENA (nv 42-60)
  'Gladiador', 'Duelista', 'Mercenário', 'Quebra-Crânios', 'Carrasco',
  'Demolidor', 'Campeão do Fosso', 'Fera Enjaulada', 'Imbatível', 'Rei da Arena',
  // ATO IV — A LENDA (nv 62-80)
  'Espectro', 'Lâmina Silenciosa', 'Flagelo', 'Pesadelo Ambulante', 'Devorador de Reis',
  'Meio-Demônio', 'Avatar da Fúria', 'Imortal', 'Lenda Viva', 'Mito',
  // ATO V — A MORTE (nv 82-100)
  'Aprendiz do Ceifador', 'Coveiro', 'Mão da Morte', 'Shinigami', 'Ceifador',
  'Senhor dos Ossos', 'Ceifador Supremo', 'Encarnação do Fim', 'A Própria Morte', 'STIKDEAD',
];

const ATOS = ['A RUA', 'O DOJO', 'A ARENA', 'A LENDA', 'A MORTE'];
const EMOJI_FALLBACK = ['🥊', '🥋', '⚔️', '👁️', '💀']; // por ato, enquanto a insígnia não chega

const DESCS = [
  "Todo lutador nasce apanhando. Você aguentou o primeiro round da vida — e voltou para o segundo.",
  "Sem luva, sem técnica, sem medo. Só você, um chinelo e uma vontade absurda de brigar.",
  "O mundo aprendeu seu nome errado. Em breve vai aprender a temê-lo do jeito certo.",
  "Os becos têm suas próprias regras — e você escreveu a primeira delas com os punhos.",
  "Não tem golpe bonito, tem golpe que funciona. Você resolve na raça o que outros resolvem no talento.",
  "Bateram, você levantou. Bateram de novo, você sorriu. Casca dessa espessura não se compra.",
  "Quando você entra, a rua fica em silêncio. O respeito chegou antes da fama.",
  "Você não solta a presa. Lutadores desistem contra você — não porque perdem, mas porque cansam de tentar.",
  "A viela tem dono, e o trono é feito de nocautes. Ninguém passa sem pagar pedágio.",
  "Mães falam seu nome para assustar criança. O bairro inteiro conhece o som dos seus passos.",
  "A raiva virou disciplina. Pela primeira vez, você bateu continência antes de bater de verdade.",
  "Mil socos no mesmo ponto, todos os dias. Sua mão esqueceu o que é dor.",
  "Seus chutes cortam o ar com som de chicote. O chão virou opcional.",
  "Você se move como o mestre — tão parecido que ele já não sabe quem ensina quem.",
  "A faixa não foi comprada, foi tingida. Cada tom de vermelho custou um combate.",
  "O tatame é sagrado, e você é o guardião. Quem pisa desrespeitando, sai carregado.",
  "Sua palma quebra tábua, tijolo e orgulho alheio — nessa ordem, e sem esforço.",
  "Já quebraram tudo em você. Nada colou quebrado: colou mais forte.",
  "O aluno superou a lição. Agora os veteranos pedem para treinar COM você — nunca contra.",
  "O mestre se curvou e entregou as chaves. O dojo agora respira no seu ritmo.",
  "A multidão grita, a areia gruda no sangue, e você sorri. Nasceu para este palco.",
  "Um contra um, olho no olho. Você transformou o duelo em arte — e a arte em massacre.",
  "Sua lâmina tem preço, seu punho tem tabela. Lealdade só ao contrato — e ao próximo desafio.",
  "O apelido não é figura de linguagem. Os capacetes dos adversários que o digam.",
  "Quando o veredito é dado, você executa. Sem raiva, sem pressa, sem apelação.",
  "Paredes, escudos, formações defensivas: tudo vira escombro no seu caminho.",
  "Jogaram você no fosso para morrer. Você redecorou o fosso e cobrou aluguel.",
  "Prenderam a fera achando que a jaula protegia ela. A jaula protegia ELES.",
  "Contam nos dedos os que duraram três rounds contra você. Sobram dedos.",
  "A arena tem um trono de crânios, e o crânio de cima escolhe quem senta. Escolheu você.",
  "Dizem que você atravessa paredes. É mentira: as paredes que se afastam.",
  "Ninguém vê o golpe. Só o resultado. O silêncio depois do impacto virou sua assinatura.",
  "Cidades mudam de rota para não cruzar seu caminho. Você virou fenômeno da natureza.",
  "Você aparece nos pesadelos dos campeões — e eles acordam gratos por ter sido só um sonho.",
  "Coroas colecionam poeira na sua estante. Reis viraram degraus da sua escada.",
  "Metade humano, metade outra coisa. A parte humana é a que assusta.",
  "A fúria escolheu um corpo para morar. Parabéns pela inquilina eterna.",
  "Já tentaram de tudo: número, aço, veneno, traição. Você continua aqui. Eles não.",
  "Não precisam contar suas histórias — as cicatrizes dos outros contam por você.",
  "Crianças duvidam que você existe. Adultos rezam para estarem certos.",
  "A Morte procurava um estagiário. Sua ficha de nocautes serviu de currículo.",
  "Você cava antes da luta começar. Otimismo? Não — pontualidade.",
  "Seu toque encerra debates, carreiras e eras. A mão direita da própria escuridão.",
  "No oriente te dariam um nome sagrado. Aqui te dão distância — muita distância.",
  "A foice é cerimonial. Seus punhos fazem o serviço há muito tempo.",
  "Todo esqueleto se curva quando você passa. Os ossos reconhecem o dono.",
  "Ceifar virou arte, e você é o único mestre vivo dela — 'vivo' sendo força de expressão.",
  "O fim de todas as coisas precisava de um rosto. Escolheu o seu.",
  "As lendas erraram: a Morte não usa manto preto. Usa os seus movimentos.",
  "Você não joga STIKDEAD. Você É o STIKDEAD. O jogo inteiro é a sua sombra.",
];

export const PATENTS = N.map((name, i) => ({
  id: i + 1,
  name,
  desc: DESCS[i],
  level: (i + 1) * 2,           // nv 2, 4, 6 ... 100
  ato: ATOS[Math.floor(i / 10)],
  emoji: EMOJI_FALLBACK[Math.floor(i / 10)],
  icon: `/patentes/p${String(i + 1).padStart(2, '0')}.webp`,
}));

// a patente atual de um nível (ou null antes do nv 2)
export const patentFor = (level) => {
  const idx = Math.min(PATENTS.length, Math.floor((level || 0) / 2)) - 1;
  return idx >= 0 ? PATENTS[idx] : null;
};
