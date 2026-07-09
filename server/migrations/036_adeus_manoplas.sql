-- STIKDEAD :: 036 — manoplas aposentadas (ficam as luvas)
DELETE FROM gifts WHERE item_id IN ('saf_arms_gauntlets','esm_arms_gauntlets');
DELETE FROM loadouts WHERE item_id IN ('saf_arms_gauntlets','esm_arms_gauntlets');
DELETE FROM user_items WHERE item_id IN ('saf_arms_gauntlets','esm_arms_gauntlets');
DELETE FROM items WHERE id IN ('saf_arms_gauntlets','esm_arms_gauntlets');
