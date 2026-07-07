// STIKDEAD :: esqueci a senha (pedido) + redefinição (com token)
import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../lib/api.js';

export function Esqueci() {
  const nav = useNavigate();
  const [email, setEmail] = useState('');
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try { await api('/api/auth/forgot', { method: 'POST', body: { email } }); } catch { /* resposta é sempre ok */ }
    setDone(true);
    setBusy(false);
  };

  return (
    <div className="scene" style={{ justifyContent: 'center', minHeight: '100dvh' }}>
      <div className="card" style={{ maxWidth: 380, width: '100%' }}>
        <h2 style={{ marginTop: 0 }}>Esqueceu a senha?</h2>
        {done ? (
          <>
            <p style={{ color: 'var(--muted)', lineHeight: 1.6 }}>
              📬 Se este email tiver conta, o link de redefinição chega em instantes.
              Confere também a caixa de spam. O link vale por <b>1 hora</b>.
            </p>
            <button className="btn btn-ghost" onClick={() => nav('/')}>← Voltar ao login</button>
          </>
        ) : (
          <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <p style={{ color: 'var(--muted)', margin: 0 }}>Digite o email da sua conta e enviaremos o link para criar uma senha nova.</p>
            <input type="email" required placeholder="seu@email.com" value={email} onChange={(e) => setEmail(e.target.value)} />
            <button className="btn btn-blood" disabled={busy || !email}>{busy ? 'Enviando...' : 'Enviar link'}</button>
            <button type="button" className="btn btn-ghost" onClick={() => nav('/')}>← Voltar</button>
          </form>
        )}
      </div>
    </div>
  );
}

export function Redefinir() {
  const nav = useNavigate();
  const [params] = useSearchParams();
  const token = params.get('token') || '';
  const [pass, setPass] = useState('');
  const [pass2, setPass2] = useState('');
  const [err, setErr] = useState(null);
  const [ok, setOk] = useState(false);
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setErr(null);
    if (pass !== pass2) return setErr('As senhas não coincidem.');
    setBusy(true);
    try {
      await api('/api/auth/reset', { method: 'POST', body: { token, password: pass } });
      setOk(true);
    } catch (e2) { setErr(e2.message); }
    setBusy(false);
  };

  return (
    <div className="scene" style={{ justifyContent: 'center', minHeight: '100dvh' }}>
      <div className="card" style={{ maxWidth: 380, width: '100%' }}>
        <h2 style={{ marginTop: 0 }}>Nova senha</h2>
        {ok ? (
          <>
            <p style={{ color: '#7de0a8', fontWeight: 600 }}>✅ Senha redefinida com sucesso!</p>
            <button className="btn btn-blood" onClick={() => nav('/')}>Fazer login</button>
          </>
        ) : (
          <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <input type="password" required minLength={8} placeholder="Nova senha (mín. 8)" value={pass} onChange={(e) => setPass(e.target.value)} />
            <input type="password" required minLength={8} placeholder="Repita a nova senha" value={pass2} onChange={(e) => setPass2(e.target.value)} />
            {err && <p style={{ color: '#ff5a70', margin: 0, fontWeight: 600 }}>{err}</p>}
            <button className="btn btn-blood" disabled={busy || !pass}>{busy ? 'Salvando...' : 'Salvar nova senha'}</button>
          </form>
        )}
      </div>
    </div>
  );
}
