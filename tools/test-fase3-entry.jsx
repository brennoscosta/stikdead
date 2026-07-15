// harness FASE 3: navbar real + classes legadas revestidas pela ponte
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import Navbar from '../client/src/lib/Navbar.jsx';
import { Atmosphere } from '../client/src/ds';
import '../client/src/styles.css';
import '../client/src/theme.css';

const profile = { coins: 89450, diamonds: 2370, fighter_name: 'BRENNO', level: 72 };
function Tela() {
  return (
    <BrowserRouter>
      <Navbar profile={profile} />
      <Atmosphere level="media" />
      <div className="sd-page" style={{ position: 'relative', zIndex: 2 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
          <div className="dash-card" style={{ padding: 18 }}>
            <h3>Resumo de carreira</h3>
            <div className="stat-grid" style={{ display: 'flex', gap: 18 }}>
              <div className="stat"><b>2.568</b><span>Vitórias</span></div>
              <div className="stat gold"><b>2.845</b><span>Pontos</span></div>
              <div className="stat"><b>71,5%</b><span>Win rate</span></div>
            </div>
            <button className="btn btn-blood" style={{ marginTop: 14, padding: '12px 26px' }}>Buscar partida</button>
          </div>
          <div className="dash-card" style={{ padding: 18 }}>
            <h3>Ranking</h3>
            <div style={{ display: 'grid', gap: 8, marginTop: 8 }}>
              <div className="rank-row"><span>1</span><span>SHADOW-X</span><span className="rank-pts">3.450</span></div>
              <div className="rank-row"><span>2</span><span>NINJA_BR</span><span className="rank-pts">3.240</span></div>
              <div className="rank-row"><span>3</span><span>BRENNO</span><span className="rank-pts">2.845</span></div>
              <div className="rank-row"><span>4</span><span>KILLER87</span><span className="rank-pts">2.650</span></div>
            </div>
          </div>
        </div>
      </div>
    </BrowserRouter>
  );
}
document.body.style.margin = '0';
const el = document.createElement('div');
document.body.appendChild(el);
createRoot(el).render(<Tela />);
setTimeout(() => { window.__pronto = true; }, 500);
