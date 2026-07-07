-- STIKDEAD :: 009 — Série Diamante: raridade nova, moeda própria, 25 itens
ALTER TABLE items ADD COLUMN IF NOT EXISTS currency TEXT NOT NULL DEFAULT 'coins';

INSERT INTO items (id, name, slot, rarity, price, currency, template, params) VALUES
-- CABEÇA (coroas e capuzes de cristal)
('dia_coroa_gelo',     'Coroa do Gelo Eterno',    'head',   'diamante', 300, 'diamonds', 'crown', '{"color":"#8fe3ff","glow":"#7fd9ff"}'),
('dia_coroa_abismo',   'Coroa do Abismo',         'head',   'diamante', 450, 'diamonds', 'crown', '{"color":"#4d7dff","glow":"#5d8dff"}'),
('dia_capuz_aurora',   'Capuz da Aurora',         'head',   'diamante', 260, 'diamonds', 'hood',  '{"color":"#bfeaff","glow":"#9fe0ff"}'),
('dia_banda_prisma',   'Banda do Prisma',         'head',   'diamante', 180, 'diamonds', 'band',  '{"color":"#a5f2ff","glow":"#7fd9ff"}'),
('dia_coroa_estelar',  'Coroa Estelar',           'head',   'diamante', 800, 'diamonds', 'crown', '{"color":"#e8faff","glow":"#bfefff"}'),
-- CORPO (vestes cristalinas)
('dia_veste_glacial',  'Veste Glacial',           'body',   'diamante', 320, 'diamonds', 'vest',  '{"color":"#7fd9ff","glow":"#7fd9ff"}'),
('dia_veste_safira',   'Couraça de Safira',       'body',   'diamante', 480, 'diamonds', 'vest',  '{"color":"#3d6dff","glow":"#5d8dff"}'),
('dia_cachecol_neve',  'Cachecol da Nevasca',     'body',   'diamante', 220, 'diamonds', 'scarf', '{"color":"#dff6ff","glow":"#bfefff"}'),
('dia_veste_prisma',   'Armadura Prismática',     'body',   'diamante', 650, 'diamonds', 'vest',  '{"color":"#9fe8ff","glow":"#8fe3ff"}'),
('dia_cachecol_azul',  'Cachecol do Cometa',      'body',   'diamante', 280, 'diamonds', 'scarf', '{"color":"#6db8ff","glow":"#7fd9ff"}'),
-- ARMAS (lâminas de cristal)
('dia_katana_gelo',    'Katana de Gelo Puro',     'weapon', 'diamante', 500, 'diamonds', 'katana',  '{"color":"#bfefff","glow":"#8fe3ff"}'),
('dia_foice_glacial',  'Foice Glacial',           'weapon', 'diamante', 700, 'diamonds', 'scythe',  '{"color":"#8fd4ff","glow":"#7fd9ff"}'),
('dia_lancas_cristal', 'Lança de Cristal',        'weapon', 'diamante', 550, 'diamonds', 'spear',   '{"color":"#a5ecff","glow":"#8fe3ff"}'),
('dia_duplas_prisma',  'Lâminas do Prisma',       'weapon', 'diamante', 850, 'diamonds', 'dual',    '{"color":"#dff6ff","glow":"#bfefff"}'),
('dia_machado_abismo', 'Machado do Abismo',       'weapon', 'diamante', 900, 'diamonds', 'axe',     '{"color":"#4d7dff","glow":"#5d8dff"}'),
-- COSTAS (capas e bainhas)
('dia_capa_aurora',    'Capa da Aurora Boreal',   'back',   'diamante', 600, 'diamonds', 'cape',   '{"color":"#7fd9ff","glow":"#8fe3ff"}'),
('dia_capa_cometa',    'Capa do Cometa',          'back',   'diamante', 750, 'diamonds', 'cape',   '{"color":"#5d8dff","glow":"#6db8ff"}'),
('dia_capa_nevasca',   'Manto da Nevasca',        'back',   'diamante', 520, 'diamonds', 'cape',   '{"color":"#dff6ff","glow":"#bfefff"}'),
('dia_bainha_gelo',    'Bainha Glacial',          'back',   'diamante', 340, 'diamonds', 'sheath', '{"color":"#8fd4ff","glow":"#7fd9ff"}'),
('dia_aura_costas',    'Asa de Cristal',          'back',   'diamante', 950, 'diamonds', 'aura',   '{"color":"#9fe8ff","glow":"#8fe3ff"}'),
-- EFEITOS (a coroação)
('dia_aura_glacial',   'Aura Glacial',            'effect', 'diamante', 700, 'diamonds', 'aura',  '{"color":"#7fd9ff","glow":"#7fd9ff"}'),
('dia_aura_abismo',    'Aura do Abismo',          'effect', 'diamante', 850, 'diamonds', 'aura',  '{"color":"#4d7dff","glow":"#5d8dff"}'),
('dia_poeira_estelar', 'Poeira Estelar',          'effect', 'diamante', 500, 'diamonds', 'dust',  '{"color":"#bfefff","glow":"#9fe0ff"}'),
('dia_aura_prisma',    'Aura Prismática',         'effect', 'diamante', 1200,'diamonds', 'aura',  '{"color":"#e8faff","glow":"#bfefff"}'),
('dia_poeira_gelo',    'Cristais Flutuantes',     'effect', 'diamante', 620, 'diamonds', 'dust',  '{"color":"#8fe3ff","glow":"#7fd9ff"}')
ON CONFLICT (id) DO NOTHING;
