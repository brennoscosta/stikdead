-- STIKDEAD :: 032 — segunda poda de rostos
DELETE FROM loadouts WHERE item_id IN ('f3_elmo_fenix','f3_mascara_anbu','f3_elmo_viking','f3_rosto_robo','f3_mascara_anjo','f3_rosto_diamante');
DELETE FROM user_items WHERE item_id IN ('f3_elmo_fenix','f3_mascara_anbu','f3_elmo_viking','f3_rosto_robo','f3_mascara_anjo','f3_rosto_diamante');
DELETE FROM items WHERE id IN ('f3_elmo_fenix','f3_mascara_anbu','f3_elmo_viking','f3_rosto_robo','f3_mascara_anjo','f3_rosto_diamante');
