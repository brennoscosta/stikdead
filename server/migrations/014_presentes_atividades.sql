-- STIKDEAD :: 014 — presentes entre jogadores, feed de atividades, megafone global
CREATE TABLE IF NOT EXISTS gifts (
  id         BIGSERIAL PRIMARY KEY,
  from_id    BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  to_id      BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  item_id    TEXT NOT NULL REFERENCES items(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  opened_at  TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_gifts_to ON gifts(to_id) WHERE opened_at IS NULL;

CREATE TABLE IF NOT EXISTS activities (
  id         BIGSERIAL PRIMARY KEY,
  user_id    BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  kind       TEXT NOT NULL,   -- diamond_purchase | friend_request | friend_accept | gift_sent | gift_received
  data       JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_act_user ON activities(user_id, id DESC);

CREATE TABLE IF NOT EXISTS global_messages (
  id         BIGSERIAL PRIMARY KEY,
  body       TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
