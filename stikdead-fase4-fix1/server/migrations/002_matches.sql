-- STIKDEAD :: 002_matches
-- Registro de partidas (Fase 3: treino vs bot; Fase 4 reutiliza para PvP).

CREATE TABLE IF NOT EXISTS matches (
  id            BIGSERIAL PRIMARY KEY,
  user_id       BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  opponent_type TEXT   NOT NULL DEFAULT 'bot',        -- bot | player (Fase 4)
  opponent_id   BIGINT,                               -- Fase 4
  difficulty    TEXT,                                  -- bot: facil|medio|dificil|insano
  won           BOOLEAN NOT NULL,
  wins_a        INT NOT NULL,
  wins_b        INT NOT NULL,
  duration_s    INT NOT NULL,
  stats         JSONB NOT NULL DEFAULT '{}',
  xp_gain       INT NOT NULL DEFAULT 0,
  coin_gain     INT NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_matches_user ON matches (user_id, created_at DESC);
