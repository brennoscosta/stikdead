import { useEffect, useState, useCallback, lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
// Design System (Fase 2): a /vitrine é a sala de aprovação — carrega sob demanda
const Vitrine = lazy(() => import('./pages/Vitrine.jsx'));
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

  const refresh = useCallback(async () => {
    if (!getToken()) return setProfile(null);
    try {
      const { profile } = await api('/api/auth/me');
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
      {profile && <FriendAskModal />}
      <ExcellentTip />
    </BrowserRouter>
  );
}
