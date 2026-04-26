/**
 * PREMIUM GLOBE SHADERS
 * Domain-warped FBM for organic continents
 * Cratered ocean floor, atmospheric scattering, proper lighting
 */

// ─── Shared GLSL Noise Library ────────────────────────────────────────────
const NOISE_LIB = `
// ─── Ashima / Stefan Gustavson Perlin-like noise ───────────────────────
vec3 mod289_3(vec3 x) { return x - floor(x * (1.0/289.0)) * 289.0; }
vec4 mod289_4(vec4 x) { return x - floor(x * (1.0/289.0)) * 289.0; }
vec4 permute(vec4 x) { return mod289_4(((x*34.0)+1.0)*x); }
vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

float snoise(vec3 v) {
  const vec2 C = vec2(1.0/6.0, 1.0/3.0);
  const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
  vec3 i  = floor(v + dot(v, C.yyy));
  vec3 x0 = v - i + dot(i, C.xxx);
  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min(g.xyz, l.zxy);
  vec3 i2 = max(g.xyz, l.zxy);
  vec3 x1 = x0 - i1 + C.xxx;
  vec3 x2 = x0 - i2 + C.yyy;
  vec3 x3 = x0 - D.yyy;
  i = mod289_3(i);
  vec4 p = permute(permute(permute(
    i.z + vec4(0.0, i1.z, i2.z, 1.0)) +
    i.y + vec4(0.0, i1.y, i2.y, 1.0)) +
    i.x + vec4(0.0, i1.x, i2.x, 1.0));
  float n_ = 0.142857142857;
  vec3 ns = n_ * D.wyz - D.xzx;
  vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_);
  vec4 x  = x_ * ns.x + ns.yyyy;
  vec4 y  = y_ * ns.x + ns.yyyy;
  vec4 h  = 1.0 - abs(x) - abs(y);
  vec4 b0 = vec4(x.xy, y.xy);
  vec4 b1 = vec4(x.zw, y.zw);
  vec4 s0 = floor(b0)*2.0 + 1.0;
  vec4 s1 = floor(b1)*2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));
  vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy;
  vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;
  vec3 p0 = vec3(a0.xy, h.x);
  vec3 p1 = vec3(a0.zw, h.y);
  vec3 p2 = vec3(a1.xy, h.z);
  vec3 p3 = vec3(a1.zw, h.w);
  vec4 norm = taylorInvSqrt(vec4(dot(p0,p0),dot(p1,p1),dot(p2,p2),dot(p3,p3)));
  p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
  vec4 m = max(0.6 - vec4(dot(x0,x0),dot(x1,x1),dot(x2,x2),dot(x3,x3)), 0.0);
  m = m * m;
  return 42.0 * dot(m*m, vec4(dot(p0,x0),dot(p1,x1),dot(p2,x2),dot(p3,x3)));
}

// ─── Simple value noise for faster detail ────────────────────────────────
float hash1(vec3 p) {
  p  = 50.0*fract(p*0.3183099 + vec3(0.71,0.113,0.419));
  return -1.0 + 2.0*fract(p.x*p.y*p.z*(p.x+p.y+p.z));
}

float vnoise(vec3 p) {
  vec3 i = floor(p);
  vec3 f = fract(p);
  f = f*f*(3.0-2.0*f);
  return mix(
    mix(mix(hash1(i+vec3(0,0,0)), hash1(i+vec3(1,0,0)), f.x),
        mix(hash1(i+vec3(0,1,0)), hash1(i+vec3(1,1,0)), f.x), f.y),
    mix(mix(hash1(i+vec3(0,0,1)), hash1(i+vec3(1,0,1)), f.x),
        mix(hash1(i+vec3(0,1,1)), hash1(i+vec3(1,1,1)), f.x), f.y), f.z);
}

// ─── Fractal Brownian Motion ─────────────────────────────────────────────
float fbm(vec3 p, int octaves) {
  float val = 0.0;
  float amp = 0.5;
  float freq = 1.0;
  for (int i = 0; i < 8; i++) {
    if (i >= octaves) break;
    val += amp * snoise(p * freq);
    freq *= 2.0;
    amp *= 0.5;
  }
  return val;
}

// ─── Domain-warped FBM for organic continent shapes ─────────────────────
// Based on Inigo Quilez's procedural terrain techniques
float ridgedFBM(vec3 p) {
  float val = 0.0;
  float amp = 0.5;
  float freq = 1.0;
  float prev = 1.0;
  for (int i = 0; i < 5; i++) {
    float n = snoise(p * freq);
    n = 1.0 - abs(n); // ridge
    n = n * n;
    val += amp * n * prev;
    prev = n;
    freq *= 2.1;
    amp *= 0.52;
  }
  return val;
}

// ─── Crater / ridge noise for ocean floor ────────────────────────────────
float oceanRidge(vec3 p) {
  float val = 0.0;
  float amp = 0.3;
  float freq = 2.0;
  for (int i = 0; i < 4; i++) {
    float n = abs(snoise(p * freq));
    val += amp * n;
    freq *= 2.2;
    amp *= 0.45;
  }
  return val;
}
`;

// ─── EARTH SHADER ─────────────────────────────────────────────────────────
export const earthVertexShader = `
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vPosition;
  varying vec3 vWorldPos;
  void main() {
    vUv       = uv;
    vNormal   = normalize(normalMatrix * normal);
    vPosition = position;
    vWorldPos = (modelMatrix * vec4(position, 1.0)).xyz;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

export const earthFragmentShader = `
  uniform float uTime;
  uniform float uNightSide;
  uniform float uCityGlow;
  
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vPosition;
  varying vec3 vWorldPos;
  
  ${NOISE_LIB}
  
  // ─── Color palettes ───────────────────────────────────────────────────
  vec3 deepOceanColor(vec3 p, float ridgeMask) {
    vec3 deep1 = vec3(0.02, 0.05, 0.13);
    vec3 deep2 = vec3(0.01, 0.04, 0.10);
    vec3 ridge = vec3(0.04, 0.08, 0.18);
    float n = snoise(p * 6.0 + vec3(23.1));
    vec3 base = mix(deep1, deep2, smoothstep(-0.3, 0.3, n));
    base = mix(base, ridge, ridgeMask * 0.6);
    return base;
  }
  
  vec3 shallowOceanColor(vec3 p) {
    vec3 shallow = vec3(0.04, 0.12, 0.22);
    vec3 turquoise = vec3(0.03, 0.14, 0.18);
    float n = snoise(p * 8.0 + vec3(7.3, -2.1, 4.7));
    return mix(shallow, turquoise, smoothstep(-0.2, 0.3, n) * 0.5);
  }
  
  vec3 landBaseColor(vec3 p) {
    // Multi-layered land: tropical, temperate, arid
    vec3 tropical = vec3(0.08, 0.18, 0.07);
    vec3 temperate = vec3(0.12, 0.20, 0.09);
    vec3 arid = vec3(0.20, 0.16, 0.08);
    vec3 boreal = vec3(0.06, 0.14, 0.06);
    
    float lat = vPosition.y; // latitude proxy
    float latMask = abs(lat);
    
    vec3 base = temperate;
    base = mix(base, tropical, smoothstep(0.0, 0.5, 1.0 - latMask));
    base = mix(base, arid, smoothstep(0.3, 0.6, abs(snoise(p * 1.5 + vec3(45.2)))));
    base = mix(base, boreal, smoothstep(0.55, 0.85, latMask));
    
    // Micro terrain variation
    float detail = snoise(p * 12.0 + vec3(3.7));
    base += vec3(0.02, 0.015, 0.01) * detail;
    return base;
  }
  
  // Poles ice/snow
  vec3 poleColor(vec3 land, float poleFactor) {
    vec3 ice = vec3(0.65, 0.72, 0.78);
    vec3 snow = vec3(0.80, 0.84, 0.88);
    vec3 polarLand = mix(land, ice, poleFactor * 0.85);
    // Snow on mountains
    float mtn = ridgedFBM(vPosition * 3.0 + vec3(12.0));
    polarLand = mix(polarLand, snow, smoothstep(0.6, 0.9, mtn) * poleFactor * 0.7);
    return polarLand;
  }
  
  void main() {
    // ─── DOMAIN WARPING: organic, natural-looking continents ──────────
    vec3 warpP = vPosition * 2.5;
    vec3 warp = vec3(
      snoise(warpP + vec3(0.0, 13.7, 7.3)),
      snoise(warpP + vec3(5.1, 0.0, 23.4)),
      snoise(warpP + vec3(17.2, 3.5, 0.0))
    ) * 0.35;
    vec3 warpedPos = vPosition * 3.2 + warp;
    
    // ─── RIDGED FBM for major landmass structure ──────────────────────
    float ridges = ridgedFBM(warpedPos);
    
    // ─── Secondary detail noise for coastline irregularity ────────────
    float detail = fbm(vPosition * 6.0, 3) * 0.3;
    
    // ─── Combine: ridges = continents, detail = coastline/terrain ────
    float landRaw = ridges + detail - 0.15;
    
    // ─── Smooth continental edges with a shelf falloff ────────────────
    float landMask = smoothstep(0.08, 0.28, landRaw);
    
    // ─── Ocean floor ridges (Mid-Atlantic Ridge style) ─────────────────
    float oceanRidges = oceanRidge(vPosition * 1.5 + vec3(41.7));
    
    // ─── Color building ────────────────────────────────────────────────
    // IMPORTANT: start with deep ocean, transition to shallow near land, then land
    vec3 oceanDeep = deepOceanColor(vPosition, oceanRidges);
    vec3 oceanShallow = shallowOceanColor(vPosition);
    
    // Shore color blend region
    float shoreMask = smoothstep(0.0, 0.15, landRaw);
    vec3 oceanColor = mix(oceanDeep, oceanShallow, shoreMask * 0.4);
    
    // Land colors
    vec3 landC = landBaseColor(vPosition);
    float poleFactor = pow(abs(vPosition.y), 2.5);
    landC = poleColor(landC, poleFactor);
    
    // Mix land/ocean
    vec3 baseColor = mix(oceanColor, landC, landMask);
    
    // ─── Lighting ─────────────────────────────────────────────────────
    vec3 sunDir = normalize(vec3(-0.6, 0.25, 0.8));
    float diffuse = max(dot(vNormal, sunDir), 0.0);
    // Slightly soften the day/night terminator
    float litFrac = smoothstep(-0.35, 0.15, dot(vNormal, sunDir));
    float nightFrac = 1.0 - litFrac;
    
    // ─── Day side: warm sunlight ──────────────────────────────────────
    vec3 sunWarm = vec3(1.04, 0.98, 0.88);
    vec3 dayColor = baseColor * mix(vec3(0.35), sunWarm, diffuse);
    
    // Specular ocean highlight (blue-green sheen on water)
    vec3 viewDir = normalize(cameraPosition - vWorldPos);
    vec3 halfDir = normalize(sunDir + viewDir);
    float spec = pow(max(dot(vNormal, halfDir), 0.0), 120.0);
    float oceanMask = 1.0 - landMask;
    vec3 oceanSpec = vec3(0.15, 0.28, 0.38) * spec * oceanMask;
    dayColor += oceanSpec;
    
    // ─── Night side: dark + city lights ───────────────────────────────
    vec3 nightColor = baseColor * 0.06;
    
    // City lights on land: warm gold scatter points via hash
    float cityN1 = vnoise(vPosition * 38.0 + vec3(100.0));
    float cityN2 = vnoise(vPosition * 18.0 + vec3(-20.3, 47.1, 3.2));
    float cityCluster = smoothstep(0.35, 0.55, cityN2);
    float cityDots  = smoothstep(0.45, 0.48, cityN1);
    // Only on land, clustered near coasts/meanders
    float cityMask = cityDots * cityCluster * landMask;
    vec3 cityColor = vec3(0.95, 0.78, 0.35) * cityMask * uCityGlow * 2.0;
    nightColor += cityColor;
    
    // Combine day/night
    vec3 finalColor = mix(nightColor, dayColor, litFrac);
    
    // ─── Subtle atmosphere edge tint ─────────────────────────────────
    float fresnel = pow(1.0 - max(dot(vNormal, viewDir), 0.0), 3.0);
    vec3 limbColor = vec3(0.15, 0.25, 0.45);
    finalColor += limbColor * fresnel * 0.25 * litFrac;
    
    // ─── Subtle vignette for dramatic framing ─────────────────────────
    finalColor *= mix(0.92, 1.0, 1.0 - fresnel * 0.3);
    
    // Tone mapping hint (gentle contrast)
    finalColor = finalColor / (finalColor + vec3(0.15)) * 1.1;
    
    gl_FragColor = vec4(finalColor, 1.0);
  }
`;

// ─── CLOUD SHADERS ────────────────────────────────────────────────────────
export const cloudVertexShader = `
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vPos;
  void main() {
    vUv    = uv;
    vNormal= normalize(normalMatrix * normal);
    vPos   = position;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

export const cloudFragmentShader = `
  uniform float uTime;
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vPos;
  
  ${NOISE_LIB}
  
  void main() {
    // Animate clouds with two noise layers drifting
    vec3 p1 = vPos * 3.5 + vec3(uTime * 0.003, uTime * 0.0012, 0.0);
    vec3 p2 = vPos * 7.2 + vec3(uTime * 0.001, 0.0, uTime * 0.002);
    
    float cloudNoise = snoise(p1) * 0.55 + snoise(p2) * 0.45;
    cloudNoise += snoise(vPos * 14.0 + vec3(uTime*0.0005)) * 0.15;
    
    // Build: flats in center (larger), wisps at edges
    float cloud = smoothstep(0.12, 0.45, cloudNoise);
    float wispy = smoothstep(0.05, 0.25, cloudNoise) * 0.3;
    cloud = max(cloud, wispy);
    
    // Sun-lit cloud: slightly warm white on day, cool grey on night
    vec3 sunDir  = normalize(vec3(-0.6, 0.25, 0.8));
    float lit    = dot(vNormal, sunDir) * 0.35 + 0.65;
    vec3 cloudDayCol = vec3(0.82, 0.82, 0.86) * lit;
    vec3 cloudNightCol = vec3(0.12, 0.12, 0.15) * lit * 0.3;
    float nightMask = smoothstep(-0.2, 0.1, dot(vNormal, sunDir));
    vec3 cloudCol = mix(cloudNightCol, cloudDayCol, nightMask);
    
    gl_FragColor = vec4(cloudCol, cloud * 0.28);
  }
`;

// ─── ATMOSPHERE SHADERS ───────────────────────────────────────────────────
export const atmosphereVertexShader = `
  varying float vFresnel;
  varying vec3 vNormal;
  void main() {
    vec3 worldNormal = normalize(mat3(modelMatrix) * normal);
    vec3 viewDir = normalize(cameraPosition - (modelMatrix * vec4(position, 1.0)).xyz);
    vFresnel     = 1.0 - max(dot(worldNormal, viewDir), 0.0);
    vNormal = worldNormal;
    gl_Position  = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

export const atmosphereFragmentShader = `
  uniform vec3 uColor;
  varying float vFresnel;
  varying vec3 vNormal;
  
  void main() {
    float f = pow(vFresnel, 3.0);
    // Soft atmospheric glow, stronger on the lit limb
    float glow = f * 0.6;
    gl_FragColor = vec4(uColor * 2.0, glow);
  }
`;
