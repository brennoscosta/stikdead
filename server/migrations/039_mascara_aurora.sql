-- STIKDEAD :: 039 — Máscara de Aurora (borboleta arco-íris)
INSERT INTO items (id, name, slot, rarity, price, currency, template, params, excellents) VALUES
('mascara_aurora', 'Máscara de Aurora', 'face', 'diamante', 380, 'diamonds', 'mask_oni',
 '{"color":"#8fe3ff","glow":"#ff9ae0"}',
 '["🌈 Véu da Aurora — todas as cores dançam por você", "❄️ Redução de Dano +4% — dano recebido reduzido", "🧿 Energia Máxima +4%", "🎯 Chance de Bloqueio +10% — maior chance de defender ataques", "❤️ Aumenta HP Máximo +4%"]'::jsonb)
ON CONFLICT (id) DO NOTHING;
