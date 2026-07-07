// STIKDEAD :: Painel Administrativo — controle total (acesso: dono)
import { useEffect, useState } from 'react';
import Navbar from '../lib/Navbar.jsx';
import { api } from '../lib/api.js';

const TABS = ['Dashboard', 'Usuários', 'Itens', 'Mapas', 'Pagamentos', 'Emails'];
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
  const [emailInfo, setEmailInfo] = useState(null);
  const [emSubject, setEmSubject] = useState('');
  const [emMsg, setEmMsg] = useState('');
  const [emPreview, setEmPreview] = useState('');
  const [emBusy, setEmBusy] = useState(false);
  const [emNotice, setEmNotice] = useState(null);
  const emSend = async (test) => {
    if (!test && !confirm(`Enviar para TODOS os ${emailInfo?.recipients || 0} usuários?`)) return;
    setEmBusy(true); setEmNotice(null);
    try {
      const r = await api('/api/admin/emails/send', { method: 'POST', body: { subject: emSubject, message: emMsg, test } });
      setEmNotice({ ok: true, text: test ? 'Teste enviado para o seu email!' : `Enviado para ${r.sent} de ${r.total} usuários.` });
    } catch (e) { setEmNotice({ ok: false, text: e.message }); }
    setEmBusy(false);
  };
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
      if (tab === 'Emails') setEmailInfo(await api('/api/admin/emails/status'));
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

      {tab === 'Emails' && (
        <div className="adm-block em-block">
          <div className="adm-stats" style={{ marginBottom: 14 }}>
            <div className="adm-stat"><b>{emailInfo?.enabled ? '✅ ativo' : '⚠️ sem chave'}</b> <span>SendGrid</span></div>
            <div className="adm-stat"><b>{emailInfo?.recipients ?? '—'}</b> <span>destinatários</span></div>
          </div>
          <div className="em-compose">
            <input className="em-subject" placeholder="Assunto do email" value={emSubject} onChange={(e) => setEmSubject(e.target.value)} />
            <textarea className="em-body" rows={8} placeholder="Escreva a mensagem... (o topo com a logo e o rodapé já estão prontos no template)" value={emMsg} onChange={(e) => setEmMsg(e.target.value)} />
            <div className="em-actions">
              <button className="btn btn-ghost" style={{ width: 'auto', padding: '10px 18px' }} disabled={!emMsg}
                onClick={async () => { const r = await api('/api/admin/emails/preview', { method: 'POST', body: { message: emMsg } }); setEmPreview(r.html); }}>
                👁 Pré-visualizar
              </button>
              <button className="btn btn-ghost" style={{ width: 'auto', padding: '10px 18px' }} disabled={emBusy || !emSubject || !emMsg} onClick={() => emSend(true)}>
                ✉️ Enviar teste (para mim)
              </button>
              <button className="btn btn-blood" style={{ width: 'auto', padding: '10px 22px' }} disabled={emBusy || !emSubject || !emMsg || !emailInfo?.enabled} onClick={() => emSend(false)}>
                🚀 Enviar para todos
              </button>
            </div>
            {emNotice && <p className={emNotice.ok ? 'em-ok' : 'em-err'}>{emNotice.text}</p>}
          </div>
          {emPreview && (
            <div className="em-preview">
              <p className="dash-empty" style={{ marginBottom: 6 }}>Pré-visualização (como o jogador recebe):</p>
              <iframe title="preview" srcDoc={emPreview} style={{ width: '100%', height: 560, border: '1px solid var(--line)', borderRadius: 12, background: '#0b0709' }} />
            </div>
          )}
        </div>
      )}
      {tab === 'Pagamentos' && payments && (
        <div className="adm-block pay-block">
          <div className="adm-stats pay-stats">
            <div className="adm-stat"><b>R$ {(payments.totals.receita_cents / 100).toFixed(2).replace('.', ',')}</b> <span>receita total</span></div>
            <div className="adm-stat"><b>R$ {(Number(payments.totals.receita_hoje_cents || 0) / 100).toFixed(2).replace('.', ',')}</b> <span>receita hoje</span></div>
            <div className="adm-stat"><b>{payments.totals.pagos}</b> <span>pagos</span></div>
            <div className="adm-stat"><b>{payments.totals.pendentes}</b> <span>pendentes</span></div>
          </div>
          <div className="pay-list">
            {payments.orders.map((o) => (
              <div key={o.id} className={`pay-card s-${o.status}`}>
                <div className="pay-when">
                  {new Date(o.created_at).toLocaleDateString('pt-BR')}<br />
                  <small>{new Date(o.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</small>
                </div>
                <div className="pay-who">
                  <b>{o.fighter_name || '—'}</b>
                  <small>{o.email}</small>
                  {o.mp_payment_id && <small className="pay-txid" title="Nº da transação no Mercado Pago">MP #{o.mp_payment_id}</small>}
                </div>
                <div className="pay-what">
                  <b>💎 {o.diamonds}</b>
                  <small>{o.pack_id}</small>
                </div>
                <div className="pay-value">R$ {(o.amount_cents / 100).toFixed(2).replace('.', ',')}</div>
                <div className="pay-status">
                  <span className={`adm-pay-badge s-${o.status}`}>
                    {o.status === 'paid' ? '✅ pago' : o.status === 'pending' ? '⏳ pendente' : '❌ ' + o.status}
                  </span>
                  {o.paid_at && <small>{new Date(o.paid_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</small>}
                  {o.status === 'pending' && <button className="adm-btn" onClick={() => checkOrder(o.id)}>↻ verificar</button>}
                </div>
              </div>
            ))}
          </div>
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
