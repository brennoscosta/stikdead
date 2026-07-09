-- STIKDEAD :: 037 — aposenta os pés bugados; pernas integradas assumem
DELETE FROM gifts WHERE item_id IN ('saf_feet_boots','saf_feet_shoes','esm_feet_boots','esm_feet_shoes');
DELETE FROM loadouts WHERE item_id IN ('saf_feet_boots','saf_feet_shoes','esm_feet_boots','esm_feet_shoes');
DELETE FROM user_items WHERE item_id IN ('saf_feet_boots','saf_feet_shoes','esm_feet_boots','esm_feet_shoes');
DELETE FROM items WHERE id IN ('saf_feet_boots','saf_feet_shoes','esm_feet_boots','esm_feet_shoes');
