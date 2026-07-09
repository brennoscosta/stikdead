-- STIKDEAD :: 038 — o slot PÉS deixa de existir (nenhum boneco calça nada)
DELETE FROM gifts WHERE item_id IN (SELECT id FROM items WHERE slot = 'feet');
DELETE FROM loadouts WHERE item_id IN (SELECT id FROM items WHERE slot = 'feet');
DELETE FROM loadouts WHERE slot = 'feet';
DELETE FROM user_items WHERE item_id IN (SELECT id FROM items WHERE slot = 'feet');
DELETE FROM items WHERE slot = 'feet';
