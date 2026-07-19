-- STIKDEAD :: 041 — quarta leva de rostos diamante (arte IA Higgsfield)
INSERT INTO items (id, name, slot, rarity, price, currency, template, params, excellents) VALUES
('f4_menpo_jade', 'Menpō do Dragão de Jade', 'face', 'diamante', 440, 'diamonds', 'mask_oni',
 '{"color":"#3ba764","glow":"#7dffb0"}',
 '["🐉 Fôlego de Jade — a serenidade do dragão guia seus golpes", "🗡️ Diminui 10% do Dano de Ataque recebido", "❤️ Aumenta HP Máximo +4%", "🧿 Energia Máxima +4%", "🛡️ Aumenta a Defesa +Nível/20 — defesa cresce com o nível"]'::jsonb),
('f4_hannya_gelo', 'Hannya de Gelo', 'face', 'diamante', 420, 'diamonds', 'mask_oni',
 '{"color":"#bfe6ff","glow":"#39c1ff"}',
 '["❄️ Olhar Congelante — o medo gela quem te encara", "❄️ Redução de Dano +4% — dano recebido reduzido", "🎯 Chance de Bloqueio +10% — maior chance de defender ataques", "🪞 Reflete Dano +5% — devolve parte do dano recebido", "🧿 Energia Máxima +4%"]'::jsonb),
('f4_kitsune_nove', 'Kitsune das Nove Caudas', 'face', 'diamante', 400, 'diamonds', 'mask_oni',
 '{"color":"#f4f0e8","glow":"#ff7a3b"}',
 '["🦊 Astúcia das Nove Caudas — nove vidas de esperteza em uma máscara", "🎯 Chance de Defesa +10% — o bloqueio absorve 10% a mais", "❄️ Redução de Dano +4% — dano recebido reduzido", "❤️ Aumenta HP Máximo +4%", "🧿 Energia Máxima +4%"]'::jsonb),
('f4_tigre_sangue', 'Elmo do Tigre Carmesim', 'face', 'diamante', 380, 'diamonds', 'mask_oni',
 '{"color":"#c8501f","glow":"#ff3b3b"}',
 '["🐯 Instinto Predador — a caçada nunca termina", "🗡️ Diminui 10% do Dano de Ataque recebido", "❤️ Aumenta HP Máximo +4%", "🎯 Chance de Bloqueio +10% — maior chance de defender ataques", "🧿 Energia Máxima +4%"]'::jsonb),
('f4_tengu_corvo', 'Máscara do Corvo Tengu', 'face', 'diamante', 360, 'diamonds', 'mask_oni',
 '{"color":"#2b2b33","glow":"#b78bff"}',
 '["🪶 Voo do Tengu — leve como a pena, rápido como o vento", "🎯 Chance de Defesa +10% — o bloqueio absorve 10% a mais", "❄️ Redução de Dano +4% — dano recebido reduzido", "🪞 Reflete Dano +5% — devolve parte do dano recebido", "🧿 Energia Máxima +4%"]'::jsonb)
ON CONFLICT (id) DO NOTHING;
