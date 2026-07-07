// STIKDEAD :: Painel Administrativo — controle total (acesso: dono)
import { useEffect, useState } from 'react';
import Navbar from '../lib/Navbar.jsx';
import { api } from '../lib/api.js';

const TABS = ['Dashboard', 'Usuários', 'Itens', 'Mapas', 'Pagamentos'];
const fmt = (n) => Number(n).toLocaleString('pt-BR');

function Editable({ value, onSave, type = 'text', width = 90 }) {
  const [v, setV] = useState(value);
  const [busy, setBusy] = useState(false);
  useEffect(() => setV(value), [value]);
  const dirty = String(v) !== String(value);
  return (
    <span className="adm-edit">
      <input
        type={type}
        value={v ?? ''}
        style={{ width }}
        onChange={(e) => setV(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && dirty && onSave(v)}
      />
      {dirty && (
        <button
          className="adm-save"
          disabled={busy}
          onClick={async () => { setBusy(true); await onSave(v); setBusy(false); }}
        >✓</button>
      )}
    </span>
  );
}

export default function Admin({ profile }) {
  const [tab, setTab] = useState('Dashboard');
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [items, setItems] = useState([]);
  const [arenas, setArenas] = useState([]);
  const [payments, setPayments] = useState(null);
  const checkOrder = async (id) => { await api(`/api/admin/payments/${id}/check`, { method: 'POST' }); setPayments(await api('/api/admin/payments')); };
  const [term, setTerm] = useState('');
  const [err, setErr] = useState('');

  const load = async () => {
    try {
      setErr('');
      if (tab === 'Dashboard') setStats(await api('/api/admin/stats'));
      if (tab === 'Usuários') setUsers((await api(`/api/admin/users?q=${encodeURIComponent(term)}`)).users);
      if (tab === 'Itens') setItems((await api('/api/admin/items')).items);
      if (tab === 'Mapas') setArenas((await api('/api/admin/arenas')).arenas);
      if (tab === 'Pagamentos') setPayments(await api('/api/admin/payments'));
    } catch (e) { setErr(e.message); }
  };
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [tab]);

  const saveUser = (id, field) => async (val) => {
    try {
      const num = ['level', 'xp', 'coins', 'rank_points'].includes(field);
      await api(`/api/admin/users/${id}`, { method: 'PATCH', body: { [field]: num ? Number(val) : val } });
      load();
    } catch (e) { setErr(e.message); }
  };
  const saveItem = (id, field) => async (val) => {
    try {
      await api(`/api/admin/items/${id}`, { method: 'PATCH', body: { [field]: field === 'price' || field === 'sort' ? Number(val) : val } });
      load();
    } catch (e) { setErr(e.message); }
  };

  return (
    <div className="scene scene-nav">
      <Navbar profile={profile} />
      <h1 className="brand" style={{ fontSize: 'clamp(30px, 6vw, 44px)' }}>
        PAINEL <span className="red">ADMIN</span>
      </h1>
      <div className="shop-filters" style={{ marginBottom: 18 }}>
        {TABS.map((t) => (
          <button key={t} className={`filter ${tab === t ? 'on' : ''}`} onClick={() => setTab(t)}>{t}</button>
        ))}
      </div>
      {err && <div className="shop-notice err">{err}</div>}

      {tab === 'Dashboard' && stats && (
        <div className="adm-stats">
          {[
            ['Total de cadastros', stats.total_usuarios],
            ['Cadastros hoje', stats.cadastros_hoje],
            ['Conectados hoje', stats.conectados_hoje],
            ['Partidas hoje', stats.partidas_hoje],
            ['Itens no catálogo', stats.total_itens],
            ['Moedas em circulação', fmt(stats.moedas_em_circulacao)],
          ].map(([label, val]) => (
            <div key={label} className="dash-card adm-stat">
              <div className="adm-stat-n">{val}</div>
              <div className="adm-stat-l">{label}</div>
            </div>
          ))}
        </div>
      )}

      {tab === 'Usuários' && (
        <>
          <div style={{ display: 'flex', gap: 8, marginBottom: 12, width: '100%', maxWidth: 1100 }}>
            <input
              placeholder="Buscar por e-mail ou nome..."
              value={term}
              onChange={(e) => setTerm(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && load()}
              style={{ flex: 1, padding: '10px 14px', borderRadius: 8 }}
            />
            <button className="btn btn-blood" style={{ width: 'auto', padding: '10px 20px' }} onClick={load}>Buscar</button>
          </div>
          <div className="adm-table-wrap">
            <table className="adm-table">
              <thead><tr><th>ID</th><th>E-mail</th><th>Nome</th><th>Nv</th><th>XP</th><th>Moedas</th><th>Estilo</th><th>Pts</th><th>Tier</th><th>Criado</th><th>Último login</th></tr></thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id}>
                    <td>{u.id}</td>
                    <td className="adm-email">{u.email}</td>
                    <td><Editable value={u.fighter_name} onSave={saveUser(u.id, 'fighter_name')} width={110} /></td>
                    <td><Editable value={u.level} type="number" onSave={saveUser(u.id, 'level')} width={52} /></td>
                    <td><Editable value={u.xp} type="number" onSave={saveUser(u.id, 'xp')} width={70} /></td>
                    <td><Editable value={u.coins} type="number" onSave={saveUser(u.id, 'coins')} width={86} /></td>
                    <td><Editable value={u.style} onSave={saveUser(u.id, 'style')} width={82} /></td>
                    <td><Editable value={u.rank_points} type="number" onSave={saveUser(u.id, 'rank_points')} width={62} /></td>
                    <td><Editable value={u.tier} onSave={saveUser(u.id, 'tier')} width={92} /></td>
                    <td className="adm-dim">{new Date(u.created_at).toLocaleDateString('pt-BR')}</td>
                    <td className="adm-dim">{u.last_login_at ? new Date(u.last_login_at).toLocaleString('pt-BR') : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {tab === 'Itens' && (
        <div className="adm-table-wrap">
          <table className="adm-table">
            <thead><tr><th>ID</th><th>Nome</th><th>Slot</th><th>Raridade</th><th>Preço</th><th>Ordem</th></tr></thead>
            <tbody>
              {items.map((it) => (
                <tr key={it.id}>
                  <td className="adm-dim">{it.id}</td>
                  <td><Editable value={it.name} onSave={saveItem(it.id, 'name')} width={190} /></td>
                  <td><Editable value={it.slot} onSave={saveItem(it.id, 'slot')} width={74} /></td>
                  <td><Editable value={it.rarity} onSave={saveItem(it.id, 'rarity')} width={82} /></td>
                  <td><Editable value={it.price} type="number" onSave={saveItem(it.id, 'price')} width={84} /></td>
                  <td><Editable value={it.sort} type="number" onSave={saveItem(it.id, 'sort')} width={56} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'Pagamentos' && payments && (
        <div className="adm-block">
          <div className="adm-stats" style={{ marginBottom: 14 }}>
            <div className="adm-stat"><b>R$ {(payments.totals.receita_cents / 100).toFixed(2).replace('.', ',')}</b><span>receita total</span></div>
            <div className="adm-stat"><b>{payments.totals.pagos}</b><span>pagos</span></div>
            <div className="adm-stat"><b>{payments.totals.pendentes}</b><span>pendentes</span></div>
          </div>
          <table className="adm-table">
            <thead><tr><th>Data/Hora</th><th>Comprador</th><th>Pack</th><th>💎</th><th>Valor</th><th>Status</th><th></th></tr></thead>
            <tbody>
              {payments.orders.map((o) => (
                <tr key={o.id}>
                  <td>{new Date(o.created_at).toLocaleDateString('pt-BR')} {new Date(o.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</td>
                  <td>{o.fighter_name || '—'}<br /><small style={{ color: 'var(--muted)' }}>{o.email}</small></td>
                  <td>{o.pack_id}</td>
                  <td>{o.diamonds}</td>
                  <td>R$ {(o.amount_cents / 100).toFixed(2).replace('.', ',')}</td>
                  <td>
                    <span className={`adm-pay-badge s-${o.status}`}>
                      {o.status === 'paid' ? '✅ pago' : o.status === 'pending' ? '⏳ pendente' : '❌ ' + o.status}
                    </span>
                  </td>
                  <td>{o.status === 'pending' && <button className="adm-btn" onClick={() => checkOrder(o.id)}>↻ verificar</button>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {tab === 'Mapas' && (
        <div className="adm-table-wrap">
          <table className="adm-table">
            <thead><tr><th>ID</th><th>Nome</th><th>Arte</th></tr></thead>
            <tbody>
              {arenas.map((a) => (
                <tr key={a.id}>
                  <td className="adm-dim">{a.id}</td>
                  <td>{a.label}</td>
                  <td><a className="adm-link" href={`/arenas/${a.id}.webp`} target="_blank" rel="noreferrer">ver imagem ↗</a></td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="dash-empty" style={{ marginTop: 10 }}>
            A arte dos mapas vive em assets do cliente — para trocar, use a fábrica (<code>--group=arenas --force</code>).
          </p>
        </div>
      )}
    </div>
  );
}
