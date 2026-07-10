-- STIKDEAD :: 040 — Calças Prismáticas (a perna da Armadura Prismática)
INSERT INTO items (id, name, slot, rarity, price, currency, template, params, excellents) VALUES
('calcas_prisma', 'Calças Prismáticas', 'legs', 'diamante', 254, 'diamonds', 'prisma_pants',
 '{"color":"#9fe8ff","glow":"#8fe3ff"}',
 '["🌈 Passos do Prisma — o espectro caminha com você", "🛡️ Aumenta a Defesa +Nível/20 — defesa cresce com o nível", "❄️ Redução de Dano +4% — dano recebido reduzido", "🧿 Energia Máxima +4%", "❤️ Aumenta HP Máximo +4%"]'::jsonb)
ON CONFLICT (id) DO NOTHING;
