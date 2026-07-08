// STIKDEAD :: medalha do status atual (tier) — arte Nano Banana + numeral por cima
const MEDAL_META = {
  BRONZE: { glow: 'rgba(169,113,61,0.55)', nome: 'Bronze' },
  PRATA: { glow: 'rgba(185,194,204,0.55)', nome: 'Prata' },
  OURO: { glow: 'rgba(224,161,11,0.6)', nome: 'Ouro' },
  PLATINA: { glow: 'rgba(95,208,197,0.55)', nome: 'Platina' },
  DIAMANTE: { glow: 'rgba(139,92,246,0.6)', nome: 'Diamante' },
  MASTER: { glow: 'rgba(217,4,41,0.6)', nome: 'Mestre' },
  GRANDMASTER: { glow: 'rgba(255,34,68,0.7)', nome: 'Grão-Mestre' },
};
const TIER_ORDEM = ['BRONZE', 'PRATA', 'OURO', 'PLATINA', 'DIAMANTE', 'MASTER', 'GRANDMASTER'];
const SUB_ORDEM = ['III', 'II', 'I']; // III entra, I reina

export default function StatusMedal({ profile }) {
  const [tierNome, subNome] = String(profile.tier || 'BRONZE_III').split('_');
  const st = MEDAL_META[tierNome] || MEDAL_META.BRONZE;
  const pontos = Number(profile.rank_points || 0);
  const degrau = Math.floor(pontos / 100);
  const topo = tierNome === 'GRANDMASTER' && subNome === 'I';
  const faltam = topo ? 0 : (degrau + 1) * 100 - pontos;
  let proximo = '';
  if (!topo) {
    const si = SUB_ORDEM.indexOf(subNome);
    if (si < 2) proximo = `${st.nome} ${SUB_ORDEM[si + 1]}`;
    else {
      const prox = MEDAL_META[TIER_ORDEM[Math.min(TIER_ORDEM.indexOf(tierNome) + 1, TIER_ORDEM.length - 1)]];
      proximo = prox.nome + ' III';
    }
  }
  return (
    <div className="medal-box">
      <div className="medal-art" style={{ boxShadow: `0 0 30px ${st.glow}` }}>
        <img src={`/medalhas/${tierNome.toLowerCase()}.webp`} alt={st.nome}
          onError={(e) => { e.currentTarget.style.display = 'none'; }} />
        <span className="medal-num">{subNome}</span>
      </div>
      <div className="medal-info">
        <div className="medal-titulo">{st.nome} {subNome}</div>
        <p className="medal-explica">
          Este é o seu <b>status atual</b> na arena: <b>{pontos.toLocaleString('pt-BR')} pontos</b> de ranking,
          forjados em <b style={{ color: '#7de0a8' }}>{profile.wins}V</b> · <b style={{ color: '#ff8fa3' }}>{profile.losses}D</b> online.
          Vitórias somam pontos, derrotas tiram — a medalha sobe e desce com você.
        </p>
        {topo ? (
          <p className="medal-meta">👑 Você está no topo absoluto. Defenda o trono.</p>
        ) : (
          <p className="medal-meta">⬆️ Faltam <b style={{ color: '#ffd76a' }}>{faltam}</b> pontos para <b>{proximo}</b>.</p>
        )}
      </div>
    </div>
  );
}
