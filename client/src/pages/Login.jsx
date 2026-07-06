import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, setToken } from '../lib/api.js';
import { createHero } from '../game/hero.js';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

export function Brand() {
  const host = useRef(null);
  useEffect(() => {
    let alive = true;
    let hero = null;
    createHero(host.current).then((h) => {
      if (!alive) return h.destroy();
      hero = h;
    });
    return () => {
      alive = false;
      hero?.destroy();
    };
  }, []);
  return (
    <>
      <div className="hero-wrap">
        <div className="hero-canvas" ref={host} aria-hidden="true" />
        <div className="hero-title">
          <h1 className="brand">
            STIK<span className="red">DEAD</span>
          </h1>
          <div className="tagline hero-tagline">— LUTE. MORRA. EVOLUA. —</div>
        </div>
      </div>
    </>
  );
}

export function GoogleButton({ onAuth, onError }) {
  const slot = useRef(null);

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) return;
    const finish = async (response) => {
      try {
        const data = await api('/api/auth/google', {
          method: 'POST',
          body: { idToken: response.credential },
        });
        setToken(data.token);
        onAuth(data.profile);
      } catch (err) {
        onError(err.message);
      }
    };
    const init = () => {
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: finish,
      });
      window.google.accounts.id.renderButton(slot.current, {
        theme: 'filled_black',
        size: 'large',
        width: 370,
        text: 'continue_with',
        locale: 'pt-BR',
      });
    };
    if (window.google?.accounts) return init();
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.onload = init;
    document.head.appendChild(script);
  }, [onAuth, onError]);

  if (!GOOGLE_CLIENT_ID) return null;
  return (
    <>
      <div ref={slot} style={{ display: 'flex', justifyContent: 'center' }} />
      <div className="divider">OU</div>
    </>
  );
}

export default function Login({ onAuth }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const data = await api('/api/auth/login', { method: 'POST', body: { email, password } });
      setToken(data.token);
      onAuth(data.profile);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="scene">
      <Brand />
      <div className="card">
        <h2>Faça login para continuar</h2>
        {error && <div className="error" role="alert">{error}</div>}
        <GoogleButton onAuth={onAuth} onError={setError} />
        <form onSubmit={submit}>
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
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button className="btn btn-blood" disabled={busy}>
            {busy ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
        <p className="switch-line">
          Ainda não tem uma conta? <Link to="/criar-conta">Criar conta</Link>
        </p>
      </div>
      <div className="footer-links">Termos de uso · Política de privacidade</div>
    </div>
  );
}
