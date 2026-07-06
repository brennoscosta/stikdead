-- STIKDEAD :: 005_styles — estilo de luta do jogador
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS style TEXT NOT NULL DEFAULT 'ronin';
