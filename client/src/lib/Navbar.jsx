// STIKDEAD :: navbar do jogo — seções, moedas e identidade do jogador
import { NavLink, useNavigate } from 'react-router-dom';

const LINKS = [
  { to: '/lobby', label: 'Lobby', icon: '⚔️' },
  { to: '/inventario', label: 'Inventário', icon: '🎒' },
  { to: '/loja', label: 'Loja', icon: '🛒' },
  { to: '/missoes', label: 'Missões', icon: '📜' },
  { to: '/rankings', label: 'Ranking', icon: '🏆' },
];

export function Bottombar() {
  const nav = useNavigate();
  return (
    <nav className="bottombar" aria-label="Navegação">
      {LINKS.map((l) => (
        <NavLink key={l.to} to={l.to} className={({ isActive }) => (isActive ? 'on' : '')}>
          <span className="bb-ico">{l.icon}</span>
          <span className="bb-label">{l.label}</span>
        </NavLink>
      ))}
      <button className="bb-item" onClick={() => nav('/cla')}>
        <span className="bb-ico">🛡️</span>
        <span className="bb-label">Clã</span>
      </button>
    </nav>
  );
}

export default function Navbar({ profile }) {
  const nav = useNavigate();
  return (
    <>
    <header className="topnav">
      <button className="topnav-logo" onClick={() => nav('/perfil')}>
        <img src="/logo.webp" alt="STIKDEAD" />
      </button>
      <nav className="topnav-links">
        {LINKS.map((l) => (
          <NavLink key={l.to} to={l.to} className={({ isActive }) => (isActive ? 'on' : '')}>
            <span className="topnav-ico">{l.icon}</span>
            <span className="topnav-label">{l.label}</span>
          </NavLink>
        ))}
        <button className="topnav-link" onClick={() => nav('/cla')}>🛡️ Clã</button>
      </nav>
      <div className="topnav-right">
        <span className="topnav-wallet">
          <span className="topnav-coins">🪙 {Number(profile.coins).toLocaleString('pt-BR')}</span>
          <span className="topnav-diamonds">💎 {Number(profile.diamonds || 0).toLocaleString('pt-BR')}</span>
        </span>
        <button className="topnav-me" onClick={() => nav('/perfil')}>
          <span className="topnav-name">{profile.fighter_name}</span>
          <span className="topnav-level">Nv. {profile.level}</span>
        </button>
      </div>
    </header>
    <div className="topnav-spacer" aria-hidden="true" />
    </>
  );
}
