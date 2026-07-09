-- STIKDEAD :: 034 — poda (cabeças + katana do trovão)
DELETE FROM gifts WHERE item_id IN ('h4_chapeu_mago','h4_coroa_rei','dia_coroa_estelar','esm_head_crown','w2_katana_trovao');
DELETE FROM loadouts WHERE item_id IN ('h4_chapeu_mago','h4_coroa_rei','dia_coroa_estelar','esm_head_crown','w2_katana_trovao');
DELETE FROM user_items WHERE item_id IN ('h4_chapeu_mago','h4_coroa_rei','dia_coroa_estelar','esm_head_crown','w2_katana_trovao');
DELETE FROM items WHERE id IN ('h4_chapeu_mago','h4_coroa_rei','dia_coroa_estelar','esm_head_crown','w2_katana_trovao');
