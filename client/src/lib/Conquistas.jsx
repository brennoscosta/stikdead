// STIKDEAD :: CONQUISTAS compactas — coleção premium, não uma página gigante.
// Uma categoria por vez (abas), página de 8/5/3 conquistas com setas internas,
// cabeçalho em linha única e detalhes só no modal. ~300px de altura total.
import { memo, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PATENTS } from '../../../shared/patents.js';
import Icon from '../ds/Icon.jsx';
import AchievementIcon from './AchievementIcon.jsx';

const RAR_ATO = { 'A RUA': 'Comum', 'O DOJO': 'Incomum', 'A ARENA': 'Raro', 'A LENDA': 'Épico', 'A MORTE': 'Lendário' };
const RAR_COR = { Comum: '#9a8f88', Incomum: '#7de0a8', Raro: '#5bb8ff', 'Épico': '#b98cff', 'Lendário': '#ffd76a' };
const ATOS = ['A RUA', 'O DOJO', 'A ARENA', 'A LENDA', 'A MORTE'];
const FILTROS = [['todos', 'TODOS'], ['obtidos', 'OBTIDOS'], ['progresso', 'EM PROGRESSO'], ['raros', 'RAROS'], ['secretos', 'SECRETOS']];

// 8 por página no desktop, 5 no tablet, 3 no mobile (item 3 do brief)
function usePageSize() {
  const calc = () => (window.matchMedia('(max-width: 560px)').matches ? 3
    : window.matchMedia('(max-width: 1024px)').matches ? 5 : 8);
  const [n, setN] = useState(calc);
  useEffect(() => {
    const mqs = [window.matchMedia('(max-width: 560px)'), window.matchMedia('(max-width: 1024px)')];
    const f = () => setN(calc());
    mqs.forEach((m) => m.addEventListener('change', f));
    return () => mqs.forEach((m) => m.removeEventListener('change', f));
  }, []);
  return n;
}

const Tile = memo(function Tile({ p, e, onOpen }) {
  return (
    <button className={`cq-tile ${e.obtida ? 'won' : ''}`} onClick={() => onOpen(p)}
      title={e.obtida ? `${p.name} — nível ${p.level}` : e.secreta ? '??? — conquista secreta' : `${p.name} — nível ${p.level} (${e.pct}%)`}>
      <AchievementIcon patent={p} cor={e.cor} unlocked={e.obtida} progress={e.pct} secret={e.secreta} size={46} />
      <small className="cq-tile-nome">{e.obtida || !e.secreta ? p.name : '???'}</small>
    </button>
  );
});

export default function Conquistas({ profile }) {
  const nav = useNavigate();
  const nivel = profile.level;
  const [ato, setAto] = useState(() => {
    // abre na categoria onde o jogador está progredindo agora
    const atual = PATENTS.find((p) => nivel < p.level);
    return atual ? atual.ato : ATOS[ATOS.length - 1];
  });
  const [filtro, setFiltro] = useState('todos');
  const [pag, setPag] = useState(0);
  const [sel, setSel] = useState(null);
  const porPagina = usePageSize();

  const estado = useMemo(() => {
    const m = new Map();
    for (const p of PATENTS) {
      const obtida = nivel >= p.level;
      const secreta = !obtida && p.level > nivel + 20;
      const rar = RAR_ATO[p.ato];
      m.set(p.id, { obtida, secreta, rar, cor: RAR_COR[rar], pct: obtida ? 100 : Math.min(99, Math.floor((nivel / p.level) * 100)) });
    }
    return m;
  }, [nivel]);

  const passaFiltro = (p) => {
    const e = estado.get(p.id);
    if (filtro === 'obtidos') return e.obtida;
    if (filtro === 'progresso') return !e.obtida && !e.secreta;
    if (filtro === 'raros') return ['Raro', 'Épico', 'Lendário'].includes(e.rar);
    if (filtro === 'secretos') return e.secreta;
    return true;
  };

  // só a categoria ativa é montada (item 9: performance)
  const daCategoria = useMemo(() => PATENTS.filter((p) => p.ato === ato).filter(passaFiltro), [ato, filtro, estado]);
  const totalPag = Math.max(1, Math.ceil(daCategoria.length / porPagina));
  const pagina = Math.min(pag, totalPag - 1);
  const visiveis = daCategoria.slice(pagina * porPagina, pagina * porPagina + porPagina);
  useEffect(() => { setPag(0); }, [ato, filtro, porPagina]);

  const obtidas = useMemo(() => PATENTS.filter((p) => nivel >= p.level).length, [nivel]);

  return (
    <section className="conq-wrap cq2">
      {/* cabeçalho em UMA linha: título · progresso geral · filtros */}
      <div className="cq-head">
        <button className="conq-title-link" onClick={() => nav('/carreira')} title="Ver a carreira completa">
          <Icon name="trofeu" size={16} weight="forte" className="h2-ico" /> CONQUISTAS <span className="conq-arrow">›</span>
        </button>
        <span className="cq-geral">
          <b>{obtidas}/{PATENTS.length}</b> PATENTES
          <i className="cq-geral-bar"><span style={{ width: `${(obtidas / PATENTS.length) * 100}%` }} /></i>
        </span>
        <div className="conq-filtros" role="tablist" aria-label="Filtrar conquistas">
          {FILTROS.map(([id, l]) => (
            <button key={id} role="tab" aria-selected={filtro === id}
              className={`conq-filtro ${filtro === id ? 'on' : ''}`} onClick={() => setFiltro(id)}>{l}</button>
          ))}
        </div>
      </div>

      {/* abas de categoria — troca no MESMO espaço, nunca empilha */}
      <div className="cq-abas" role="tablist" aria-label="Categorias">
        {ATOS.map((a) => {
          const doAto = PATENTS.filter((p) => p.ato === a);
          const ganhas = doAto.filter((p) => nivel >= p.level).length;
          const cor = RAR_COR[RAR_ATO[a]];
          return (
            <button key={a} role="tab" aria-selected={ato === a}
              className={`cq-aba ${ato === a ? 'on' : ''}`} style={{ '--cat-cor': cor }}
              onClick={() => setAto(a)}>
              <b>{a}</b><em>{ganhas}/{doAto.length}</em>
            </button>
          );
        })}
      </div>

      {/* página da categoria ativa: 8/5/3 tiles + setas internas */}
      <div key={`${ato}-${filtro}-${pagina}`} className="cq-pagina">
        {visiveis.length === 0 && <p className="dash-empty" style={{ margin: '18px auto' }}>Nada nessa combinação de categoria e filtro.</p>}
        {visiveis.map((p) => <Tile key={p.id} p={p} e={estado.get(p.id)} onOpen={setSel} />)}
      </div>
      {totalPag > 1 && (
        <div className="cq-pager">
          <button className="act-pg" disabled={pagina === 0} onClick={() => setPag(pagina - 1)} aria-label="Anterior">‹</button>
          <small>{pagina + 1}/{totalPag}</small>
          <button className="act-pg" disabled={pagina >= totalPag - 1} onClick={() => setPag(pagina + 1)} aria-label="Próxima">›</button>
        </div>
      )}

      {/* modal compacto: TODOS os detalhes vivem aqui, não no grid */}
      {sel && (() => {
        const e = estado.get(sel.id);
        return (
          <div className="pc-overlay" style={{ zIndex: 470 }} onClick={() => setSel(null)}>
            <div className="conq-modal" style={{ '--cat-cor': e.cor }} onClick={(ev) => ev.stopPropagation()}>
              <button className="av-close" onClick={() => setSel(null)} aria-label="Fechar"><Icon name="fechar" size={16} /></button>
              <span className="conq-modal-arte">
                {e.obtida
                  ? <img src={sel.icon} alt="" onError={(ev) => { ev.currentTarget.style.display = 'none'; }} />
                  : <span className="conq-tile-lock"><Icon name="cadeado" size={30} /></span>}
              </span>
              <span className="conq-modal-rar">{e.rar} · {sel.ato}</span>
              <h3 className="conq-modal-nome">{e.obtida || !e.secreta ? sel.name : '???'}</h3>
              <p className="conq-modal-desc">
                {e.secreta && !e.obtida ? 'Conquista secreta — continue evoluindo para revelar seu segredo.' : sel.desc}
              </p>
              <div className="conq-modal-prog">
                <i className="conq-tile-bar"><span style={{ width: `${e.pct}%` }} /></i>
                <small>{e.obtida ? '✓ Obtida' : `${e.pct}% · Nível ${nivel}/${sel.level}`}</small>
              </div>
              <div className="conq-modal-meta">
                <span><small>REQUISITO</small><b>Nível {sel.level}</b></span>
                {e.obtida && <span><small>DESBLOQUEIO</small><b>Ao atingir o nível {sel.level}</b></span>}
                <span><small>RECOMPENSA</small><b>Título «{e.obtida || !e.secreta ? sel.name : '???'}»</b></span>
              </div>
            </div>
          </div>
        );
      })()}
    </section>
  );
}
