-- STIKDEAD :: 020 — reajuste: itens de diamante +30%
UPDATE items SET price = CEIL(price * 1.3) WHERE currency = 'diamonds';
