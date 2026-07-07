-- STIKDEAD :: 010 — Série Diamante 70% mais acessível
UPDATE items SET price = GREATEST(30, ROUND(price * 0.3)) WHERE currency = 'diamonds';
