-- STIKDEAD :: 027 — arcos aposentados: aqui se luta de perto
DELETE FROM loadouts WHERE item_id IN ('arco', 'arco_fantasma', 'esm_weapon_bow');
DELETE FROM user_items WHERE item_id IN ('arco', 'arco_fantasma', 'esm_weapon_bow');
DELETE FROM items WHERE id IN ('arco', 'arco_fantasma', 'esm_weapon_bow');
