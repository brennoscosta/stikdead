// STIKDEAD :: SOCIAL — hub social: salões, atalhos e convites (UPDATE 3.5)
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api.js';
import Navbar from '../lib/Navbar.jsx';
import Icon from '../ds/Icon.jsx';
import { playUi } from '../game/audioLibrary.js';

export default function Social({ profile }) {
  const nav = useNavigate();
  const [meu, setMeu] = useState(null);
  const [modal, setModal] = useState(null); // 'convite' | 'cla' | null
  const [copiado, setCopiado] = useState(false);
  useEffect(() => { api('/api/clans/mine').then(setMeu).catch(() => {}); }, []);

  const abrir = (m) => { playUi('ui_panel_open_01'); setModal(m); setCopiado(false); };
  const fechar = () => { playUi('ui_panel_close_01'); setModal(null); };
  const ir = (to) => { playUi('ui_nav_header_01'); nav(to); };

  const copiarConvite = async () => {
    const texto = `Vem lutar comigo no STIKDEAD! ⚔️ Sou ${profile.fighter_name} lá dentro. https://game.stikdead.com`;
    try { await navigator.clipboard.writeText(texto); setCopiado(true); playUi('ui_confirm_01'); }
    catch { playUi('ui_error_01'); }
  };

  return (
    <div className="scene dash">
      <Navbar profile={profile} />
      <header className="soc2-topo">
        <h1><Icon name="amigos" size={22} weight="forte" /> SOCIAL</h1>
        <p>Dois salões, uma irmandade. Escolhe onde a tua lâmina descansa.</p>
      </header>

      {/* ===== salões principais ===== */}
      <div className="soc-grid">
        <button className="soc-card soc2-hero" onClick={() => ir('/social/amigos')}>
          <span className="soc2-hero-ico"><Icon name="amigos" size={40} weight="forte" /></span>
          <span className="soc-title">AMIGOS</span>
          <span className="soc-desc">O salão da tua turma: praça ao vivo, papo, sussurros e presentes.</span>
          <span className="soc2-cta">ENTRAR NO SALÃO →</span>
        </button>
        <button className="soc-card soc2-hero" onClick={() => ir('/social/cla')}>
          <span className="soc2-hero-ico"><Icon name="escudo" size={40} weight="forte" /></span>
          <span className="soc-title">CLÃ</span>
          <span className="soc-desc">
            {meu?.clan
              ? <>Bandeira hasteada: <b style={{ color: '#ffd76a' }}>{meu.clan.name}</b> — entra no quartel.</>
              : 'Funde o teu clã ou aguarde um convite de guerra.'}
          </span>
          <span className="soc2-cta">{meu?.clan ? 'IR AO QUARTEL →' : 'VER COMO FUNCIONA →'}</span>
        </button>
      </div>

      {/* ===== atalhos rápidos ===== */}
      <div className="soc2-links">
        <button onClick={() => ir('/atividades')}><Icon name="aura" size={17} weight="forte" /> Atividades</button>
        <button onClick={() => ir('/carreira')}><Icon name="conquista" size={17} weight="forte" /> Carreira</button>
        <button onClick={() => ir('/partidas')}><Icon name="espada" size={17} weight="forte" /> Partidas</button>
        <button onClick={() => ir('/rankings')}><Icon name="ranking" size={17} weight="forte" /> Ranking</button>
        <button className="soc2-destaque" onClick={() => abrir('convite')}><Icon name="favorito" size={17} weight="forte" /> Convidar amigo</button>
        <button onClick={() => abrir('cla')}><Icon name="escudo" size={17} weight="forte" /> Regras de clã</button>
      </div>

      {/* ===== modal: convidar amigo ===== */}
      {modal === 'convite' && (
        <div className="pc-overlay" onClick={fechar}>
          <div className="soc2-modal" onClick={(e) => e.stopPropagation()}>
            <span className="soc2-modal-ico"><Icon name="favorito" size={34} weight="forte" /></span>
            <h2>CHAMA PRA LUTA</h2>
            <p>Manda o convite pro teu amigo e resolve quem manda na arena.</p>
            <div className="soc2-convite">Vem lutar comigo no STIKDEAD! ⚔️<br /><b>game.stikdead.com</b></div>
            <button className="btn btn-primary soc2-modal-btn" onClick={copiarConvite}>
              {copiado ? '✓ COPIADO — AGORA É SÓ MANDAR' : 'COPIAR CONVITE'}
            </button>
            <button className="soc2-modal-fechar" onClick={fechar}>FECHAR</button>
          </div>
        </div>
      )}

      {/* ===== modal: regras de clã ===== */}
      {modal === 'cla' && (
        <div className="pc-overlay" onClick={fechar}>
          <div className="soc2-modal" onClick={(e) => e.stopPropagation()}>
            <span className="soc2-modal-ico"><Icon name="escudo" size={34} weight="forte" /></span>
            <h2>CÓDIGO DOS CLÃS</h2>
            <ul className="soc2-regras">
              <li><b>Fundar</b> um clã exige nível <b>10+</b> — o fundador vira o líder da bandeira.</li>
              <li><b>Entrar</b> num clã exige nível <b>5+</b> e um convite de quem já está dentro.</li>
              <li>O quartel tem praça própria, chat da irmandade e mural de conquistas.</li>
              <li>Honra acima de tudo: sair de um clã em guerra mancha o teu título.</li>
            </ul>
            <button className="btn btn-primary soc2-modal-btn" onClick={() => { fechar(); nav('/social/cla'); }}>
              {meu?.clan ? 'IR AO MEU QUARTEL' : 'VER O SALÃO DOS CLÃS'}
            </button>
            <button className="soc2-modal-fechar" onClick={fechar}>FECHAR</button>
          </div>
        </div>
      )}
    </div>
  );
}
