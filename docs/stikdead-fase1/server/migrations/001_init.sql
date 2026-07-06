-- STIKDEAD :: 001_init
-- Contas e perfis (Fase 1). Campos preparados para fases futuras (clã, título).

CREATE TABLE IF NOT EXISTS users (
  id            BIGSERIAL PRIMARY KEY,
  email         TEXT UNIQUE,
  password_hash TEXT,
  google_id     TEXT UNIQUE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT users_login_method CHECK (password_hash IS NOT NULL OR google_id IS NOT NULL)
);

CREATE TABLE IF NOT EXISTS profiles (
  user_id       BIGINT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  fighter_name  TEXT NOT NULL UNIQUE,
  level         INT  NOT NULL DEFAULT 1,
  xp            INT  NOT NULL DEFAULT 0,
  coins         INT  NOT NULL DEFAULT 500,
  rank_points   INT  NOT NULL DEFAULT 0,
  tier          TEXT NOT NULL DEFAULT 'BRONZE_III',
  wins          INT  NOT NULL DEFAULT 0,
  losses        INT  NOT NULL DEFAULT 0,
  win_streak    INT  NOT NULL DEFAULT 0,
  title         TEXT,
  clan_id       BIGINT,
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_profiles_rank ON profiles (rank_points DESC);
