-- STIKDEAD :: 003_economy
-- Catálogo de itens, baú do jogador e build equipada.

CREATE TABLE IF NOT EXISTS items (
  id        TEXT PRIMARY KEY,           -- slug estável (asset key)
  name      TEXT NOT NULL,
  slot      TEXT NOT NULL,              -- head|face|body|back|weapon|arms|legs|feet|effect
  rarity    TEXT NOT NULL,              -- comum|raro|epico|lendario
  price     INT  NOT NULL,
  template  TEXT NOT NULL,              -- template de desenho no cliente
  params    JSONB NOT NULL DEFAULT '{}',
  sort      INT  NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS user_items (
  user_id    BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  item_id    TEXT   NOT NULL REFERENCES items(id),
  obtained_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  source     TEXT NOT NULL DEFAULT 'shop',   -- shop|drop
  PRIMARY KEY (user_id, item_id)
);

CREATE TABLE IF NOT EXISTS loadouts (
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  slot    TEXT   NOT NULL,
  item_id TEXT   NOT NULL REFERENCES items(id),
  PRIMARY KEY (user_id, slot)
);

INSERT INTO items (id, name, slot, rarity, price, template, params, sort) VALUES
-- ===== ARMAS =====
('bastao_bo',        'Bastão bō',          'weapon', 'comum',    500,  'bo',       '{}', 10),
('nunchaku',         'Nunchaku',           'weapon', 'comum',    600,  'nunchaku', '{}', 11),
('katana',           'Katana',             'weapon', 'comum',    800,  'katana',   '{}', 12),
('machado',          'Machado',            'weapon', 'raro',     1800, 'axe',      '{}', 13),
('lanca',            'Lança',              'weapon', 'raro',     2000, 'spear',    '{}', 14),
('foice',            'Foice',              'weapon', 'epico',    5000, 'scythe',   '{}', 15),
('dual_blades',      'Dual Blades',        'weapon', 'epico',    5500, 'dual',     '{}', 16),
('arco',             'Arco',               'weapon', 'epico',    5200, 'bow',      '{}', 17),
('katana_infernal',  'Katana Infernal',    'weapon', 'lendario', 12000,'katana',   '{"blade":"#2b0a10","glow":"#ff2244","grip":"#520a14"}', 18),
('foice_sangrenta',  'Foice Sangrenta',    'weapon', 'lendario', 14000,'scythe',   '{"blade":"#3a3038","handle":"#1c1416","glow":"#ff2244"}', 19),
-- ===== CABEÇA =====
('faixa_vermelha',   'Faixa Vermelha',     'head', 'comum',    500,  'band',  '{"color":"#d90429"}', 20),
('faixa_branca',     'Faixa Branca',       'head', 'comum',    500,  'band',  '{"color":"#e8e4da"}', 21),
('chapeu_palha',     'Chapéu de Palha',    'head', 'raro',     1600, 'hat',   '{}', 22),
('capuz_sombrio',    'Capuz Sombrio',      'head', 'epico',    4500, 'hood',  '{}', 23),
('coroa',            'Coroa do Rei',       'head', 'lendario', 15000,'crown', '{}', 24),
-- ===== ROSTO =====
('bandana_preta',    'Bandana Preta',      'face', 'comum',    600,  'bandana',    '{"color":"#1a1a1a"}', 30),
('bandana_vermelha', 'Bandana Vermelha',   'face', 'comum',    700,  'bandana',    '{"color":"#d90429"}', 31),
('olhos_vermelhos',  'Olhos de Fúria',     'face', 'raro',     2200, 'eyes_red',   '{}', 32),
('mascara_caveira',  'Máscara Caveira',    'face', 'raro',     2500, 'mask_skull', '{}', 33),
('mascara_hockey',   'Máscara de Hóquei',  'face', 'raro',     2400, 'mask_hockey','{}', 34),
('mascara_oni',      'Máscara Oni',        'face', 'epico',    6000, 'mask_oni',   '{}', 35),
-- ===== CORPO =====
('cachecol_cinza',   'Cachecol Cinza',     'body', 'comum',    600,  'scarf', '{"color":"#8a8a8a"}', 40),
('cachecol_vermelho','Cachecol Vermelho',  'body', 'raro',     1800, 'scarf', '{"color":"#d90429"}', 41),
('colete',           'Colete de Couro',    'body', 'raro',     2000, 'vest',  '{"color":"#2c2320"}', 42),
('armadura_ronin',   'Armadura Ronin',     'body', 'epico',    6500, 'vest',  '{"color":"#3a1216","trim":"#d90429"}', 43),
('armadura_infernal','Armadura Infernal',  'body', 'lendario', 16000,'vest',  '{"color":"#1c0a0e","trim":"#ff2244","glow":"#ff2244"}', 44),
-- ===== COSTAS =====
('bainha',           'Bainha de Katana',   'back', 'comum',    500,  'sheath', '{}', 50),
('capa_curta',       'Capa Curta',         'back', 'raro',     2200, 'cape',   '{"color":"#2a2a2a"}', 51),
('capa_guerreiro',   'Capa do Guerreiro',  'back', 'epico',    7000, 'cape',   '{"color":"#8f0620"}', 52),
-- ===== BRAÇOS =====
('bracadeiras',      'Braçadeiras',        'arms', 'comum',    500,  'bands',     '{"color":"#3a3a3a"}', 60),
('luvas_combate',    'Luvas de Combate',   'arms', 'raro',     1900, 'gloves',    '{"color":"#242424"}', 61),
('luvas_vermelhas',  'Luvas Vermelhas',    'arms', 'raro',     2000, 'gloves',    '{"color":"#c1121f"}', 62),
('manoplas',         'Manoplas de Aço',    'arms', 'epico',    5800, 'gauntlets', '{"studs":"#d90429"}', 63),
-- ===== PERNAS =====
('shorts_treino',    'Shorts de Treino',   'legs', 'comum',    500,  'shorts',   '{"trim":"#d90429"}', 70),
('calca_ninja',      'Calça Ninja',        'legs', 'comum',    700,  'pants',    '{}', 71),
('joelheiras',       'Joelheiras',         'legs', 'raro',     1700, 'kneepads', '{}', 72),
-- ===== PÉS =====
('tenis_classico',   'Tênis Clássico',     'feet', 'comum',    500,  'shoes', '{"color":"#f2efe9","stripe":"#d90429"}', 80),
('botas',            'Botas de Couro',     'feet', 'raro',     1800, 'boots', '{"color":"#241a12"}', 81),
('botas_sombrias',   'Botas Sombrias',     'feet', 'epico',    5600, 'boots', '{"color":"#160f1e","glow":"#8b5cf6"}', 82),
-- ===== EFEITOS =====
('poeira_pes',       'Poeira nos Pés',     'effect', 'raro',     2500,  'dust', '{}', 90),
('aura_vermelha',    'Aura Vermelha',      'effect', 'epico',    8000,  'aura', '{"color":"#d90429"}', 91),
('aura_caos',        'Aura do Caos',       'effect', 'lendario', 18000, 'aura', '{"color":"#8b5cf6"}', 92)
ON CONFLICT (id) DO NOTHING;
