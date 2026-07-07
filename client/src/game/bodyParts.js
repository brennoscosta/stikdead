// STIKDEAD :: P2 — peças pintadas presas ao esqueleto (método da cabeça, expandido)
// Cada peça é opcional: sem o arquivo em /parts/, o vetor segue soberano.
// Números de encaixe = TUNING: ajustados por print do jogo (protocolo oficial).
import { Sprite, Assets } from 'pixi.js';

const FILES = ['head', 'torso', 'thigh', 'shin', 'boot', 'forearm', 'upperarm'];
let texs = null;

export async function loadPartTextures() {
  if (texs) return texs;
  texs = {};
  await Promise.all(
    FILES.map(async (n) => {
      try {
        texs[n] = await Assets.load(`/parts/${n}.webp`);
      } catch {
        /* peça ausente: vetor assume */
      }
    })
  );
  return texs;
}

// tuning de encaixe por peça (len = distância entre as juntas)
// tint: manequim branco tingido de obsidiana (skins de cor no futuro = trocar este número)
export const BODY_TINT = 0x4e4a56; // chumbo: escuro mas com volume vivo
const FIT = {
  torso:    { stretch: 1.5, widthK: 0.55, anchorY: 0.46, tint: true },
  thigh:    { stretch: 1.35, widthK: 0.5, anchorY: 0.45, tint: true },
  shin:     { stretch: 1.3, widthK: 0.55, anchorY: 0.42, tint: true },
  upperarm: { stretch: 1.4, widthK: 0.55, anchorY: 0.42, tint: true },
  boot:     { size: 2.2, anchorY: 0.42, rotK: 0.55, tint: true },
  forearm:  { stretch: 1.5, widthK: 0.62, anchorY: 0.35, tint: true },
};

export function createFighterParts(world) {
  const mk = (name, anchorY = 0.5) => {
    const s = new Sprite();
    s.anchor.set(0.5, anchorY);
    s.visible = false;
    s.__part = name;
    return s;
  };
  // ordem de profundidade: membros de trás → torso → membros da frente → (cabeça vive no renderer)
  const parts = {
    upperarmB: mk('upperarm', FIT.upperarm.anchorY),
    forearmB: mk('forearm', FIT.forearm.anchorY),
    thighB: mk('thigh', FIT.thigh.anchorY),
    shinB: mk('shin', FIT.shin.anchorY),
    bootB: mk('boot', FIT.boot.anchorY),
    torso: mk('torso', FIT.torso.anchorY),
    thighF: mk('thigh', FIT.thigh.anchorY),
    shinF: mk('shin', FIT.shin.anchorY),
    bootF: mk('boot', FIT.boot.anchorY),
    upperarmF: mk('upperarm', FIT.upperarm.anchorY),
    forearmF: mk('forearm', FIT.forearm.anchorY),
  };
  for (const k of ['upperarmB', 'forearmB', 'thighB', 'shinB', 'bootB', 'torso', 'thighF', 'shinF', 'bootF', 'upperarmF', 'forearmF'])
    world.addChild(parts[k]);
  return parts;
}

const ang = (a, b) => Math.atan2(b.y - a.y, b.x - a.x);
const dist = (a, b) => Math.hypot(b.x - a.x, b.y - a.y);
const mid = (a, b) => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });

function fitSegment(spr, tex, a, b, fit, face) {
  // peça vertical (pintada apontando para baixo) esticada entre as juntas a→b
  spr.texture = tex;
  spr.visible = true;
  spr.tint = fit.tint ? BODY_TINT : 0xffffff;
  const len = dist(a, b) * fit.stretch;
  const k = len / tex.height;
  spr.height = len;
  spr.width = tex.width * k * fit.widthK;
  spr.scale.x = Math.abs(spr.scale.x) * (face < 0 ? -1 : 1);
  const p = fit.anchorY <= 0.35 ? a : mid(a, b); // âncora alta = pendura na junta de cima
  spr.position.set(p.x, p.y);
  spr.rotation = ang(a, b) - Math.PI / 2;
}

export function updateFighterParts(parts, pose, T) {
  // T = mapa de texturas carregadas
  if (!pose) return;
  const off = () => {
    for (const k in parts) parts[k].visible = false;
  };
  if (!T) return off();
  const face = pose.face;

  if (T.torso) fitSegment(parts.torso, T.torso, pose.neck, pose.hip, FIT.torso, face);
  else parts.torso.visible = false;

  if (T.thigh) {
    fitSegment(parts.thighF, T.thigh, pose.hip, pose.kneeF, FIT.thigh, face);
    fitSegment(parts.thighB, T.thigh, pose.hip, pose.kneeB, FIT.thigh, face);
  } else { parts.thighF.visible = false; parts.thighB.visible = false; }

  if (T.shin) {
    fitSegment(parts.shinF, T.shin, pose.kneeF, pose.ankleF, FIT.shin, face);
    fitSegment(parts.shinB, T.shin, pose.kneeB, pose.ankleB, FIT.shin, face);
  } else { parts.shinF.visible = false; parts.shinB.visible = false; }

  if (T.upperarm) {
    fitSegment(parts.upperarmF, T.upperarm, pose.neck, pose.elbowF, FIT.upperarm, face);
    fitSegment(parts.upperarmB, T.upperarm, pose.neck, pose.elbowB, FIT.upperarm, face);
  } else { parts.upperarmF.visible = false; parts.upperarmB.visible = false; }

  if (T.forearm) {
    fitSegment(parts.forearmF, T.forearm, pose.elbowF, pose.wristF, FIT.forearm, face);
    fitSegment(parts.forearmB, T.forearm, pose.elbowB, pose.wristB, FIT.forearm, face);
  } else { parts.forearmF.visible = false; parts.forearmB.visible = false; }

  if (T.boot) {
    for (const [spr, knee, ankle] of [
      [parts.bootF, pose.kneeF, pose.ankleF],
      [parts.bootB, pose.kneeB, pose.ankleB],
    ]) {
      spr.texture = T.boot;
      spr.visible = true;
      spr.tint = FIT.boot.tint ? BODY_TINT : 0xffffff;
      const d = pose.headR * FIT.boot.size;
      const k = d / spr.texture.height;
      spr.height = d;
      spr.width = spr.texture.width * k;
      spr.scale.x = Math.abs(spr.scale.x) * (face < 0 ? -1 : 1);
      spr.position.set(ankle.x, ankle.y - d * 0.18);
      spr.rotation = (ang(knee, ankle) - Math.PI / 2) * FIT.boot.rotK;
    }
  } else { parts.bootF.visible = false; parts.bootB.visible = false; }
}
