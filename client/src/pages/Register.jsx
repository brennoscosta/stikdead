import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api, setToken } from '../lib/api.js';
import { Brand, GoogleButton } from './Login.jsx';

export default function Register({ onAuth }) {
  const [fighterName, setFighterName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const data = await api('/api/auth/register', {
        method: 'POST',
        body: { email, password, fighterName },
      });
      setToken(data.token);
      onAuth(data.profile);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="scene login-scene" style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', padding: '16px', position: 'relative', background: '#050304', overflow: 'hidden' }}>
      <img src="/login-bg.webp" alt="" aria-hidden="true" style={{ position: 'fixed', inset: 0, width: '100%', height: '100%', objectFit: 'contain', objectPosition: 'center top', pointerEvents: 'none', zIndex: 0 }} />
      <Brand />
      <div className="card" style={{ position: 'relative', zIndex: 1 }}>
        <h2>Crie seu lutador</h2>
        {error && <div className="error" role="alert">{error}</div>}
        <GoogleButton onAuth={onAuth} onError={setError} />
        <form onSubmit={submit}>
          <div className="field">
            <label htmlFor="fighterName">Nome de lutador</label>
            <input
              id="fighterName"
              value={fighterName}
              onChange={(e) => setFighterName(e.target.value)}
              placeholder="3 a 16 caracteres: letras, números e _"
              maxLength={16}
              required
            />
          </div>
          <div className="field">
            <label htmlFor="email">E-mail</label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="field">
            <label htmlFor="password">Senha</label>
            <input
              id="password"
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mínimo de 8 caracteres"
              minLength={8}
              required
            />
          </div>
          <button className="btn btn-blood" disabled={busy}>
            {busy ? 'Criando...' : 'Entrar na arena'}
          </button>
        </form>
        <p className="switch-line">
          Já tem uma conta? <Link to="/">Fazer login</Link>
        </p>
      </div>
      <div className="footer-links">Termos de uso · Política de privacidade</div>
    </div>
  );
}
