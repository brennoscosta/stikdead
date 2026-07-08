-- STIKDEAD :: clãs — bandeiras hasteadas
CREATE TABLE IF NOT EXISTS clans (
  id SERIAL PRIMARY KEY,
  name VARCHAR(12) UNIQUE NOT NULL,
  motto VARCHAR(30) NOT NULL DEFAULT '',
  flag_color TEXT NOT NULL DEFAULT '#d90429',
  flag_file TEXT,                          -- bandeira enviada (arquivo salvo no servidor)
  owner_id BIGINT NOT NULL REFERENCES users(id),
  duo_wins INT NOT NULL DEFAULT 0,         -- batalhas de clã (duo) vencidas
  duo_battles INT NOT NULL DEFAULT 0,      -- batalhas de clã disputadas
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS clan_id INT REFERENCES clans(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_profiles_clan ON profiles(clan_id);
CREATE TABLE IF NOT EXISTS clan_invites (
  id SERIAL PRIMARY KEY,
  clan_id INT NOT NULL REFERENCES clans(id) ON DELETE CASCADE,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  invited_by BIGINT NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (clan_id, user_id)
);
