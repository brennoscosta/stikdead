-- STIKDEAD :: 042 — corpos diamante das coleções (fecham set com os rostos f4)
-- Coleções: Dragão de Jade, Hannya de Gelo, Nove Caudas, Tigre Carmesim, Corvo Tengu
INSERT INTO items (id, name, slot, rarity, price, currency, template, params, excellents) VALUES
('b4_peitoral_jade', 'Peitoral do Dragão de Jade', 'body', 'diamante', 520, 'diamonds', 'vest',
 '{"color":"#3ba764","glow":"#7dffb0"}',
 '["🐉 Escamas de Jade — o corpo do dragão é a sua armadura", "🛡️ Aumenta a Defesa +Nível/20 — defesa cresce com o nível", "❤️ Aumenta HP Máximo +4%", "🗡️ Diminui 10% do Dano de Ataque recebido", "🧿 Energia Máxima +4%"]'::jsonb),
('b4_couraca_hannya', 'Couraça da Hannya de Gelo', 'body', 'diamante', 480, 'diamonds', 'vest',
 '{"color":"#bfe6ff","glow":"#39c1ff"}',
 '["❄️ Coração de Gelo — o frio endurece a sua guarda", "❄️ Redução de Dano +4% — dano recebido reduzido", "🪞 Reflete Dano +5% — devolve parte do dano recebido", "🎯 Chance de Bloqueio +10% — maior chance de defender ataques", "❤️ Aumenta HP Máximo +4%"]'::jsonb),
('b4_kimono_nove', 'Kimono das Nove Caudas', 'body', 'diamante', 450, 'diamonds', 'vest',
 '{"color":"#f4f0e8","glow":"#ff7a3b"}',
 '["🦊 Véu das Nove Caudas — esquiva com a graça da raposa", "🎯 Chance de Defesa +10% — o bloqueio absorve 10% a mais", "❄️ Redução de Dano +4% — dano recebido reduzido", "🧿 Energia Máxima +4%", "❤️ Aumenta HP Máximo +4%"]'::jsonb),
('b4_peitoral_tigre', 'Peitoral do Tigre Carmesim', 'body', 'diamante', 420, 'diamonds', 'vest',
 '{"color":"#c8501f","glow":"#ff3b3b"}',
 '["🐯 Couro do Predador — cada caçada deixa a pele mais dura", "🗡️ Diminui 10% do Dano de Ataque recebido", "❤️ Aumenta HP Máximo +4%", "🎯 Chance de Bloqueio +10% — maior chance de defender ataques", "🧿 Energia Máxima +4%"]'::jsonb),
('b4_manto_tengu', 'Manto de Penas do Tengu', 'body', 'diamante', 390, 'diamonds', 'vest',
 '{"color":"#2b2b33","glow":"#b78bff"}',
 '["🪶 Plumagem Espectral — leve demais para ser acertado em cheio", "🎯 Chance de Defesa +10% — o bloqueio absorve 10% a mais", "🪞 Reflete Dano +5% — devolve parte do dano recebido", "❄️ Redução de Dano +4% — dano recebido reduzido", "🧿 Energia Máxima +4%"]'::jsonb)
ON CONFLICT (id) DO NOTHING;
