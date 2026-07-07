-- STIKDEAD :: 018 — disciplina nos pedidos de amizade (5 recusas -> 7 dias)
CREATE TABLE IF NOT EXISTS friend_denials (
  requester_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  addressee_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  count        INT NOT NULL DEFAULT 0,
  last_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (requester_id, addressee_id)
);
