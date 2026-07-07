// STIKDEAD :: P2 — peças pintadas presas ao esqueleto (método da cabeça, expandido)
// Cada peça é opcional: sem o arquivo em /parts/, o vetor segue soberano.
// Números de encaixe = TUNING: ajustados por print do jogo (protocolo oficial).
import { Sprite, Assets } from 'pixi.js';

const FILES = ['head', 'torso', 'thigh', 'boot', 'forearm'];
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
const FIT = {
  torso:   { stretch: 1.62, widthK: 1.0, anchorY: 0.5 },
  thigh:   { stretch: 1.45, widthK: 1.0, anchorY: 0.42 },
  boot:    { size: 2.05, anchorY: 0.42, rotK: 0.55 }, // size em headR; rot amortecida
  forearm: { stretch: 1.75, widthK: 1.0, anchorY: 0.32 }, // inclui a luva na ponta
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
    thighB: mk('thigh', FIT.thigh.anchorY),
    bootB: mk('boot', FIT.boot.anchorY),
    forearmB: mk('forearm', FIT.forearm.anchorY),
    torso: mk('torso', FIT.torso.anchorY),
    thighF: mk('thigh', FIT.thigh.anchorY),
    bootF: mk('boot', FIT.boot.anchorY),
    forearmF: mk('forearm', FIT.forearm.anchorY),
  };
  for (const k of ['thighB', 'bootB', 'forearmB', 'torso', 'thighF', 'bootF', 'forearmF'])
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
