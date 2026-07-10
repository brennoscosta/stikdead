// STIKDEAD :: itens pintados em jogo — a arte da loja presa ao esqueleto do boneco
// Slots rígidos (arma, cabeça, rosto, costas) usam o sprite recortado; panos,
// pares (luvas/botas) e energias continuam no vetor glossy animado.
import { Sprite, Assets } from 'pixi.js';
import { poseFor, skeleton, RIG } from './rig.js';

// attach: hand = punho rotacionando com o antebraço | head = topo da cabeça
//         face = centro do rosto | back = costas na altura do peito
const CFG = {
  // ----- armas (attach: hand) -----
  katana: { attach: 'hand', len: 66, grip: 0.86 },
  katana_infernal: { attach: 'hand', len: 68, grip: 0.86 },
  bastao_bo: { attach: 'hand', len: 82, grip: 0.5 },
  nunchaku: { attach: 'hand', len: 48, grip: 0.7 },
  machado: { attach: 'hand', len: 58, grip: 0.88 },
  lanca: { attach: 'hand', len: 88, grip: 0.72 },
  foice: { attach: 'hand', len: 74, grip: 0.9 },
  foice_sangrenta: { attach: 'hand', len: 76, grip: 0.9 },
  dual_blades: { attach: 'hand', len: 46, grip: 0.85 },
  // ----- cabeça (assenta no topo) -----
  chapeu_palha: { attach: 'head', len: 36, maxW: 74, overlap: 12 },
  coroa: { attach: 'head', len: 26, maxW: 36, overlap: 7 },
  capuz_sombrio: { attach: 'head', len: 54, maxW: 54, overlap: 34 },
  // ----- rosto (centrado na cabeça) -----
  mascara_caveira: { attach: 'face', len: 36, maxW: 34 },
  mascara_oni: { attach: 'face', len: 38, maxW: 36 },
  mascara_hockey: { attach: 'face', len: 36, maxW: 34 },
  // ----- costas -----
  bainha: { attach: 'back', len: 58, grip: 0.5, rot: 0.6, maxW: 16 },
  // ----- armas de cristal (arte IA original, recortada) -----
  dia_katana_gelo: { attach: 'hand', len: 66, grip: 0.86 },
  dia_foice_glacial: { attach: 'hand', len: 76, grip: 0.9 },
  dia_lancas_cristal: { attach: 'hand', len: 88, grip: 0.72 },
  dia_machado_abismo: { attach: 'hand', len: 58, grip: 0.88 },
  esm_weapon_katana: { attach: 'hand', len: 66, grip: 0.86 },
  esm_weapon_spear: { attach: 'hand', len: 88, grip: 0.72 },
  esm_weapon_axe: { attach: 'hand', len: 58, grip: 0.88 },
  esm_weapon_scythe: { attach: 'hand', len: 76, grip: 0.9 },
  // ----- rostos de cristal (arte IA original) -----
  saf_face_mask_oni: { attach: 'face', len: 96, maxW: 91 },
  saf_face_eyes_red: { attach: 'face', len: 31, maxW: 72 },
  esm_face_mask_oni: { attach: 'face', len: 96, maxW: 91 },
  esm_face_mask_skull: { attach: 'face', len: 76, maxW: 73 },
  esm_face_eyes_red: { attach: 'face', len: 31, maxW: 72 },
  // ----- arsenal diamante 2 (armas) -----
  w2_martelo_tempestade: { attach: 'hand', len: 56, grip: 0.85 },
  w2_kanabo_rubi: { attach: 'hand', len: 60, grip: 0.86 },
  w2_naginata_aurora: { attach: 'hand', len: 90, grip: 0.7 },
  w2_tridente_maremoto: { attach: 'hand', len: 88, grip: 0.72 },
  w2_cimitarra_sol: { attach: 'hand', len: 64, grip: 0.86 },
  w2_adaga_eclipse: { attach: 'hand', len: 36, grip: 0.8 },
  w2_garra_dragao: { attach: 'hand', len: 32, grip: 0.55 },
  w2_kama_lua: { attach: 'hand', len: 46, grip: 0.85 },
  w2_tessen_vendaval: { attach: 'hand', len: 42, grip: 0.75 },
  w2_chakram_estrela: { attach: 'hand', len: 42, grip: 0.5 },
  w2_machadao_vulcao: { attach: 'hand', len: 62, grip: 0.88 },
  w2_lanca_serpente: { attach: 'hand', len: 88, grip: 0.72 },
  w2_foice_alma: { attach: 'hand', len: 76, grip: 0.9 },
  w2_bastao_dragao: { attach: 'hand', len: 84, grip: 0.5 },
  w2_espada_fenix: { attach: 'hand', len: 66, grip: 0.86 },
  w2_maca_meteoro: { attach: 'hand', len: 54, grip: 0.85 },
  w2_kunai_sombra: { attach: 'hand', len: 32, grip: 0.8 },
  w2_sabre_nebulosa: { attach: 'hand', len: 64, grip: 0.86 },
  w2_alabarda_tita: { attach: 'hand', len: 92, grip: 0.7 },
  // ----- rostos diamante 2 -----
  f2_hannya_carmesim: { attach: 'face', len: 88, maxW: 80 },
  f2_kitsune_branca: { attach: 'face', len: 90, maxW: 77 },
  f2_elmo_dragao: { attach: 'face', len: 102, maxW: 93 },
  f2_cranio_demonio: { attach: 'face', len: 96, maxW: 86 },
  f2_visor_neon: { attach: 'face', len: 35, maxW: 74 },
  f2_mascara_corvo: { attach: 'face', len: 86, maxW: 70 },
  f2_tengu_rubro: { attach: 'face', len: 90, maxW: 74 },
  f2_capacete_gladiador: { attach: 'face', len: 101, maxW: 86 },
  f2_mascara_gato: { attach: 'face', len: 80, maxW: 74 },
  f2_mascara_fantasma: { attach: 'face', len: 83, maxW: 70 },
  f2_respirador_toxico: { attach: 'face', len: 70, maxW: 70 },
  f2_mascara_borboleta: { attach: 'face', len: 67, maxW: 93 },
  mascara_aurora: { attach: 'face', len: 67, maxW: 93 },
  f2_mascara_palhaco: { attach: 'face', len: 83, maxW: 74 },
  f2_mascara_medusa: { attach: 'face', len: 93, maxW: 83 },
  f2_mascara_kabuki: { attach: 'face', len: 83, maxW: 72 },
  // ----- braços diamante (par: um sprite em cada antebraço) -----
  saf_arms_gloves: { attach: 'arm', len: 52, maxW: 43, grip: 0.5 },
  esm_arms_gloves: { attach: 'arm', len: 52, maxW: 43, grip: 0.5 },
  // ----- cabeças diamante (arte IA) -----
  h4_chapeu_magico: { attach: 'head', len: 55, maxW: 58, overlap: 10 },
  h4_cartola_ouro: { attach: 'head', len: 50, maxW: 50, overlap: 10 },
  // ----- cabeças não-diamante (arte IA fiel à identidade de cada item) -----
  faixa_vermelha: { attach: 'head', len: 26, maxW: 52, overlap: 20 },
  faixa_branca: { attach: 'head', len: 26, maxW: 52, overlap: 20 },
  faixa_negra: { attach: 'head', len: 26, maxW: 52, overlap: 20 },
  faixa_dourada: { attach: 'head', len: 26, maxW: 52, overlap: 20 },
  faixa_ki: { attach: 'head', len: 26, maxW: 52, overlap: 20 },
  faixa_branca_2: { attach: 'head', len: 26, maxW: 52, overlap: 20 },
  chapeu_kasa_negro: { attach: 'head', len: 36, maxW: 74, overlap: 12 },
  elmo_ronin: { attach: 'head', len: 46, maxW: 52, overlap: 30 },
  capuz_sangue: { attach: 'head', len: 54, maxW: 54, overlap: 34 },
  capuz_cinzas: { attach: 'head', len: 54, maxW: 54, overlap: 34 },
  coroa_sombria: { attach: 'head', len: 26, maxW: 36, overlap: 7 },
  coroa_espinhos: { attach: 'head', len: 26, maxW: 36, overlap: 7 },
  // ----- pés diamante (par: um sprite em cada pé) -----
  // ----- costas diamante (arte IA, atrás do corpo) -----
  dia_aura_costas: { attach: 'back', len: 80, maxW: 98, rot: 0, dx: -5, dy: 6, anch: 0.4 },
  esm_back_aura: { attach: 'back', len: 80, maxW: 98, rot: 0, dx: -5, dy: 6, anch: 0.4 },
  bk_asa_fenix: { attach: 'back', len: 120, maxW: 147, rot: 0, dx: -5, dy: 6, anch: 0.4 },
  bk_asa_dragao: { attach: 'back', len: 120, maxW: 147, rot: 0, dx: -5, dy: 6, anch: 0.4 },
  bk_asa_serafim: { attach: 'back', len: 120, maxW: 147, rot: 0, dx: -5, dy: 6, anch: 0.4 },
  bk_asa_demonio: { attach: 'back', len: 120, maxW: 147, rot: 0, dx: -5, dy: 6, anch: 0.4 },
  bk_asa_borboleta: { attach: 'back', len: 120, maxW: 147, rot: 0, dx: -5, dy: 6, anch: 0.4 },
  bk_asa_tempestade: { attach: 'back', len: 120, maxW: 147, rot: 0, dx: -5, dy: 6, anch: 0.4 },
  bk_asa_sombra: { attach: 'back', len: 120, maxW: 147, rot: 0, dx: -5, dy: 6, anch: 0.4 },
  bk_asa_morcego: { attach: 'back', len: 120, maxW: 147, rot: 0, dx: -5, dy: 6, anch: 0.4 },
  bk_asa_mecanica: { attach: 'back', len: 120, maxW: 147, rot: 0, dx: -5, dy: 6, anch: 0.4 },
  bk_asa_arcoiris: { attach: 'back', len: 120, maxW: 147, rot: 0, dx: -5, dy: 6, anch: 0.4 },
  dia_capa_aurora: { attach: 'back', len: 74, maxW: 50, rot: 0.08, dx: -4, dy: 3, anch: 0.06 },
  dia_capa_nevasca: { attach: 'back', len: 74, maxW: 50, rot: 0.08, dx: -4, dy: 3, anch: 0.06 },
  // ----- rostos diamante 3 -----
  f3_elmo_aguia: { attach: 'face', len: 98, maxW: 85 },
  f3_mascara_urso: { attach: 'face', len: 74, maxW: 66 },
  f3_mascara_naja: { attach: 'face', len: 77, maxW: 66 },
  f3_elmo_leao: { attach: 'face', len: 101, maxW: 93 },
  f3_mascara_farao: { attach: 'face', len: 99, maxW: 83 },
  f3_caveira_fogo: { attach: 'face', len: 122, maxW: 107 },
  f3_mascara_diabo: { attach: 'face', len: 136, maxW: 120 },
  f3_elmo_coruja: { attach: 'face', len: 94, maxW: 85 },
  f3_face_mumia: { attach: 'face', len: 117, maxW: 99 },
  f3_mascara_geisha: { attach: 'face', len: 94, maxW: 77 },
  f3_elmo_rinoceronte: { attach: 'face', len: 99, maxW: 86 },
};

// itens que usam sprite MESMO com o interruptor mestre desligado
const SPRITE_WHITELIST = new Set([
  'dia_katana_gelo', 'dia_foice_glacial', 'dia_lancas_cristal', 'dia_machado_abismo',
  'esm_weapon_katana', 'esm_weapon_spear', 'esm_weapon_axe', 'esm_weapon_scythe',
  'saf_face_mask_oni', 'saf_face_eyes_red',
  'esm_face_mask_oni', 'esm_face_mask_skull', 'esm_face_eyes_red',
  'w2_martelo_tempestade', 'w2_kanabo_rubi', 'w2_naginata_aurora', 'w2_tridente_maremoto', 'w2_cimitarra_sol', 'w2_adaga_eclipse', 'w2_garra_dragao', 'w2_kama_lua', 'w2_tessen_vendaval', 'w2_chakram_estrela', 'w2_machadao_vulcao', 'w2_lanca_serpente', 'w2_foice_alma', 'w2_bastao_dragao', 'w2_espada_fenix', 'w2_maca_meteoro', 'w2_kunai_sombra', 'w2_sabre_nebulosa', 'w2_alabarda_tita',
  'f2_hannya_carmesim', 'f2_kitsune_branca', 'f2_elmo_dragao', 'f2_cranio_demonio', 'f2_visor_neon', 'f2_mascara_corvo', 'f2_tengu_rubro', 'f2_capacete_gladiador', 'f2_mascara_gato', 'f2_mascara_fantasma', 'f2_respirador_toxico', 'f2_mascara_borboleta', 'mascara_aurora', 'f2_mascara_palhaco', 'f2_mascara_medusa', 'f2_mascara_kabuki',
  'h4_chapeu_magico', 'h4_cartola_ouro',
  'faixa_vermelha', 'faixa_branca', 'faixa_negra', 'faixa_dourada', 'faixa_ki', 'faixa_branca_2',
  'chapeu_palha', 'chapeu_kasa_negro', 'elmo_ronin', 'capuz_sombrio', 'capuz_sangue', 'capuz_cinzas',
  'coroa', 'coroa_sombria', 'coroa_espinhos',
  
  
  'dia_aura_costas', 'esm_back_aura',
  'bk_asa_fenix', 'bk_asa_dragao', 'bk_asa_serafim', 'bk_asa_demonio', 'bk_asa_borboleta', 'bk_asa_tempestade', 'bk_asa_sombra', 'bk_asa_morcego', 'bk_asa_mecanica', 'bk_asa_arcoiris', 'dia_capa_aurora', 'dia_capa_nevasca',
  'saf_arms_gloves',
  'esm_arms_gloves',
  'f3_elmo_aguia', 'f3_mascara_urso', 'f3_mascara_naja', 'f3_elmo_leao', 'f3_mascara_farao', 'f3_caveira_fogo', 'f3_mascara_diabo', 'f3_elmo_coruja', 'f3_face_mumia', 'f3_mascara_geisha', 'f3_elmo_rinoceronte',
]);

// ============================================================
// INTERRUPTOR MESTRE: sprites pintados no boneco (experimental).
// false = todo o visual em jogo usa o vetor glossy (estável).
// Para reativar no futuro: true + rodar tools/normalize-sprites.mjs no VPS.
// ============================================================
const SPRITES_ENABLED = false;

const SPRITE_SLOTS = new Set(['weapon', 'head', 'face', 'back', 'body', 'arms']);

export function createWeaponSprite(container, behindOf = null) {
  const active = new Map(); // slot -> { spr, cfg, id }

  const clearSlot = (slot) => {
    const cur = active.get(slot);
    if (cur) { cur.spr.destroy(); cur.sprT?.destroy(); active.delete(slot); }
  };

  return {
    async setLoadout(loadout) {
      const wanted = new Map();
      for (const it of loadout || []) {
        const liberado = SPRITES_ENABLED || SPRITE_WHITELIST.has(it.id);
        if (liberado && SPRITE_SLOTS.has(it.slot) && CFG[it.id]) wanted.set(it.slot, it.id);
        else if (SPRITES_ENABLED && SPRITE_SLOTS.has(it.slot) && it.id)
          console.log(`[stikdead] ${it.slot}=${it.id}: sem sprite configurado, vetor assume`);
      }

      // remove o que saiu
      for (const slot of [...active.keys()])
        if (wanted.get(slot) !== active.get(slot).id) clearSlot(slot);

      // carrega o que entrou
      for (const [slot, id] of wanted) {
        if (active.has(slot)) continue;
        try {
          const tex = await Assets.load(CFG[id].src || `/sprites/${id}.webp`);
          const cfg = CFG[id];
          const spr = new Sprite(tex);
          spr.anchor.set(0.5, cfg.grip ?? 0.5);
          // torso e costas: entram ATRÁS do desenho do lutador
          if ((cfg.attach === 'torso' || cfg.attach === 'back') && behindOf && behindOf.parent === container) {
            container.addChildAt(spr, container.getChildIndex(behindOf));
          } else {
            container.addChild(spr);
          }
          let sprT = null;
          if (cfg.attach === 'arm' || cfg.attach === 'leg') {
            // o par do braço de trás — vive ATRÁS do desenho do lutador
            sprT = new Sprite(tex);
            sprT.anchor.set(0.5, cfg.grip ?? 0.5);
            sprT.alpha = 0.9;
            if (behindOf && behindOf.parent === container) container.addChildAt(sprT, container.getChildIndex(behindOf));
            else container.addChild(sprT);
          }
          active.set(slot, { spr, sprT, cfg, id });
          console.log(`[stikdead] sprite pintado ativo: ${slot}=${id} (${tex.width}x${tex.height})`);
        } catch (err) {
          console.warn(`[stikdead] sprite ${id} indisponível (${err?.message || err}) — usando vetor`);
        }
      }
    },
    hasSprite: (slot = 'weapon') => active.has(slot),
    activeSlots: () => new Set(active.keys()),
    update(f, moves) {
      if (active.size === 0) return;
      const sk = skeleton(poseFor(f, moves));
      const face = f.face;
      const ko = f.state === 'ko';
      const T = (p) => [f.x + p[0] * face, -(f.y + p[1])];

      for (const [slot, { spr, sprT, cfg }] of active) {
        if (ko) { spr.visible = false; if (sprT) sprT.visible = false; continue; }
        spr.visible = true;
        if (sprT) sprT.visible = true;
        let s = cfg.len / spr.texture.height;
        if (cfg.maxW) s = Math.min(s, cfg.maxW / spr.texture.width);
        spr.scale.set(s);
        if (sprT) sprT.scale.set(s);

        if (slot === 'weapon') {
          const e = T(sk.elbF);
          const h = T(sk.handF);
          let dx = h[0] - e[0];
          let dy = h[1] - e[1];
          const L = Math.hypot(dx, dy) || 1;
          dx /= L; dy /= L;
          spr.position.set(h[0], h[1]);
          spr.rotation = Math.atan2(dx, -dy);
        } else if (slot === 'head') {
          // assenta a base do objeto no topo da cabeça (com leve sobreposição)
          spr.anchor.set(0.5, 0.5);
          const s2 = Math.abs(spr.scale.y);
          const worldH = spr.texture.height * s2;
          const attach = [sk.head[0], sk.head[1] + RIG.headR * 0.72 + worldH / 2 - (cfg.overlap ?? 6)];
          const c = T(attach);
          spr.position.set(c[0], c[1]);
          spr.rotation = -sk.lean * 0.4 * face;
          spr.scale.x = s2 * face;
        } else if (slot === 'body') {
          // torso: centrado entre pescoço e quadril, girando com a inclinação do tronco
          spr.anchor.set(0.5, 0.5);
          const n = sk.neck, hp = sk.hip;
          const c = T([(n[0] + hp[0]) / 2, (n[1] + hp[1]) / 2 - 1]);
          spr.position.set(c[0], c[1]);
          const nT = T(n), hT = T(hp);
          spr.rotation = Math.atan2(hT[0] - nT[0], hT[1] - nT[1]) * -1;
          spr.scale.x = Math.abs(spr.scale.y) * face;
        } else if (slot === 'face') {
          // centro exato da cabeça, levemente à frente
          spr.anchor.set(0.5, 0.5);
          const c = T(sk.head);
          spr.position.set(c[0], c[1]);
          spr.rotation = -sk.lean * 0.35 * face;
          spr.scale.x = Math.abs(spr.scale.y) * face;
        } else if (cfg.attach === 'arm' || cfg.attach === 'leg') {
          // luva = PUNHO na mão; bota = PÉ com o cano subindo pela canela
          if (cfg.attach === 'legs') {
            // PERNA INTEIRA: um sprite do quadril ao pé, alinhado ao membro (como as armas ao braço)
            const calca = (alvo, joe, pe) => {
              const j = T(joe), p = T(pe);        // usa joelho→pé como eixo principal da perna
              let dx = p[0] - j[0], dy = p[1] - j[1];
              const L = Math.hypot(dx, dy) || 1; dx /= L; dy /= L;
              alvo.anchor.set(0.5, cfg.grip ?? 0.28); // 0.28 = topo perto do quadril
              const q = T(sk.hip);
              alvo.position.set((q[0] + p[0]) / 2, (q[1] + p[1]) / 2); // centro quadril↔pé
              alvo.rotation = Math.atan2(dx, -dy);
              alvo.scale.x = Math.abs(alvo.scale.y) * face;
            };
            calca(spr, sk.kneF, sk.footF);
            if (sprT) calca(sprT, sk.kneB, sk.footB);
          } else {
            // LUVA: punho na mão, apontando pelo antebraço
            const veste = (alvo, elb, hand) => {
              const e = T(elb), h = T(hand);
              let dx = h[0] - e[0], dy = h[1] - e[1];
              const L = Math.hypot(dx, dy) || 1; dx /= L; dy /= L;
              alvo.anchor.set(0.5, cfg.grip ?? 0.7);
              alvo.position.set(h[0], h[1]);
              alvo.rotation = Math.atan2(dx, -dy);
            };
            veste(spr, sk.elbF, sk.handF);
            if (sprT) veste(sprT, sk.elbB, sk.handB);
            spr.scale.x = -Math.abs(spr.scale.y) * face;
            if (sprT) sprT.scale.x = Math.abs(sprT.scale.y) * face;
          }
        } else if (slot === 'back') {
          spr.anchor.set(0.5, cfg.anch ?? 0.5);
          const bk = T([sk.neck[0] + (cfg.dx ?? -11), sk.neck[1] + (cfg.dy ?? -8)]);
          spr.position.set(bk[0], bk[1]);
          spr.rotation = (cfg.rot ?? 0.6) * face;
          spr.scale.x = Math.abs(spr.scale.y) * face;
        }
      }
    },
    destroy() { for (const slot of [...active.keys()]) clearSlot(slot); },
  };
}

// remove do vetor os itens cujo sprite pintado está ativo
export function filterForVector(loadout, mgr) {
  const slots = mgr?.activeSlots?.();
  if (!slots || slots.size === 0) return loadout;
  // stub: o vetor não desenha (template desconhecido), mas o rig ainda enxerga o slot ocupado
  return (loadout || []).map((it) => (slots.has(it.slot) ? { ...it, template: '__sprited__' } : it));
}
