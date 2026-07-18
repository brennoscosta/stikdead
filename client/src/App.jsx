import { useEffect, useRef, useState, useCallback, lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Atmosphere, ATMO_POR_TELA } from './ds';
// Design System (Fase 2): a /vitrine é a sala de aprovação — carrega sob demanda
const Vitrine = lazy(() => import('./pages/Vitrine.jsx'));

// FASE 3: atmosfera contextual em todas as telas do meta-game.
// Fora: luta (o jogo É a atmosfera) e telas de auth (o hero pintado já é a arte).
const SEM_ATMO = new Set(['/', '/criar-conta', '/esqueci', '/redefinir', '/treino', '/vitrine']);
function AtmosferaGlobal() {
  const { pathname } = useLocation();
  if (SEM_ATMO.has(pathname)) return null;
  const nivel = ATMO_POR_TELA[pathname] || 'media';
  return <Atmosphere level={nivel} key={nivel + pathname} />;
}

// SISTEMA DE ÁUDIO: trilha + ambiente seguem a navegação.
// Nos menus tocam contínuos (sem reiniciar entre telas); na luta e no auth, silêncio
// dos loops — o combate tem os próprios sons. Singleton nos motores = nunca duplica.
import { startMusic, stopMusic } from './game/music.js';
import { startAmbience, stopAmbience } from './game/ambience.js';
import { applyRemoteSettings, musicForPath, preload } from './game/audioManager.js';
import { PRELOAD_UI, PRELOAD_COMBAT, arenaAtiva } from './game/audioLibrary.js';
import { initUiSounds } from './game/uiSounds.js';
const SEM_TRILHA = new Set(['/', '/criar-conta', '/esqueci', '/redefinir', '/treino', '/vitrine', '/calibrador']);
let uiPreloaded = false;
function AudioMood() {
  const { pathname } = useLocation();
  useEffect(() => {
    if (SEM_TRILHA.has(pathname)) { stopMusic(); stopAmbience(); return undefined; }
    // FASE 5: cada tela tem a própria trilha real (crossfade na troca);
    // o ambiente do lobby (9 camadas ElevenLabs) toca junto nos menus.
    const tenta = () => {
      // UPDATE 3.2: luta em andamento (PvP no /lobby) = a arena manda no som.
      // Sem isso, cada tecla apertada na luta religava o vento do lobby ("mar" no fundo).
      if (arenaAtiva()) return;
      startMusic(musicForPath(pathname));
      startAmbience();
      if (!uiPreloaded) { uiPreloaded = true; preload(PRELOAD_UI); preload(PRELOAD_COMBAT); initUiSounds(); } // aquece SFX + combate + hover global
    };
    tenta(); // se o áudio já está destravado, entra na hora
    window.addEventListener('pointerdown', tenta); // senão, no 1º gesto
    window.addEventListener('keydown', tenta);
    return () => { window.removeEventListener('pointerdown', tenta); window.removeEventListener('keydown', tenta); };
  }, [pathname]);
  return null;
}
import { Bottombar } from './lib/Navbar.jsx';
import Admin from './pages/Admin.jsx';
import Calibrador from './pages/Calibrador.jsx';
import Matches from './pages/Matches.jsx';
import { Esqueci, Redefinir } from './pages/Reset.jsx';
import Friends from './pages/Friends.jsx';
import Activities from './pages/Activities.jsx';
import Career from './pages/Career.jsx';
import Social from './pages/Social.jsx';
import ClanHall from './pages/ClanHall.jsx';
import ClanPublic from './pages/ClanPublic.jsx';
import GiftModal from './lib/GiftModal.jsx';
import ExcellentTip from './lib/ExcellentTip.jsx';
import FriendAskModal from './lib/FriendAskModal.jsx';
import PatentToast from './lib/PatentToast.jsx';
import { PATENTS } from '../../shared/patents.js';
import { api, getToken, clearToken } from './lib/api.js';
import { closeSocket } from './lib/socket.js';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import Profile from './pages/Profile.jsx';
import Battle from './pages/Battle.jsx';
import Lobby from './pages/Lobby.jsx';
import Shop from './pages/Shop.jsx';
import Inventory from './pages/Inventory.jsx';
import Missions from './pages/Missions.jsx';
import Rankings from './pages/Rankings.jsx';

export default function App() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(!!getToken());

  // UPDATE 3.0 — conquistas nunca chegam em silêncio: ao cruzar o nível de
  // uma patente, dispara o toast dourado (PatentToast escuta 'stik:patente')
  const nivelAnterior = useRef(null);
  useEffect(() => {
    const nv = profile?.level;
    if (nv == null) { nivelAnterior.current = null; return; }
    const antes = nivelAnterior.current;
    nivelAnterior.current = nv;
    if (antes == null || nv <= antes) return;
    for (const p of PATENTS) {
      if (p.level > antes && p.level <= nv) {
        window.dispatchEvent(new CustomEvent('stik:patente', { detail: { patent: p } }));
      }
    }
  }, [profile?.level]);

  // preferências de áudio do usuário: backend vence, localStorage é fallback.
  // Aplicadas UMA vez por sessão, antes de qualquer som dos menus.
  const audioAplicado = useRef(false);
  const refresh = useCallback(async () => {
    if (!getToken()) return setProfile(null);
    try {
      const { profile } = await api('/api/auth/me');
      if (!audioAplicado.current && profile?.audio_settings) {
        audioAplicado.current = true;
        applyRemoteSettings(profile.audio_settings);
      }
      setProfile(profile);
    } catch {
      clearToken();
      setProfile(null);
    }
  }, []);

  useEffect(() => {
    refresh().finally(() => setLoading(false));
  }, [refresh]);

  const logout = () => {
    closeSocket();
    clearToken();
    setProfile(null);
  };

  if (loading) return null;

  return (
    <BrowserRouter>
      {profile && <AtmosferaGlobal />}
      {profile && <AudioMood />}
      {profile && <Bottombar />}
      <Routes>
        <Route
          path="/"
          element={profile ? <Navigate to="/perfil" replace /> : <Login onAuth={setProfile} />}
        />
        <Route
          path="/criar-conta"
          element={profile ? <Navigate to="/perfil" replace /> : <Register onAuth={setProfile} />}
        />
        <Route path="/esqueci" element={<Esqueci />} />
        <Route path="/cla" element={profile ? <Friends profile={profile} /> : null} />
        <Route path="/atividades" element={profile ? <Activities profile={profile} /> : null} />
        <Route path="/carreira" element={profile ? <Career profile={profile} /> : null} />
        <Route path="/social" element={profile ? <Social profile={profile} /> : null} />
        <Route path="/social/amigos" element={profile ? <Friends profile={profile} /> : null} />
        <Route path="/social/cla" element={profile ? <ClanHall profile={profile} /> : null} />
        <Route path="/cla/:id" element={profile ? <ClanPublic profile={profile} /> : null} />
        <Route path="/redefinir" element={<Redefinir />} />
        <Route
          path="/partidas"
          element={profile ? <Matches profile={profile} /> : <Navigate to="/" replace />}
        />
        <Route
          path="/calibrador"
          element={profile ? <Calibrador profile={profile} /> : <Navigate to="/" replace />}
        />
        <Route
          path="/admin"
          element={profile ? <Admin profile={profile} /> : <Navigate to="/" replace />}
        />
        <Route
          path="/perfil"
          element={
            profile ? (
              <Profile profile={profile} onUpdate={setProfile} onLogout={logout} />
            ) : (
              <Navigate to="/" replace />
            )
          }
        />
        <Route
          path="/loja"
          element={profile ? <Shop profile={profile} onProfile={setProfile} /> : <Navigate to="/" replace />}
        />
        <Route
          path="/inventario"
          element={profile ? <Inventory profile={profile} /> : <Navigate to="/" replace />}
        />
        <Route
          path="/missoes"
          element={profile ? <Missions profile={profile} onProfile={setProfile} /> : <Navigate to="/" replace />}
        />
        <Route
          path="/rankings"
          element={profile ? <Rankings profile={profile} /> : <Navigate to="/" replace />}
        />
        <Route
          path="/lobby"
          element={profile ? <Lobby profile={profile} onProfile={setProfile} /> : <Navigate to="/" replace />}
        />
        <Route
          path="/treino"
          element={profile ? <Battle profile={profile} onProfile={setProfile} /> : <Navigate to="/" replace />}
        />
        <Route
          path="/vitrine"
          element={profile ? <Suspense fallback={null}><Vitrine /></Suspense> : <Navigate to="/" replace />}
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      {profile && <GiftModal />}
      {profile && <PatentToast />}
      {profile && <FriendAskModal />}
      <ExcellentTip />
    </BrowserRouter>
  );
}
