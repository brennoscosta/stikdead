// STIKDEAD :: FORMA ATUAL — o algoritmo que mede o momento do lutador (1-7)
// Digere ranking, aproveitamento, sequência, jornada e rodagem → um veredito com motivo.

const NIVEIS = [
  { metal: 'bronze', nome: 'Bronze', glow: 'rgba(169,113,61,0.55)' },
  { metal: 'prata', nome: 'Prata', glow: 'rgba(185,194,204,0.55)' },
  { metal: 'ouro', nome: 'Ouro', glow: 'rgba(224,161,11,0.6)' },
  { metal: 'platina', nome: 'Platina', glow: 'rgba(95,208,197,0.55)' },
  { metal: 'diamante', nome: 'Diamante', glow: 'rgba(139,92,246,0.6)' },
  { metal: 'master', nome: 'Mestre', glow: 'rgba(217,4,41,0.6)' },
  { metal: 'grandmaster', nome: 'Grão-Mestre', glow: 'rgba(255,34,68,0.7)' },
];
// a régua de 7 cores: do cinza apagado ao vermelho sangue
export const CORES_FORMA = ['#6e6a6e', '#8a6a66', '#a3655c', '#b95a4e', '#cc4740', '#d62b33', '#d90429'];

// ===== O ALGORITMO DA FORMA (0-100) =====
// ranking 35% · aproveitamento 25% · sequência 20% · jornada 10% · rodagem 10%
export function calculaForma(p) {
  const pontos = Number(p.rank_points || 0);
  const wins = Number(p.wins || 0), losses = Number(p.losses || 0);
  const total = wins + losses;
  const winrate = total > 0 ? wins / total : 0;
  const streak = Number(p.win_streak || 0);
  const nivel = Number(p.level || 1);

  const fRanking = Math.min(pontos / 1000, 1) * 35;          // 1000+ pts = componente cheio
  const fAproveit = winrate * 25 * Math.min(total / 5, 1);   // winrate só vale com pelo menos 5 duelos
  const fSequencia = Math.min(streak / 5, 1) * 20;           // 5 seguidas = fogo total
  const fJornada = Math.min(nivel / 50, 1) * 10;             // experiência acumulada
  const fRodagem = Math.min(total / 60, 1) * 10;             // quilometragem online

  const score = fRanking + fAproveit + fSequencia + fJornada + fRodagem;
  const forma = Math.max(1, Math.min(7, 1 + Math.floor(score / 14.3)));

  // o motivo: fatores em % do próprio teto → o que carrega e o que segura
  const fatores = [
    { nome: 'pontos de ranking', pct: fRanking / 35, dica: 'vença partidas online para somar pontos' },
    { nome: 'aproveitamento', pct: total >= 5 ? winrate : 0, dica: 'melhore a taxa de vitórias' },
    { nome: 'sequência de vitórias', pct: Math.min(streak / 5, 1), dica: 'emende vitórias sem perder' },
    { nome: 'experiência (nível)', pct: Math.min(nivel / 50, 1), dica: 'suba de nível lutando' },
    { nome: 'rodagem online', pct: Math.min(total / 60, 1), dica: 'dispute mais duelos' },
  ].sort((a, b) => b.pct - a.pct);

  return { score: Math.round(score), forma, forte: fatores[0], fraco: fatores[fatores.length - 1], winrate, streak, total };
}

export default function StatusMedal({ profile }) {
  const f = calculaForma(profile);
  const N = NIVEIS[f.forma - 1];

  return (
    <div className="medal-box">
      <div className="medal-art" style={{ boxShadow: `0 0 30px ${N.glow}` }}>
        <img src={`/medalhas/${N.metal}.webp`} alt={N.nome}
          onError={(e) => { e.currentTarget.style.display = 'none'; }} />
      </div>
      <div className="medal-info">
        <div className="medal-titulo">{N.nome} <span className="medal-forma-tag">FORMA {f.forma}/7</span></div>

        {/* a régua da forma: 7 blocos do cinza ao sangue */}
        <div className="forma-bar" role="img" aria-label={`Forma ${f.forma} de 7`}>
          {CORES_FORMA.map((cor, i) => (
            <span key={i} className={`forma-seg ${i < f.forma ? 'on' : ''}`}
              style={i < f.forma ? { background: cor, boxShadow: `0 0 8px ${cor}` } : undefined} />
          ))}
        </div>

        <p className="medal-explica">
          O algoritmo da arena avaliou tudo que você viveu — ranking, aproveitamento, sequência, nível e rodagem —
          e cravou <b>{f.score}/100</b>. O que mais pesa a seu favor: <b style={{ color: '#7de0a8' }}>{f.forte.nome}</b>
          {f.streak >= 2 ? <> (🔥 {f.streak} seguidas)</> : null}.
          O que te segura: <b style={{ color: '#ff8fa3' }}>{f.fraco.nome}</b> — {f.fraco.dica}.
        </p>
        <p className="medal-meta">
          {f.forma >= 7
            ? '👑 Melhor momento possível. O jogo inteiro está olhando para você.'
            : f.forma >= 5
              ? '⚔️ Momento forte. Mantenha o ritmo para alcançar o topo.'
              : f.forma >= 3
                ? '📈 Em construção. Cada vitória online empurra a régua para o sangue.'
                : '🩸 Início de jornada. Lute online: é lá que a forma nasce.'}
        </p>
      </div>
    </div>
  );
}
