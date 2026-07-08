-- STIKDEAD :: histórico de clãs — por onde o lutador já passou
CREATE TABLE IF NOT EXISTS clan_history (
  id SERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  clan_id INT,                       -- pode sobreviver à dissolução (id vira memória)
  clan_name VARCHAR(12) NOT NULL,    -- nome congelado no tempo
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  left_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_clan_hist_user ON clan_history(user_id, joined_at DESC);

-- backfill: quem já está num clã ganha o registro de entrada (data do clã como aproximação)
INSERT INTO clan_history (user_id, clan_id, clan_name, joined_at)
SELECT p.user_id, c.id, c.name, c.created_at
  FROM profiles p JOIN clans c ON c.id = p.clan_id
 WHERE NOT EXISTS (
   SELECT 1 FROM clan_history h WHERE h.user_id = p.user_id AND h.clan_id = p.clan_id AND h.left_at IS NULL
 );
