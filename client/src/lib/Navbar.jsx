// STIKDEAD :: navbar do jogo — seções, moedas e identidade do jogador
// FASE 3: emojis aposentados — iconografia oficial do StikDead Icon System.
import { NavLink, useNavigate } from 'react-router-dom';
import Icon from '../ds/Icon.jsx';

const LINKS = [
  { to: '/perfil', label: 'Início', icon: 'perfil', end: true },
  { to: '/lobby', label: 'Lobby', icon: 'lobby' },
  { to: '/inventario', label: 'Inventário', icon: 'inventario' },
  { to: '/loja', label: 'Loja', icon: 'loja' },
  { to: '/missoes', label: 'Missões', icon: 'missoes' },
  { to: '/rankings', label: 'Ranking', icon: 'ranking' },
];

export function Bottombar() {
  const nav = useNavigate();
  return (
    <nav className="bottombar" aria-label="Navegação">
      {LINKS.map((l) => (
        <NavLink key={l.to} to={l.to} end={l.end} className={({ isActive }) => (isActive ? 'on' : '')}>
          <span className="bb-ico"><Icon name={l.icon} size="sm" weight="forte" /></span>
          <span className="bb-label">{l.label}</span>
        </NavLink>
      ))}
      <button className="bb-item" onClick={() => nav('/social')}>
        <span className="bb-ico"><Icon name="amigos" size="sm" weight="forte" /></span>
        <span className="bb-label">Social</span>
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
          <NavLink key={l.to} to={l.to} end={l.end} className={({ isActive }) => (isActive ? 'on' : '')}>
            <span className="topnav-ico"><Icon name={l.icon} size="xs" weight="forte" /></span>
            <span className="topnav-label">{l.label}</span>
          </NavLink>
        ))}
        <button className="topnav-link" onClick={() => nav('/social')}>
          <Icon name="amigos" size="xs" weight="forte" /> Social
        </button>
      </nav>
      <div className="topnav-right">
        <span className="topnav-wallet">
          <span className="topnav-coins"><Icon name="moeda" size="xs" weight="forte" /> {Number(profile.coins).toLocaleString('pt-BR')}</span>
          <span className="topnav-diamonds"><Icon name="diamante" size="xs" weight="forte" /> {Number(profile.diamonds || 0).toLocaleString('pt-BR')}</span>
        </span>
        <button className="topnav-chip" onClick={() => nav('/atividades')} title="Suas atividades">
          <span className="topnav-chip-name">{profile.fighter_name}</span>
          <span className="topnav-chip-lv">Nv {profile.level}</span>
        </button>
      </div>
    </header>
    <div className="topnav-spacer" aria-hidden="true" />
    </>
  );
}
