// ═══════════════════════════════════════════════════════════════
// AIRBOOK v2.0 — main.js
// Full-featured interactive experience. No build step.
// ═══════════════════════════════════════════════════════════════

// ─── REGISTER GSAP ───
try { gsap.registerPlugin(ScrollTrigger); } catch(e){ console.warn('GSAP plugin error', e); }

// ─── EASING CONSTANTS ───
const EASE = { arrive: 'expo.out', depart: 'expo.in', flow: 'expo.inOut', snap: 'power3.out', spring: 'back.out(1.7)', steady: 'power1.inOut' };
const DUR = { instant: 0.12, fast: 0.25, base: 0.45, slow: 0.8, glacial: 1.4 };

// ─── 1. DEVICE CAPABILITY ───
const DC = (() => {
  const c = document.createElement('canvas');
  const gl = c.getContext('webgl2') || c.getContext('webgl');
  let score = 0;
  if (!gl) return { tier: 'NONE', score: 0, pixelRatio: 1, particles: 0, arcs: 0, bloom: false, antialias: false, fpsCap: 30 };
  const ext = gl.getExtension('WEBGL_debug_renderer_info');
  const renderer = ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : '';
  if (/apple m[1-9]|nvidia rtx|nvidia gtx 1[6-9]|nvidia gtx [2-9]/i.test(renderer)) score += 50;
  else if (/apple gpu|nvidia|amd|radeon/i.test(renderer)) score += 35;
  else if (/intel iris/i.test(renderer)) score += 22;
  else if (/adreno [6-9]/i.test(renderer)) score += 18;
  else if (/adreno [4-5]/i.test(renderer)) score += 10;
  else score += 5;
  if (navigator.deviceMemory >= 8) score += 20;
  else if (navigator.deviceMemory >= 4) score += 12;
  else if (navigator.deviceMemory >= 2) score += 5;
  const cores = navigator.hardwareConcurrency || 4;
  if (cores >= 8) score += 15; else if (cores >= 4) score += 8;
  const conn = navigator.connection;
  if (conn?.effectiveType === '4g' || conn?.type === 'wifi') score += 8;
  if (conn?.saveData) score -= 25;
  if (/Mobi|Android/i.test(navigator.userAgent)) score -= 12;
  if (devicePixelRatio > 2) score -= 8;
  score = Math.max(0, Math.min(100, score));
  const tier = score >= 65 ? 'ULTRA' : score >= 40 ? 'HIGH' : score >= 22 ? 'MED' : 'LOW';
  return {
    score, tier,
    pixelRatio: Math.min(devicePixelRatio, tier === 'ULTRA' ? 2 : 1.5),
    particles: ({ ULTRA: 3500, HIGH: 2000, MED: 900, LOW: 300 })[tier],
    arcs: ({ ULTRA: 14, HIGH: 10, MED: 7, LOW: 4 })[tier],
    bloom: tier !== 'LOW',
    antialias: tier === 'ULTRA' || tier === 'HIGH',
    fpsCap: tier === 'LOW' ? 30 : 60,
  };
})();
window.DC = DC;

// ─── 2. PRELOADER ───
class Preloader {
  constructor() {
    this.el = document.getElementById('preloader');
    this.pct = this.el.querySelector('.preloader__pct');
    this._startCounter();
  }
  _startCounter() {
    let start = null;
    const duration = 1200;
    const tick = (ts) => {
      if (!start) start = ts;
      const elapsed = ts - start;
      const progress = Math.min(100, Math.round((elapsed / duration) * 100));
      if (this.pct) this.pct.textContent = String(progress).padStart(3, '0') + '%';
      if (elapsed < duration + 200) requestAnimationFrame(tick);
      else if (this.pct) this.pct.textContent = '100%';
    };
    requestAnimationFrame(tick);
  }
  async start() { await new Promise(r => setTimeout(r, 1800)); }
  async exit() { this.el.classList.add('preloader--exit'); await new Promise(r => setTimeout(r, 700)); this.el.remove(); }
}

// ─── 3. MAGNETIC CURSOR ───
class MagneticCursor {
  constructor() {
    if ('ontouchstart' in window || !matchMedia('(hover: hover)').matches || innerWidth <= 640) return;
    this.cursor = this._create();
    this.x = 0; this.y = 0; this.tx = 0; this.ty = 0; this.scale = 1; this.tScale = 1;
    this._bind(); this._tick();
  }
  _create() {
    const c = document.createElement('div');
    c.className = 'cursor';
    c.innerHTML = '<div class="cursor__ring"></div><div class="cursor__dot"></div><div class="cursor__label"></div>';
    document.body.appendChild(c);
    return c;
  }
  _bind() {
    document.addEventListener('mousemove', e => { this.tx = e.clientX; this.ty = e.clientY; });
    document.querySelectorAll('[data-magnetic], a, button, .cursor-target').forEach(el => {
      el.addEventListener('mouseenter', () => {
        this.tScale = 2.5;
        this.cursor.classList.add('cursor--hover');
        const label = el.dataset.cursorLabel;
        if (label) { this.cursor.querySelector('.cursor__label').textContent = label; this.cursor.classList.add('cursor--label'); }
      });
      el.addEventListener('mouseleave', () => {
        this.tScale = 1;
        this.cursor.classList.remove('cursor--hover', 'cursor--label');
        if (el.hasAttribute('data-magnetic')) gsap.to(el, { x: 0, y: 0, duration: 0.6, ease: EASE.spring });
      });
      if (el.hasAttribute('data-magnetic')) {
        const strength = parseFloat(el.dataset.magnetic) || 0.3;
        el.addEventListener('mousemove', e => {
          const r = el.getBoundingClientRect();
          const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
          gsap.to(el, { x: (e.clientX - cx) * strength, y: (e.clientY - cy) * strength, duration: 0.4, ease: EASE.snap });
        });
      }
    });
  }
  _tick() {
    this.x += (this.tx - this.x) * 0.18;
    this.y += (this.ty - this.y) * 0.18;
    this.scale += (this.tScale - this.scale) * 0.12;
    this.cursor.style.transform = `translate(${this.x}px, ${this.y}px) scale(${this.scale})`;
    requestAnimationFrame(() => this._tick());
  }
}

// ─── 4. HERO PARTICLES (2D canvas) ───
class HeroParticles {
  constructor() {
    this.canvas = document.getElementById('heroParticles');
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');
    this.resize();
    window.addEventListener('resize', () => this.resize());
    this._initDots();
    this._initNebula();
    this._tick();
  }
  resize() { this.w = this.canvas.width = this.canvas.offsetWidth || innerWidth; this.h = this.canvas.height = this.canvas.offsetHeight || innerHeight; }
  _initDots() {
    this.dots = [];
    const n = Math.min(350, Math.round((this.w * this.h) / 5000));
    for (let i = 0; i < n; i++) {
      this.dots.push({
        x: Math.random() * this.w, y: Math.random() * this.h,
        r: Math.random() * 1.8 + 0.3,
        vx: (Math.random() - 0.5) * 0.12, vy: (Math.random() - 0.5) * 0.12,
        alpha: Math.random() * 0.6 + 0.15,
        pulse: Math.random() * Math.PI * 2, pulseSpeed: 0.4 + Math.random() * 2,
        hue: Math.random() < 0.3 ? 44 : (Math.random() < 0.65 ? 210 : 170)
      });
    }
  }
  _initNebula() {
    this.clouds = [];
    for (let i = 0; i < 6; i++) {
      this.clouds.push({
        x: Math.random() * this.w, y: Math.random() * this.h,
        r: 250 + Math.random() * 500,
        vx: (Math.random() - 0.5) * 0.06, vy: (Math.random() - 0.5) * 0.04,
        hue: i % 2 === 0 ? 220 : 270, alpha: 0.025 + Math.random() * 0.035
      });
    }
  }
  _tick() {
    const ctx = this.ctx, t = performance.now() / 1000;
    ctx.clearRect(0, 0, this.w, this.h);
    for (const c of this.clouds) {
      c.x += c.vx; c.y += c.vy;
      if (c.x < -c.r) c.x = this.w + c.r; if (c.x > this.w + c.r) c.x = -c.r;
      if (c.y < -c.r) c.y = this.h + c.r; if (c.y > this.h + c.r) c.y = -c.r;
      const g = ctx.createRadialGradient(c.x, c.y, 0, c.x, c.y, c.r);
      g.addColorStop(0, `hsla(${c.hue}, 70%, 55%, ${c.alpha})`);
      g.addColorStop(1, `hsla(${c.hue}, 70%, 55%, 0)`);
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(c.x, c.y, c.r, 0, Math.PI * 2); ctx.fill();
    }
    for (const d of this.dots) {
      d.x += d.vx; d.y += d.vy;
      if (d.x < -2) d.x = this.w + 2; if (d.x > this.w + 2) d.x = -2;
      if (d.y < -2) d.y = this.h + 2; if (d.y > this.h + 2) d.y = -2;
      const twinkle = 0.5 + 0.5 * Math.sin(t * d.pulseSpeed + d.pulse);
      ctx.beginPath(); ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
      ctx.fillStyle = `hsla(${d.hue}, 65%, 62%, ${d.alpha * twinkle})`;
      ctx.fill();
    }
    if (!this.shootingStar || t - this.shootingStar.t0 > this.shootingStar.duration) {
      if (Math.random() < 0.003) {
        this.shootingStar = { x: Math.random() * this.w, y: Math.random() * this.h * 0.6, vx: (Math.random() - 0.2) * 10, vy: Math.random() * 3 + 1, t0: t, duration: 1.0, len: 80 + Math.random() * 100 };
      }
    }
    if (this.shootingStar) {
      const ss = this.shootingStar, progress = Math.min(1, (t - ss.t0) / ss.duration);
      const headX = ss.x + ss.vx * progress * 60, headY = ss.y + ss.vy * progress * 60;
      const tailX = headX - ss.vx * ss.len * 0.3, tailY = headY - ss.vy * ss.len * 0.3;
      const g = ctx.createLinearGradient(tailX, tailY, headX, headY);
      g.addColorStop(0, 'hsla(45, 90%, 70%, 0)'); g.addColorStop(0.5, 'hsla(45, 90%, 70%, 0.5)'); g.addColorStop(1, 'hsla(60, 100%, 95%, 1)');
      ctx.strokeStyle = g; ctx.lineWidth = 2; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(tailX, tailY); ctx.lineTo(headX, headY); ctx.stroke();
      if (progress >= 1) this.shootingStar = null;
    }
    requestAnimationFrame(() => this._tick());
  }
}

// ─── 5. THREE.JS GLOBE ───
const SNOISE_GLSL = `
vec3 mod289(vec3 x){return x-floor(x*(1.0/289.0))*289.0;}
vec4 mod289(vec4 x){return x-floor(x*(1.0/289.0))*289.0;}
vec4 permute(vec4 x){return mod289(((x*34.0)+1.0)*x);}
vec4 taylorInvSqrt(vec4 r){return 1.79284291400159-0.85373472095314*r;}
float snoise(vec3 v){
  const vec2 C=vec2(1.0/6.0,1.0/3.0);const vec4 D=vec4(0.0,0.5,1.0,2.0);
  vec3 i=floor(v+dot(v,C.yyy));vec3 x0=v-i+dot(i,C.xxx);
  vec3 g=step(x0.yzx,x0.xyz);vec3 l=1.0-g;vec3 i1=min(g.xyz,l.zxy);vec3 i2=max(g.xyz,l.zxy);
  vec3 x1=x0-i1+C.xxx;vec3 x2=x0-i2+C.yyy;vec3 x3=x0-D.yyy;
  i=mod289(i);vec4 p=permute(permute(permute(i.z+vec4(0.0,i1.z,i2.z,1.0))+i.y+vec4(0.0,i1.y,i2.y,1.0))+i.x+vec4(0.0,i1.x,i2.x,1.0));
  float n_=0.142857142857;vec3 ns=n_*D.wyz-D.xzx;
  vec4 j=p-49.0*floor(p*ns.z*ns.z);
  vec4 x_=floor(j*ns.z);vec4 y_=floor(j-7.0*x_);
  vec4 x=x_*ns.x+ns.yyyy;vec4 y=y_*ns.x+ns.yyyy;vec4 h=1.0-abs(x)-abs(y);
  vec4 b0=vec4(x.xy,y.xy);vec4 b1=vec4(x.zw,y.zw);
  vec4 s0=floor(b0)*2.0+1.0;vec4 s1=floor(b1)*2.0+1.0;vec4 sh=-step(h,vec4(0.0));
  vec4 a0=b0.xzyw+s0.xzyw*sh.xxyy;vec4 a1=b1.xzyw+s1.xzyw*sh.zzww;
  vec3 p0=vec3(a0.xy,h.x);vec3 p1=vec3(a0.zw,h.y);vec3 p2=vec3(a1.xy,h.z);vec3 p3=vec3(a1.zw,h.w);
  vec4 norm=taylorInvSqrt(vec4(dot(p0,p0),dot(p1,p1),dot(p2,p2),dot(p3,p3)));
  p0*=norm.x;p1*=norm.y;p2*=norm.z;p3*=norm.w;
  vec4 m=max(0.6-vec4(dot(x0,x0),dot(x1,x1),dot(x2,x2),dot(x3,x3)),0.0);m=m*m;
  return 42.0*dot(m*m,vec4(dot(p0,x0),dot(p1,x1),dot(p2,x2),dot(p3,x3)));
}
`;

class GlobeScene {
  constructor(canvas) {
    this.canvas = canvas;
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(45, innerWidth / innerHeight, 0.1, 100);
    this.camera.position.set(0, 0, 2.8);
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: DC.antialias, alpha: true, powerPreference: 'high-performance' });
    this.renderer.setSize(innerWidth, innerHeight);
    this.renderer.setPixelRatio(DC.pixelRatio);
    this.renderer.setClearColor(0x02030A, 0);
    this.time = 0;
    this._build(); this._bindResize();
  }
  _build() {
    const earthGeo = new THREE.SphereGeometry(1, 128, 128);
    const earthMat = new THREE.ShaderMaterial({
      uniforms: { uTime: { value: 0 }, uSunDir: { value: new THREE.Vector3(0.3, 0.2, 1.0).normalize() }, uHover: { value: 0 } },
      vertexShader: `varying vec3 vPos;varying vec3 vNormal;void main(){vPos=position;vNormal=normalize(normalMatrix*normal);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`,
      fragmentShader: SNOISE_GLSL + `
      uniform float uTime;uniform vec3 uSunDir;uniform float uHover;varying vec3 vPos;varying vec3 vNormal;
      void main(){
        float continent=snoise(vPos*1.8)*0.55+snoise(vPos*4.2)*0.30+snoise(vPos*9.0)*0.15;
        float land=smoothstep(-0.05,0.25,continent);
        vec3 oceanDeep=vec3(0.008,0.025,0.075);vec3 oceanShallow=vec3(0.02,0.07,0.18);
        vec3 landTemperate=vec3(0.05,0.10,0.06);vec3 landDesert=vec3(0.14,0.10,0.05);vec3 polar=vec3(0.18,0.22,0.32);
        float lat=abs(vPos.y);float poleMask=smoothstep(0.7,0.95,lat);float desertBand=smoothstep(0.15,0.35,lat)*(1.0-smoothstep(0.4,0.6,lat));
        vec3 oceanColor=mix(oceanDeep,oceanShallow,snoise(vPos*8.0)*0.5+0.5);
        vec3 landColor=mix(landTemperate,landDesert,desertBand);landColor=mix(landColor,polar,poleMask*0.7);
        vec3 surface=mix(oceanColor,landColor,land);
        float NdotL=dot(vNormal,uSunDir);float dayMix=smoothstep(-0.15,0.25,NdotL);float nightMix=1.0-dayMix;
        float terminator=(1.0-abs(NdotL))*(1.0-smoothstep(0.4,0.7,abs(NdotL)));
        vec3 terminatorColor=vec3(0.95,0.45,0.15)*terminator*0.4;
        float cityNoise=snoise(vPos*28.0+vec3(50.0));float cityMask=smoothstep(0.45,0.55,cityNoise);
        float popCluster=smoothstep(0.0,0.3,snoise(vPos*5.5));cityMask*=popCluster*land;
        vec3 cityLight=vec3(1.0,0.78,0.32)*cityMask*nightMix*1.5;
        vec3 viewDir=normalize(vec3(0.0,0.0,3.0)-vPos);vec3 halfDir=normalize(uSunDir+viewDir);
        float spec=pow(max(dot(vNormal,halfDir),0.0),80.0)*(1.0-land);
        vec3 specColor=vec3(0.6,0.7,1.0)*spec*0.5*dayMix;
        vec3 dayLit=surface*(0.25+0.75*max(0.0,NdotL));vec3 nightLit=surface*0.04+cityLight+terminatorColor;
        vec3 finalColor=mix(nightLit,dayLit,dayMix)+specColor;
        finalColor+=finalColor*uHover*0.3;
        gl_FragColor=vec4(finalColor,1.0);
      }`,
    });
    this.earth = new THREE.Mesh(earthGeo, earthMat);
    this.scene.add(this.earth);

    const atmoGeo = new THREE.SphereGeometry(1.04, 64, 64);
    const atmoMat = new THREE.ShaderMaterial({
      uniforms: { uSunDir: { value: new THREE.Vector3(0.3, 0.2, 1.0).normalize() } },
      vertexShader: `varying vec3 vNormal;void main(){vNormal=normalize(normalMatrix*normal);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`,
      fragmentShader: `uniform vec3 uSunDir;varying vec3 vNormal;void main(){float d=dot(vNormal,uSunDir);float rim=pow(1.0-abs(dot(vNormal,vec3(0.0,0.0,1.0))),3.0);vec3 c=mix(vec3(0.0,0.9,0.85),vec3(0.96,0.78,0.3),smoothstep(-0.2,0.5,d));gl_FragColor=vec4(c,rim*0.35);}`,
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.BackSide,
    });
    this.atmo = new THREE.Mesh(atmoGeo, atmoMat);
    this.scene.add(this.atmo);

    // Particles
    const count = DC.particles;
    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array(count * 3), col = new Float32Array(count * 3), siz = new Float32Array(count), phs = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      const r = 1.15 + Math.pow(Math.random(), 0.5) * 1.85;
      const phi = Math.acos(2 * Math.random() - 1), th = Math.random() * Math.PI * 2;
      pos[i*3] = r * Math.sin(phi) * Math.cos(th); pos[i*3+1] = r * Math.sin(phi) * Math.sin(th); pos[i*3+2] = r * Math.cos(phi);
      const t = Math.random();
      if (t < 0.6) { col[i*3] = 0.8; col[i*3+1] = 0.85; col[i*3+2] = 0.98; siz[i] = 0.6 + Math.random() * 1.0; }
      else if (t < 0.85) { col[i*3] = 0.96; col[i*3+1] = 0.78; col[i*3+2] = 0.30; siz[i] = 0.8 + Math.random() * 1.2; }
      else { col[i*3] = 0.0; col[i*3+1] = 0.9; col[i*3+2] = 0.85; siz[i] = 1.0 + Math.random() * 1.5; }
      phs[i] = Math.random() * Math.PI * 2;
    }
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
    geo.setAttribute('size', new THREE.BufferAttribute(siz, 1));
    geo.setAttribute('phase', new THREE.BufferAttribute(phs, 1));
    const mat = new THREE.ShaderMaterial({
      uniforms: { uTime: { value: 0 }, uPixelRatio: { value: DC.pixelRatio } },
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
      vertexShader: `attribute float size;attribute float phase;attribute vec3 color;varying vec3 vColor;varying float vTwinkle;uniform float uTime;uniform float uPixelRatio;void main(){vColor=color;vTwinkle=0.6+0.4*sin(uTime*2.0+phase);vec4 mv=modelViewMatrix*vec4(position,1.0);gl_PointSize=size*uPixelRatio*(300.0/-mv.z);gl_Position=projectionMatrix*mv;}`,
      fragmentShader: `varying vec3 vColor;varying float vTwinkle;void main(){vec2 c=gl_PointCoord-0.5;float d=length(c);if(d>0.5)discard;float alpha=smoothstep(0.5,0.0,d)*vTwinkle;gl_FragColor=vec4(vColor,alpha);}`,
    });
    this.particles = new THREE.Points(geo, mat);
    this.scene.add(this.particles);

    // Arcs
    const ROUTES = [
      { from: [28.56, 77.10], to: [19.09, 72.87] }, { from: [28.56, 77.10], to: [12.95, 77.67] },
      { from: [19.09, 72.87], to: [13.00, 80.18] }, { from: [12.95, 77.67], to: [17.24, 78.43] },
      { from: [22.65, 88.45], to: [28.56, 77.10] }, { from: [10.15, 76.40], to: [12.95, 77.67] },
      { from: [23.07, 72.62], to: [19.09, 72.87] }, { from: [26.91, 75.79], to: [28.56, 77.10] },
      { from: [28.56, 77.10], to: [25.25, 55.36] }, { from: [19.09, 72.87], to: [1.36, 103.99] },
      { from: [28.56, 77.10], to: [51.47, -0.45] }, { from: [12.95, 77.67], to: [40.64, -73.78] },
      { from: [19.09, 72.87], to: [35.55, 139.78] }, { from: [28.56, 77.10], to: [-33.94, 151.18] },
    ];
    const latLonToVec3 = (lat, lon, r = 1) => {
      const phi = (90 - lat) * Math.PI / 180, theta = (lon + 180) * Math.PI / 180;
      return new THREE.Vector3(-r * Math.sin(phi) * Math.cos(theta), r * Math.cos(phi), r * Math.sin(phi) * Math.sin(theta));
    };
    this.arcs = [];
    ROUTES.slice(0, DC.arcs).forEach((route, idx) => {
      const start = latLonToVec3(route.from[0], route.from[1], 1.01);
      const end = latLonToVec3(route.to[0], route.to[1], 1.01);
      const mid = start.clone().add(end).multiplyScalar(0.5).normalize().multiplyScalar(1.28);
      const curve = new THREE.QuadraticBezierCurve3(start, mid, end);
      const points = curve.getPoints(60);
      const geo = new THREE.BufferGeometry().setFromPoints(points);
      const mat = new THREE.LineBasicMaterial({ color: 0xF5C842, transparent: true, opacity: 0.55, blending: THREE.AdditiveBlending });
      const line = new THREE.Line(geo, mat);
      this.scene.add(line);
      this.arcs.push({ line, t: idx * 0.3, speed: 0.35 + Math.random() * 0.2 });
    });
  }
  _bindResize() {
    window.addEventListener('resize', () => {
      this.camera.aspect = innerWidth / innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(innerWidth, innerHeight);
    });
  }
  update(dt) {
    this.time += dt;
    this.earth.rotation.y += 0.0008;
    this.earth.material.uniforms.uTime.value = this.time;
    this.particles.rotation.y = this.time * 0.015;
    this.particles.material.uniforms.uTime.value = this.time;
    this.arcs.forEach(a => {
      a.t += dt * a.speed; if (a.t > 1.3) a.t = 0;
      let op = 0;
      if (a.t <= 0.7) op = a.t / 0.7; else if (a.t <= 0.9) op = 1.0 - (a.t - 0.7) / 0.2; else if (a.t <= 1.0) op = 0.6 * Math.sin((a.t - 0.9) * Math.PI * 10);
      a.line.material.opacity = op * 0.55;
    });
    this.renderer.render(this.scene, this.camera);
  }
  setState(state) {
    const targets = { HERO: { z: 2.8 }, AMBIENT: { z: 4.5 }, REST: { z: 7.0 } };
    const t = targets[state] || targets.REST;
    gsap.to(this.camera.position, { z: t.z, duration: 1.2, ease: EASE.flow });
  }
}

function startGlobeLoop() {
  if (!window._globe) return;
  let lastTime = performance.now();
  function loop() {
    const now = performance.now();
    window._globe.update(Math.min(0.05, (now - lastTime) / 1000));
    lastTime = now;
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
}

// ─── 6. HERO CHOREOGRAPHY ───
function initHeroChoreo() {
  const tl = gsap.timeline({ defaults: { ease: EASE.arrive } });
  tl.from('.hero__globe', { opacity: 0, duration: DUR.glacial }, 0);
  tl.from('.hero__particles', { opacity: 0, duration: DUR.glacial }, 0.2);
  tl.from('.hero__eyebrow', { opacity: 0, y: 20, duration: 0.6 }, 0.3);
  tl.to('.hero__title .mask-line__inner', { y: '0%', duration: 0.9, stagger: 0.15 }, 0.5);
  tl.from('.hero__subtitle', { opacity: 0, y: 20, duration: 0.6 }, 1.3);
  tl.from('.hero__meta-stats', { opacity: 0, y: 20, duration: 0.6 }, 1.5);
  tl.from('.search-console', { opacity: 0, y: 60, rotateX: 8, duration: 1.0, ease: EASE.arrive }, 1.5);
  tl.from('.hero__scroll-cue', { opacity: 0, y: 10, duration: 0.8 }, 2.0);
}

// ─── 7. SEARCH CONSOLE ───
function initSearchConsole() {
  const trips = document.querySelectorAll('.search-trip');
  const indicator = document.querySelector('.search-trips__indicator');
  const fromInput = document.getElementById('fromInput');
  const toInput = document.getElementById('toInput');
  const fromCode = document.getElementById('fromCode');
  const toCode = document.getElementById('toCode');
  const swapBtn = document.getElementById('swapBtn');
  const searchBtn = document.getElementById('searchBtn');
  const resultsSection = document.getElementById('resultsSection');
  const resultsGrid = document.getElementById('resultsGrid');
  const resFromCode = document.getElementById('resFromCode');
  const resToCode = document.getElementById('resToCode');
  const resCount = document.getElementById('resCount');

  function moveIndicator(el) {
    indicator.style.left = el.offsetLeft + 'px';
    indicator.style.width = el.offsetWidth + 'px';
  }
  const activeTrip = document.querySelector('.search-trip.is-active');
  if (activeTrip) moveIndicator(activeTrip);

  trips.forEach(trip => {
    trip.addEventListener('click', () => {
      trips.forEach(t => { t.classList.remove('is-active'); t.setAttribute('aria-selected', 'false'); });
      trip.classList.add('is-active'); trip.setAttribute('aria-selected', 'true');
      moveIndicator(trip);
      const isOneway = trip.dataset.trip === 'oneway';
      const retSlot = document.getElementById('returnSlot');
      retSlot.style.opacity = isOneway ? '0.35' : '1';
      retSlot.style.pointerEvents = isOneway ? 'none' : 'auto';
    });
  });

  swapBtn.addEventListener('click', () => {
    gsap.to(swapBtn, { rotation: '+=180', duration: 0.5, ease: EASE.spring });
    const fv = fromInput.value, tv = toInput.value;
    const fc = fromCode.textContent, tc = toCode.textContent;
    fromInput.value = tv; toInput.value = fv;
    fromCode.textContent = tc === '—' ? '—' : tc;
    toCode.textContent = fc;
  });

  searchBtn.addEventListener('click', () => {
    if (!toInput.value.trim()) {
      gsap.to('.search-slot--to', { x: '+=8', duration: 0.06, repeat: 5, yoyo: true, ease: 'none' });
      return;
    }
    searchBtn.classList.add('is-loading');
    setTimeout(() => {
      searchBtn.classList.remove('is-loading');
      searchBtn.classList.add('is-done');
      searchBtn.querySelector('.search-submit__label').textContent = 'Found 12 fares';
      // Show results
      showResults();
      setTimeout(() => {
        searchBtn.classList.remove('is-done');
        searchBtn.querySelector('.search-submit__label').textContent = 'Search fares';
      }, 2000);
    }, 1400);
  });

  function showResults() {
    resFromCode.textContent = fromCode.textContent;
    resToCode.textContent = toCode.textContent;
    resCount.textContent = '12 fares found across 6 OTAs';
    resultsSection.hidden = false;
    const fromCity = fromInput.value.split(' ')[0];
    const toCity = toInput.value.split(' ')[0];
    resultsGrid.innerHTML = generateFlightCards(fromCity, toCity);
    // Animate cards in
    gsap.from('.flight-card', { opacity: 0, y: 30, stagger: 0.08, duration: 0.6, ease: EASE.arrive });
    // Scroll to results
    document.getElementById('resultsSection').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function generateFlightCards(from, to) {
    const flights = [
      { airline: 'IndiGo', code: '6E 2341', dep: '06:30', arr: '08:45', dur: '2h 15m', stops: 'Non-stop', price: '4,299', was: '5,140', save: '841', tag: 'Cheapest' },
      { airline: 'Air India', code: 'AI 809', dep: '07:15', arr: '09:35', dur: '2h 20m', stops: 'Non-stop', price: '4,650', was: '5,400', save: '750', tag: '' },
      { airline: 'Vistara', code: 'UK 941', dep: '08:00', arr: '10:10', dur: '2h 10m', stops: 'Non-stop', price: '4,890', was: '5,700', save: '810', tag: 'Fastest' },
      { airline: 'Akasa Air', code: 'QP 1521', dep: '09:20', arr: '11:50', dur: '2h 30m', stops: 'Non-stop', price: '3,999', was: '4,800', save: '801', tag: 'Lowest fare' },
      { airline: 'SpiceJet', code: 'SG 153', dep: '11:00', arr: '13:25', dur: '2h 25m', stops: 'Non-stop', price: '4,450', was: '5,200', save: '750', tag: '' },
      { airline: 'IndiGo', code: '6E 6123', dep: '14:30', arr: '16:50', dur: '2h 20m', stops: 'Non-stop', price: '4,599', was: '5,350', save: '751', tag: '' },
    ];
    return flights.map(f => `
      <article class="flight-card">
        <div class="flight-card__main">
          <div class="flight-card__airline">
            <span class="flight-card__airline-dot"></span>
            <span>${f.airline}</span>
            <span>·</span>
            <span>${f.code}</span>
          </div>
          <div class="flight-card__path">
            <div class="flight-card__path-top">
              <span class="flight-card__path-time">${f.dep}</span>
              <span class="flight-card__path-dur">${f.dur}</span>
              <span class="flight-card__path-time">${f.arr}</span>
            </div>
            <div class="flight-card__path-line">
              <span class="flight-card__path-plane">✈</span>
            </div>
            <div class="flight-card__path-stops">
              <span>${from}</span>
              <span>${f.stops}</span>
              <span>${to}</span>
            </div>
          </div>
          <div class="flight-card__price">
            <div class="flight-card__price-main">₹${f.price}</div>
            <div class="flight-card__price-was">₹${f.was}</div>
            <div class="flight-card__price-save">Save ₹${f.save}</div>
          </div>
          <button class="flight-card__select">Select</button>
        </div>
        ${f.tag ? `<span class="flight-card__tag">${f.tag}</span>` : ''}
      </article>`).join('');
  }

  document.querySelectorAll('.recent-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      fromInput.value = chip.dataset.from;
      toInput.value = chip.dataset.to;
      fromCode.textContent = chip.dataset.fromCode;
      toCode.textContent = chip.dataset.toCode;
    });
  });

  const today = new Date().toISOString().split('T')[0];
  document.getElementById('departInput').value = today;
  document.getElementById('returnSlot').style.opacity = '0.35';
  document.getElementById('returnSlot').style.pointerEvents = 'none';
}

// ─── 8. TICKER ───
function initDealsTicker() {
  const track = document.getElementById('tickerTrack');
  if (!track) return;
  const items = [
    { route: 'DEL → BOM', price: '₹4,299', change: '-12%' }, { route: 'BLR → DEL', price: '₹3,899', change: '-8%' },
    { route: 'BOM → DXB', price: '₹12,450', change: '-5%' }, { route: 'DEL → SIN', price: '₹18,200', change: '-3%' },
    { route: 'CCU → BOM', price: '₹5,100', change: '-15%' }, { route: 'HYD → BLR', price: '₹2,899', change: '-9%' },
    { route: 'MAA → DEL', price: '₹4,750', change: '-6%' }, { route: 'AMD → BOM', price: '₹3,200', change: '-11%' },
  ];
  const html = items.map(item => `
    <div class="ticker__item">
      <span class="ticker__route">${item.route}</span>
      <span class="ticker__price">${item.price}</span>
      <span class="ticker__change">${item.change}</span>
    </div>`).join('');
  track.innerHTML = html + html;
}

// ─── 9. DEALS GRID ───
function initDeals() {
  const grid = document.getElementById('dealsGrid');
  if (!grid) return;
  const deals = [
    { from: 'DEL', to: 'BOM', price: '4,299', was: '5,140', save: '841', airline: 'IndiGo', trend: '↓ 12%' },
    { from: 'BLR', to: 'DEL', price: '3,899', was: '4,350', save: '451', airline: 'Air India', trend: '↓ 8%' },
    { from: 'BOM', to: 'DXB', price: '12,450', was: '13,800', save: '1,350', airline: 'IndiGo', trend: '↓ 5%' },
    { from: 'DEL', to: 'LHR', price: '34,200', was: '38,500', save: '4,300', airline: 'Vistara', trend: '↓ 11%' },
    { from: 'CCU', to: 'BOM', price: '5,100', was: '5,900', save: '800', airline: 'Akasa', trend: '↓ 14%' },
    { from: 'HYD', to: 'BLR', price: '2,899', was: '3,400', save: '501', airline: 'IndiGo', trend: '↓ 15%' },
    { from: 'MAA', to: 'DEL', price: '4,750', was: '5,200', save: '450', airline: 'Air India', trend: '↓ 9%' },
    { from: 'AMD', to: 'BOM', price: '3,200', was: '3,750', save: '550', airline: 'SpiceJet', trend: '↓ 15%' },
  ];
  grid.innerHTML = deals.map(d => `
    <article class="deal-card" data-tilt>
      <div class="deal-card__route">${d.from} → ${d.to}</div>
      <div class="deal-card__price">₹${d.price}</div>
      <div class="deal-card__was">₹${d.was}</div>
      <div class="deal-card__save">Save ₹${d.save}</div>
      <div class="deal-card__spacer"></div>
      <div class="deal-card__meta">
        <span class="deal-card__airline"><span class="deal-card__airline-dot"></span>${d.airline}</span>
        <span style="color:var(--teal-300);font-family:'Geist Mono',monospace;font-size:11px">${d.trend}</span>
      </div>
      <button class="deal-card__cta">View fare</button>
    </article>`).join('');
}

// ─── 10. BANK OFFERS ───
function initOffers() {
  const grid = document.getElementById('offersGrid');
  if (!grid) return;
  const offers = [
    { bank: 'HDFC Bank', amount: '₹1,500 off', desc: 'On domestic flights above ₹5,000 with HDFC Millennia card', code: 'HDFCFLY' },
    { bank: 'ICICI Bank', amount: '₹2,000 off', desc: 'On international flights with ICICI Coral credit card', code: 'ICICIGO' },
    { bank: 'SBI Card', amount: '₹1,200 off', desc: 'On any booking above ₹4,000 with SBI Prime', code: 'SBIFLY' },
    { bank: 'Axis Bank', amount: '₹1,800 off', desc: 'On domestic flights with Axis Magnus card', code: 'AXISFLY' },
    { bank: 'Amex', amount: '₹3,000 off', desc: 'On international flights with American Express Platinum', code: 'AMEXFLY' },
    { bank: 'Paytm', amount: '₹800 off', desc: 'On first flight booking via Paytm UPI', code: 'PAYTMFLY' },
  ];
  grid.innerHTML = offers.map(o => `
    <article class="offer-card" data-tilt>
      <div class="offer-card__bank">${o.bank}</div>
      <div class="offer-card__amount">${o.amount}</div>
      <div class="offer-card__desc">${o.desc}</div>
      <div class="offer-card__code">${o.code}</div>
    </article>`).join('');
}

// ─── 11. PRICE CHART ───
function initPriceChart() {
  const canvas = document.getElementById('priceChart');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const data = [5200, 4950, 5100, 4800, 4600, 4700, 4500, 4300, 4400, 4200, 4100, 3950, 3800, 3900, 4100, 4300, 4500, 4700, 4900, 5100, 5300, 5500, 5700, 5900, 6100, 6300, 6500, 6700, 6900, 7100];
  const w = canvas.width, h = canvas.height;
  const pad = { t: 30, r: 30, b: 40, l: 50 };
  const cw = w - pad.l - pad.r, ch = h - pad.t - pad.b;
  const min = Math.min(...data), max = Math.max(...data);
  const getX = i => pad.l + (i / (data.length - 1)) * cw;
  const getY = v => pad.t + ch - ((v - min) / (max - min)) * ch;

  let progress = 0;
  function draw() {
    ctx.clearRect(0, 0, w, h);
    ctx.strokeStyle = 'rgba(168,182,209,0.06)'; ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) { const y = pad.t + (ch / 4) * i; ctx.beginPath(); ctx.moveTo(pad.l, y); ctx.lineTo(pad.l + cw, y); ctx.stroke(); }
    const grad = ctx.createLinearGradient(0, pad.t, 0, pad.t + ch);
    grad.addColorStop(0, 'rgba(245,200,66,0.20)'); grad.addColorStop(1, 'rgba(245,200,66,0)');
    ctx.beginPath(); ctx.moveTo(getX(0), getY(data[0]));
    for (let i = 1; i < data.length * progress; i++) { const x0 = getX(i - 1), y0 = getY(data[i - 1]); const x1 = getX(i), y1 = getY(data[i]); const cpX = (x0 + x1) / 2; ctx.bezierCurveTo(cpX, y0, cpX, y1, x1, y1); }
    ctx.lineTo(getX(Math.min(data.length - 1, Math.floor(data.length * progress))), pad.t + ch);
    ctx.lineTo(getX(0), pad.t + ch); ctx.closePath(); ctx.fillStyle = grad; ctx.fill();
    ctx.beginPath(); ctx.moveTo(getX(0), getY(data[0]));
    for (let i = 1; i < data.length * progress; i++) { const x0 = getX(i - 1), y0 = getY(data[i - 1]); const x1 = getX(i), y1 = getY(data[i]); const cpX = (x0 + x1) / 2; ctx.bezierCurveTo(cpX, y0, cpX, y1, x1, y1); }
    ctx.strokeStyle = '#F5C842'; ctx.lineWidth = 2.5; ctx.stroke();
    for (let i = 0; i < data.length * progress; i += 3) {
      ctx.beginPath(); ctx.arc(getX(i), getY(data[i]), 3.5, 0, Math.PI * 2);
      ctx.fillStyle = '#F5C842'; ctx.fill();
      ctx.beginPath(); ctx.arc(getX(i), getY(data[i]), 8, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(245,200,66,0.1)'; ctx.fill();
    }
    ctx.fillStyle = '#6B7B9A'; ctx.font = '500 10px "Geist Mono", monospace'; ctx.textAlign = 'center';
    const labels = ['30d','25d','20d','15d','10d','5d','Today'];
    labels.forEach((l, i) => { const idx = Math.round((data.length - 1) * (i / (labels.length - 1))); ctx.fillText(l, getX(idx), h - 10); });
  }
  ScrollTrigger.create({ trigger: canvas, start: 'top 80%', once: true, onEnter: () => gsap.to({ p: 0 }, { p: 1, duration: 2.5, ease: EASE.steady, onUpdate: function() { progress = this.targets()[0].p; draw(); } }) });
  draw();
}

// ─── 12. AUTH MODAL ───
function initAuthModal() {
  const modal = document.getElementById('authModal');
  const signinBtn = document.getElementById('navSignin');
  const signupBtn = document.getElementById('navSignup');
  const closeBtn = document.getElementById('authClose');
  const backdrop = document.getElementById('authBackdrop');
  const tabs = modal.querySelectorAll('.auth-tab');
  const indicator = modal.querySelector('.auth-tabs__indicator');
  const title = document.getElementById('authTitle');
  const sub = document.getElementById('authSub');
  const hint = document.getElementById('authHint');
  const nameField = document.getElementById('nameField');
  const mobileField = document.getElementById('mobileField');
  const confirmField = document.getElementById('confirmField');
  const submit = document.getElementById('authSubmit');

  let currentTab = 'signin';

  function open(tab) {
    currentTab = tab;
    modal.classList.add('is-open');
    document.body.style.overflow = 'hidden';
    updateTab(tab);
  }
  function close() { modal.classList.remove('is-open'); document.body.style.overflow = ''; }

  signinBtn.addEventListener('click', () => open('signin'));
  signupBtn.addEventListener('click', () => open('signup'));
  closeBtn.addEventListener('click', close);
  backdrop.addEventListener('click', close);

  function updateTab(tab) {
    tabs.forEach(t => { t.classList.toggle('is-active', t.dataset.tab === tab); });
    const active = modal.querySelector('.auth-tab.is-active');
    if (active && indicator) { indicator.style.left = active.offsetLeft + 'px'; indicator.style.width = active.offsetWidth + 'px'; }
    const isSignup = tab === 'signup';
    title.textContent = isSignup ? 'Create account' : 'Sign In';
    sub.textContent = isSignup ? 'Join AirBook and start saving on every flight.' : 'Welcome back to AirBook.';
    hint.innerHTML = isSignup ? 'Already have an account? <button type="button" class="auth-hint__link" data-switch="signin">Sign in</button>' : "Don't have an account? <button type='button' class='auth-hint__link' data-switch='signup'>Sign up</button>";
    [nameField, mobileField, confirmField].forEach(f => f.hidden = !isSignup);
    submit.querySelector('.auth-submit__text').textContent = isSignup ? 'Create account' : 'Sign In';
  }

  tabs.forEach(t => t.addEventListener('click', () => updateTab(t.dataset.tab)));
  hint.addEventListener('click', (e) => { if (e.target.dataset.switch) updateTab(e.target.dataset.switch); });

  modal.querySelector('#authForm').addEventListener('submit', (e) => {
    e.preventDefault();
    submit.querySelector('.auth-submit__text').textContent = currentTab === 'signup' ? 'Creating…' : 'Signing in…';
    setTimeout(() => {
      close();
      // Show logged-in state in nav
      const navActions = document.querySelector('.nav__actions');
      navActions.innerHTML = '<button class="nav__btn nav__btn--ghost" id="navProfile">My Account</button>';
      submit.querySelector('.auth-submit__text').textContent = currentTab === 'signup' ? 'Create account' : 'Sign In';
    }, 1200);
  });

  // Init indicator position
  requestAnimationFrame(() => updateTab('signin'));
}

// ─── 13. NATIVE SCROLL TRIGGERS (no Lenis — eliminates scroll-to-top lag) ───
function initScrollTriggers() {
  const hero = document.getElementById('hero');
  if (window._globe && hero) {
    const obs = new IntersectionObserver(entries => {
      entries.forEach(e => { window._globe.setState(e.isIntersecting ? 'HERO' : 'REST'); });
    }, { threshold: 0 });
    obs.observe(hero);
  }

  // Mask reveals
  const revealObs = new IntersectionObserver(entries => {
    entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in-view'); revealObs.unobserve(e.target); } });
  }, { threshold: 0.05, rootMargin: '0px 0px -5% 0px' });
  document.querySelectorAll('.scroll-target').forEach(el => revealObs.observe(el));

  // Counter animations
  const countObs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        const el = e.target, target = parseInt(el.dataset.counter), suffix = el.dataset.suffix || '';
        gsap.to({ val: 0 }, { val: target, duration: 2, ease: EASE.steady, onUpdate: function() { el.textContent = Math.round(this.targets()[0].val) + suffix; } });
        countObs.unobserve(el);
      }
    });
  }, { threshold: 0.3 });
  document.querySelectorAll('[data-counter]').forEach(el => countObs.observe(el));
}

// ─── 14. TILT CARDS ───
function initTiltCards() {
  if (innerWidth <= 640 || 'ontouchstart' in window) return;
  document.querySelectorAll('[data-tilt]').forEach(card => {
    card.addEventListener('mousemove', e => {
      const r = card.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5;
      const y = (e.clientY - r.top) / r.height - 0.5;
      gsap.to(card, { rotateX: -y * 10, rotateY: x * 10, duration: 0.4, ease: EASE.snap, transformPerspective: 700 });
    });
    card.addEventListener('mouseleave', () => gsap.to(card, { rotateX: 0, rotateY: 0, duration: 0.6, ease: EASE.spring }));
  });
}

// ─── 15. NAV SCROLL ───
function initNav() {
  const nav = document.getElementById('nav');
  let lastScroll = 0;
  window.addEventListener('scroll', () => {
    const y = window.scrollY;
    nav.classList.toggle('is-scrolled', y > 50);
    lastScroll = y;
  }, { passive: true });

  // Mobile menu
  document.getElementById('navMenu')?.addEventListener('click', () => {
    alert('Mobile menu would open here');
  });
}

// ─── 16. UTC CLOCK ───
function updateUTCClock() {
  const el = document.getElementById('utcClock');
  if (el) el.childNodes[0].nodeValue = new Date().toISOString().split('T')[1].split('.')[0];
}

// ─── 17. ALERT TOAST ───
function showToast(msg) {
  let toast = document.querySelector('.toast');
  if (!toast) { toast = document.createElement('div'); toast.className = 'toast'; document.body.appendChild(toast); }
  toast.textContent = msg;
  toast.classList.add('is-visible');
  setTimeout(() => toast.classList.remove('is-visible'), 3000);
}

// ─── 18. PRICE ALERT / CALENDAR BUTTONS ───
function initInsightActions() {
  document.getElementById('setAlertBtn')?.addEventListener('click', () => showToast('Price alert set for DEL → BOM'));
  document.getElementById('viewCalendarBtn')?.addEventListener('click', () => showToast('Fare calendar coming soon'));
  document.getElementById('alertBtn')?.addEventListener('click', () => {
    const email = document.getElementById('alertEmail');
    if (email.value) showToast('Alert created for ' + email.value); else showToast('Please enter your email');
  });
}

// ─── 19. BOOT SEQUENCE ───
(async function boot() {
  const safety = setTimeout(() => document.getElementById('preloader')?.classList.add('preloader--exit'), 4500);
  if (typeof gsap === 'undefined') { clearTimeout(safety); document.getElementById('preloader')?.classList.add('preloader--exit'); return; }

  try {
    const preloader = new Preloader();
    await preloader.start();
    await Promise.race([document.fonts.ready.catch(() => {}), new Promise(r => setTimeout(r, 3000))]);

    initNav();
    initAuthModal();
    initSearchConsole();
    initScrollTriggers();

    if (typeof THREE !== 'undefined' && DC.tier !== 'NONE' && DC.score >= 15) {
      const canvas = document.getElementById('globe');
      if (canvas) { window._globe = new GlobeScene(canvas); startGlobeLoop(); }
    } else { document.querySelector('.css-globe-fallback')?.classList.add('active'); }

    try { new HeroParticles(); } catch (e) {}

    if (typeof lucide !== 'undefined') lucide.createIcons();
    if (matchMedia('(hover: hover)').matches && innerWidth > 640) new MagneticCursor();

    await preloader.exit();
    initHeroChoreo();

    const rIC = window.requestIdleCallback || ((cb) => setTimeout(cb, 10));
    rIC(() => {
      initDealsTicker();
      initDeals();
      initOffers();
      initTiltCards();
      initPriceChart();
      initInsightActions();
    });

    setInterval(updateUTCClock, 1000);
    updateUTCClock();
    clearTimeout(safety);
    window.__airbookBooted = true;
    console.log('[airbook] ready ✦');
  } catch (err) {
    console.error('[airbook] boot error', err);
    document.getElementById('preloader')?.classList.add('preloader--exit');
    clearTimeout(safety);
  }
})();
