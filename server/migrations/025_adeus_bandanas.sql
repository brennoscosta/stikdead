-- STIKDEAD :: 025 — bandanas de cristal aposentadas do catálogo
DELETE FROM loadouts WHERE item_id IN ('saf_face_bandana', 'esm_face_bandana');
DELETE FROM user_items WHERE item_id IN ('saf_face_bandana', 'esm_face_bandana');
DELETE FROM items WHERE id IN ('saf_face_bandana', 'esm_face_bandana');
