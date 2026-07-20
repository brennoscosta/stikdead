-- STIKDEAD :: 043 — pernas das coleções (par com os peitorais b4)
INSERT INTO items (id, name, slot, rarity, price, currency, template, params, excellents) VALUES
('l4_perna_jade',   'Grevas do Dragão de Jade',    'legs', 'diamante', 460, 'diamonds', 'perna_jade', '{"color":"#3fae6a","glow":"#8fffb0"}',
 '["🐉 Escamas de Jade — passos firmes de dragão", "🛡️ Aumenta a Defesa +Nível/20 — defesa cresce com o nível", "❄️ Redução de Dano +4% — dano recebido reduzido", "❤️ Aumenta HP Máximo +4%"]'::jsonb),
('l4_perna_hannya', 'Grevas da Hannya de Gelo',    'legs', 'diamante', 430, 'diamonds', 'perna_hannya', '{"color":"#7fd9ff","glow":"#dff6ff"}',
 '["❄️ Passo Gélido — o frio endurece a guarda", "🛡️ Aumenta a Defesa +Nível/20 — defesa cresce com o nível", "❄️ Redução de Dano +4% — dano recebido reduzido", "🎯 Chance de Bloqueio +10% — maior chance de defender ataques"]'::jsonb),
('l4_perna_nove',   'Calças das Nove Caudas',      'legs', 'diamante', 400, 'diamonds', 'perna_nove', '{"color":"#e0a10b","glow":"#ffd76a"}',
 '["🦊 Nove Passos — agilidade de raposa espiritual", "❄️ Redução de Dano +4% — dano recebido reduzido", "🧿 Energia Máxima +4%", "🎯 Chance de Bloqueio +10% — maior chance de defender ataques"]'::jsonb),
('l4_perna_tigre',  'Grevas do Tigre Carmesim',    'legs', 'diamante', 380, 'diamonds', 'perna_tigre', '{"color":"#d90429","glow":"#ff6a3b"}',
 '["🐯 Bote do Tigre — avanço explosivo", "🛡️ Aumenta a Defesa +Nível/20 — defesa cresce com o nível", "❤️ Aumenta HP Máximo +4%", "❄️ Redução de Dano +4% — dano recebido reduzido"]'::jsonb),
('l4_perna_tengu',  'Perneiras de Penas do Tengu', 'legs', 'diamante', 360, 'diamonds', 'perna_tengu', '{"color":"#4b3b8f","glow":"#b8a5ff"}',
 '["🪶 Salto do Tengu — leveza sobrenatural", "🧿 Energia Máxima +4%", "❄️ Redução de Dano +4% — dano recebido reduzido", "🎯 Chance de Bloqueio +10% — maior chance de defender ataques"]'::jsonb)
ON CONFLICT (id) DO NOTHING;
