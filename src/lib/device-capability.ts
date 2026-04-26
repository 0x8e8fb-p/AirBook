"use client";

export interface DeviceCapabilityResult {
  score: number;
  tier: "HIGH" | "MED" | "LOW";
  webgl2: boolean;
  pixelRatio: number;
  maxParticles: number;
  bloomEnabled: boolean;
  shadowsEnabled: boolean;
  antialias: boolean;
  flightArcs: number;
}

function getDeviceCapability(): DeviceCapabilityResult {
  const canvas = document.createElement("canvas");
  const gl = canvas.getContext("webgl2") || canvas.getContext("webgl");

  let score = 0;

  if (gl) {
    const debugInfo = gl.getExtension("WEBGL_debug_renderer_info");
    const renderer = debugInfo ? gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) : "";

    if (/nvidia|amd|radeon|geforce/i.test(renderer)) score += 40;
    else if (/apple gpu|apple m/i.test(renderer)) score += 40;
    else if (/intel iris|intel uhd/i.test(renderer)) score += 25;
    else if (/adreno [5-9]/i.test(renderer)) score += 20;
    else if (/adreno [3-4]/i.test(renderer)) score += 10;
    else score += 5;
  }

  // @ts-ignore
  if (navigator.deviceMemory >= 8) score += 25;
  // @ts-ignore
  else if (navigator.deviceMemory >= 4) score += 15;
  // @ts-ignore
  else if (navigator.deviceMemory >= 2) score += 5;

  if (navigator.hardwareConcurrency >= 8) score += 20;
  else if (navigator.hardwareConcurrency >= 4) score += 10;
  else if (navigator.hardwareConcurrency >= 2) score += 5;

  // @ts-ignore
  if (navigator.connection) {
    // @ts-ignore
    if (["4g", "wifi"].includes(navigator.connection.effectiveType)) score += 10;
    // @ts-ignore
    if (navigator.connection.saveData) score -= 30;
  }

  if (window.devicePixelRatio > 2) score -= 10;
  if (/Mobi|Android/i.test(navigator.userAgent)) score -= 15;

  score = Math.max(0, Math.min(100, score));

  const tier = score >= 60 ? "HIGH" : score >= 30 ? "MED" : "LOW";

  return {
    score,
    tier,
    webgl2: !!canvas.getContext("webgl2"),
    pixelRatio: Math.min(window.devicePixelRatio, score >= 60 ? 2.5 : score >= 30 ? 1.5 : 1),
    maxParticles: score >= 60 ? 2500 : score >= 30 ? 1200 : 400,
    bloomEnabled: score >= 50,
    shadowsEnabled: score >= 60,
    antialias: score >= 40,
    flightArcs: score >= 30 ? 12 : 6,
  };
}

let cachedDC: DeviceCapabilityResult | null = null;

export function getDC(): DeviceCapabilityResult {
  if (!cachedDC) {
    cachedDC = getDeviceCapability();
    console.log(`[AirBook] Device tier: ${cachedDC.tier} (score: ${cachedDC.score})`);
  }
  return cachedDC;
}
