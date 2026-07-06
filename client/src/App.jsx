import { useEffect, useState, useCallback } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { api, getToken, clearToken } from './lib/api.js';
import { closeSocket } from './lib/socket.js';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import Profile from './pages/Profile.jsx';
import Battle from './pages/Battle.jsx';
import Lobby from './pages/Lobby.jsx';

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
      <Routes>
        <Route
          path="/"
          element={profile ? <Navigate to="/perfil" replace /> : <Login onAuth={setProfile} />}
        />
        <Route
          path="/criar-conta"
          element={profile ? <Navigate to="/perfil" replace /> : <Register onAuth={setProfile} />}
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
          path="/lobby"
          element={profile ? <Lobby profile={profile} onProfile={setProfile} /> : <Navigate to="/" replace />}
        />
        <Route
          path="/treino"
          element={profile ? <Battle profile={profile} onProfile={setProfile} /> : <Navigate to="/" replace />}
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
