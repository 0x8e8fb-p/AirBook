"use client";

import * as THREE from "three";

/**
 * Create a soft circular glow texture for particles & dots.
 * This replaces the sharp square default Three.js points.
 */
function createGlowTexture(
  stops: { pos: number; color: string }[]
): THREE.Texture {
  const size = 128;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;

  const cx = size / 2;
  const radius = size / 2;

  const grad = ctx.createRadialGradient(cx, cx, 0, cx, cx, radius);
  for (const s of stops) {
    grad.addColorStop(s.pos, s.color);
  }

  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  return texture;
}

let _particleTexture: THREE.Texture | null = null;
let _glowDotTexture: THREE.Texture | null = null;
let _starTexture: THREE.Texture | null = null;

export function getParticleTexture(): THREE.Texture {
  if (!_particleTexture) {
    _particleTexture = createGlowTexture([
      { pos: 0.0,  color: "rgba(255,255,255,0.9)" },
      { pos: 0.35, color: "rgba(200,230,255,0.5)" },
      { pos: 0.7,  color: "rgba(200,230,255,0.15)" },
      { pos: 1.0,  color: "rgba(0,0,0,0)" },
    ]);
  }
  return _particleTexture;
}

export function getGlowDotTexture(): THREE.Texture {
  if (!_glowDotTexture) {
    _glowDotTexture = createGlowTexture([
      { pos: 0.0,  color: "rgba(245,200,66,1.0)" },
      { pos: 0.35, color: "rgba(245,200,66,0.55)" },
      { pos: 0.7,  color: "rgba(245,200,66,0.15)" },
      { pos: 1.0,  color: "rgba(0,0,0,0)" },
    ]);
  }
  return _glowDotTexture;
}

export function getStarTexture(): THREE.Texture {
  if (!_starTexture) {
    const canvas = document.createElement("canvas");
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext("2d")!;
    const cx = 64;
    const cy = 64;

    // Core star
    const core = ctx.createRadialGradient(cx, cy, 0, cx, cy, 60);
    core.addColorStop(0.0, "rgba(255,255,255,1.0)");
    core.addColorStop(0.15, "rgba(255,245,220,0.9)");
    core.addColorStop(0.4, "rgba(200,220,255,0.5)");
    core.addColorStop(0.7, "rgba(150,180,255,0.15)");
    core.addColorStop(1.0, "rgba(0,0,0,0)");
    ctx.fillStyle = core;
    ctx.fillRect(0, 0, 128, 128);

    // Cross flare (4-pointed star)
    ctx.globalCompositeOperation = "lighter";
    const flareGrad = ctx.createLinearGradient(cx, 0, cx, 128);
    flareGrad.addColorStop(0, "rgba(255,255,255,0)");
    flareGrad.addColorStop(0.45, "rgba(255,255,255,0)");
    flareGrad.addColorStop(0.5, "rgba(255,250,230,0.6)");
    flareGrad.addColorStop(0.55, "rgba(255,255,255,0)");
    flareGrad.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = flareGrad;
    ctx.fillRect(0, 0, 128, 128);

    const flareGradH = ctx.createLinearGradient(0, cy, 128, cy);
    flareGradH.addColorStop(0, "rgba(255,255,255,0)");
    flareGradH.addColorStop(0.45, "rgba(255,255,255,0)");
    flareGradH.addColorStop(0.5, "rgba(255,250,230,0.4)");
    flareGradH.addColorStop(0.55, "rgba(255,255,255,0)");
    flareGradH.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = flareGradH;
    ctx.fillRect(0, 0, 128, 128);

    _starTexture = new THREE.CanvasTexture(canvas);
    _starTexture.needsUpdate = true;
    _starTexture.minFilter = THREE.LinearFilter;
    _starTexture.magFilter = THREE.LinearFilter;
  }
  return _starTexture;
}
