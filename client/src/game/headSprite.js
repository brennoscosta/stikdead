// STIKDEAD :: P1 — cabeça pintada (Soul) presa ao esqueleto
// A textura é opcional: sem /parts/head.webp, o rig vetorial segue soberano.
import { Assets } from 'pixi.js';

export const HEAD_SPRITE_ENABLED = true;
let tex = null;
let tried = false;

export async function loadHeadTexture() {
  if (tried || !HEAD_SPRITE_ENABLED) return tex;
  tried = true;
  try {
    tex = await Assets.load('/parts/head.webp');
  } catch {
    tex = null; // sem arquivo, sem drama
  }
  return tex;
}
