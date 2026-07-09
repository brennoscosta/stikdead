-- STIKDEAD :: 029 — terceira leva de rostos diamante (arte IA)
INSERT INTO items (id, name, slot, rarity, price, currency, template, params) VALUES
('f3_elmo_aguia',        'Elmo da Águia Real',      'face', 'diamante', 360, 'diamonds', 'mask_oni',   '{"color":"#d8a51f","glow":"#ffd76a"}'),
('f3_mascara_urso',      'Máscara Urso Polar',      'face', 'diamante', 330, 'diamonds', 'mask_oni',   '{"color":"#eef2f4","glow":"#8fe3ff"}'),
('f3_elmo_touro',        'Elmo do Touro de Ferro',  'face', 'diamante', 370, 'diamonds', 'mask_oni',   '{"color":"#6a5a4a","glow":"#ff7a3b"}'),
('f3_mascara_naja',      'Máscara da Naja Real',    'face', 'diamante', 350, 'diamonds', 'mask_oni',   '{"color":"#48a93c","glow":"#ffd76a"}'),
('f3_elmo_leao',         'Elmo do Leão Dourado',    'face', 'diamante', 390, 'diamonds', 'mask_oni',   '{"color":"#d8941f","glow":"#ffcf3b"}'),
('f3_mascara_anbu',      'Máscara ANBU',            'face', 'diamante', 340, 'diamonds', 'mask_oni',   '{"color":"#f4f0e8","glow":"#ff5a5a"}'),
('f3_menpo_oni_negro',   'Menpō Oni Negro',         'face', 'diamante', 360, 'diamonds', 'mask_oni',   '{"color":"#2b2b33","glow":"#ff3b3b"}'),
('f3_elmo_cavaleiro',    'Elmo do Cavaleiro Caído', 'face', 'diamante', 380, 'diamonds', 'mask_oni',   '{"color":"#5a5a66","glow":"#8f9aff"}'),
('f3_mascara_farao',     'Máscara do Faraó',        'face', 'diamante', 400, 'diamonds', 'mask_oni',   '{"color":"#d8a51f","glow":"#39c1ff"}'),
('f3_elmo_viking',       'Elmo Viking',             'face', 'diamante', 350, 'diamonds', 'mask_oni',   '{"color":"#8a8a94","glow":"#c8d4e8"}'),
('f3_rosto_robo',        'Rosto Androide',          'face', 'diamante', 370, 'diamonds', 'mask_oni',   '{"color":"#9aa4b3","glow":"#3bffea"}'),
('f3_caveira_fogo',      'Caveira Flamejante',      'face', 'diamante', 390, 'diamonds', 'mask_skull', '{"color":"#d8ccc4","glow":"#ff6a17"}'),
('f3_mascara_anjo',      'Máscara do Anjo',         'face', 'diamante', 360, 'diamonds', 'mask_oni',   '{"color":"#f4ecd8","glow":"#ffe8a5"}'),
('f3_mascara_diabo',     'Máscara do Diabo',        'face', 'diamante', 360, 'diamonds', 'mask_oni',   '{"color":"#b31f1f","glow":"#ff5a3b"}'),
('f3_elmo_coruja',       'Elmo da Coruja',          'face', 'diamante', 340, 'diamonds', 'mask_oni',   '{"color":"#8a7a66","glow":"#ffd76a"}'),
('f3_face_mumia',        'Face de Múmia',           'face', 'diamante', 330, 'diamonds', 'mask_skull', '{"color":"#d8ccb3","glow":"#7dff9a"}'),
('f3_mascara_geisha',    'Máscara Gueixa Sombria',  'face', 'diamante', 350, 'diamonds', 'mask_oni',   '{"color":"#f4f0e8","glow":"#d8341f"}'),
('f3_elmo_rinoceronte',  'Elmo Rinoceronte',        'face', 'diamante', 370, 'diamonds', 'mask_oni',   '{"color":"#7a8a8a","glow":"#c8d4e8"}'),
('f3_rosto_diamante',    'Rosto de Diamante Puro',  'face', 'diamante', 450, 'diamonds', 'mask_oni',   '{"color":"#dff6ff","glow":"#ffffff"}'),
('f3_elmo_fenix',        'Elmo da Fênix',           'face', 'diamante', 420, 'diamonds', 'mask_oni',   '{"color":"#ff8c1f","glow":"#ffcf3b"}')
ON CONFLICT (id) DO NOTHING;
