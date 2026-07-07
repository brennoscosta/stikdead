-- STIKDEAD :: 015 — mensagem opcional no presente
ALTER TABLE gifts ADD COLUMN IF NOT EXISTS message TEXT;
