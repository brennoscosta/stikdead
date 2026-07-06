import { useState } from 'react';
import { api } from '../lib/api.js';

const TIER_LABEL = {
  BRONZE_III: 'Bronze III',
  BRONZE_II: 'Bronze II',
  BRONZE_I: 'Bronze I',
};

const xpForNext = (level) => level * 500;

export default function Profile({ profile, onUpdate, onLogout }) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(profile.fighter_name);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const need = xpForNext(profile.level);
  const pct = Math.min(100, Math.round((profile.xp / need) * 100));

  const saveName = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const data = await api('/api/auth/me', { method: 'PATCH', body: { fighterName: name } });
      onUpdate(data.profile);
      setEditing(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="scene">
      <h1 className="brand" style={{ fontSize: 'clamp(40px, 8vw, 60px)' }}>
        STIK<span className="red">DEAD</span>
      </h1>
      <div className="card profile-card">
        <div className="profile-head">
          <div className="mascot" aria-hidden="true" />
          <div>
            <h2 className="fighter-name" style={{ textAlign: 'left' }}>
              {profile.fighter_name}
            </h2>
            <div className="fighter-sub">Nível {profile.level}</div>
            <span className="tier-badge">{TIER_LABEL[profile.tier] || profile.tier}</span>
          </div>
        </div>

        <div className="xp-track" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
          <div className="xp-fill" style={{ width: `${pct}%` }} />
        </div>
        <div className="xp-label">
          <span>EXP</span>
          <span>
            {profile.xp} / {need}
          </span>
        </div>

        <div className="stat-grid">
          <div className="stat">
            <b>{profile.wins}</b>
            <span>Vitórias</span>
          </div>
          <div className="stat">
            <b>{profile.losses}</b>
            <span>Derrotas</span>
          </div>
          <div className="stat">
            <b>{profile.rank_points}</b>
            <span>Pontos</span>
          </div>
          <div className="stat gold">
            <b>{profile.coins}</b>
            <span>Moedas</span>
          </div>
        </div>

        {error && <div className="error" role="alert">{error}</div>}

        {editing ? (
          <form onSubmit={saveName}>
            <div className="field">
              <label htmlFor="newName">Novo nome de lutador</label>
              <input
                id="newName"
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={16}
                required
              />
            </div>
            <button className="btn btn-blood" disabled={busy}>
              {busy ? 'Salvando...' : 'Salvar nome'}
            </button>
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => {
                setEditing(false);
                setName(profile.fighter_name);
                setError('');
              }}
            >
              Cancelar
            </button>
          </form>
        ) : (
          <>
            <button className="btn btn-ghost" onClick={() => setEditing(true)}>
              Editar nome de lutador
            </button>
            <button className="btn btn-ghost" onClick={onLogout}>
              Sair da conta
            </button>
          </>
        )}

        <div className="soon-note" style={{ marginTop: 16 }}>
          <b>LOBBY EM BREVE</b> — o combate está sendo forjado. Fase 2 do plano: a luta.
        </div>
      </div>
    </div>
  );
}
