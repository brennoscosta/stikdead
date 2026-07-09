-- STIKDEAD :: 031 — poda dos rostos que não encaixaram
DELETE FROM loadouts WHERE item_id IN ('f2_mempo_dourado','f2_mascara_teatro','f2_cabeca_lobo','f2_elmo_ciclope','f2_elmo_tubarao','f3_elmo_touro','f3_menpo_oni_negro','f3_elmo_cavaleiro');
DELETE FROM user_items WHERE item_id IN ('f2_mempo_dourado','f2_mascara_teatro','f2_cabeca_lobo','f2_elmo_ciclope','f2_elmo_tubarao','f3_elmo_touro','f3_menpo_oni_negro','f3_elmo_cavaleiro');
DELETE FROM items WHERE id IN ('f2_mempo_dourado','f2_mascara_teatro','f2_cabeca_lobo','f2_elmo_ciclope','f2_elmo_tubarao','f3_elmo_touro','f3_menpo_oni_negro','f3_elmo_cavaleiro');
