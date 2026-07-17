// STIKDEAD :: atividades — o diário do lutador + avisos do servidor
// UPDATE 2.9: cards compactos com ícones SVG, filtros por categoria e
// paginação de 10 em 10 (adeus lista infinita).
import { useEffect, useMemo, useState } from 'react';
import { api } from '../lib/api.js';
import Navbar from '../lib/Navbar.jsx';
import PlayerCard from '../lib/PlayerCard.jsx';
import Icon from '../ds/Icon.jsx';

// cada tipo de atividade: ícone SVG do design system + categoria + cor do chip
const META = {
  diamond_purchase: { icon: 'diamante', cat: 'economia', cor: '#67e8f9' },
  bet_win:          { icon: 'moeda',    cat: 'economia', cor: '#7de0a8' },
  bet_loss:         { icon: 'moeda',    cat: 'economia', cor: '#ff8fa3' },
  friend_request:   { icon: 'amigos',   cat: 'social',   cor: '#9fd8ff' },
  friend_accept:    { icon: 'amigos',   cat: 'social',   cor: '#7de0a8' },
  gift_sent:        { icon: 'presente', cat: 'inventario', cor: '#ffd76a' },
  gift_received:    { icon: 'presente', cat: 'inventario', cor: '#ffd76a' },
  clan_invite:      { icon: 'cla',      cat: 'clan',     cor: '#ffd76a' },
  clan_joined:      { icon: 'cla',      cat: 'clan',     cor: '#7de0a8' },
  _global:          { icon: 'alerta',   cat: 'social',   cor: '#e0a10b' },
  _fallback:        { icon: 'xp',       cat: 'social',   cor: '#9a8f88' },
};

const FILTROS = [
  ['tudo', 'TUDO', 'filtro'],
  ['combate', 'COMBATE', 'espada'],
  ['social', 'SOCIAL', 'amigos'],
  ['inventario', 'INVENTÁRIO', 'inventario'],
  ['clan', 'CLÃ', 'cla'],
  ['economia', 'ECONOMIA', 'moeda'],
];

const POR_PAGINA = 10;

export default function Activities({ profile }) {
  const [feed, setFeed] = useState(null);
  const [card, setCard] = useState(null);
  const [filtro, setFiltro] = useState('tudo');
  const [pagina, setPagina] = useState(0);

  const load = () => api('/api/activities').then(setFeed).catch(() => {});
  useEffect(() => { load(); }, []);
  useEffect(() => { setPagina(0); }, [filtro]); // trocar filtro volta pra 1ª página

  const accept = async (requestId) => {
    await api('/api/friends/respond', { method: 'POST', body: { requestId, accept: true } });
    load();
  };

  const Name = ({ n }) => <button className="fr-name" onClick={() => setCard(n)}>{n}</button>;
  const line = (a) => {
    const d = a.data || {};
    switch (a.kind) {
      case 'diamond_purchase': return <>Você comprou <b style={{ color: '#9fc4ff' }}>{Number(d.diamonds).toLocaleString('pt-BR')} diamantes</b></>;
      case 'clan_invite': return <><Name n={d.from} /> te convidou para o clã <b style={{ color: '#ffd76a' }}>{d.clan}</b>
        {a.actionable && <> <button className="adm-btn" onClick={() => api('/api/clans/respond', { method: 'POST', body: { inviteId: d.inviteId, accept: true } }).then(() => location.reload())}>✓ entrar</button>
        <button className="adm-btn" onClick={() => api('/api/clans/respond', { method: 'POST', body: { inviteId: d.inviteId, accept: false } }).then(() => location.reload())}>✕</button></>}</>;
      case 'clan_joined': return <><Name n={d.who} /> entrou no seu clã <b style={{ color: '#ffd76a' }}>{d.clan}</b>!</>;
      case 'bet_win': return <>Você <b style={{ color: '#7de0a8' }}>ganhou {Number(d.amount).toLocaleString('pt-BR')} {d.kind === 'diamonds' ? 'diamantes' : 'moedas'}</b> em duelo apostado com <Name n={d.with} /></>;
      case 'bet_loss': return <>Você <b style={{ color: '#ff8fa3' }}>perdeu {Number(d.amount).toLocaleString('pt-BR')} {d.kind === 'diamonds' ? 'diamantes' : 'moedas'}</b> em duelo apostado com <Name n={d.with} /></>;
      case 'friend_request': return <><Name n={d.from} /> solicitou sua amizade {a.actionable && <button className="adm-btn" onClick={() => accept(d.requestId)}>✓ aceitar</button>}</>;
      case 'friend_accept': return <>Você e <Name n={d.with} /> agora são amigos</>;
      case 'gift_sent': return d.kind === 'coins' || d.kind === 'diamonds'
        ? <>Você enviou <b>{Number(d.amount).toLocaleString('pt-BR')} {d.kind === 'coins' ? 'moedas' : 'diamantes'}</b> de presente para <Name n={d.to} /></>
        : <>Você enviou <b>{d.item}</b> de presente para <Name n={d.to} /></>;
      case 'gift_received': return d.kind === 'coins' || d.kind === 'diamonds'
        ? <><Name n={d.from} /> te enviou <b>{Number(d.amount).toLocaleString('pt-BR')} {d.kind === 'coins' ? 'moedas' : 'diamantes'}</b> de presente</>
        : <><Name n={d.from} /> te enviou um presente: <b>{d.item}</b></>;
      default: return <>{a.kind}</>;
    }
  };

  // mistura global + pessoal por data
  const merged = useMemo(() => (feed ? [
    ...feed.personal.map((a) => ({ ...a, _t: new Date(a.created_at).getTime(), _g: false })),
    ...feed.global.map((g) => ({ ...g, _t: new Date(g.created_at).getTime(), _g: true })),
  ].sort((a, b) => b._t - a._t) : []), [feed]);

  // aplica filtro por categoria e recorta a página atual
  const filtradas = useMemo(() => merged.filter((a) => {
    if (filtro === 'tudo') return true;
    const m = a._g ? META._global : (META[a.kind] || META._fallback);
    return m.cat === filtro;
  }), [merged, filtro]);
  const totalPaginas = Math.max(1, Math.ceil(filtradas.length / POR_PAGINA));
  const pag = Math.min(pagina, totalPaginas - 1);
  const visiveis = filtradas.slice(pag * POR_PAGINA, pag * POR_PAGINA + POR_PAGINA);

  // páginas do seletor (janela de 5 em volta da atual)
  const paginas = useMemo(() => {
    const ini = Math.max(0, Math.min(pag - 2, totalPaginas - 5));
    return Array.from({ length: Math.min(5, totalPaginas) }, (_, i) => ini + i);
  }, [pag, totalPaginas]);

  const quando = (iso) => `${new Date(iso).toLocaleDateString('pt-BR')} ${new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;

  return (
    <div className="scene dash">
      <Navbar profile={profile} />
      <h1 className="dash-name" style={{ marginBottom: 2 }}><Icon name="xp" size={22} weight="forte" /> ATIVIDADES</h1>
      <p className="dash-empty" style={{ marginTop: 0 }}>{profile.fighter_name} · Nível {profile.level}</p>

      {/* filtros por categoria */}
      <div className="act-filtros" role="tablist" aria-label="Filtrar atividades">
        {FILTROS.map(([id, l, ic]) => (
          <button
            key={id}
            role="tab"
            aria-selected={filtro === id}
            className={`act-filtro ${filtro === id ? 'on' : ''}`}
            onClick={() => setFiltro(id)}
          >
            <Icon name={ic} size={12} weight="forte" /> {l}
          </button>
        ))}
      </div>

      <div className="act-feed">
        {!feed && <p className="dash-empty">Abrindo o diário...</p>}
        {feed && filtradas.length === 0 && (
          <p className="dash-empty">{filtro === 'tudo' ? 'Nada por aqui ainda — vai lutar!' : 'Nada nessa categoria por enquanto.'}</p>
        )}
        {visiveis.map((a) => {
          const m = a._g ? META._global : (META[a.kind] || META._fallback);
          return (
            <div key={a._g ? `g${a.id}` : a.id} className={`act-card ${a._g ? 'act-global' : ''}`}>
              <span className="act-chip" style={{ '--act-cor': m.cor }}>
                <Icon name={m.icon} size={15} weight="forte" />
              </span>
              <span className="act-texto">{a._g ? <><b>STIKDEAD:</b> {a.body}</> : line(a)}</span>
              <small className="act-quando">{quando(a.created_at)}</small>
            </div>
          );
        })}
      </div>

      {/* paginação: ‹ 1 2 3 4 › */}
      {totalPaginas > 1 && (
        <nav className="act-pager" aria-label="Páginas">
          <button className="act-pg" disabled={pag === 0} onClick={() => setPagina(pag - 1)} aria-label="Página anterior">‹</button>
          {paginas.map((p) => (
            <button key={p} className={`act-pg ${p === pag ? 'on' : ''}`} onClick={() => setPagina(p)} aria-current={p === pag ? 'page' : undefined}>
              {p + 1}
            </button>
          ))}
          <button className="act-pg" disabled={pag >= totalPaginas - 1} onClick={() => setPagina(pag + 1)} aria-label="Próxima página">›</button>
        </nav>
      )}

      {card && <PlayerCard name={card} onClose={() => setCard(null)} />}
    </div>
  );
}
