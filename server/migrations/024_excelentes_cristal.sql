-- STIKDEAD :: 024 — armaduras e armas de cristal ganham os templates excelentes
-- armaduras de corpo (paleta própria: c1/c2 facetas, gem gema do peito)
UPDATE items SET template = 'crystal_armor', params = '{"c1":"#3d6dff","c2":"#6d9dff","gem":"#9fc3ff","glow":"#5d8dff"}' WHERE id = 'dia_veste_safira';
UPDATE items SET template = 'crystal_armor', params = '{"c1":"#7fd9ff","c2":"#dff6ff","gem":"#ffffff","glow":"#7fd9ff"}' WHERE id = 'dia_veste_glacial';
UPDATE items SET template = 'crystal_armor', params = '{"c1":"#2edc7a","c2":"#5dffa8","gem":"#a8ffd4","glow":"#4dee98"}' WHERE id = 'esm_body_vest';
-- armas de cristal (blade translúcida + core vivo)
UPDATE items SET template = 'crystal_katana', params = '{"blade":"#eaf9ff","core":"#8fe3ff","glow":"#8fe3ff"}' WHERE id = 'dia_katana_gelo';
UPDATE items SET template = 'crystal_scythe', params = '{"blade":"#e4f4ff","core":"#7fd9ff","glow":"#7fd9ff"}' WHERE id = 'dia_foice_glacial';
UPDATE items SET template = 'crystal_spear',  params = '{"blade":"#eaf9ff","core":"#8fe3ff","glow":"#8fe3ff"}' WHERE id = 'dia_lancas_cristal';
UPDATE items SET template = 'crystal_axe',    params = '{"blade":"#dce8ff","core":"#4d7dff","glow":"#5d8dff"}' WHERE id = 'dia_machado_abismo';
UPDATE items SET template = 'crystal_katana', params = '{"blade":"#e8fff2","core":"#2edc7a","glow":"#4dee98"}' WHERE id = 'esm_weapon_katana';
UPDATE items SET template = 'crystal_spear',  params = '{"blade":"#e8fff2","core":"#3ddc84","glow":"#3ddc84"}' WHERE id = 'esm_weapon_spear';
UPDATE items SET template = 'crystal_axe',    params = '{"blade":"#eefff6","core":"#7dffb8","glow":"#7dffb8"}' WHERE id = 'esm_weapon_axe';
UPDATE items SET template = 'crystal_scythe', params = '{"blade":"#e4ffe9","core":"#0faf62","glow":"#2edc7a"}' WHERE id = 'esm_weapon_scythe';
UPDATE items SET template = 'crystal_bow',    params = '{"blade":"#e8fff2","core":"#4dee98","glow":"#4dee98"}' WHERE id = 'esm_weapon_bow';
