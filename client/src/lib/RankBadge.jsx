// STIKDEAD DS :: RankBadge — o único componente de elo, reutilizável em todas as telas.
// Mostra: ícone do elo, nome, pontuação, barra de progresso e próximo elo.
// Variantes: full (default) e compact (só ícone + nome + pontos).
import { rankArte, rankCor, rankNome, nextTierName, ptsToNext } from '../ds/rank.js';

export default function RankBadge({ tier, points = 0, compact = false, onClick, className = '' }) {
  const pts = Math.max(0, Number(points) || 0);
  const pct = Math.min(100, pts % 100);
  const next = nextTierName(pts);
  const falta = ptsToNext(pts);
  const clickable = typeof onClick === 'function';

  return (
    <div
      className={`rankbadge ${compact ? 'is-compact' : ''} ${clickable ? 'is-click' : ''} ${className}`}
      style={{ '--rank-cor': rankCor(tier) }}
      onClick={onClick}
      role={clickable ? 'button' : undefined}
      tabIndex={clickable ? 0 : undefined}
      onKeyDown={clickable ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick(e); } } : undefined}
      title={rankNome(tier)}
    >
      <span className="rb-emblema" aria-hidden="true"><img className="rank-img" src={rankArte(tier)} alt="" /></span>
      <div className="rb-body">
        <b className="rb-tier" style={{ color: rankCor(tier) }}>{rankNome(tier)}</b>
        <span className="rb-pts">{pts.toLocaleString('pt-BR')} pts</span>
        {!compact && (
          <>
            <div className="rb-bar"><div className="rb-fill" style={{ width: `${pct}%` }} /></div>
            <span className="rb-next">
              {next
                ? <>faltam <b>{falta}</b> pts para <b style={{ color: rankCor(next) }}>{rankNome(next)}</b></>
                : 'elo máximo atingido 👑'}
            </span>
          </>
        )}
      </div>
    </div>
  );
}
