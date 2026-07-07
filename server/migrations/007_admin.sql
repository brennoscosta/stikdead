-- STIKDEAD :: 007_admin — preços dos estilos +300% e rastreio de login
UPDATE items SET price = 8000  WHERE id = 'estilo_shinobi';
UPDATE items SET price = 10000 WHERE id = 'estilo_monge';
UPDATE items SET price = 14000 WHERE id = 'estilo_berserker';
UPDATE items SET price = 20000 WHERE id = 'estilo_espectro';
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMPTZ;
