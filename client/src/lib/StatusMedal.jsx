// STIKDEAD :: medalha do status atual (tier) — compartilhada entre perfil e carreira
// ===== a medalha do status atual: quem você é HOJE na arena =====
const MEDAL_STYLE = {
  BRONZE: { grad: 'linear-gradient(155deg, #d99a5b, #8a5426 55%, #5d3517)', glow: 'rgba(169,113,61,0.5)', nome: 'Bronze' },
  PRATA: { grad: 'linear-gradient(155deg, #eef2f6, #9aa6b2 55%, #5f6a75)', glow: 'rgba(185,194,204,0.5)', nome: 'Prata' },
  OURO: { grad: 'linear-gradient(155deg, #ffe08a, #e0a10b 55%, #8a6206)', glow: 'rgba(224,161,11,0.55)', nome: 'Ouro' },
  PLATINA: { grad: 'linear-gradient(155deg, #b7fff4, #5fd0c5 55%, #2a7d75)', glow: 'rgba(95,208,197,0.5)', nome: 'Platina' },
  DIAMANTE: { grad: 'linear-gradient(155deg, #d8c5ff, #8b5cf6 55%, #4c2f96)', glow: 'rgba(139,92,246,0.55)', nome: 'Diamante' },
  MASTER: { grad: 'linear-gradient(155deg, #ff6a7e, #d90429 55%, #7a0217)', glow: 'rgba(217,4,41,0.55)', nome: 'Mestre' },
  GRANDMASTER: { grad: 'linear-gradient(155deg, #ff8fa3, #ff2244 50%, #1a0508)', glow: 'rgba(255,34,68,0.65)', nome: 'Grão-Mestre' },
};
const TIER_ORDEM = ['BRONZE', 'PRATA', 'OURO', 'PLATINA', 'DIAMANTE', 'MASTER', 'GRANDMASTER'];
const SUB_ORDEM = ['III', 'II', 'I']; // III é o degrau de entrada; I é o topo da medalha

export default function StatusMedal({ profile }) {
  const [tierNome, subNome] = String(profile.tier || 'BRONZE_III').split('_');
  const st = MEDAL_STYLE[tierNome] || MEDAL_STYLE.BRONZE;
  const pontos = Number(profile.rank_points || 0);
  const degrau = Math.floor(pontos / 100);
  const topo = tierNome === 'GRANDMASTER' && subNome === 'I';
  const faltam = topo ? 0 : (degrau + 1) * 100 - pontos;
  // qual é o próximo título?
  let proximo = '';
  if (!topo) {
    const si = SUB_ORDEM.indexOf(subNome);
    if (si < 2) proximo = `${st.nome} ${SUB_ORDEM[si + 1]}`;
    else {
      const ti = TIER_ORDEM.indexOf(tierNome);
      const prox = MEDAL_STYLE[TIER_ORDEM[Math.min(ti + 1, TIER_ORDEM.length - 1)]];
      proximo = `${prox.nome} III`;
    }
  }
  return (
    <div className="medal-box">
      <div className="medal" style={{ background: st.grad, boxShadow: `0 0 26px ${st.glow}, inset 0 2px 6px rgba(255,255,255,0.35), inset 0 -4px 10px rgba(0,0,0,0.45)` }}>
        <span className="medal-sub">{subNome}</span>
        <span className="medal-fita" style={{ background: st.grad }} />
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
