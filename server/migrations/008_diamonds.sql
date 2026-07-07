-- STIKDEAD :: 008 — moeda premium (diamantes) + pedidos Mercado Pago
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS diamonds INT NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS diamond_orders (
  id           BIGSERIAL PRIMARY KEY,
  user_id      BIGINT NOT NULL REFERENCES users(id),
  pack_id      TEXT NOT NULL,
  diamonds     INT NOT NULL,
  amount_cents INT NOT NULL,
  mp_preference_id TEXT,
  mp_payment_id    TEXT UNIQUE,
  status       TEXT NOT NULL DEFAULT 'pending',  -- pending | paid | failed
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  paid_at      TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_dorders_user ON diamond_orders(user_id);
