import * as THREE from 'https://esm.sh/three@0.160.0';
import { OrbitControls } from 'https://esm.sh/three@0.160.0/examples/jsm/controls/OrbitControls.js';

const EARTH_TEXTURE_URL = 'https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/planets/earth_atmos_2048.jpg';

const container = document.getElementById('canvas-container');
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.01, 50000000);
camera.position.set(0, 1.5, 4);

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, logarithmicDepthBuffer: true });
renderer.setSize(container.clientWidth, container.clientHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setClearColor(0x020208, 1);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.4;
renderer.outputColorSpace = THREE.SRGBColorSpace;
container.appendChild(renderer.domElement);

// Shared circular sprite/point texture
const _sprC = document.createElement('canvas');
_sprC.width = 128; _sprC.height = 128;
const _sprCtx = _sprC.getContext('2d');
const _sprG = _sprCtx.createRadialGradient(64, 64, 0, 64, 64, 64);
_sprG.addColorStop(0, 'rgba(255,255,255,1)');
_sprG.addColorStop(0.15, 'rgba(255,255,255,0.95)');
_sprG.addColorStop(0.35, 'rgba(255,255,255,0.6)');
_sprG.addColorStop(0.6, 'rgba(255,255,255,0.2)');
_sprG.addColorStop(1, 'rgba(255,255,255,0)');
_sprCtx.fillStyle = _sprG;
_sprCtx.fillRect(0, 0, 128, 128);
const circleTex = new THREE.CanvasTexture(_sprC);

// --- Lighting ---
const ambientLight = new THREE.AmbientLight(0x404060, 0.4);
scene.add(ambientLight);

const cameraLight = new THREE.PointLight(0xffffff, 1.5, 0, 0.5);
camera.add(cameraLight);
scene.add(camera);

// Brightness slider
const slider = document.getElementById('brightness-slider');
function applyBrightness(value) {
  const t = value / 100;
  ambientLight.intensity = THREE.MathUtils.lerp(0.05, 2.5, t);
  cameraLight.intensity = THREE.MathUtils.lerp(0.3, 8.0, t);
}
slider.addEventListener('input', (e) => applyBrightness(Number(e.target.value)));
applyBrightness(Number(slider.value));

// --- Starfield — realistic with spectral classes and twinkling ---
function createStarfield() {
  const count = 15000;
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const r = 150 + Math.random() * 350;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    positions[i * 3]     = r * Math.sin(phi) * Math.cos(theta);
    positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
    positions[i * 3 + 2] = r * Math.cos(phi);
    const temp = Math.random();
    const bright = 0.6 + Math.random() * 0.5;
    if (temp < 0.08)       { colors[i*3]=0.4*bright; colors[i*3+1]=0.5*bright; colors[i*3+2]=1.4*bright; }
    else if (temp < 0.18)  { colors[i*3]=0.6*bright; colors[i*3+1]=0.75*bright; colors[i*3+2]=1.3*bright; }
    else if (temp < 0.28)  { colors[i*3]=1.2*bright; colors[i*3+1]=1.15*bright; colors[i*3+2]=0.9*bright; }
    else if (temp < 0.40)  { colors[i*3]=1.3*bright; colors[i*3+1]=0.9*bright; colors[i*3+2]=0.4*bright; }
    else if (temp < 0.50)  { colors[i*3]=1.4*bright; colors[i*3+1]=0.6*bright; colors[i*3+2]=0.2*bright; }
    else if (temp < 0.55)  { colors[i*3]=1.4*bright; colors[i*3+1]=0.35*bright; colors[i*3+2]=0.2*bright; }
    else                    { colors[i*3]=1.1*bright; colors[i*3+1]=1.1*bright; colors[i*3+2]=1.0*bright; }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  const mat = new THREE.PointsMaterial({
    map: circleTex, size: 0.22, sizeAttenuation: true, vertexColors: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
  });
  return new THREE.Points(geo, mat);
}
const stars = createStarfield();
scene.add(stars);

// Background cosmic dust haze -- subtle colored nebulosity behind the stars
const dustCount = 120;
const dustGroup = new THREE.Group();
scene.add(dustGroup);
const dustTex = (() => {
  const c = document.createElement('canvas'); c.width = 256; c.height = 256;
  const ctx = c.getContext('2d');
  const g = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
  g.addColorStop(0, 'rgba(255,255,255,0.6)');
  g.addColorStop(0.2, 'rgba(255,255,255,0.25)');
  g.addColorStop(0.5, 'rgba(255,255,255,0.08)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g; ctx.fillRect(0, 0, 256, 256);
  return new THREE.CanvasTexture(c);
})();
const dustColors = [0x3030aa, 0x8030a0, 0x2060aa, 0x704020, 0x2040a0, 0x803080, 0x206060, 0xa04060, 0x4060a0, 0x306088];
for (let i = 0; i < dustCount; i++) {
  const r = 180 + Math.random() * 320;
  const th = Math.random() * Math.PI * 2;
  const ph = Math.acos(2 * Math.random() - 1);
  const sp = new THREE.Sprite(new THREE.SpriteMaterial({
    map: dustTex, color: dustColors[i % dustColors.length],
    transparent: true, opacity: 0.08 + Math.random() * 0.12,
    depthWrite: false, blending: THREE.AdditiveBlending,
  }));
  sp.position.set(r * Math.sin(ph) * Math.cos(th), r * Math.sin(ph) * Math.sin(th), r * Math.cos(ph));
  sp.scale.setScalar(50 + Math.random() * 120);
  dustGroup.add(sp);
}

// --- Procedural planet textures ---
function makePlanetTexture(w, h, drawFn) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  drawFn(c.getContext('2d'), w, h);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

// Pixel noise overlay for surface grit
function addNoise(ctx, w, h, alpha) {
  const img = ctx.getImageData(0, 0, w, h);
  const d = img.data;
  for (let i = 0; i < d.length; i += 4) {
    const n = (Math.random() - 0.5) * alpha;
    d[i] += n; d[i+1] += n; d[i+2] += n;
  }
  ctx.putImageData(img, 0, 0);
}

// --- Procedural displacement maps (high-contrast grayscale heightmaps) ---
function makeHeightMap(w, h, drawFn) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  drawFn(c.getContext('2d'), w, h);
  return new THREE.CanvasTexture(c);
}

function heightCraters(ctx, w, h, count, minR, maxR) {
  for (let i = 0; i < count; i++) {
    const x = Math.random() * w, y = Math.random() * h;
    const r = minR + Math.random() * (maxR - minR);
    const rg = ctx.createRadialGradient(x, y, 0, x, y, r);
    rg.addColorStop(0, '#000');
    rg.addColorStop(0.25, '#111');
    rg.addColorStop(0.6, '#222');
    rg.addColorStop(0.85, '#ddd');
    rg.addColorStop(1, '#888');
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fillStyle = rg; ctx.fill();
  }
}

function heightMercury(ctx, w, h) {
  ctx.fillStyle = '#999'; ctx.fillRect(0, 0, w, h);
  heightCraters(ctx, w, h, 500, 3, 25);
  heightCraters(ctx, w, h, 100, 18, 50);
  heightCraters(ctx, w, h, 20, 35, 70);
  addNoise(ctx, w, h, 60);
}

function heightVenus(ctx, w, h) {
  ctx.fillStyle = '#777'; ctx.fillRect(0, 0, w, h);
  for (let i = 0; i < 40; i++) {
    const x = Math.random() * w, y = Math.random() * h;
    const rx = 40 + Math.random() * 100, ry = 20 + Math.random() * 60;
    ctx.beginPath(); ctx.ellipse(x, y, rx, ry, Math.random() * Math.PI, 0, Math.PI * 2);
    const v = Math.floor(60 + Math.random() * 140);
    ctx.fillStyle = `rgb(${v},${v},${v})`; ctx.fill();
  }
  heightCraters(ctx, w, h, 60, 5, 20);
  for (let i = 0; i < 50; i++) {
    const y = Math.random() * h;
    const bh = 3 + Math.random() * 12;
    const v = Math.floor(80 + Math.random() * 100);
    ctx.fillStyle = `rgba(${v},${v},${v},0.4)`;
    ctx.fillRect(0, y, w, bh);
  }
  addNoise(ctx, w, h, 40);
}

function heightMars(ctx, w, h) {
  ctx.fillStyle = '#888'; ctx.fillRect(0, 0, w, h);
  heightCraters(ctx, w, h, 300, 2, 15);
  heightCraters(ctx, w, h, 50, 12, 35);
  // Olympus Mons (huge raised area)
  const omRg = ctx.createRadialGradient(w * 0.3, h * 0.4, 0, w * 0.3, h * 0.4, w * 0.08);
  omRg.addColorStop(0, '#fff');
  omRg.addColorStop(0.4, '#ddd');
  omRg.addColorStop(1, '#888');
  ctx.beginPath(); ctx.arc(w * 0.3, h * 0.4, w * 0.08, 0, Math.PI * 2);
  ctx.fillStyle = omRg; ctx.fill();
  // Valles Marineris (deep canyon)
  ctx.beginPath();
  ctx.moveTo(w * 0.15, h * 0.48);
  for (let x = w * 0.15; x < w * 0.8; x += 3) {
    ctx.lineTo(x, h * 0.48 + Math.sin(x * 0.025) * 12 + (Math.random() - 0.5) * 6);
  }
  ctx.lineWidth = 6; ctx.strokeStyle = '#111'; ctx.stroke();
  ctx.lineWidth = 3; ctx.strokeStyle = '#222'; ctx.stroke();
  // Polar caps
  const pg = ctx.createLinearGradient(0, 0, 0, h);
  pg.addColorStop(0, '#eee');
  pg.addColorStop(0.06, '#888');
  pg.addColorStop(0.94, '#888');
  pg.addColorStop(1, '#eee');
  ctx.fillStyle = pg; ctx.fillRect(0, 0, w, h);
  addNoise(ctx, w, h, 45);
}

function heightJupiter(ctx, w, h) {
  ctx.fillStyle = '#777'; ctx.fillRect(0, 0, w, h);
  const bandCount = 24;
  const bh = h / bandCount;
  for (let i = 0; i < bandCount; i++) {
    const v = (i % 2 === 0) ? 55 : 200;
    ctx.fillStyle = `rgb(${v},${v},${v})`;
    ctx.fillRect(0, i * bh, w, bh + 1);
  }
  for (let i = 0; i < 80; i++) {
    const y = Math.random() * h;
    ctx.beginPath(); ctx.moveTo(0, y);
    for (let x = 0; x < w; x += 3) {
      ctx.lineTo(x, y + Math.sin(x * 0.015 + Math.random() * 2) * 5);
    }
    ctx.lineWidth = 2 + Math.random() * 3;
    const v = Math.floor(50 + Math.random() * 160);
    ctx.strokeStyle = `rgba(${v},${v},${v},0.4)`; ctx.stroke();
  }
  // Great Red Spot (deep vortex)
  const grs = ctx.createRadialGradient(w * 0.62, h * 0.55, 0, w * 0.62, h * 0.55, w * 0.06);
  grs.addColorStop(0, '#222');
  grs.addColorStop(0.5, '#555');
  grs.addColorStop(1, '#888');
  ctx.beginPath(); ctx.ellipse(w * 0.62, h * 0.55, w * 0.08, h * 0.04, 0, 0, Math.PI * 2);
  ctx.fillStyle = grs; ctx.fill();
  addNoise(ctx, w, h, 30);
}

function heightSaturn(ctx, w, h) {
  ctx.fillStyle = '#888'; ctx.fillRect(0, 0, w, h);
  const bandCount = 20;
  const bh = h / bandCount;
  for (let i = 0; i < bandCount; i++) {
    const v = (i % 2 === 0) ? 70 : 180;
    ctx.fillStyle = `rgb(${v},${v},${v})`;
    ctx.fillRect(0, i * bh, w, bh + 1);
  }
  for (let i = 0; i < 50; i++) {
    const y = Math.random() * h;
    const bh2 = 2 + Math.random() * 6;
    const v = Math.floor(60 + Math.random() * 140);
    ctx.fillStyle = `rgba(${v},${v},${v},0.5)`;
    ctx.fillRect(0, y, w, bh2);
  }
  addNoise(ctx, w, h, 20);
}

function heightUranus(ctx, w, h) {
  ctx.fillStyle = '#888'; ctx.fillRect(0, 0, w, h);
  for (let i = 0; i < 30; i++) {
    const y = Math.random() * h;
    const bh = 4 + Math.random() * 15;
    const v = Math.floor(60 + Math.random() * 130);
    ctx.fillStyle = `rgba(${v},${v},${v},0.5)`;
    ctx.fillRect(0, y, w, bh);
  }
  for (let i = 0; i < 15; i++) {
    const x = Math.random() * w, y = Math.random() * h;
    const rx = 25 + Math.random() * 60, ry = 10 + Math.random() * 30;
    ctx.beginPath(); ctx.ellipse(x, y, rx, ry, Math.random() * Math.PI, 0, Math.PI * 2);
    const v = Math.floor(70 + Math.random() * 120);
    ctx.fillStyle = `rgba(${v},${v},${v},0.35)`; ctx.fill();
  }
  addNoise(ctx, w, h, 25);
}

function heightNeptune(ctx, w, h) {
  ctx.fillStyle = '#777'; ctx.fillRect(0, 0, w, h);
  for (let i = 0; i < 35; i++) {
    const y = Math.random() * h;
    const bh = 3 + Math.random() * 10;
    const v = Math.floor(50 + Math.random() * 150);
    ctx.fillStyle = `rgba(${v},${v},${v},0.45)`;
    ctx.fillRect(0, y, w, bh);
  }
  // Great Dark Spot
  const gds = ctx.createRadialGradient(w * 0.38, h * 0.42, 0, w * 0.38, h * 0.42, w * 0.06);
  gds.addColorStop(0, '#111');
  gds.addColorStop(0.6, '#444');
  gds.addColorStop(1, '#777');
  ctx.beginPath(); ctx.ellipse(w * 0.38, h * 0.42, w * 0.07, h * 0.035, -0.15, 0, Math.PI * 2);
  ctx.fillStyle = gds; ctx.fill();
  for (let i = 0; i < 20; i++) {
    const x = Math.random() * w, y = Math.random() * h;
    const rx = 15 + Math.random() * 35, ry = 6 + Math.random() * 15;
    ctx.beginPath(); ctx.ellipse(x, y, rx, ry, Math.random(), 0, Math.PI * 2);
    const v = Math.floor(60 + Math.random() * 140);
    ctx.fillStyle = `rgba(${v},${v},${v},0.3)`; ctx.fill();
  }
  addNoise(ctx, w, h, 30);
}

function heightEarth(ctx, w, h) {
  ctx.fillStyle = '#333'; ctx.fillRect(0, 0, w, h);
  const continents = [
    { x: 0.25, y: 0.35, rx: 0.12, ry: 0.15 },
    { x: 0.28, y: 0.62, rx: 0.08, ry: 0.2 },
    { x: 0.55, y: 0.28, rx: 0.16, ry: 0.13 },
    { x: 0.58, y: 0.55, rx: 0.06, ry: 0.1 },
    { x: 0.72, y: 0.38, rx: 0.13, ry: 0.16 },
    { x: 0.85, y: 0.48, rx: 0.09, ry: 0.12 },
    { x: 0.12, y: 0.42, rx: 0.07, ry: 0.14 },
  ];
  for (const c of continents) {
    const rg = ctx.createRadialGradient(
      c.x * w, c.y * h, 0,
      c.x * w, c.y * h, Math.max(c.rx, c.ry) * w
    );
    rg.addColorStop(0, '#eee');
    rg.addColorStop(0.5, '#ccc');
    rg.addColorStop(0.8, '#777');
    rg.addColorStop(1, '#333');
    ctx.beginPath();
    ctx.ellipse(c.x * w, c.y * h, c.rx * w, c.ry * h, Math.random() * 0.4, 0, Math.PI * 2);
    ctx.fillStyle = rg; ctx.fill();
  }
  for (let i = 0; i < 60; i++) {
    const ci = continents[Math.floor(Math.random() * continents.length)];
    const x = (ci.x + (Math.random() - 0.5) * ci.rx) * w;
    const y = (ci.y + (Math.random() - 0.5) * ci.ry) * h;
    ctx.beginPath(); ctx.arc(x, y, 3 + Math.random() * 8, 0, Math.PI * 2);
    ctx.fillStyle = `rgb(${200 + Math.floor(Math.random() * 55)},${200 + Math.floor(Math.random() * 55)},${200 + Math.floor(Math.random() * 55)})`; ctx.fill();
  }
  addNoise(ctx, w, h, 40);
}

function heightMoonGeneric(ctx, w, h) {
  ctx.fillStyle = '#888'; ctx.fillRect(0, 0, w, h);
  heightCraters(ctx, w, h, Math.floor(120 + Math.random() * 150), 2, 12);
  heightCraters(ctx, w, h, Math.floor(15 + Math.random() * 25), 8, 22);
  addNoise(ctx, w, h, 55);
}

function texMercury(ctx, w, h) {
  const g = ctx.createLinearGradient(0, 0, w, h);
  g.addColorStop(0, '#9a9a9a'); g.addColorStop(0.3, '#b8b0a0'); g.addColorStop(0.6, '#8a8278'); g.addColorStop(1, '#a09888');
  ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
  for (let i = 0; i < 250; i++) {
    const x = Math.random() * w, y = Math.random() * h;
    const r = 1 + Math.random() * 12;
    const rg = ctx.createRadialGradient(x, y, 0, x, y, r);
    rg.addColorStop(0, `rgba(50,48,44,${0.25 + Math.random() * 0.2})`);
    rg.addColorStop(0.7, `rgba(70,68,62,${0.1 + Math.random() * 0.1})`);
    rg.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fillStyle = rg; ctx.fill();
  }
  for (let i = 0; i < 40; i++) {
    const x = Math.random() * w, y = Math.random() * h;
    ctx.beginPath(); ctx.arc(x, y, 0.5 + Math.random() * 2, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(180,170,160,${0.15 + Math.random() * 0.15})`; ctx.fill();
  }
  addNoise(ctx, w, h, 30);
}

function texVenus(ctx, w, h) {
  const g = ctx.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, '#f0d88a'); g.addColorStop(0.2, '#e0b858'); g.addColorStop(0.5, '#d4a040');
  g.addColorStop(0.8, '#dab050'); g.addColorStop(1, '#e8c470');
  ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
  for (let i = 0; i < 50; i++) {
    const y = Math.random() * h;
    const bh = 2 + Math.random() * 10;
    ctx.fillStyle = `rgba(210,180,90,${0.08 + Math.random() * 0.12})`;
    ctx.fillRect(0, y, w, bh);
  }
  for (let i = 0; i < 30; i++) {
    const x = Math.random() * w, y = Math.random() * h;
    const rx = 10 + Math.random() * 40, ry = 5 + Math.random() * 15;
    ctx.beginPath(); ctx.ellipse(x, y, rx, ry, Math.random() * Math.PI, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(230,200,120,${0.06 + Math.random() * 0.08})`; ctx.fill();
  }
  addNoise(ctx, w, h, 20);
}

function texMars(ctx, w, h) {
  const g = ctx.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, '#ede0d4'); g.addColorStop(0.1, '#d8a880');
  g.addColorStop(0.3, '#c86838'); g.addColorStop(0.5, '#b84820');
  g.addColorStop(0.7, '#c86838'); g.addColorStop(0.9, '#d8a880'); g.addColorStop(1, '#ede0d4');
  ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
  for (let i = 0; i < 20; i++) {
    const x = Math.random() * w, y = 0.15 * h + Math.random() * 0.7 * h;
    const rx = 15 + Math.random() * 50, ry = 8 + Math.random() * 25;
    ctx.beginPath(); ctx.ellipse(x, y, rx, ry, Math.random() * Math.PI, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(160,70,30,${0.08 + Math.random() * 0.12})`; ctx.fill();
  }
  for (let i = 0; i < 120; i++) {
    const x = Math.random() * w, y = 0.15 * h + Math.random() * 0.7 * h;
    const r = 1 + Math.random() * 6;
    const rg = ctx.createRadialGradient(x, y, 0, x, y, r);
    rg.addColorStop(0, `rgba(80,25,8,${0.15 + Math.random() * 0.2})`);
    rg.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fillStyle = rg; ctx.fill();
  }
  ctx.beginPath(); ctx.ellipse(w * 0.35, h * 0.42, w * 0.12, h * 0.06, -0.2, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(100,40,15,0.18)'; ctx.fill();
  ctx.beginPath();
  ctx.moveTo(w * 0.5, h * 0.48); ctx.lineTo(w * 0.7, h * 0.5);
  ctx.lineWidth = 2; ctx.strokeStyle = 'rgba(90,35,10,0.12)'; ctx.stroke();
  addNoise(ctx, w, h, 25);
}

function texJupiter(ctx, w, h) {
  const bands = [
    '#d8c4a0','#c8a06a','#a87040','#dcc8a8','#c09060','#8c5830',
    '#d4b888','#b88858','#a06838','#d8c090','#c4a474','#9c6c40',
    '#d0b880','#b88050','#dcc898'
  ];
  const bh = h / bands.length;
  bands.forEach((col, i) => { ctx.fillStyle = col; ctx.fillRect(0, i * bh, w, bh + 1); });
  for (let i = 0; i < 40; i++) {
    const y = Math.random() * h;
    const wave = Math.sin(y * 0.05) * 3;
    ctx.beginPath();
    ctx.moveTo(0, y);
    for (let x = 0; x < w; x += 4) {
      ctx.lineTo(x, y + Math.sin(x * 0.02 + wave) * (1 + Math.random() * 2));
    }
    ctx.lineWidth = 1 + Math.random() * 2;
    ctx.strokeStyle = `rgba(140,90,40,${0.06 + Math.random() * 0.08})`; ctx.stroke();
  }
  for (let i = 0; i < 15; i++) {
    const x = Math.random() * w, y = Math.random() * h;
    const rx = 4 + Math.random() * 15, ry = 2 + Math.random() * 6;
    ctx.beginPath(); ctx.ellipse(x, y, rx, ry, Math.random(), 0, Math.PI * 2);
    ctx.fillStyle = `rgba(180,120,60,${0.06 + Math.random() * 0.08})`; ctx.fill();
  }
  ctx.beginPath(); ctx.ellipse(w * 0.62, h * 0.55, w * 0.09, h * 0.04, 0, 0, Math.PI * 2);
  ctx.fillStyle = '#b85028'; ctx.fill();
  ctx.beginPath(); ctx.ellipse(w * 0.62, h * 0.55, w * 0.065, h * 0.025, 0, 0, Math.PI * 2);
  ctx.fillStyle = '#d06838'; ctx.fill();
  ctx.beginPath(); ctx.ellipse(w * 0.62, h * 0.54, w * 0.03, h * 0.012, 0, 0, Math.PI * 2);
  ctx.fillStyle = '#e08850'; ctx.fill();
  addNoise(ctx, w, h, 15);
}

function texSaturn(ctx, w, h) {
  const bands = [
    '#eedcc0','#dcc8a0','#ccb488','#d8c498','#c4a878',
    '#d0bc90','#c8b080','#dcc898','#c8ac78','#d4c090',
    '#c0a870','#d8c898'
  ];
  const bh = h / bands.length;
  bands.forEach((col, i) => { ctx.fillStyle = col; ctx.fillRect(0, i * bh, w, bh + 1); });
  for (let i = 0; i < 30; i++) {
    const y = Math.random() * h;
    ctx.beginPath();
    ctx.moveTo(0, y);
    for (let x = 0; x < w; x += 4) {
      ctx.lineTo(x, y + Math.sin(x * 0.015) * (0.5 + Math.random()));
    }
    ctx.lineWidth = 0.5 + Math.random() * 1.5;
    ctx.strokeStyle = `rgba(170,140,90,${0.04 + Math.random() * 0.06})`; ctx.stroke();
  }
  for (let i = 0; i < 8; i++) {
    const x = Math.random() * w, y = Math.random() * h;
    const rx = 6 + Math.random() * 20, ry = 2 + Math.random() * 5;
    ctx.beginPath(); ctx.ellipse(x, y, rx, ry, Math.random() * 0.3, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(200,180,130,${0.04 + Math.random() * 0.06})`; ctx.fill();
  }
  addNoise(ctx, w, h, 12);
}

function texUranus(ctx, w, h) {
  const g = ctx.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, '#b8e8f0'); g.addColorStop(0.2, '#8ed0e0'); g.addColorStop(0.5, '#6cc0d4');
  g.addColorStop(0.8, '#88cce0'); g.addColorStop(1, '#aadce8');
  ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
  for (let i = 0; i < 20; i++) {
    const y = Math.random() * h;
    const bh = 2 + Math.random() * 8;
    ctx.fillStyle = `rgba(140,220,240,${0.06 + Math.random() * 0.08})`;
    ctx.fillRect(0, y, w, bh);
  }
  for (let i = 0; i < 10; i++) {
    const x = Math.random() * w, y = Math.random() * h;
    const rx = 8 + Math.random() * 30, ry = 4 + Math.random() * 10;
    ctx.beginPath(); ctx.ellipse(x, y, rx, ry, Math.random() * Math.PI, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(160,230,245,${0.04 + Math.random() * 0.06})`; ctx.fill();
  }
  addNoise(ctx, w, h, 15);
}

function texNeptune(ctx, w, h) {
  const g = ctx.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, '#5080d8'); g.addColorStop(0.25, '#3860c4'); g.addColorStop(0.5, '#2c50b0');
  g.addColorStop(0.75, '#3860c4'); g.addColorStop(1, '#4c78d0');
  ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
  for (let i = 0; i < 25; i++) {
    const y = Math.random() * h;
    ctx.beginPath();
    ctx.moveTo(0, y);
    for (let x = 0; x < w; x += 4) {
      ctx.lineTo(x, y + Math.sin(x * 0.025 + Math.random()) * (1 + Math.random() * 2));
    }
    ctx.lineWidth = 1 + Math.random() * 2;
    ctx.strokeStyle = `rgba(50,70,160,${0.06 + Math.random() * 0.1})`; ctx.stroke();
  }
  ctx.beginPath(); ctx.ellipse(w * 0.38, h * 0.42, w * 0.06, h * 0.025, -0.15, 0, Math.PI * 2);
  ctx.fillStyle = '#6090e0'; ctx.fill();
  ctx.beginPath(); ctx.ellipse(w * 0.38, h * 0.42, w * 0.035, h * 0.014, -0.15, 0, Math.PI * 2);
  ctx.fillStyle = '#78a8f0'; ctx.fill();
  for (let i = 0; i < 8; i++) {
    const x = Math.random() * w, y = Math.random() * h;
    const rx = 5 + Math.random() * 15, ry = 2 + Math.random() * 6;
    ctx.beginPath(); ctx.ellipse(x, y, rx, ry, Math.random(), 0, Math.PI * 2);
    ctx.fillStyle = `rgba(80,110,200,${0.05 + Math.random() * 0.07})`; ctx.fill();
  }
  addNoise(ctx, w, h, 18);
}

function texEarth(ctx, w, h) {
  ctx.fillStyle = '#1a4a7a'; ctx.fillRect(0,0,w,h);
}

// --- Earth globe at the origin (stationary) ---
const earthGeo = new THREE.SphereGeometry(1, 192, 192);
const earthHeight = makeHeightMap(1024, 512, heightEarth);
const earthMat = new THREE.MeshStandardMaterial({
  roughness: 0.8, metalness: 0.1,
  displacementMap: earthHeight, displacementScale: 0.06, displacementBias: -0.03,
  bumpMap: earthHeight, bumpScale: 0.8,
});
const earth = new THREE.Mesh(earthGeo, earthMat);
earth.userData.name = 'Earth';
earth.userData.size = 1.0;
scene.add(earth);

const earthHit = new THREE.Mesh(
  new THREE.SphereGeometry(1.5, 16, 16),
  new THREE.MeshBasicMaterial({ visible: false })
);
earthHit.userData.name = 'Earth';
earthHit.userData.size = 1.0;
earthHit.userData.planetMesh = earth;
earth.add(earthHit);

// Earth cloud layer -- procedural swirling cloud texture
const cloudTex = makePlanetTexture(2048, 1024, (ctx, w, h) => {
  ctx.clearRect(0, 0, w, h);
  for (let i = 0; i < 300; i++) {
    const x = Math.random() * w, y = h * 0.1 + Math.random() * h * 0.8;
    const rx = 30 + Math.random() * 120, ry = 10 + Math.random() * 40;
    const grad = ctx.createRadialGradient(x, y, 0, x, y, Math.max(rx, ry));
    const a = 0.15 + Math.random() * 0.25;
    grad.addColorStop(0, `rgba(255,255,255,${a})`);
    grad.addColorStop(0.4, `rgba(245,248,255,${a * 0.5})`);
    grad.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = grad;
    ctx.beginPath(); ctx.ellipse(x, y, rx, ry, Math.random() * Math.PI, 0, Math.PI * 2);
    ctx.fill();
  }
  // Polar cloud bands
  for (let i = 0; i < 40; i++) {
    const y = (Math.random() < 0.5) ? Math.random() * h * 0.15 : h - Math.random() * h * 0.15;
    ctx.fillStyle = `rgba(255,255,255,${0.1 + Math.random() * 0.15})`;
    ctx.fillRect(0, y, w, 3 + Math.random() * 12);
  }
  // Spiral cloud patterns (cyclones)
  for (let i = 0; i < 8; i++) {
    const cx = Math.random() * w, cy = h * 0.2 + Math.random() * h * 0.6;
    for (let s = 0; s < 30; s++) {
      const angle = s * 0.3 + i;
      const r = s * 2;
      const px = cx + Math.cos(angle) * r, py = cy + Math.sin(angle) * r;
      ctx.beginPath(); ctx.arc(px, py, 3 + Math.random() * 6, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255,255,255,${0.08 + Math.random() * 0.08})`; ctx.fill();
    }
  }
});
const earthClouds = new THREE.Mesh(
  new THREE.SphereGeometry(1.02, 128, 128),
  new THREE.MeshStandardMaterial({
    map: cloudTex, transparent: true, opacity: 0.6, depthWrite: false, roughness: 1, metalness: 0,
  })
);
earth.add(earthClouds);

const loader = new THREE.TextureLoader();
loader.load(
  EARTH_TEXTURE_URL,
  (texture) => { texture.colorSpace = THREE.SRGBColorSpace; earthMat.map = texture; earthMat.needsUpdate = true; },
  undefined,
  () => { earthMat.map = makePlanetTexture(512, 256, texEarth); earthMat.needsUpdate = true; }
);

// --- Solar system orbiting around Earth ---
const solarSystem = new THREE.Group();
scene.add(solarSystem);
solarSystem.rotation.x = 0.25;

// Sun on an orbit pivot so it circles Earth
const sunPivot = new THREE.Group();
solarSystem.add(sunPivot);

const sunGroup = new THREE.Group();
sunGroup.position.set(22, 0, 0);
sunPivot.add(sunGroup);

const sunTex = makePlanetTexture(1024, 512, (ctx, w, h) => {
  const g = ctx.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, '#fff8e0'); g.addColorStop(0.3, '#ffe8a0'); g.addColorStop(0.5, '#ffd060');
  g.addColorStop(0.7, '#ffb830'); g.addColorStop(1, '#fff0c0');
  ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
  for (let i = 0; i < 8000; i++) {
    const x = Math.random() * w, y = Math.random() * h;
    const r = 1 + Math.random() * 4;
    const bright = Math.random();
    const rr = Math.floor(200 + bright * 55), gg = Math.floor(140 + bright * 80), bb = Math.floor(20 + bright * 40);
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(${rr},${gg},${bb},${0.15 + Math.random() * 0.2})`;
    ctx.fill();
  }
  for (let i = 0; i < 200; i++) {
    const x = Math.random() * w, y = Math.random() * h;
    const rx = 3 + Math.random() * 12, ry = 2 + Math.random() * 8;
    ctx.beginPath(); ctx.ellipse(x, y, rx, ry, Math.random() * Math.PI, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255,${160 + Math.floor(Math.random() * 60)},${Math.floor(Math.random() * 50)},${0.08 + Math.random() * 0.12})`;
    ctx.fill();
  }
  for (let i = 0; i < 30; i++) {
    const x = Math.random() * w, y = Math.random() * h;
    const rg = ctx.createRadialGradient(x, y, 0, x, y, 8 + Math.random() * 15);
    rg.addColorStop(0, 'rgba(255,255,220,0.3)'); rg.addColorStop(0.5, 'rgba(255,200,100,0.1)'); rg.addColorStop(1, 'rgba(255,150,50,0)');
    ctx.fillStyle = rg; ctx.fillRect(x - 20, y - 20, 40, 40);
  }
  addNoise(ctx, w, h, 20);
});
const sunCore = new THREE.Mesh(
  new THREE.SphereGeometry(3, 64, 64),
  new THREE.MeshBasicMaterial({ map: sunTex })
);
sunCore.userData.name = 'Sun';
sunCore.userData.size = 3.0;
sunGroup.add(sunCore);

const sunHit = new THREE.Mesh(
  new THREE.SphereGeometry(4.5, 16, 16),
  new THREE.MeshBasicMaterial({ visible: false })
);
sunHit.userData.name = 'Sun';
sunHit.userData.size = 3.0;
sunHit.userData.planetMesh = sunCore;
sunGroup.add(sunHit);

const coronaLayers = [
  { scale: 1.15, opacity: 0.4, color: 0xffdd66 },
  { scale: 1.35, opacity: 0.22, color: 0xffcc44 },
  { scale: 1.65, opacity: 0.12, color: 0xffaa22 },
  { scale: 2.1,  opacity: 0.06, color: 0xff8800 },
  { scale: 2.6,  opacity: 0.025, color: 0xff6600 },
];
const coronaMeshes = coronaLayers.map((l) => {
  const mesh = new THREE.Mesh(
    new THREE.SphereGeometry(3, 32, 32),
    new THREE.MeshBasicMaterial({ color: l.color, transparent: true, opacity: l.opacity, side: THREE.BackSide, depthWrite: false, blending: THREE.AdditiveBlending })
  );
  mesh.scale.setScalar(l.scale);
  sunGroup.add(mesh);
  return mesh;
});

const sunLight = new THREE.PointLight(0xffeedd, 3.0, 0, 0);
sunLight.position.copy(sunGroup.position);
sunPivot.add(sunLight);

// Solar prominences / flares -- animated sprite particles arching out from the sun
const solarFlares = [];
const flareTex = (() => {
  const c = document.createElement('canvas'); c.width = 128; c.height = 128;
  const ctx = c.getContext('2d');
  const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
  g.addColorStop(0, 'rgba(255,200,100,1)');
  g.addColorStop(0.2, 'rgba(255,150,50,0.7)');
  g.addColorStop(0.5, 'rgba(255,80,20,0.3)');
  g.addColorStop(1, 'rgba(255,40,0,0)');
  ctx.fillStyle = g; ctx.fillRect(0, 0, 128, 128);
  return new THREE.CanvasTexture(c);
})();

for (let i = 0; i < 12; i++) {
  const angle = (i / 12) * Math.PI * 2 + Math.random() * 0.3;
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({
    map: flareTex, transparent: true, opacity: 0.6, depthWrite: false, blending: THREE.AdditiveBlending,
  }));
  sprite.scale.setScalar(2.0 + Math.random() * 3.0);
  const baseR = 3.0 + Math.random() * 1.5;
  sprite.position.set(Math.cos(angle) * baseR, Math.sin(angle) * baseR, (Math.random() - 0.5) * 1.5);
  sunGroup.add(sprite);
  solarFlares.push({ sprite, angle, baseR, phase: Math.random() * Math.PI * 2, speed: 0.2 + Math.random() * 0.6, scaleBase: sprite.scale.x });
}

// Sun lens flare sprite (visible from distance)
const sunLensFlare = new THREE.Sprite(new THREE.SpriteMaterial({
  map: circleTex, color: 0xfff0cc, transparent: true, opacity: 0.3, depthWrite: false, blending: THREE.AdditiveBlending,
}));
sunLensFlare.scale.setScalar(20);
sunGroup.add(sunLensFlare);
const sunLensFlare2 = new THREE.Sprite(new THREE.SpriteMaterial({
  map: circleTex, color: 0xffcc66, transparent: true, opacity: 0.1, depthWrite: false, blending: THREE.AdditiveBlending,
}));
sunLensFlare2.scale.setScalar(35);
sunGroup.add(sunLensFlare2);

// --- Planets orbiting the Sun ---
const tSize = 2048;
const planetDefs = [
  { name: 'Mercury', tex: texMercury, height: heightMercury, dispScale: 0.06,  size: 0.3,  orbit: 12, speed: 0.08, tilt: 0.1,  segs: 128 },
  { name: 'Venus',   tex: texVenus,   height: heightVenus,   dispScale: 0.04,  size: 0.5,  orbit: 18, speed: 0.055, tilt: 0.05, segs: 128 },
  { name: 'Mars',    tex: texMars,    height: heightMars,    dispScale: 0.06,  size: 0.4,  orbit: 25, speed: 0.035, tilt: 0.08, segs: 128 },
  { name: 'Jupiter', tex: texJupiter, height: heightJupiter, dispScale: 0.04,  size: 1.6,  orbit: 38, speed: 0.018, tilt: 0.03, segs: 128 },
  { name: 'Saturn',  tex: texSaturn,  height: heightSaturn,  dispScale: 0.03,  size: 1.3,  orbit: 52, speed: 0.012, tilt: 0.06, segs: 128, hasRing: true },
  { name: 'Uranus',  tex: texUranus,  height: heightUranus,  dispScale: 0.03,  size: 0.8,  orbit: 65, speed: 0.008, tilt: 0.1, segs: 128 },
  { name: 'Neptune', tex: texNeptune, height: heightNeptune, dispScale: 0.035, size: 0.75, orbit: 78, speed: 0.005, tilt: 0.04, segs: 128 },
];

const planetStartAngles = [0, 2.2, 4.1, 1.3, 3.7, 5.5, 0.8];
const planets = planetDefs.map((def, idx) => {
  const pivot = new THREE.Group();
  pivot.rotation.x = def.tilt;
  pivot.rotation.y = planetStartAngles[idx];
  sunGroup.add(pivot);

  const texture = makePlanetTexture(tSize, tSize / 2, def.tex);
  const hmap = makeHeightMap(tSize, tSize / 2, def.height);
  const mat = new THREE.MeshStandardMaterial({
    map: texture,
    displacementMap: hmap,
    displacementScale: def.dispScale,
    displacementBias: -def.dispScale * 0.5,
    bumpMap: hmap,
    bumpScale: 0.8,
    roughness: 0.45,
    metalness: 0.05,
  });

  const mesh = new THREE.Mesh(new THREE.SphereGeometry(def.size, def.segs, def.segs), mat);
  mesh.userData.name = def.name;
  mesh.userData.size = def.size;
  mesh.position.x = def.orbit;
  pivot.add(mesh);

  const hitSphere = new THREE.Mesh(
    new THREE.SphereGeometry(Math.max(def.size * 1.8, 0.8), 16, 16),
    new THREE.MeshBasicMaterial({ visible: false })
  );
  hitSphere.userData.name = def.name;
  hitSphere.userData.size = def.size;
  hitSphere.userData.planetMesh = mesh;
  hitSphere.position.x = def.orbit;
  pivot.add(hitSphere);

  if (def.hasRing) {
    const ringGeo = new THREE.RingGeometry(def.size * 1.3, def.size * 2.5, 128);
    const rc = document.createElement('canvas');
    rc.width = 1024; rc.height = 64;
    const rctx = rc.getContext('2d');
    // Multi-band ring structure like real Saturn
    const bands = [
      { start: 0, end: 0.05, r: 160, g: 140, b: 110, a: 0 },
      { start: 0.05, end: 0.12, r: 190, g: 170, b: 130, a: 0.4 },
      { start: 0.12, end: 0.15, r: 100, g: 90, b: 70, a: 0.1 },
      { start: 0.15, end: 0.35, r: 200, g: 185, b: 150, a: 0.65 },
      { start: 0.35, end: 0.38, r: 80, g: 70, b: 55, a: 0.05 },
      { start: 0.38, end: 0.42, r: 180, g: 165, b: 130, a: 0.5 },
      { start: 0.42, end: 0.44, r: 60, g: 50, b: 40, a: 0.02 },
      { start: 0.44, end: 0.65, r: 210, g: 195, b: 160, a: 0.7 },
      { start: 0.65, end: 0.68, r: 120, g: 110, b: 85, a: 0.15 },
      { start: 0.68, end: 0.85, r: 195, g: 180, b: 145, a: 0.5 },
      { start: 0.85, end: 0.92, r: 170, g: 155, b: 120, a: 0.3 },
      { start: 0.92, end: 1.0, r: 150, g: 135, b: 105, a: 0 },
    ];
    for (const b of bands) {
      const y0 = Math.floor(b.start * 64), y1 = Math.floor(b.end * 64);
      for (let y = y0; y < y1; y++) {
        const t = (y - y0) / Math.max(1, y1 - y0);
        const noise = (Math.random() - 0.5) * 15;
        rctx.fillStyle = `rgba(${b.r + noise},${b.g + noise},${b.b + noise},${b.a})`;
        rctx.fillRect(0, y, 1024, 1);
      }
    }
    for (let i = 0; i < 2000; i++) {
      const x = Math.random() * 1024, y = Math.random() * 64;
      rctx.fillStyle = `rgba(255,255,240,${0.02 + Math.random() * 0.04})`;
      rctx.fillRect(x, y, 1 + Math.random() * 3, 1);
    }
    const ringTex = new THREE.CanvasTexture(rc);
    ringTex.colorSpace = THREE.SRGBColorSpace;
    const ringMat = new THREE.MeshBasicMaterial({
      map: ringTex, side: THREE.DoubleSide, transparent: true, opacity: 0.75, depthWrite: false,
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = -Math.PI / 2.4;
    ring.position.copy(mesh.position);
    pivot.add(ring);
  }

  return { pivot, mesh, hitSphere, speed: def.speed, name: def.name, size: def.size, moons: [], moonGroup: null };
});

// --- Moon definitions (only planets that have notable moons) ---
const moonDefs = {
  Earth: [
    { name: 'Moon',      dist: 1.8, size: 0.18, speed: 0.5,  color: 0xcccccc },
  ],
  Mars: [
    { name: 'Phobos',    dist: 0.7, size: 0.06, speed: 1.2,  color: 0xaa9988 },
    { name: 'Deimos',    dist: 1.0, size: 0.04, speed: 0.8,  color: 0x998877 },
  ],
  Jupiter: [
    { name: 'Io',        dist: 2.8, size: 0.18, speed: 0.6,  color: 0xe8cc44 },
    { name: 'Europa',    dist: 3.4, size: 0.15, speed: 0.45, color: 0xccddee },
    { name: 'Ganymede',  dist: 4.2, size: 0.22, speed: 0.3,  color: 0xbbaa88 },
    { name: 'Callisto',  dist: 5.0, size: 0.20, speed: 0.2,  color: 0x886655 },
  ],
  Saturn: [
    { name: 'Titan',     dist: 3.5, size: 0.22, speed: 0.35, color: 0xddaa55 },
    { name: 'Enceladus', dist: 2.4, size: 0.08, speed: 0.7,  color: 0xeeeeff },
    { name: 'Mimas',     dist: 2.0, size: 0.06, speed: 0.9,  color: 0xcccccc },
  ],
  Uranus: [
    { name: 'Titania',   dist: 1.6, size: 0.10, speed: 0.5,  color: 0xccbbaa },
    { name: 'Oberon',    dist: 2.0, size: 0.09, speed: 0.35, color: 0xaabb99 },
  ],
  Neptune: [
    { name: 'Triton',    dist: 1.6, size: 0.12, speed: 0.4,  color: 0x99bbcc },
  ],
};

const MOON_ORBIT_COLOR = 0x66ccff;

function createMoonSystem(parentMesh, defs) {
  const group = new THREE.Group();
  group.visible = false;
  parentMesh.add(group);

  const moons = defs.map((md) => {
    const pivot = new THREE.Group();
    pivot.rotation.y = Math.random() * Math.PI * 2;
    group.add(pivot);

    const geo = new THREE.SphereGeometry(md.size, 64, 64);
    const moonHeight = makeHeightMap(256, 128, heightMoonGeneric);
    const mat = new THREE.MeshStandardMaterial({
      color: md.color,
      roughness: 0.6,
      displacementMap: moonHeight,
      displacementScale: md.size * 0.15,
      displacementBias: -md.size * 0.075,
      bumpMap: moonHeight,
      bumpScale: 0.5,
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.x = md.dist;
    pivot.add(mesh);

    const moonCurve = new THREE.CatmullRomCurve3(
      Array.from({ length: 91 }, (_, j) => {
        const a = (j / 90) * Math.PI * 2;
        return new THREE.Vector3(Math.cos(a) * md.dist, 0, Math.sin(a) * md.dist);
      }), true
    );
    const moonGlow = new THREE.Mesh(
      new THREE.TubeGeometry(moonCurve, 90, 0.04, 4, true),
      new THREE.MeshBasicMaterial({ color: MOON_ORBIT_COLOR, transparent: true, opacity: 0.08, side: THREE.DoubleSide })
    );
    group.add(moonGlow);
    const moonCore = new THREE.Mesh(
      new THREE.TubeGeometry(moonCurve, 90, 0.015, 4, true),
      new THREE.MeshBasicMaterial({ color: 0xaaddff, transparent: true, opacity: 0.3 })
    );
    group.add(moonCore);

    return { pivot, mesh, speed: md.speed };
  });

  return { group, moons };
}

// Create Earth's moon system
const earthMoonSys = createMoonSystem(earth, moonDefs.Earth);

// Create moon systems for other planets
for (const p of planets) {
  const defs = moonDefs[p.name];
  if (defs) {
    const sys = createMoonSystem(p.mesh, defs);
    p.moons = sys.moons;
    p.moonGroup = sys.group;
  }
}

// Collect all moon groups for easy toggling
const allMoonSystems = [
  { target: earth, group: earthMoonSys.group, moons: earthMoonSys.moons },
  ...planets.filter(p => p.moonGroup).map(p => ({ target: p.mesh, group: p.moonGroup, moons: p.moons })),
];

function updateMoonVisibility() {
  for (const ms of allMoonSystems) {
    ms.group.visible = (focusTarget === ms.target);
  }
}

// Glowing green orbit lines for each planet (layered tubes for thickness + glow)
planetDefs.forEach((def) => {
  const curve = new THREE.CatmullRomCurve3(
    Array.from({ length: 181 }, (_, i) => {
      const a = (i / 180) * Math.PI * 2;
      return new THREE.Vector3(Math.cos(a) * def.orbit, 0, Math.sin(a) * def.orbit);
    }),
    true
  );

  // Outer glow layer (wide, faint)
  const glowGeo = new THREE.TubeGeometry(curve, 180, 0.25, 6, true);
  const glowMat = new THREE.MeshBasicMaterial({
    color: 0x44ff66, transparent: true, opacity: 0.06, side: THREE.DoubleSide,
  });
  const glowMesh = new THREE.Mesh(glowGeo, glowMat);
  glowMesh.rotation.x = def.tilt;
  sunGroup.add(glowMesh);

  // Mid glow layer
  const midGeo = new THREE.TubeGeometry(curve, 180, 0.12, 6, true);
  const midMat = new THREE.MeshBasicMaterial({
    color: 0x66ff88, transparent: true, opacity: 0.12, side: THREE.DoubleSide,
  });
  const midMesh = new THREE.Mesh(midGeo, midMat);
  midMesh.rotation.x = def.tilt;
  sunGroup.add(midMesh);

  // Core line (bright, thin)
  const coreGeo = new THREE.TubeGeometry(curve, 180, 0.04, 4, true);
  const coreMat = new THREE.MeshBasicMaterial({
    color: 0xaaffbb, transparent: true, opacity: 0.35,
  });
  const coreMesh = new THREE.Mesh(coreGeo, coreMat);
  coreMesh.rotation.x = def.tilt;
  sunGroup.add(coreMesh);
});

// Earth orbit ring (radius = Sun-Earth distance)
{
  const earthOrbit = 22;
  const earthCurve = new THREE.CatmullRomCurve3(
    Array.from({ length: 181 }, (_, i) => {
      const a = (i / 180) * Math.PI * 2;
      return new THREE.Vector3(Math.cos(a) * earthOrbit, 0, Math.sin(a) * earthOrbit);
    }),
    true
  );

  const eGlowGeo = new THREE.TubeGeometry(earthCurve, 180, 0.25, 6, true);
  const eGlowMat = new THREE.MeshBasicMaterial({
    color: 0x44ff66, transparent: true, opacity: 0.06, side: THREE.DoubleSide,
  });
  sunGroup.add(new THREE.Mesh(eGlowGeo, eGlowMat));

  const eMidGeo = new THREE.TubeGeometry(earthCurve, 180, 0.12, 6, true);
  const eMidMat = new THREE.MeshBasicMaterial({
    color: 0x66ff88, transparent: true, opacity: 0.12, side: THREE.DoubleSide,
  });
  sunGroup.add(new THREE.Mesh(eMidGeo, eMidMat));

  const eCoreGeo = new THREE.TubeGeometry(earthCurve, 180, 0.04, 4, true);
  const eCoreMat = new THREE.MeshBasicMaterial({
    color: 0xaaffbb, transparent: true, opacity: 0.35,
  });
  sunGroup.add(new THREE.Mesh(eCoreGeo, eCoreMat));
}

// === PHASE 1: SOLAR SYSTEM POLISH ===

// Asteroid belt between Mars and Jupiter
const ASTEROID_COUNT = 4000;
const asteroidPos = new Float32Array(ASTEROID_COUNT * 3);
const asteroidCol = new Float32Array(ASTEROID_COUNT * 3);
const asteroidSizes = new Float32Array(ASTEROID_COUNT);
for (let i = 0; i < ASTEROID_COUNT; i++) {
  const a = Math.random() * Math.PI * 2;
  const r = 28 + Math.random() * 8;
  asteroidPos[i * 3] = Math.cos(a) * r + (Math.random() - 0.5) * 0.3;
  asteroidPos[i * 3 + 1] = (Math.random() - 0.5) * 1.5;
  asteroidPos[i * 3 + 2] = Math.sin(a) * r + (Math.random() - 0.5) * 0.3;
  const shade = 0.4 + Math.random() * 0.5;
  const warm = Math.random();
  asteroidCol[i * 3] = shade * (0.9 + warm * 0.1);
  asteroidCol[i * 3 + 1] = shade * (0.8 + warm * 0.05);
  asteroidCol[i * 3 + 2] = shade * (0.7 + warm * 0.05);
  asteroidSizes[i] = 0.02 + Math.random() * 0.08;
}
const asteroidGeo = new THREE.BufferGeometry();
asteroidGeo.setAttribute('position', new THREE.BufferAttribute(asteroidPos, 3));
asteroidGeo.setAttribute('color', new THREE.BufferAttribute(asteroidCol, 3));
const asteroidBelt = new THREE.Points(asteroidGeo, new THREE.PointsMaterial({
  map: circleTex, size: 0.06, sizeAttenuation: true, vertexColors: true, transparent: true, opacity: 0.7, depthWrite: false,
}));
sunGroup.add(asteroidBelt);

// Kuiper belt beyond Neptune
const KUIPER_COUNT = 3500;
const kuiperPos = new Float32Array(KUIPER_COUNT * 3);
const kuiperCol = new Float32Array(KUIPER_COUNT * 3);
for (let i = 0; i < KUIPER_COUNT; i++) {
  const a = Math.random() * Math.PI * 2;
  const r = 85 + Math.random() * 45;
  kuiperPos[i * 3] = Math.cos(a) * r + (Math.random() - 0.5) * 2;
  kuiperPos[i * 3 + 1] = (Math.random() - 0.5) * 6;
  kuiperPos[i * 3 + 2] = Math.sin(a) * r + (Math.random() - 0.5) * 2;
  const shade = 0.3 + Math.random() * 0.4;
  const icy = Math.random() > 0.7;
  kuiperCol[i * 3] = icy ? shade * 0.7 : shade * 0.85;
  kuiperCol[i * 3 + 1] = icy ? shade * 0.8 : shade * 0.8;
  kuiperCol[i * 3 + 2] = icy ? shade * 1.0 : shade * 0.75;
}
const kuiperGeo = new THREE.BufferGeometry();
kuiperGeo.setAttribute('position', new THREE.BufferAttribute(kuiperPos, 3));
kuiperGeo.setAttribute('color', new THREE.BufferAttribute(kuiperCol, 3));
const kuiperBelt = new THREE.Points(kuiperGeo, new THREE.PointsMaterial({
  map: circleTex, size: 0.04, sizeAttenuation: true, vertexColors: true, transparent: true, opacity: 0.4, depthWrite: false,
}));
sunGroup.add(kuiperBelt);

// Dwarf planets
const dwarfPlanetDefs = [
  { name: 'Ceres',    size: 0.08, orbit: 30,  speed: 0.028,  color: 0xaaaaaa, tilt: 0.18 },
  { name: 'Pluto',    size: 0.12, orbit: 92,  speed: 0.003,  color: 0xddccaa, tilt: 0.3 },
  { name: 'Eris',     size: 0.10, orbit: 108, speed: 0.002,  color: 0xccccdd, tilt: 0.75 },
  { name: 'Haumea',   size: 0.07, orbit: 97,  speed: 0.0025, color: 0xddddcc, tilt: 0.5 },
  { name: 'Makemake', size: 0.09, orbit: 100, speed: 0.0022, color: 0xccbbaa, tilt: 0.48 },
];
const dwarfPlanets = dwarfPlanetDefs.map((def) => {
  const pivot = new THREE.Group();
  pivot.rotation.x = def.tilt;
  pivot.rotation.y = Math.random() * Math.PI * 2;
  sunGroup.add(pivot);

  const mesh = new THREE.Mesh(
    new THREE.SphereGeometry(def.size, 32, 32),
    new THREE.MeshStandardMaterial({ color: def.color, roughness: 0.7, metalness: 0.05 })
  );
  mesh.userData.name = def.name;
  mesh.userData.size = def.size;
  mesh.position.x = def.orbit;
  pivot.add(mesh);

  const hitSphere = new THREE.Mesh(
    new THREE.SphereGeometry(Math.max(def.size * 2.5, 0.4), 8, 8),
    new THREE.MeshBasicMaterial({ visible: false })
  );
  hitSphere.userData.name = def.name;
  hitSphere.userData.size = def.size;
  hitSphere.userData.planetMesh = mesh;
  hitSphere.position.x = def.orbit;
  pivot.add(hitSphere);

  // Thin orbit line
  const oCurve = new THREE.CatmullRomCurve3(
    Array.from({ length: 91 }, (_, i) => {
      const ang = (i / 90) * Math.PI * 2;
      return new THREE.Vector3(Math.cos(ang) * def.orbit, 0, Math.sin(ang) * def.orbit);
    }), true
  );
  const oLine = new THREE.Mesh(
    new THREE.TubeGeometry(oCurve, 90, 0.02, 4, true),
    new THREE.MeshBasicMaterial({ color: 0x44ff66, transparent: true, opacity: 0.08 })
  );
  sunGroup.add(oLine);

  return { pivot, mesh, hitSphere, speed: def.speed, name: def.name, size: def.size };
});

// Planet atmospheres -- bold, vivid multi-layer glow
function addAtmosphere(parentMesh, radius, color, opacity) {
  parentMesh.add(new THREE.Mesh(
    new THREE.SphereGeometry(radius, 48, 48),
    new THREE.MeshBasicMaterial({ color, transparent: true, opacity, side: THREE.BackSide, depthWrite: false, blending: THREE.AdditiveBlending })
  ));
  parentMesh.add(new THREE.Mesh(
    new THREE.SphereGeometry(radius * 1.08, 48, 48),
    new THREE.MeshBasicMaterial({ color, transparent: true, opacity: opacity * 0.5, side: THREE.BackSide, depthWrite: false, blending: THREE.AdditiveBlending })
  ));
  parentMesh.add(new THREE.Mesh(
    new THREE.SphereGeometry(radius * 1.18, 48, 48),
    new THREE.MeshBasicMaterial({ color, transparent: true, opacity: opacity * 0.2, side: THREE.BackSide, depthWrite: false, blending: THREE.AdditiveBlending })
  ));
  const rimSprite = new THREE.Sprite(new THREE.SpriteMaterial({
    map: circleTex, color, transparent: true, opacity: opacity * 0.7, depthWrite: false, blending: THREE.AdditiveBlending,
  }));
  rimSprite.scale.setScalar(radius * 3.5);
  parentMesh.add(rimSprite);
}
addAtmosphere(earth, 1.05, 0x4499ff, 0.25);
addAtmosphere(earth, 1.12, 0x3388ff, 0.08);
const pByName = (n) => planets.find(p => p.name === n);
if (pByName('Venus'))   { addAtmosphere(pByName('Venus').mesh,   0.55, 0xffcc33, 0.35); }
if (pByName('Mars'))    { addAtmosphere(pByName('Mars').mesh,     0.44, 0xff6633, 0.15); }
if (pByName('Jupiter')) { addAtmosphere(pByName('Jupiter').mesh, 1.68, 0xffcc88, 0.20); }
if (pByName('Saturn'))  { addAtmosphere(pByName('Saturn').mesh,  1.38, 0xffdd88, 0.18); }
if (pByName('Uranus'))  { addAtmosphere(pByName('Uranus').mesh,  0.86, 0x44ddff, 0.25); }
if (pByName('Neptune')) { addAtmosphere(pByName('Neptune').mesh, 0.81, 0x3366ff, 0.25); }

// Comets -- intense dual tails (blue ion + golden dust)
const comets = [];
[
  { peri: 8,  aph: 120, incl: 0.6,  angle: 0.3, spd: 0.012 },
  { peri: 15, aph: 85,  incl: -0.3, angle: 2.8, spd: 0.018 },
  { peri: 5,  aph: 140, incl: 1.0,  angle: 4.5, spd: 0.008 },
  { peri: 10, aph: 110, incl: 0.2,  angle: 1.5, spd: 0.015 },
  { peri: 3,  aph: 130, incl: -0.8, angle: 5.2, spd: 0.010 },
].forEach((cd) => {
  const grp = new THREE.Group();
  grp.rotation.x = cd.incl;
  sunGroup.add(grp);

  const head = new THREE.Mesh(
    new THREE.SphereGeometry(0.18, 24, 24),
    new THREE.MeshBasicMaterial({ color: 0xf4faff })
  );
  grp.add(head);

  const coma = new THREE.Mesh(
    new THREE.SphereGeometry(0.6, 24, 24),
    new THREE.MeshBasicMaterial({ color: 0xaaccee, transparent: true, opacity: 0.3, depthWrite: false, blending: THREE.AdditiveBlending })
  );
  grp.add(coma);

  const comaGlow = new THREE.Sprite(new THREE.SpriteMaterial({ map: circleTex, color: 0x88ccff, transparent: true, opacity: 0.5, depthWrite: false, blending: THREE.AdditiveBlending }));
  comaGlow.scale.setScalar(3.0);
  head.add(comaGlow);
  const comaGlow2 = new THREE.Sprite(new THREE.SpriteMaterial({ map: circleTex, color: 0x6699dd, transparent: true, opacity: 0.2, depthWrite: false, blending: THREE.AdditiveBlending }));
  comaGlow2.scale.setScalar(6);
  head.add(comaGlow2);

  // Ion tail (straight, intense blue, narrow)
  const ION_N = 200;
  const ionArr = new Float32Array(ION_N * 3);
  const ionCol = new Float32Array(ION_N * 3);
  const ionGeo = new THREE.BufferGeometry();
  ionGeo.setAttribute('position', new THREE.BufferAttribute(ionArr, 3));
  ionGeo.setAttribute('color', new THREE.BufferAttribute(ionCol, 3));
  const ionTail = new THREE.Points(ionGeo, new THREE.PointsMaterial({
    map: circleTex, size: 0.08, sizeAttenuation: true, vertexColors: true, transparent: true, opacity: 0.7, depthWrite: false, blending: THREE.AdditiveBlending,
  }));
  grp.add(ionTail);

  // Dust tail (curved, golden, wider)
  const DUST_N = 160;
  const dustArr = new Float32Array(DUST_N * 3);
  const dustCol2 = new Float32Array(DUST_N * 3);
  const dustGeo = new THREE.BufferGeometry();
  dustGeo.setAttribute('position', new THREE.BufferAttribute(dustArr, 3));
  dustGeo.setAttribute('color', new THREE.BufferAttribute(dustCol2, 3));
  const dustTail = new THREE.Points(dustGeo, new THREE.PointsMaterial({
    map: circleTex, size: 0.12, sizeAttenuation: true, vertexColors: true, transparent: true, opacity: 0.5, depthWrite: false, blending: THREE.AdditiveBlending,
  }));
  grp.add(dustTail);

  comets.push({ grp, head, coma, ionTail, ionArr, ionCol, ionGeo, dustTail, dustArr, dustCol: dustCol2, dustGeo, peri: cd.peri, aph: cd.aph, angle: cd.angle, spd: cd.spd });
});

// --- OrbitControls (targets Earth at origin) ---
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.minDistance = 0.5;
controls.maxDistance = 40000000;
controls.autoRotate = true;
controls.autoRotateSpeed = 0.5;

renderer.domElement.addEventListener('wheel', () => { flyingIn = false; flyingToCenter = false; }, { passive: true });

function onResize() {
  const w = container.clientWidth;
  const h = container.clientHeight;
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  renderer.setSize(w, h);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
}
window.addEventListener('resize', onResize);

// --- Planet Info Panel ---
const infoPanel = document.getElementById('info-panel');
const infoName = document.getElementById('info-name');
const infoFacts = document.getElementById('info-facts');

const planetFacts = {
  Sun: ['Type: G-type main-sequence star', 'Diameter: 1.39 million km', 'Surface temp: ~5,500 °C', 'Age: ~4.6 billion years'],
  Mercury: ['Closest planet to the Sun', 'Diameter: 4,880 km', 'Day length: 59 Earth days', 'No atmosphere or moons'],
  Venus: ['Hottest planet in the solar system', 'Diameter: 12,104 km', 'Rotates backwards (retrograde)', 'Surface temp: ~465 °C'],
  Earth: ['The only known planet with life', 'Diameter: 12,742 km', '71% of surface is water', 'One natural satellite: the Moon'],
  Mars: ['Known as the Red Planet', 'Diameter: 6,779 km', 'Home to Olympus Mons, tallest volcano', 'Has two moons: Phobos and Deimos'],
  Jupiter: ['Largest planet in the solar system', 'Diameter: 139,820 km', 'Great Red Spot: storm for 350+ years', 'Has 95 known moons'],
  Saturn: ['Famous for its ring system', 'Diameter: 116,460 km', 'Least dense planet — would float on water', 'Has 146 known moons'],
  Uranus: ['Rotates on its side (98° tilt)', 'Diameter: 50,724 km', 'Coldest planetary atmosphere: −224 °C', 'Has 28 known moons'],
  Neptune: ['Farthest planet from the Sun', 'Diameter: 49,244 km', 'Strongest winds in the solar system', 'Has 16 known moons'],
  Ceres: ['Largest object in the asteroid belt', 'Diameter: 946 km', 'First dwarf planet visited by spacecraft', 'Contains subsurface ocean'],
  Pluto: ['Reclassified as dwarf planet in 2006', 'Diameter: 2,377 km', 'Has 5 known moons including Charon', 'Heart-shaped nitrogen glacier'],
  Eris: ['Most massive known dwarf planet', 'Diameter: 2,326 km', 'Orbits far beyond Pluto', 'Has one moon: Dysnomia'],
  Haumea: ['Fastest rotating dwarf planet', 'Elongated egg shape', 'Has two moons and a ring', 'Orbits in the Kuiper belt'],
  Makemake: ['Second brightest Kuiper belt object', 'Diameter: ~1,430 km', 'Extremely low temperature: −243 °C', 'Has one known moon'],
};

// Facts for all cosmic objects
const cosmicFacts = {
  'Alpha Centauri':   ['Nearest star system: 4.37 light-years', 'Triple star system (A, B, Proxima)', 'Proxima Centauri has confirmed exoplanet'],
  "Barnard's Star":   ['Second nearest star: 5.96 light-years', 'Red dwarf, fastest proper motion known', 'One confirmed sub-Earth planet'],
  'Wolf 359':         ['Red dwarf: 7.86 light-years', 'One of the faintest stars known', 'Two candidate exoplanets'],
  'Lalande 21185':    ['Red dwarf: 8.31 light-years', 'Among the brightest red dwarfs', 'Possible planetary system'],
  'Sirius':           ['Brightest star in the sky: 8.6 ly', 'Binary system (Sirius A + white dwarf B)', 'Twice the mass of our Sun'],
  'Luyten 726-8':     ['Binary red dwarf system: 8.73 ly', 'Also known as UV Ceti', 'Famous flare star'],
  'Ross 154':         ['Red dwarf: 9.69 light-years', 'Flare star in Sagittarius', 'About 17% solar mass'],
  'Ross 248':         ['Red dwarf: 10.3 light-years', 'Will be nearest star in ~40,000 years', 'In constellation Andromeda'],
  'Epsilon Eridani':  ['Sun-like star: 10.5 light-years', 'One confirmed exoplanet', 'Prominent debris disk'],
  'Lacaille 9352':    ['Red dwarf: 10.7 light-years', 'Fast-moving star', 'Visible from southern hemisphere'],
  'Ross 128':         ['Red dwarf: 11 light-years', 'Earth-mass planet in habitable zone', 'Quiet (low-flare) star'],
  'Procyon':          ['Binary system: 11.5 light-years', 'Brightest star in Canis Minor', '1.5x solar mass'],
  'Tau Ceti':         ['Sun-like star: 11.9 light-years', 'Up to 4 candidate exoplanets', 'Popular in science fiction'],
  'Altair':           ['Bright star: 16.7 light-years', 'Rapid rotation flattens its shape', 'Part of the Summer Triangle'],
  'Vega':             ['Bright star: 25 light-years', 'Former North Star, will be again in 12,000 yrs', 'Prominent debris disk'],
  'Fomalhaut':        ['Bright star: 25.1 light-years', 'Visible dust ring with exoplanet', 'One of the Royal Stars'],
  'Pollux':           ['Orange giant: 33.8 light-years', 'Brightest star in Gemini', 'One confirmed exoplanet (Pollux b)'],
  'Arcturus':         ['Red giant: 36.7 light-years', 'Brightest in northern hemisphere', '25x solar diameter'],
  'Aldebaran':        ['Red giant: 65 light-years', 'Eye of Taurus the Bull', '44x solar diameter'],
  'Betelgeuse':       ['Red supergiant: ~700 light-years', 'Will explode as supernova (eventually)', '~900x solar diameter'],
  'Rigel':            ['Blue supergiant: ~860 light-years', 'Brightest star in Orion', '120,000x solar luminosity'],
  'Capella':          ['Giant binary system: 42.9 light-years', 'Brightest star in Auriga', 'Two yellow giant stars orbiting'],
  'Deneb':            ['Blue-white supergiant: ~2,600 ly', 'Brightest star in Cygnus', '~200,000x solar luminosity'],
  'Spica':            ['Blue giant binary: 250 light-years', 'Brightest star in Virgo', '~12,000x solar luminosity'],
  'Antares':          ['Red supergiant: ~550 light-years', 'Heart of Scorpius', '~700x solar diameter'],
  "Luyten's Star":    ['Red dwarf: 12.4 light-years', 'Two confirmed exoplanets', 'One in habitable zone'],
  'Milky Way Galaxy': ['Our home galaxy: barred spiral type', 'Diameter: ~100,000 light-years', 'Contains 100-400 billion stars', 'Age: ~13.6 billion years'],
  'Sagittarius A*':   ['Supermassive black hole at galactic center', 'Mass: ~4 million solar masses', 'Event horizon: 12 million km radius', 'Imaged by Event Horizon Telescope (2022)'],
  'Orion Nebula':     ['Stellar nursery: ~1,344 light-years', 'Brightest diffuse nebula in the sky', 'Contains ~700 stars in various stages'],
  'Eagle Nebula':     ['Star-forming region: ~7,000 light-years', 'Home to the Pillars of Creation', 'Contains a young open star cluster'],
  'Crab Nebula':      ['Supernova remnant: ~6,500 light-years', 'Result of supernova observed in 1054 AD', 'Contains a pulsar spinning 30x/second'],
  'Carina Nebula':    ['Giant HII region: ~8,500 light-years', 'One of the largest nebulae known', 'Contains Eta Carinae, a massive star'],
  'Pillars of Creation': ['Elephant trunk structures in Eagle Nebula', 'Made famous by Hubble in 1995', 'Active star-forming region'],
  'Ring Nebula':      ['Planetary nebula: ~2,570 light-years', 'Dying star shedding its outer layers', 'About 1 light-year in diameter'],
  'Helix Nebula':     ['Planetary nebula: ~650 light-years', 'Often called the Eye of God', 'One of the closest planetary nebulae'],
  'Rosette Nebula':   ['HII region: ~5,000 light-years', 'Contains the young cluster NGC 2244', 'About 130 light-years in diameter'],
  'Andromeda (M31)':  ['Nearest large galaxy: 2.5 million ly', 'Spiral galaxy with ~1 trillion stars', 'Will merge with Milky Way in ~4.5 billion yrs'],
  'Triangulum (M33)': ['Spiral galaxy: 2.73 million light-years', 'Third largest in the Local Group', 'Contains ~40 billion stars'],
  'Large Magellanic Cloud': ['Irregular galaxy: 160,000 light-years', 'Satellite of the Milky Way', 'Visible to the naked eye from southern hemisphere'],
  'Small Magellanic Cloud': ['Dwarf galaxy: 200,000 light-years', 'Satellite of the Milky Way', 'Contains several hundred million stars'],
  'M32':              ['Compact elliptical galaxy: 2.5 million ly', 'Satellite of Andromeda', 'Contains a supermassive black hole'],
  'NGC 6822':         ['Irregular galaxy: 1.6 million light-years', 'Also called Barnard\'s Galaxy', 'Similar to Small Magellanic Cloud'],
  'Sagittarius Dwarf': ['Dwarf galaxy being absorbed by Milky Way', 'Distance: 70,000 light-years', 'Discovered in 1994'],
  'IC 10':            ['Irregular starburst galaxy: 2.2 million ly', 'Only known starburst galaxy in Local Group', 'High rate of star formation'],
  'IC 1613':          ['Irregular galaxy: 2.4 million light-years', 'Very little interstellar dust', 'Used as distance calibrator'],
  'Wolf-Lundmark-Melotte': ['Irregular galaxy: 3.4 million light-years', 'One of most remote Local Group members', 'Also called the WLM galaxy'],
  'Laniakea Supercluster': ['Our home supercluster: ~520 million light-years across', 'Contains ~100,000 galaxies including the Local Group', 'Centered on the Great Attractor', 'Name means "immense heaven" in Hawaiian'],
  'Great Attractor': ['Gravitational anomaly at the center of Laniakea', 'Pulls galaxies toward it at 600 km/s', 'Hidden behind the Milky Way\'s Zone of Avoidance', 'Mass equivalent to ~10^16 solar masses'],
  'Pisces-Cetus Supercluster Complex': ['Enormous galaxy filament: ~1 billion light-years long', 'One of the largest known structures in the universe', 'Contains several superclusters including Perseus-Pisces', 'Discovered by R. Brent Tully in 1987'],
};

function showInfoPanel(name) {
  const facts = planetFacts[name] || cosmicFacts[name];
  if (!facts) { hideInfoPanel(); return; }
  hidingPanel = false;
  infoPanel.classList.remove('pixel-fade-out');
  infoName.textContent = name;
  infoFacts.innerHTML = facts.join('<br>');
  infoPanel.style.display = 'block';
}

let hidingPanel = false;
function hideInfoPanel() {
  if (infoPanel.style.display === 'none' || hidingPanel) return;
  hidingPanel = true;
  infoPanel.classList.add('pixel-fade-out');
  infoPanel.addEventListener('animationend', function onEnd() {
    infoPanel.removeEventListener('animationend', onEnd);
    infoPanel.classList.remove('pixel-fade-out');
    infoPanel.style.display = 'none';
    hidingPanel = false;
  });
}

// --- Raycaster + Tooltip + Click-to-Focus ---
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
const tooltip = document.getElementById('tooltip');
const hitTargets = [earthHit, sunHit, ...planets.map(p => p.hitSphere), ...dwarfPlanets.map(d => d.hitSphere)];
// Cosmic-scale interactive sprites (populated after their groups are created)
let cosmicSprites = [];

let focusTarget = earth;
let focusSize = 1.0;
let flyingIn = false;
const EARTH_MIN = 1.5;
const EARTH_MAX = 200;

function projectToScreen(obj) {
  const pos = new THREE.Vector3();
  obj.getWorldPosition(pos);
  pos.project(camera);
  return {
    x: (pos.x * 0.5 + 0.5) * container.clientWidth,
    y: (-pos.y * 0.5 + 0.5) * container.clientHeight,
    z: pos.z,
  };
}

container.addEventListener('pointermove', (e) => {
  mouse.x = (e.clientX / container.clientWidth) * 2 - 1;
  mouse.y = -(e.clientY / container.clientHeight) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);

  // Check solar system hit targets
  const hits = raycaster.intersectObjects(hitTargets);
  if (hits.length > 0) {
    const obj = hits[0].object;
    const name = obj.userData.name;
    const displayObj = obj.userData.planetMesh || obj;
    if (name) {
      const screen = projectToScreen(displayObj);
      if (screen.z < 1) {
        tooltip.textContent = name;
        tooltip.style.left = screen.x + 'px';
        tooltip.style.top = (screen.y - 30) + 'px';
        tooltip.style.opacity = '1';
        container.style.cursor = 'pointer';
        return;
      }
    }
  }

  // Check cosmic sprites (stars, nebulae, galaxies, black hole)
  const visibleCosmicSprites = cosmicSprites.filter(s => {
    let p = s;
    while (p) { if (p.visible === false) return false; p = p.parent; }
    return true;
  });
  const cosmicHits = raycaster.intersectObjects(visibleCosmicSprites);
  if (cosmicHits.length > 0 && cosmicHits[0].object.userData.name) {
    const obj = cosmicHits[0].object;
    const screen = projectToScreen(obj);
    if (screen.z < 1) {
      tooltip.textContent = obj.userData.name;
      tooltip.style.left = screen.x + 'px';
      tooltip.style.top = (screen.y - 30) + 'px';
      tooltip.style.opacity = '1';
      container.style.cursor = 'pointer';
      return;
    }
  }

  tooltip.style.opacity = '0';
  container.style.cursor = '';
});

// Distinguish click from drag
let pointerDownPos = { x: 0, y: 0 };
container.addEventListener('pointerdown', (e) => {
  pointerDownPos.x = e.clientX;
  pointerDownPos.y = e.clientY;
});

container.addEventListener('pointerup', (e) => {
  const dx = e.clientX - pointerDownPos.x;
  const dy = e.clientY - pointerDownPos.y;
  if (dx * dx + dy * dy > 25) return;

  mouse.x = (e.clientX / container.clientWidth) * 2 - 1;
  mouse.y = -(e.clientY / container.clientHeight) * 2 + 1;
  raycaster.setFromCamera(mouse, camera);

  // Check solar system targets
  const hits = raycaster.intersectObjects(hitTargets);
  if (hits.length > 0 && hits[0].object.userData.name) {
    const hitObj = hits[0].object;
    const obj = hitObj.userData.planetMesh || hitObj;
    focusTarget = obj;
    focusSize = obj.userData.size || 1.0;
    flyingIn = true;
    flyingToCenter = false;
    controls.autoRotate = false;
    controls.minDistance = focusSize * 0.5;
    returnBtn.style.display = (obj === earth) ? 'none' : 'block';
    updateMoonVisibility();
    showInfoPanel(obj.userData.name);
    return;
  }

  // Check cosmic sprites
  const visibleCosmicSprites = cosmicSprites.filter(s => {
    let p = s;
    while (p) { if (p.visible === false) return false; p = p.parent; }
    return true;
  });
  const cosmicHits = raycaster.intersectObjects(visibleCosmicSprites);
  if (cosmicHits.length > 0 && cosmicHits[0].object.userData.name) {
    const obj = cosmicHits[0].object;
    const flyDist = obj.userData.flyDist || 50;
    focusTarget = obj;
    focusSize = flyDist / 4;
    flyingIn = true;
    flyingToCenter = false;
    controls.autoRotate = false;
    controls.minDistance = 0.5;
    returnBtn.style.display = 'block';
    updateMoonVisibility();
    showInfoPanel(obj.userData.name);
  }
});

// Return to Earth button
const returnBtn = document.getElementById('return-btn');
returnBtn.addEventListener('click', () => {
  focusTarget = earth;
  focusSize = 1.0;
  flyingIn = true;
  flyingToCenter = false;
  camera.up.set(0, 1, 0);
  controls.autoRotate = true;
  controls.minDistance = 0.5;
  returnBtn.style.display = 'none';
  updateMoonVisibility();
  hideInfoPanel();
});

// Center (aerial view) button
let flyingToCenter = false;
const centerCamGoal = new THREE.Vector3();
const centerUpGoal = new THREE.Vector3();
const centerNormal = new THREE.Vector3();
const CENTER_DIST = 280;

const centerBtn = document.getElementById('center-btn');
centerBtn.addEventListener('click', () => {
  focusTarget = sunCore;
  focusSize = 3.0;
  flyingIn = false;
  flyingToCenter = true;
  controls.autoRotate = false;
  controls.minDistance = 5;
  returnBtn.style.display = 'block';
  updateMoonVisibility();
  hideInfoPanel();

  centerNormal.set(0, 1, 0);
  centerUpGoal.set(0, 0, -1);
});

// --- 2D Zoomable Universe Map ---
const mapBtn = document.getElementById('map-btn');
const mapPanel = document.getElementById('map-panel');
const mapClose = document.getElementById('map-close');
const mapCanvas = document.getElementById('map-canvas');
const mapCtx = mapCanvas.getContext('2d');
const mapZoomLabel = document.getElementById('map-zoom-label');
let mapOpen = false;

mapBtn.addEventListener('click', () => { mapOpen = true; mapPanel.style.display = 'block'; });
mapClose.addEventListener('click', () => { mapOpen = false; mapPanel.style.display = 'none'; });

const MAP_SIZE = 600;
const MAP_CX = MAP_SIZE / 2;
const MAP_CY = MAP_SIZE / 2;

// mapViewRadius = how many 3D world units fit from the center to the map edge
let mapViewRadius = 100;
const MAP_VIEW_MIN = 15;
const MAP_VIEW_MAX = 6500000;

// All map objects across all scales
const planetColors = ['#aaaaaa', '#e8c06a', '#cc5533', '#d4a56a', '#e8d5a3', '#7ec8e3', '#4466ee'];
const SUN_DIST = 22;

const mapObjects = [];

// Solar system bodies (orbit around sun which orbits earth at origin)
mapObjects.push({ name: 'Sun', color: '#fff4d6', baseR: 5, getPos: () => { const wp = new THREE.Vector3(); sunCore.getWorldPosition(wp); return [wp.x, wp.z]; }, mesh: sunCore, scale: 'solar' });
mapObjects.push({ name: 'Earth', color: '#4488cc', baseR: 4, getPos: () => [0, 0], mesh: earth, scale: 'solar' });
planetDefs.forEach((def, i) => {
  mapObjects.push({
    name: def.name, color: planetColors[i], baseR: Math.max(2.5, def.size * 2.5),
    getPos: () => { const wp = new THREE.Vector3(); planets[i].mesh.getWorldPosition(wp); return [wp.x, wp.z]; },
    mesh: planets[i].mesh, scale: 'solar',
  });
});
dwarfPlanetDefs.forEach((def, i) => {
  mapObjects.push({
    name: def.name, color: '#aabb99', baseR: 2,
    getPos: () => { const wp = new THREE.Vector3(); dwarfPlanets[i].mesh.getWorldPosition(wp); return [wp.x, wp.z]; },
    mesh: dwarfPlanets[i].mesh, scale: 'solar',
  });
});

// Cosmic-scale objects are populated later (after Phases 2-5)
function populateCosmicMapObjects() {
  nearbyStarData.forEach((s, i) => {
    if (!starSprites[i]) return;
    mapObjects.push({
      name: s.name, color: '#' + s.color.toString(16).padStart(6, '0'), baseR: Math.max(2, s.sz * 0.8),
      getPos: () => [s.x, s.z], mesh: starSprites[i], scale: 'stellar',
    });
  });
  mapObjects.push({ name: 'Sagittarius A*', color: '#ff6622', baseR: 5, getPos: () => [GALAXY_OFFSET.x, GALAXY_OFFSET.z], mesh: bhGlow, scale: 'galaxy' });
  mapObjects.push({ name: 'Milky Way Galaxy', color: '#ffeedd', baseR: 6, getPos: () => [GALAXY_OFFSET.x, GALAXY_OFFSET.z + 12000], mesh: mwLabelSprite, scale: 'galaxy' });
  nebulaDefs.forEach((nd, i) => {
    if (!nebulaSprites[i]) return;
    mapObjects.push({
      name: nd.name, color: '#ff8888', baseR: 3,
      getPos: () => [nd.off[0] + GALAXY_OFFSET.x, nd.off[2] + GALAXY_OFFSET.z],
      mesh: nebulaSprites[i], scale: 'galaxy',
    });
  });
  galaxyDefs.forEach((gd, i) => {
    if (!galaxySprites[i]) return;
    mapObjects.push({
      name: gd.name, color: gd.type === 'spiral' ? '#aabbff' : (gd.type === 'elliptical' ? '#ffcc88' : '#ccaaff'),
      baseR: Math.max(3, gd.sz / 8000), getPos: () => [gd.x, gd.z],
      mesh: galaxySprites[i], scale: 'localgroup',
    });
  });
  mapObjects.push({ name: 'Milky Way', color: '#ffeedd', baseR: 6, getPos: () => [0, 0], mesh: mwLocalSprite, scale: 'localgroup' });
  mapObjects.push({ name: 'Laniakea Supercluster', color: '#ffcc66', baseR: 7, getPos: () => [2500000, -1800000], mesh: laniakea.labelSprite, scale: 'supercluster' });
  mapObjects.push({ name: 'Great Attractor', color: '#ffdd88', baseR: 5, getPos: () => [2500000, -1800000], mesh: greatAttractorGlow, scale: 'supercluster' });
  mapObjects.push({ name: 'Pisces-Cetus Supercluster Complex', color: '#ffcc55', baseR: 7, getPos: () => [-8000000, 6000000], mesh: piscesCetus.labelSprite, scale: 'supercluster' });
}

// Each object stores its last screen position for hit testing
let mapHover = null;

function getMapScale() { return MAP_CX / mapViewRadius; }

function getScaleLabel() {
  if (mapViewRadius < 200) return 'Solar System';
  if (mapViewRadius < 8000) return 'Stellar Neighborhood';
  if (mapViewRadius < 400000) return 'Milky Way Galaxy';
  if (mapViewRadius < 3500000) return 'Local Group';
  if (mapViewRadius < 30000000) return 'Superclusters';
  return 'Observable Universe';
}

function isScaleVisible(scale) {
  if (scale === 'solar') return mapViewRadius < 250;
  if (scale === 'stellar') return mapViewRadius > 50 && mapViewRadius < 15000;
  if (scale === 'galaxy') return mapViewRadius > 3000 && mapViewRadius < 600000;
  if (scale === 'localgroup') return mapViewRadius > 80000;
  if (scale === 'supercluster') return mapViewRadius > 1500000;
  return true;
}

function scaleAlpha(scale) {
  if (scale === 'solar') { const t = Math.max(0, Math.min(1, (250 - mapViewRadius) / 150)); return t; }
  if (scale === 'stellar') {
    const fadeIn = Math.max(0, Math.min(1, (mapViewRadius - 50) / 200));
    const fadeOut = Math.max(0, Math.min(1, (15000 - mapViewRadius) / 8000));
    return fadeIn * fadeOut;
  }
  if (scale === 'galaxy') {
    const fadeIn = Math.max(0, Math.min(1, (mapViewRadius - 3000) / 5000));
    const fadeOut = Math.max(0, Math.min(1, (600000 - mapViewRadius) / 300000));
    return fadeIn * fadeOut;
  }
  if (scale === 'localgroup') { const t = Math.max(0, Math.min(1, (mapViewRadius - 80000) / 100000)); return t; }
  if (scale === 'supercluster') { const t = Math.max(0, Math.min(1, (mapViewRadius - 1500000) / 3000000)); return t; }
  return 1;
}

function drawMap() {
  if (!mapOpen) return;

  // Auto-sync map zoom to camera distance so the map matches the viewer's scale
  const camDist = camera.position.length();
  const targetMapRadius = Math.max(100, camDist * 1.5);
  mapViewRadius = THREE.MathUtils.clamp(
    THREE.MathUtils.lerp(mapViewRadius, targetMapRadius, 0.12),
    MAP_VIEW_MIN, MAP_VIEW_MAX
  );

  const ctx = mapCtx;
  const s = getMapScale();
  ctx.clearRect(0, 0, MAP_SIZE, MAP_SIZE);

  mapZoomLabel.textContent = getScaleLabel();

  // Map center tracks what the camera is looking at (controls.target)
  const mapCenterX = controls.target.x;
  const mapCenterZ = controls.target.z;

  // Helper: convert world coords to map pixel coords
  const toSX = (wx) => MAP_CX + (wx - mapCenterX) * s;
  const toSZ = (wz) => MAP_CY + (wz - mapCenterZ) * s;

  // Draw orbit rings at solar system scale
  if (mapViewRadius < 250) {
    const alpha = scaleAlpha('solar');
    // Sun orbit around origin (Earth)
    const sunOrbitR = SUN_DIST * s;
    const earthSX = toSX(0), earthSZ = toSZ(0);
    if (sunOrbitR > 2 && sunOrbitR < MAP_SIZE) {
      ctx.beginPath(); ctx.arc(earthSX, earthSZ, sunOrbitR, 0, Math.PI * 2);
      ctx.lineWidth = 1.5; ctx.strokeStyle = `rgba(200,255,220,${0.5 * alpha})`; ctx.stroke();
    }
    // Planet orbits (around sun position)
    const sunWP = new THREE.Vector3(); sunCore.getWorldPosition(sunWP);
    const sunSX = toSX(sunWP.x);
    const sunSZ = toSZ(sunWP.z);
    for (const def of planetDefs) {
      const r = def.orbit * s;
      if (r < 2 || r > MAP_SIZE * 2) continue;
      ctx.beginPath(); ctx.arc(sunSX, sunSZ, r, 0, Math.PI * 2);
      ctx.lineWidth = 1; ctx.strokeStyle = `rgba(68,255,102,${0.15 * alpha})`; ctx.stroke();
    }
    // Asteroid belt ring
    const abInner = 28 * s, abOuter = 36 * s;
    if (abInner > 2) {
      ctx.beginPath(); ctx.arc(sunSX, sunSZ, (abInner + abOuter) / 2, 0, Math.PI * 2);
      ctx.lineWidth = (abOuter - abInner); ctx.strokeStyle = `rgba(153,136,119,${0.08 * alpha})`; ctx.stroke();
    }
    // Kuiper belt ring
    const kbInner = 85 * s, kbOuter = 130 * s;
    if (kbInner > 2) {
      ctx.beginPath(); ctx.arc(sunSX, sunSZ, (kbInner + kbOuter) / 2, 0, Math.PI * 2);
      ctx.lineWidth = Math.max(1, kbOuter - kbInner); ctx.strokeStyle = `rgba(102,119,136,${0.06 * alpha})`; ctx.stroke();
    }
  }

  // Draw Milky Way spiral arms hint at galaxy scale
  if (mapViewRadius > 3000 && mapViewRadius < 600000) {
    const alpha = scaleAlpha('galaxy') * 0.15;
    for (let arm = 0; arm < 4; arm++) {
      ctx.beginPath();
      for (let t = 0; t < 200; t++) {
        const dist = t * 400;
        const angle = arm * Math.PI * 0.5 + dist * 0.00004;
        const wx = Math.cos(angle) * dist + GALAXY_OFFSET.x;
        const wz = Math.sin(angle) * dist + GALAXY_OFFSET.z;
        const sx = toSX(wx);
        const sz = toSZ(wz);
        if (t === 0) ctx.moveTo(sx, sz); else ctx.lineTo(sx, sz);
      }
      ctx.lineWidth = Math.max(1, 2000 * s);
      ctx.strokeStyle = `rgba(150,180,255,${alpha})`;
      ctx.stroke();
    }
  }

  // Draw CMB boundary at cosmic scale
  if (mapViewRadius > 2000000) {
    const r = 5000000 * s;
    const cmx = toSX(0), cmz = toSZ(0);
    if (r > 10) {
      ctx.beginPath(); ctx.arc(cmx, cmz, r, 0, Math.PI * 2);
      ctx.lineWidth = 2; ctx.strokeStyle = 'rgba(80,60,40,0.25)'; ctx.stroke();
    }
  }

  // Draw all visible objects
  for (const obj of mapObjects) {
    if (!isScaleVisible(obj.scale)) continue;
    const alpha = scaleAlpha(obj.scale);
    if (alpha < 0.02) continue;

    const [wx, wz] = obj.getPos();
    const sx = toSX(wx);
    const sz = toSZ(wz);
    obj._sx = sx; obj._sy = sz;

    if (sx < -30 || sx > MAP_SIZE + 30 || sz < -30 || sz > MAP_SIZE + 30) continue;

    const isHover = mapHover === obj;
    const r = Math.max(2, Math.min(8, obj.baseR)) * (isHover ? 1.4 : 1);

    // Glow
    const glow = ctx.createRadialGradient(sx, sz, 0, sx, sz, r * 3);
    glow.addColorStop(0, obj.color + Math.floor(alpha * 68).toString(16).padStart(2, '0'));
    glow.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = glow;
    ctx.beginPath(); ctx.arc(sx, sz, r * 3, 0, Math.PI * 2); ctx.fill();

    // Dot
    ctx.globalAlpha = alpha;
    ctx.fillStyle = obj.color;
    ctx.beginPath(); ctx.arc(sx, sz, r, 0, Math.PI * 2); ctx.fill();

    // Label
    if (r > 1.5 && alpha > 0.3) {
      ctx.font = '9px Orbitron, sans-serif';
      ctx.fillStyle = obj.color;
      ctx.textAlign = 'center';
      ctx.fillText(obj.name, sx, sz + r + 11);
    }

    ctx.globalAlpha = 1;

    if (isHover) {
      ctx.strokeStyle = '#ff8c00';
      ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.arc(sx, sz, r + 3, 0, Math.PI * 2); ctx.stroke();
    }
  }

  // "You are here" -- show origin position on the map
  const hereSX = toSX(0), hereSZ = toSZ(0);
  if (mapViewRadius > 100 && hereSX > -20 && hereSX < MAP_SIZE + 20 && hereSZ > -20 && hereSZ < MAP_SIZE + 20) {
    ctx.fillStyle = '#44ff66';
    ctx.beginPath(); ctx.arc(hereSX, hereSZ, 3, 0, Math.PI * 2); ctx.fill();
    const yg = ctx.createRadialGradient(hereSX, hereSZ, 0, hereSX, hereSZ, 10);
    yg.addColorStop(0, 'rgba(68,255,102,0.4)'); yg.addColorStop(1, 'rgba(68,255,102,0)');
    ctx.fillStyle = yg; ctx.beginPath(); ctx.arc(hereSX, hereSZ, 10, 0, Math.PI * 2); ctx.fill();
    if (mapViewRadius > 500) {
      ctx.font = '8px Orbitron, sans-serif'; ctx.fillStyle = '#44ff66'; ctx.textAlign = 'center';
      ctx.fillText('You Are Here', hereSX, hereSZ + 16);
    }
  }

  // Crosshair at map center showing camera target
  ctx.strokeStyle = 'rgba(255,255,255,0.15)';
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(MAP_CX - 8, MAP_CY); ctx.lineTo(MAP_CX + 8, MAP_CY); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(MAP_CX, MAP_CY - 8); ctx.lineTo(MAP_CX, MAP_CY + 8); ctx.stroke();
}

function getMapObjAt(mx, my) {
  const rect = mapCanvas.getBoundingClientRect();
  const x = (mx - rect.left) * (MAP_SIZE / rect.width);
  const y = (my - rect.top) * (MAP_SIZE / rect.height);
  let best = null, bestD = Infinity;
  for (const obj of mapObjects) {
    if (!isScaleVisible(obj.scale) || obj._sx === undefined) continue;
    const dx = x - obj._sx, dy = y - obj._sy;
    const d = dx * dx + dy * dy;
    const hitR = 12;
    if (d < hitR * hitR && d < bestD) { best = obj; bestD = d; }
  }
  return best;
}

// Scroll on map zooms the 3D camera in/out to keep map in sync
mapCanvas.addEventListener('wheel', (e) => {
  e.preventDefault();
  const factor = e.deltaY > 0 ? 1.15 : 0.87;
  const dir = camera.position.clone().normalize();
  camera.position.multiplyScalar(factor);
  if (camera.position.length() < 0.5) camera.position.copy(dir.multiplyScalar(0.5));
}, { passive: false });

mapCanvas.addEventListener('mousemove', (e) => {
  const obj = getMapObjAt(e.clientX, e.clientY);
  mapHover = obj;
  if (obj) {
    tooltip.textContent = obj.name;
    tooltip.style.left = e.clientX + 'px';
    tooltip.style.top = (e.clientY - 35) + 'px';
    tooltip.style.opacity = '1';
    mapCanvas.style.cursor = 'pointer';
  } else {
    tooltip.style.opacity = '0';
    mapCanvas.style.cursor = '';
  }
});

mapCanvas.addEventListener('mouseleave', () => {
  mapHover = null;
  tooltip.style.opacity = '0';
  mapCanvas.style.cursor = '';
});

mapCanvas.addEventListener('click', (e) => {
  const obj = getMapObjAt(e.clientX, e.clientY);
  if (!obj) return;

  focusTarget = obj.mesh;
  focusSize = obj.mesh.userData.size || (obj.mesh.userData.flyDist ? obj.mesh.userData.flyDist / 4 : 1.0);
  flyingIn = true;
  flyingToCenter = false;
  camera.up.set(0, 1, 0);
  controls.autoRotate = false;
  controls.minDistance = 0.5;
  returnBtn.style.display = 'block';

  updateMoonVisibility();
  showInfoPanel(obj.name);
  mapOpen = false;
  mapPanel.style.display = 'none';
});

// ============================================================
// PHASES 2-5: UNIVERSE SCALE LAYERS
// ============================================================

// --- Phase 2: Stellar Neighborhood (~500-5000 units) ---
const stellarGroup = new THREE.Group();
scene.add(stellarGroup);

const nearbyStarData = [
  { name: 'Alpha Centauri', x: 320, y: 30, z: -180, color: 0xfff4d0, sz: 3.0 },
  { name: "Barnard's Star", x: -440, y: 210, z: 150, color: 0xff8844, sz: 1.2 },
  { name: 'Wolf 359', x: -380, y: 100, z: -250, color: 0xff6644, sz: 0.8 },
  { name: 'Lalande 21185', x: -520, y: -300, z: 400, color: 0xff8866, sz: 1.1 },
  { name: 'Sirius', x: 650, y: -120, z: 480, color: 0xd0e8ff, sz: 4.5 },
  { name: 'Luyten 726-8', x: 500, y: -400, z: 350, color: 0xff8855, sz: 0.8 },
  { name: 'Ross 154', x: 580, y: 450, z: -200, color: 0xff7744, sz: 0.9 },
  { name: 'Ross 248', x: -610, y: 300, z: 280, color: 0xff7755, sz: 0.8 },
  { name: 'Epsilon Eridani', x: -500, y: -200, z: 700, color: 0xffcc88, sz: 1.8 },
  { name: 'Lacaille 9352', x: -700, y: -100, z: -550, color: 0xff9966, sz: 1.1 },
  { name: 'Ross 128', x: 650, y: 180, z: 300, color: 0xff7755, sz: 0.9 },
  { name: 'Procyon', x: -380, y: 420, z: -520, color: 0xfff0d0, sz: 3.2 },
  { name: 'Tau Ceti', x: 720, y: -350, z: -620, color: 0xffe8c0, sz: 1.8 },
  { name: 'Altair', x: -950, y: 220, z: 1150, color: 0xfff4e0, sz: 2.8 },
  { name: 'Vega', x: 1300, y: 850, z: -420, color: 0xd8e8ff, sz: 4.0 },
  { name: 'Fomalhaut', x: 1550, y: -620, z: 850, color: 0xe0f0ff, sz: 3.2 },
  { name: 'Pollux', x: -2100, y: 1250, z: -950, color: 0xffcc66, sz: 4.2 },
  { name: 'Arcturus', x: 2600, y: 650, z: 1900, color: 0xffaa44, sz: 5.0 },
  { name: 'Aldebaran', x: -3600, y: -1550, z: 2100, color: 0xff8833, sz: 5.5 },
  { name: 'Betelgeuse', x: 4600, y: 2100, z: -3100, color: 0xff4422, sz: 9.0 },
  { name: 'Rigel', x: -4900, y: -2600, z: -3600, color: 0xaaccff, sz: 8.0 },
  { name: 'Capella', x: 2800, y: -1800, z: 2200, color: 0xffe866, sz: 4.0 },
  { name: 'Deneb', x: -4200, y: 3400, z: 1500, color: 0xddeeFF, sz: 8.5 },
  { name: 'Spica', x: 3200, y: -2800, z: -2400, color: 0xccddff, sz: 5.5 },
  { name: 'Antares', x: -3800, y: 800, z: 3200, color: 0xff3322, sz: 7.0 },
];
const starSprites = [];
nearbyStarData.forEach((s) => {
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: circleTex, color: s.color, transparent: true, opacity: 0.9, depthWrite: false }));
  sprite.position.set(s.x, s.y, s.z);
  sprite.scale.setScalar(s.sz);
  sprite.userData.name = s.name;
  sprite.userData.flyDist = s.sz * 8;
  stellarGroup.add(sprite);
  starSprites.push(sprite);
  const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: circleTex, color: s.color, transparent: true, opacity: 0.15, depthWrite: false, blending: THREE.AdditiveBlending }));
  glow.position.set(s.x, s.y, s.z);
  glow.scale.setScalar(s.sz * 5);
  stellarGroup.add(glow);
});

// Background stars for stellar neighborhood -- flattened disk, not a sphere
const STELLAR_BG = 10000;
const stBgPos = new Float32Array(STELLAR_BG * 3);
const stBgCol = new Float32Array(STELLAR_BG * 3);
for (let i = 0; i < STELLAR_BG; i++) {
  const r = 400 + Math.random() * 5000;
  const th = Math.random() * Math.PI * 2;
  stBgPos[i * 3] = Math.cos(th) * r + (Math.random() - 0.5) * r * 0.3;
  stBgPos[i * 3 + 1] = (Math.random() - 0.5) * r * 0.15;
  stBgPos[i * 3 + 2] = Math.sin(th) * r + (Math.random() - 0.5) * r * 0.3;
  const t = Math.random();
  if (t < 0.35)      { stBgCol[i*3]=1.2; stBgCol[i*3+1]=0.7; stBgCol[i*3+2]=0.45; }
  else if (t < 0.55) { stBgCol[i*3]=0.7; stBgCol[i*3+1]=0.75; stBgCol[i*3+2]=1.3; }
  else if (t < 0.75) { stBgCol[i*3]=1.1; stBgCol[i*3+1]=1.0; stBgCol[i*3+2]=0.85; }
  else               { stBgCol[i*3]=0.9; stBgCol[i*3+1]=0.95; stBgCol[i*3+2]=1.2; }
}
const stBgGeo = new THREE.BufferGeometry();
stBgGeo.setAttribute('position', new THREE.BufferAttribute(stBgPos, 3));
stBgGeo.setAttribute('color', new THREE.BufferAttribute(stBgCol, 3));
const stellarPoints = new THREE.Points(stBgGeo, new THREE.PointsMaterial({
  map: circleTex, size: 1.5, sizeAttenuation: true, vertexColors: true, transparent: true, opacity: 0.8, depthWrite: false, blending: THREE.AdditiveBlending,
}));
stellarGroup.add(stellarPoints);

// Sun indicator at origin for stellar scale
const sunIndicator = new THREE.Sprite(new THREE.SpriteMaterial({ map: circleTex, color: 0xffee88, transparent: true, opacity: 0.9, depthWrite: false }));
sunIndicator.scale.setScalar(4);
stellarGroup.add(sunIndicator);
const sunIndGlow = new THREE.Sprite(new THREE.SpriteMaterial({ map: circleTex, color: 0xffee88, transparent: true, opacity: 0.2, depthWrite: false, blending: THREE.AdditiveBlending }));
sunIndGlow.scale.setScalar(16);
stellarGroup.add(sunIndGlow);

// --- Phase 3: Milky Way Galaxy (~10000-200000 units) ---
const galaxyGroup = new THREE.Group();
scene.add(galaxyGroup);

const GALAXY_OFFSET = new THREE.Vector3(50000, 2000, -30000);

// Procedural soft glow texture for nebulous clouds
const nebulaGlowTex = (() => {
  const c = document.createElement('canvas'); c.width = 256; c.height = 256;
  const ctx = c.getContext('2d');
  const g = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
  g.addColorStop(0, 'rgba(255,255,255,0.7)');
  g.addColorStop(0.15, 'rgba(255,255,255,0.4)');
  g.addColorStop(0.35, 'rgba(255,255,255,0.15)');
  g.addColorStop(0.6, 'rgba(255,255,255,0.04)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g; ctx.fillRect(0, 0, 256, 256);
  return new THREE.CanvasTexture(c);
})();

// Galaxy stars: smooth blending spiral with heavy inter-arm fill
const GALAXY_STARS_N = 300000;
const galPos = new Float32Array(GALAXY_STARS_N * 3);
const galCol = new Float32Array(GALAXY_STARS_N * 3);

for (let i = 0; i < GALAXY_STARS_N; i++) {
  const dist = Math.pow(Math.random(), 0.55) * 85000;
  const dr = dist / 85000;

  // Spiral arm structure with smooth blending
  const armIdx = i % 4;
  const armBase = armIdx * Math.PI * 0.5;
  const windFactor = 0.00006;
  const spiralAngle = armBase + dist * windFactor;
  // Gaussian-like scatter around the arm (tighter = more visible spiral)
  const armScatter = (Math.random() + Math.random() + Math.random() - 1.5) * (0.35 + dr * 0.25);
  // Some stars scattered between arms for smooth blending
  const isInterArm = Math.random() < 0.3;
  const angle = isInterArm
    ? Math.random() * Math.PI * 2
    : spiralAngle + armScatter;
  const spread = 1000 + dist * 0.04;
  const x = Math.cos(angle) * dist + (Math.random() - 0.5) * spread;
  const z = Math.sin(angle) * dist + (Math.random() - 0.5) * spread;
  const ySpread = 400 + dist * 0.004;
  const y = (Math.random() - 0.5) * ySpread * Math.exp(-dist / 50000);

  galPos[i * 3] = x + GALAXY_OFFSET.x;
  galPos[i * 3 + 1] = y + GALAXY_OFFSET.y;
  galPos[i * 3 + 2] = z + GALAXY_OFFSET.z;

  // Arm proximity for color weighting
  let minArmDist = 999;
  for (let a = 0; a < 4; a++) {
    const aAngle = a * Math.PI * 0.5 + dist * 0.00005;
    let diff = Math.abs(angle - aAngle) % (Math.PI * 2);
    if (diff > Math.PI) diff = Math.PI * 2 - diff;
    minArmDist = Math.min(minArmDist, diff);
  }
  const onArm = minArmDist < 0.4;

  if (dr < 0.06) {
    // Blazing white-yellow core
    const b = 1.0 + Math.random() * 0.4;
    galCol[i*3]=1.8*b; galCol[i*3+1]=1.6*b; galCol[i*3+2]=1.1*b;
  } else if (dr < 0.18) {
    // Warm gold-orange-pink transition
    const b = 0.8 + Math.random() * 0.4;
    const pick = Math.random();
    if (pick < 0.35) { galCol[i*3]=1.8*b; galCol[i*3+1]=1.2*b; galCol[i*3+2]=0.7*b; }
    else if (pick < 0.55) { galCol[i*3]=1.6*b; galCol[i*3+1]=0.7*b; galCol[i*3+2]=0.9*b; }
    else if (pick < 0.75) { galCol[i*3]=1.5*b; galCol[i*3+1]=1.0*b; galCol[i*3+2]=0.6*b; }
    else { galCol[i*3]=1.4*b; galCol[i*3+1]=0.8*b; galCol[i*3+2]=1.1*b; }
  } else {
    const pick = Math.random();
    if (onArm && pick < 0.22) {
      // Electric blue
      const b = 0.8 + Math.random() * 0.5;
      galCol[i*3]=0.3*b; galCol[i*3+1]=0.5*b; galCol[i*3+2]=2.0*b;
    } else if (onArm && pick < 0.38) {
      // Intense purple
      const b = 0.7 + Math.random() * 0.5;
      galCol[i*3]=0.9*b; galCol[i*3+1]=0.2*b; galCol[i*3+2]=1.8*b;
    } else if (onArm && pick < 0.50) {
      // Hot magenta / neon pink
      const b = 0.7 + Math.random() * 0.5;
      galCol[i*3]=1.8*b; galCol[i*3+1]=0.2*b; galCol[i*3+2]=1.2*b;
    } else if (onArm && pick < 0.58) {
      // Bright cyan
      const b = 0.6 + Math.random() * 0.5;
      galCol[i*3]=0.3*b; galCol[i*3+1]=1.2*b; galCol[i*3+2]=1.8*b;
    } else if (pick < 0.70) {
      // Rich blue-white
      const b = 0.6 + Math.random() * 0.5;
      galCol[i*3]=0.8*b; galCol[i*3+1]=0.85*b; galCol[i*3+2]=1.6*b;
    } else if (pick < 0.80) {
      // Warm rose
      const b = 0.5 + Math.random() * 0.4;
      galCol[i*3]=1.5*b; galCol[i*3+1]=0.6*b; galCol[i*3+2]=0.9*b;
    } else if (pick < 0.90) {
      // Deep indigo
      const b = 0.4 + Math.random() * 0.4;
      galCol[i*3]=0.5*b; galCol[i*3+1]=0.3*b; galCol[i*3+2]=1.5*b;
    } else {
      // Vivid lavender-pink
      const b = 0.5 + Math.random() * 0.4;
      galCol[i*3]=1.2*b; galCol[i*3+1]=0.6*b; galCol[i*3+2]=1.6*b;
    }
  }
}
const galGeo = new THREE.BufferGeometry();
galGeo.setAttribute('position', new THREE.BufferAttribute(galPos, 3));
galGeo.setAttribute('color', new THREE.BufferAttribute(galCol, 3));
const galaxyPoints = new THREE.Points(galGeo, new THREE.PointsMaterial({
  map: circleTex, size: 30, sizeAttenuation: true, vertexColors: true, transparent: true, opacity: 0.95, depthWrite: false, blending: THREE.AdditiveBlending,
}));
galaxyGroup.add(galaxyPoints);

// Large nebulous glow sprites blanketing spiral arms for smooth blended look
const armGlowColors = [
  0x4466ff, 0x7733dd, 0xaa33cc, 0x3355ff, 0xff2288,
  0x5588ff, 0x9933bb, 0x4499ff, 0xdd2299, 0x7755ee,
  0x3399ff, 0xbb33aa, 0x6666ff, 0xff3399, 0x5577ee,
  0x2266dd, 0xcc44bb, 0x8844dd, 0xff44aa, 0x4488ff,
];
for (let i = 0; i < 150; i++) {
  const arm = (i % 4) * Math.PI * 0.5;
  const dist = 3000 + Math.pow(Math.random(), 0.45) * 80000;
  const spiral = arm + dist * 0.00006 + (Math.random() - 0.5) * 0.4;
  const spread = 2000 + dist * 0.04;
  const x = Math.cos(spiral) * dist + (Math.random() - 0.5) * spread;
  const z = Math.sin(spiral) * dist + (Math.random() - 0.5) * spread;
  const y = (Math.random() - 0.5) * 300 * Math.exp(-dist / 50000);

  const sp = new THREE.Sprite(new THREE.SpriteMaterial({
    map: nebulaGlowTex,
    color: armGlowColors[i % armGlowColors.length],
    transparent: true,
    opacity: 0.10 + Math.random() * 0.12,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  }));
  sp.position.set(x + GALAXY_OFFSET.x, y + GALAXY_OFFSET.y, z + GALAXY_OFFSET.z);
  sp.scale.setScalar(5000 + Math.random() * 12000);
  galaxyGroup.add(sp);
}

// Extra-large diffuse nebulosity for smooth color blending between arms
for (let i = 0; i < 60; i++) {
  const dist = 5000 + Math.random() * 75000;
  const angle = Math.random() * Math.PI * 2;
  const x = Math.cos(angle) * dist + (Math.random() - 0.5) * 10000;
  const z = Math.sin(angle) * dist + (Math.random() - 0.5) * 10000;
  const y = (Math.random() - 0.5) * 400;
  const cols = [0x3344cc, 0x6633aa, 0x9922aa, 0x4455dd, 0xaa3388, 0x5544bb, 0x7733cc, 0x2255cc];
  const sp = new THREE.Sprite(new THREE.SpriteMaterial({
    map: nebulaGlowTex,
    color: cols[i % cols.length],
    transparent: true,
    opacity: 0.04 + Math.random() * 0.06,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  }));
  sp.position.set(x + GALAXY_OFFSET.x, y + GALAXY_OFFSET.y, z + GALAXY_OFFSET.z);
  sp.scale.setScalar(10000 + Math.random() * 20000);
  galaxyGroup.add(sp);
}

// Bright pink/magenta HII star-forming knots
for (let i = 0; i < 50; i++) {
  const arm = (i % 4) * Math.PI * 0.5;
  const dist = 6000 + Math.pow(Math.random(), 0.6) * 65000;
  const spiral = arm + dist * 0.00006 + (Math.random() - 0.5) * 0.25;
  const x = Math.cos(spiral) * dist + (Math.random() - 0.5) * 1500;
  const z = Math.sin(spiral) * dist + (Math.random() - 0.5) * 2500;
  const y = (Math.random() - 0.5) * 150;
  const pick = Math.random();
  const col = pick < 0.3 ? 0xff1188 : pick < 0.5 ? 0xff44aa : pick < 0.7 ? 0xee33cc : 0xff66bb;
  const sp = new THREE.Sprite(new THREE.SpriteMaterial({
    map: nebulaGlowTex, color: col,
    transparent: true, opacity: 0.12 + Math.random() * 0.10,
    depthWrite: false, blending: THREE.AdditiveBlending,
  }));
  sp.position.set(x + GALAXY_OFFSET.x, y + GALAXY_OFFSET.y, z + GALAXY_OFFSET.z);
  sp.scale.setScalar(2000 + Math.random() * 6000);
  galaxyGroup.add(sp);
}

// Dust lanes along inner edges of spiral arms
const DUST_LANE_N = 40000;
const dlPos = new Float32Array(DUST_LANE_N * 3);
const dlCol = new Float32Array(DUST_LANE_N * 3);
for (let i = 0; i < DUST_LANE_N; i++) {
  const arm = (i % 4) * Math.PI * 0.5;
  const dist = 2000 + Math.pow(Math.random(), 0.5) * 55000;
  const spiral = arm + dist * 0.00006 + 0.12;
  const spread = 800 + dist * 0.025;
  const x = Math.cos(spiral) * dist + (Math.random() - 0.5) * spread;
  const z = Math.sin(spiral) * dist + (Math.random() - 0.5) * spread;
  const y = (Math.random() - 0.5) * 150 * Math.exp(-dist / 40000);
  dlPos[i * 3] = x + GALAXY_OFFSET.x;
  dlPos[i * 3 + 1] = y + GALAXY_OFFSET.y;
  dlPos[i * 3 + 2] = z + GALAXY_OFFSET.z;
  const shade = 0.01 + Math.random() * 0.02;
  dlCol[i * 3] = shade * 0.5; dlCol[i * 3 + 1] = shade * 0.3; dlCol[i * 3 + 2] = shade * 0.7;
}
const dlGeo = new THREE.BufferGeometry();
dlGeo.setAttribute('position', new THREE.BufferAttribute(dlPos, 3));
dlGeo.setAttribute('color', new THREE.BufferAttribute(dlCol, 3));
galaxyGroup.add(new THREE.Points(dlGeo, new THREE.PointsMaterial({
  map: circleTex, size: 60, sizeAttenuation: true, vertexColors: true, transparent: true, opacity: 0.2, depthWrite: false,
})));

// Galactic halo -- vivid multi-color layers
const haloLayers = [
  { color: 0xfff4dd, opacity: 0.18, scale: 90000 },
  { color: 0xffbb88, opacity: 0.12, scale: 120000 },
  { color: 0xdd88cc, opacity: 0.08, scale: 160000 },
  { color: 0x8855cc, opacity: 0.06, scale: 210000 },
  { color: 0x5533bb, opacity: 0.04, scale: 280000 },
  { color: 0x332288, opacity: 0.025, scale: 360000 },
  { color: 0x221166, opacity: 0.015, scale: 440000 },
];
haloLayers.forEach(h => {
  const sp = new THREE.Sprite(new THREE.SpriteMaterial({
    map: nebulaGlowTex, color: h.color, transparent: true, opacity: h.opacity, depthWrite: false, blending: THREE.AdditiveBlending,
  }));
  sp.position.copy(GALAXY_OFFSET);
  sp.scale.setScalar(h.scale);
  galaxyGroup.add(sp);
});
// Central bulge -- OVAL shape (elongated bar), not a sphere
const BULGE_N = 40000;
const bulgePos = new Float32Array(BULGE_N * 3);
const bulgeCol = new Float32Array(BULGE_N * 3);
const BAR_ANGLE = 0.45;
const cosBar = Math.cos(BAR_ANGLE), sinBar = Math.sin(BAR_ANGLE);
for (let i = 0; i < BULGE_N; i++) {
  // Smooth ellipsoidal distribution using spherical coords (no rectangular edges)
  const th = Math.random() * Math.PI * 2;
  const ph = Math.acos(2 * Math.random() - 1);
  const r = Math.pow(Math.random(), 0.5);
  const ex = r * Math.sin(ph) * Math.cos(th) * 12000;
  const ez = r * Math.sin(ph) * Math.sin(th) * 5000;
  const ey = r * Math.cos(ph) * 1200;
  // Rotate bar
  const bx = ex * cosBar - ez * sinBar;
  const bz = ex * sinBar + ez * cosBar;
  bulgePos[i*3] = bx + GALAXY_OFFSET.x;
  bulgePos[i*3+1] = ey + GALAXY_OFFSET.y;
  bulgePos[i*3+2] = bz + GALAXY_OFFSET.z;
  const dr = Math.sqrt(bx*bx + bz*bz) / 12000;
  if (dr < 0.2) {
    const b = 1.0 + Math.random() * 0.5;
    bulgeCol[i*3]=2.0*b; bulgeCol[i*3+1]=1.8*b; bulgeCol[i*3+2]=1.2*b;
  } else if (dr < 0.5) {
    const b = 0.8 + Math.random() * 0.4;
    bulgeCol[i*3]=1.8*b; bulgeCol[i*3+1]=1.3*b; bulgeCol[i*3+2]=0.7*b;
  } else {
    const b = 0.6 + Math.random() * 0.4;
    const pick = Math.random();
    if (pick < 0.4) { bulgeCol[i*3]=1.5*b; bulgeCol[i*3+1]=0.8*b; bulgeCol[i*3+2]=0.9*b; }
    else { bulgeCol[i*3]=1.4*b; bulgeCol[i*3+1]=1.1*b; bulgeCol[i*3+2]=0.7*b; }
  }
}
const bulgeGeo = new THREE.BufferGeometry();
bulgeGeo.setAttribute('position', new THREE.BufferAttribute(bulgePos, 3));
bulgeGeo.setAttribute('color', new THREE.BufferAttribute(bulgeCol, 3));
galaxyGroup.add(new THREE.Points(bulgeGeo, new THREE.PointsMaterial({
  map: circleTex, size: 40, sizeAttenuation: true, vertexColors: true, transparent: true, opacity: 0.9, depthWrite: false, blending: THREE.AdditiveBlending,
})));

// Sagittarius A* -- large, bright, dramatic black hole
const sgrA = new THREE.Mesh(
  new THREE.SphereGeometry(2000, 64, 64),
  new THREE.MeshBasicMaterial({ color: 0x000000 })
);
sgrA.position.copy(GALAXY_OFFSET);
galaxyGroup.add(sgrA);

// Bright photon ring
const photonRingGeo = new THREE.TorusGeometry(2500, 120, 24, 128);
const photonRingMat = new THREE.MeshBasicMaterial({ color: 0xffcc55, transparent: true, opacity: 0.7, depthWrite: false, blending: THREE.AdditiveBlending });
const photonRing = new THREE.Mesh(photonRingGeo, photonRingMat);
photonRing.position.copy(GALAXY_OFFSET);
photonRing.rotation.x = Math.PI * 0.45;
galaxyGroup.add(photonRing);

// Inner hot photon ring
const photonRing2Geo = new THREE.TorusGeometry(2200, 60, 16, 128);
const photonRing2Mat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.5, depthWrite: false, blending: THREE.AdditiveBlending });
const photonRing2 = new THREE.Mesh(photonRing2Geo, photonRing2Mat);
photonRing2.position.copy(GALAXY_OFFSET);
photonRing2.rotation.x = Math.PI * 0.45;
galaxyGroup.add(photonRing2);

// Multi-layer accretion disk -- wide, elongated, bright
const makeAccTex = (hotness) => {
  const c = document.createElement('canvas'); c.width = 512; c.height = 128;
  const cx = c.getContext('2d');
  for (let y = 0; y < 128; y++) {
    const t = y / 127;
    const band = Math.sin(t * Math.PI);
    for (let x = 0; x < 512; x++) {
      const u = x / 511;
      const inner = 1 - t;
      const swirl = Math.sin(u * 40 + t * 8) * 0.15 + Math.sin(u * 80 - t * 12) * 0.08;
      const r = Math.min(255, Math.floor(255 * (0.4 + inner * 0.6 + swirl) * hotness));
      const g = Math.min(255, Math.floor((160 * inner * inner + 60 + swirl * 80) * hotness));
      const b = Math.min(255, Math.floor((120 * inner * inner * inner + 40 + swirl * 50) * hotness));
      const a = Math.floor(255 * (0.15 + 0.7 * band) * (0.8 + swirl));
      cx.fillStyle = `rgba(${r},${g},${b},${a / 255})`;
      cx.fillRect(x, y, 1, 1);
    }
  }
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = THREE.RepeatWrapping;
  return tex;
};

// Primary accretion disk -- wide
const accDiskTex = makeAccTex(1.0);
const accretionGeo = new THREE.RingGeometry(2400, 10000, 128);
const accretionMat = new THREE.MeshBasicMaterial({
  map: accDiskTex, transparent: true, opacity: 0.7, side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending,
});
const accretion = new THREE.Mesh(accretionGeo, accretionMat);
accretion.position.copy(GALAXY_OFFSET);
accretion.rotation.x = Math.PI * 0.45;
galaxyGroup.add(accretion);

// Hot inner accretion layer
const accInnerTex = makeAccTex(1.3);
const accInner = new THREE.Mesh(
  new THREE.RingGeometry(2200, 6000, 128),
  new THREE.MeshBasicMaterial({ map: accInnerTex, transparent: true, opacity: 0.8, side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending })
);
accInner.position.copy(GALAXY_OFFSET);
accInner.rotation.x = Math.PI * 0.45;
galaxyGroup.add(accInner);

// Outer diffuse glow layer
const acc2 = new THREE.Mesh(
  new THREE.RingGeometry(2000, 12000, 64),
  new THREE.MeshBasicMaterial({ color: 0xff6633, transparent: true, opacity: 0.15, side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending })
);
acc2.position.copy(GALAXY_OFFSET);
acc2.rotation.x = Math.PI * 0.45;
galaxyGroup.add(acc2);

// Third swirling layer at slight offset angle
const acc3 = new THREE.Mesh(
  new THREE.RingGeometry(2600, 8000, 64),
  new THREE.MeshBasicMaterial({ map: accDiskTex, transparent: true, opacity: 0.3, side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending })
);
acc3.position.copy(GALAXY_OFFSET);
acc3.rotation.x = Math.PI * 0.45 + 0.15;
acc3.rotation.y = 0.2;
galaxyGroup.add(acc3);

// Bright glow around the black hole
const bhGlow = new THREE.Sprite(new THREE.SpriteMaterial({ map: nebulaGlowTex, color: 0xffaa44, transparent: true, opacity: 0.35, depthWrite: false, blending: THREE.AdditiveBlending }));
bhGlow.position.copy(GALAXY_OFFSET);
bhGlow.scale.setScalar(12000);
bhGlow.userData.name = 'Sagittarius A*';
bhGlow.userData.flyDist = 15000;
galaxyGroup.add(bhGlow);

// Inner hot white glow
const bhGlow2 = new THREE.Sprite(new THREE.SpriteMaterial({ map: nebulaGlowTex, color: 0xffeedd, transparent: true, opacity: 0.2, depthWrite: false, blending: THREE.AdditiveBlending }));
bhGlow2.position.copy(GALAXY_OFFSET);
bhGlow2.scale.setScalar(6000);
galaxyGroup.add(bhGlow2);

// Nebulae -- hyper-realistic procedural canvas textures on layered geometry
function makeNebulaTex(colors, seed, variant) {
  const S = 1024;
  const c = document.createElement('canvas'); c.width = S; c.height = S;
  const cx = c.getContext('2d');
  cx.clearRect(0, 0, S, S);
  const rng = (s) => { s = Math.sin(s * 9301.7 + 49297.3) % 233280; return Math.abs(s / 233280); };
  let si = seed;
  const clamp = (v) => Math.max(0, Math.min(255, Math.floor(v)));
  const shiftCol = (col, amt) => [clamp(col[0] + amt), clamp(col[1] + amt), clamp(col[2] + amt)];
  const mixCol = (a, b, t) => [clamp(a[0]*(1-t)+b[0]*t), clamp(a[1]*(1-t)+b[1]*t), clamp(a[2]*(1-t)+b[2]*t)];

  // Base diffuse glow -- large soft color zones
  for (let i = 0; i < 120; i++) {
    si += 1.3;
    const col = colors[Math.floor(rng(si * 1.1) * colors.length)];
    const shift = (rng(si * 1.5) - 0.5) * 40;
    const rc = shiftCol(col, shift);
    const bx = S * 0.1 + rng(si * 2.3) * S * 0.8;
    const by = S * 0.1 + rng(si * 3.7) * S * 0.8;
    const br = S * (0.15 + rng(si * 4.1) * 0.35);
    const dx = bx - S/2, dy = by - S/2;
    const dist = Math.sqrt(dx*dx+dy*dy) / (S*0.5);
    const fade = Math.max(0, 1 - dist * dist * 0.8);
    const alpha = (0.02 + rng(si * 5.3) * 0.05) * fade;
    const grad = cx.createRadialGradient(bx, by, 0, bx, by, br);
    grad.addColorStop(0, `rgba(${rc[0]},${rc[1]},${rc[2]},${alpha})`);
    grad.addColorStop(0.3, `rgba(${rc[0]},${rc[1]},${rc[2]},${alpha*0.6})`);
    grad.addColorStop(0.7, `rgba(${rc[0]},${rc[1]},${rc[2]},${alpha*0.2})`);
    grad.addColorStop(1, `rgba(${rc[0]},${rc[1]},${rc[2]},0)`);
    cx.fillStyle = grad;
    cx.fillRect(0, 0, S, S);
  }

  // Dense gas knots -- concentrated color patches
  for (let i = 0; i < 600; i++) {
    si += 1.7;
    const col = colors[Math.floor(rng(si * 1.1) * colors.length)];
    const col2 = colors[Math.floor(rng(si * 1.9) * colors.length)];
    const t = rng(si * 2.0);
    const rc = mixCol(col, col2, t);
    const shift = (rng(si * 2.2) - 0.5) * 50;
    const fc = shiftCol(rc, shift);
    const bx = S * 0.08 + rng(si * 2.3) * S * 0.84;
    const by = S * 0.08 + rng(si * 3.7) * S * 0.84;
    const br = S * (0.02 + rng(si * 4.1) * 0.14);
    const dx = bx - S/2, dy = by - S/2;
    const dist = Math.sqrt(dx*dx+dy*dy) / (S*0.5);
    const fade = Math.max(0, 1 - dist * dist * 0.7);
    const alpha = (0.03 + rng(si * 5.3) * 0.09) * fade;
    const grad = cx.createRadialGradient(bx, by, 0, bx, by, br);
    grad.addColorStop(0, `rgba(${fc[0]},${fc[1]},${fc[2]},${alpha})`);
    grad.addColorStop(0.5, `rgba(${fc[0]},${fc[1]},${fc[2]},${alpha*0.4})`);
    grad.addColorStop(1, `rgba(${fc[0]},${fc[1]},${fc[2]},0)`);
    cx.fillStyle = grad;
    cx.fillRect(0, 0, S, S);
  }

  // Dark absorption lanes -- real nebulae have dark dust bands
  cx.globalCompositeOperation = 'destination-out';
  for (let i = 0; i < 15 + variant % 10; i++) {
    si += 3.1;
    cx.beginPath();
    const sx = rng(si * 2.7) * S, sy = rng(si * 3.9) * S;
    cx.moveTo(sx, sy);
    for (let j = 0; j < 4; j++) {
      si += 0.7;
      const cpx = sx + (rng(si * 4.1) - 0.5) * S * 0.8;
      const cpy = sy + (rng(si * 5.1) - 0.5) * S * 0.8;
      cx.quadraticCurveTo(cpx, cpy, rng(si * 6.1) * S, rng(si * 7.1) * S);
    }
    cx.lineWidth = 3 + rng(si * 8.1) * 18;
    cx.strokeStyle = `rgba(0,0,0,${0.08 + rng(si * 9.1) * 0.15})`;
    cx.stroke();
  }
  cx.globalCompositeOperation = 'source-over';

  // Glowing filament wisps
  cx.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 50; i++) {
    si += 2.3;
    const col = colors[Math.floor(rng(si * 1.5) * colors.length)];
    const bright = shiftCol(col, 30 + rng(si * 1.8) * 40);
    cx.beginPath();
    const sx = rng(si * 2.7) * S, sy = rng(si * 3.9) * S;
    cx.moveTo(sx, sy);
    const cp1x = sx + (rng(si * 4.1) - 0.5) * S * 0.7;
    const cp1y = sy + (rng(si * 5.1) - 0.5) * S * 0.7;
    const cp2x = sx + (rng(si * 6.1) - 0.5) * S * 0.7;
    const cp2y = sy + (rng(si * 7.1) - 0.5) * S * 0.7;
    cx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, rng(si * 8.1) * S, rng(si * 9.1) * S);
    cx.lineWidth = 1 + rng(si * 10.1) * 8;
    cx.strokeStyle = `rgba(${bright[0]},${bright[1]},${bright[2]},${0.02 + rng(si * 11.1) * 0.06})`;
    cx.shadowColor = `rgba(${bright[0]},${bright[1]},${bright[2]},0.4)`;
    cx.shadowBlur = 15 + rng(si * 12.1) * 40;
    cx.stroke();
  }
  cx.shadowBlur = 0;

  // Hot bright core region
  for (let i = 0; i < 80; i++) {
    si += 0.9;
    const col = colors[Math.floor(rng(si * 1.3) * colors.length)];
    const hot = shiftCol(col, 80 + rng(si * 1.7) * 60);
    const bx = S/2 + (rng(si * 2.1) - 0.5) * S * 0.3;
    const by = S/2 + (rng(si * 3.1) - 0.5) * S * 0.3;
    const br = S * (0.02 + rng(si * 4.3) * 0.08);
    const alpha = 0.04 + rng(si * 5.7) * 0.08;
    const grad = cx.createRadialGradient(bx, by, 0, bx, by, br);
    grad.addColorStop(0, `rgba(${hot[0]},${hot[1]},${hot[2]},${alpha})`);
    grad.addColorStop(1, `rgba(${hot[0]},${hot[1]},${hot[2]},0)`);
    cx.fillStyle = grad;
    cx.fillRect(0, 0, S, S);
  }

  // Embedded stars -- tiny bright white/blue points
  for (let i = 0; i < 40; i++) {
    si += 0.6;
    const sx = S * 0.15 + rng(si * 1.1) * S * 0.7;
    const sy = S * 0.15 + rng(si * 2.1) * S * 0.7;
    const sr = 1 + rng(si * 3.1) * 3;
    const dx = sx - S/2, dy = sy - S/2;
    const dist = Math.sqrt(dx*dx + dy*dy) / (S * 0.5);
    if (dist > 0.85) continue;
    const grad = cx.createRadialGradient(sx, sy, 0, sx, sy, sr * 4);
    grad.addColorStop(0, `rgba(255,255,255,${0.15 + rng(si * 4.1) * 0.2})`);
    grad.addColorStop(0.2, `rgba(200,220,255,${0.08})`);
    grad.addColorStop(1, 'rgba(200,220,255,0)');
    cx.fillStyle = grad;
    cx.fillRect(0, 0, S, S);
  }

  cx.globalCompositeOperation = 'source-over';
  return new THREE.CanvasTexture(c);
}

const nebulaDefs = [
  { name: 'Orion Nebula',     off: [18000, 1200, 12000],  sz: 8000,
    colors: [[255,70,100], [200,60,180], [80,120,255], [255,180,120], [240,130,200], [120,80,220]] },
  { name: 'Eagle Nebula',     off: [8000, -800, 20000],   sz: 7000,
    colors: [[100,180,80], [220,170,40], [60,130,200], [160,200,60], [255,220,100], [80,160,120]] },
  { name: 'Crab Nebula',      off: [-12000, 3000, -8000], sz: 5000,
    colors: [[30,200,220], [240,160,30], [160,230,60], [80,160,230], [220,90,40], [60,220,180]] },
  { name: 'Carina Nebula',    off: [25000, -500, -15000], sz: 10000,
    colors: [[255,80,140], [220,60,200], [80,100,255], [255,160,80], [200,120,230], [255,200,160]] },
  { name: 'Pillars of Creation', off: [8500, -600, 20500], sz: 4000,
    colors: [[80,120,60], [200,150,40], [50,90,150], [120,100,50], [180,160,80], [60,80,40]] },
  { name: 'Ring Nebula',      off: [-5000, 4000, 10000],  sz: 3000,
    colors: [[40,200,140], [60,100,230], [220,60,60], [80,230,120], [140,160,230], [200,180,100]] },
  { name: 'Helix Nebula',     off: [-3000, -2000, -5000], sz: 5600,
    colors: [[40,160,250], [220,50,50], [250,180,60], [80,210,160], [200,100,200], [60,120,200]] },
  { name: 'Rosette Nebula',   off: [30000, 2000, 5000],   sz: 9000,
    colors: [[255,50,80], [240,40,140], [120,80,230], [255,100,140], [220,60,180], [180,60,100]] },
];
const nebulaSprites = [];

nebulaDefs.forEach((nd, idx) => {
  const npx = nd.off[0] + GALAXY_OFFSET.x;
  const npy = nd.off[1] + GALAXY_OFFSET.y;
  const npz = nd.off[2] + GALAXY_OFFSET.z;
  const rng = (s) => { s = Math.sin(s * 9301.7 + 49297.3) % 233280; return Math.abs(s / 233280); };
  let si = idx * 9999 + 42;

  const nebGroup = new THREE.Group();
  nebGroup.position.set(npx, npy, npz);
  galaxyGroup.add(nebGroup);

  const planeGeo = new THREE.PlaneGeometry(1, 1);
  const LAYERS = 14;
  for (let L = 0; L < LAYERS; L++) {
    si += 7.3;
    const tex = makeNebulaTex(nd.colors, si + L * 1337, L);
    const isOuter = L >= LAYERS - 4;
    const mat = new THREE.MeshBasicMaterial({
      map: tex, transparent: true, opacity: isOuter ? 0.2 : 0.3,
      side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending,
    });
    const mesh = new THREE.Mesh(planeGeo, mat);
    const sizeVar = isOuter ? (1.0 + rng(si * 1.1 + L) * 0.6) : (0.6 + rng(si * 1.1 + L) * 0.5);
    const scale = nd.sz * sizeVar;
    mesh.scale.set(scale * (0.85 + rng(si * 1.5 + L) * 0.3), scale * (0.85 + rng(si * 1.7 + L) * 0.3), 1);
    mesh.rotation.x = rng(si * 2.1 + L) * Math.PI;
    mesh.rotation.y = rng(si * 3.3 + L) * Math.PI;
    mesh.rotation.z = rng(si * 4.7 + L) * Math.PI;
    const offset = nd.sz * 0.06;
    mesh.position.set(
      (rng(si * 5.1 + L) - 0.5) * offset,
      (rng(si * 6.3 + L) - 0.5) * offset,
      (rng(si * 7.7 + L) - 0.5) * offset
    );
    nebGroup.add(mesh);
  }

  // Clickable hit sprite
  const hitSprite = new THREE.Sprite(new THREE.SpriteMaterial({
    map: circleTex, transparent: true, opacity: 0.001, depthWrite: false,
  }));
  hitSprite.scale.setScalar(nd.sz * 1.5);
  hitSprite.userData.name = nd.name;
  hitSprite.userData.flyDist = nd.sz * 3;
  nebGroup.add(hitSprite);
  nebulaSprites.push(hitSprite);
});

// "You Are Here" marker in the galaxy
const yahSprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: circleTex, color: 0x44ff66, transparent: true, opacity: 0.8, depthWrite: false }));
yahSprite.scale.setScalar(800);
galaxyGroup.add(yahSprite);
const yahGlow = new THREE.Sprite(new THREE.SpriteMaterial({ map: circleTex, color: 0x44ff66, transparent: true, opacity: 0.15, depthWrite: false, blending: THREE.AdditiveBlending }));
yahGlow.scale.setScalar(3000);
galaxyGroup.add(yahGlow);

// Milky Way galaxy label sprite (clickable at galactic scale)
const mwLabelSprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: circleTex, color: 0xffeedd, transparent: true, opacity: 0.5, depthWrite: false, blending: THREE.AdditiveBlending }));
mwLabelSprite.position.copy(GALAXY_OFFSET).add(new THREE.Vector3(0, 12000, 0));
mwLabelSprite.scale.setScalar(8000);
mwLabelSprite.userData.name = 'Milky Way Galaxy';
mwLabelSprite.userData.flyDist = 80000;
galaxyGroup.add(mwLabelSprite);

// --- Phase 4: Local Group (~300000-2000000 units) ---
const localGroupGroup = new THREE.Group();
scene.add(localGroupGroup);

// type: 'spiral' = blue arms + yellow core, 'irregular' = blue/pink mixed, 'elliptical' = red/yellow, 'dwarf' = faint mixed
const galaxyDefs = [
  { name: 'Andromeda (M31)',       x: 500000, y: 50000, z: -300000,  sz: 60000, particles: 40000, type: 'spiral' },
  { name: 'Triangulum (M33)',      x: -350000, y: -80000, z: 450000, sz: 25000, particles: 15000, type: 'spiral' },
  { name: 'Large Magellanic Cloud', x: 120000, y: -200000, z: 180000, sz: 15000, particles: 10000, type: 'irregular' },
  { name: 'Small Magellanic Cloud', x: 150000, y: -220000, z: 220000, sz: 8000,  particles: 5000,  type: 'irregular' },
  { name: 'NGC 185',   x: 480000, y: 100000, z: -250000,  sz: 5000, particles: 2000, type: 'elliptical' },
  { name: 'NGC 147',   x: 520000, y: 120000, z: -280000,  sz: 4000, particles: 1500, type: 'elliptical' },
  { name: 'IC 10',     x: 400000, y: 180000, z: -400000,  sz: 5000, particles: 2000, type: 'irregular' },
  { name: 'Leo I',     x: -600000, y: 300000, z: -200000,  sz: 3000, particles: 1000, type: 'dwarf' },
  { name: 'Leo II',    x: -650000, y: 280000, z: -180000,  sz: 2500, particles: 800,  type: 'dwarf' },
  { name: 'Sagittarius Dwarf',     x: -40000, y: -60000, z: 80000, sz: 8000, particles: 3000, type: 'dwarf' },
  { name: 'Ursa Minor Dwarf',      x: -250000, y: 400000, z: 100000, sz: 3000, particles: 1000, type: 'dwarf' },
  { name: 'Draco Dwarf',           x: -300000, y: 350000, z: -150000, sz: 3000, particles: 1000, type: 'dwarf' },
  { name: 'Carina Dwarf',          x: 200000, y: -350000, z: -100000, sz: 2000, particles: 800,  type: 'dwarf' },
  { name: 'Sextans Dwarf',         x: -400000, y: -200000, z: 350000, sz: 2500, particles: 800,  type: 'dwarf' },
  { name: 'Sculptor Dwarf',        x: 180000, y: -300000, z: -250000, sz: 2500, particles: 800,  type: 'dwarf' },
  { name: 'Fornax Dwarf',          x: 280000, y: -400000, z: 100000,  sz: 3500, particles: 1200, type: 'dwarf' },
  { name: 'Tucana Dwarf',          x: -500000, y: -350000, z: 400000, sz: 2000, particles: 600,  type: 'dwarf' },
  { name: 'Phoenix Dwarf',         x: 350000, y: -450000, z: -350000, sz: 2000, particles: 600,  type: 'dwarf' },
  { name: 'NGC 6822',              x: -300000, y: -100000, z: 500000, sz: 6000, particles: 2500, type: 'irregular' },
  { name: 'M32',                   x: 490000, y: 60000, z: -290000,   sz: 4000, particles: 2000, type: 'elliptical' },
  { name: 'Pegasus Dwarf',         x: -700000, y: 200000, z: -500000, sz: 2000, particles: 600,  type: 'dwarf' },
  { name: 'Wolf-Lundmark-Melotte', x: -800000, y: -300000, z: 600000, sz: 4000, particles: 1500, type: 'irregular' },
  { name: 'Aquarius Dwarf',        x: 600000, y: -500000, z: 300000,  sz: 2000, particles: 600,  type: 'dwarf' },
  { name: 'IC 1613',               x: -750000, y: 100000, z: -600000, sz: 5000, particles: 2000, type: 'irregular' },
];
function galaxyParticleColor(type, distRatio) {
  if (type === 'spiral') {
    if (distRatio < 0.15) return [1.0, 0.85 + Math.random() * 0.1, 0.4 + Math.random() * 0.2];
    if (Math.random() < 0.3) return [0.4 + Math.random() * 0.2, 0.5 + Math.random() * 0.3, 1.0];
    if (Math.random() < 0.1) return [1.0, 0.3 + Math.random() * 0.2, 0.5 + Math.random() * 0.2];
    return [0.7 + Math.random() * 0.3, 0.8 + Math.random() * 0.2, 0.9 + Math.random() * 0.1];
  }
  if (type === 'irregular') {
    const pick = Math.random();
    if (pick < 0.35) return [0.4 + Math.random() * 0.3, 0.6 + Math.random() * 0.2, 1.0];
    if (pick < 0.5) return [1.0, 0.4 + Math.random() * 0.3, 0.6 + Math.random() * 0.2];
    return [0.8 + Math.random() * 0.2, 0.75 + Math.random() * 0.2, 0.9 + Math.random() * 0.1];
  }
  if (type === 'elliptical') {
    return [1.0, 0.7 + Math.random() * 0.2, 0.3 + Math.random() * 0.25];
  }
  const v = 0.5 + Math.random() * 0.4;
  return [v * 0.9 + Math.random() * 0.1, v * 0.85 + Math.random() * 0.15, v * 0.8 + Math.random() * 0.2];
}
const galaxySprites = [];
galaxyDefs.forEach((gd) => {
  const gPos = new Float32Array(gd.particles * 3);
  const gCol = new Float32Array(gd.particles * 3);
  for (let i = 0; i < gd.particles; i++) {
    const r = Math.pow(Math.random(), 0.7) * gd.sz;
    const th = Math.random() * Math.PI * 2;
    const ph = Math.acos(2 * Math.random() - 1);
    const flat = gd.type === 'spiral' ? 0.12 : (gd.type === 'elliptical' ? 0.6 : (gd.type === 'irregular' ? 0.35 : 0.5));
    gPos[i*3] = gd.x + r * Math.sin(ph) * Math.cos(th);
    gPos[i*3+1] = gd.y + r * Math.sin(ph) * Math.sin(th) * flat;
    gPos[i*3+2] = gd.z + r * Math.cos(ph);
    const rgb = galaxyParticleColor(gd.type, r / gd.sz);
    gCol[i*3] = rgb[0]; gCol[i*3+1] = rgb[1]; gCol[i*3+2] = rgb[2];
  }
  const gGeo = new THREE.BufferGeometry();
  gGeo.setAttribute('position', new THREE.BufferAttribute(gPos, 3));
  gGeo.setAttribute('color', new THREE.BufferAttribute(gCol, 3));
  localGroupGroup.add(new THREE.Points(gGeo, new THREE.PointsMaterial({
    map: circleTex, size: gd.sz * 0.02, sizeAttenuation: true, vertexColors: true, transparent: true, opacity: 0.65, depthWrite: false, blending: THREE.AdditiveBlending,
  })));
  const glowColor = gd.type === 'spiral' ? 0xaabbff : (gd.type === 'elliptical' ? 0xffcc88 : (gd.type === 'irregular' ? 0xccaaff : 0xccccbb));
  const gGlow = new THREE.Sprite(new THREE.SpriteMaterial({ map: circleTex, color: glowColor, transparent: true, opacity: 0.15, depthWrite: false, blending: THREE.AdditiveBlending }));
  gGlow.position.set(gd.x, gd.y, gd.z);
  gGlow.scale.setScalar(gd.sz * 3);
  gGlow.userData.name = gd.name;
  gGlow.userData.flyDist = gd.sz * 2;
  localGroupGroup.add(gGlow);
  galaxySprites.push(gGlow);
});

// Milky Way representation in Local Group view -- hidden per user request
const mwLocalSprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: circleTex, color: 0xffeedd, transparent: true, opacity: 0, depthWrite: false }));
mwLocalSprite.scale.setScalar(40000);
mwLocalSprite.visible = false;
localGroupGroup.add(mwLocalSprite);
const mwLocalGlow = new THREE.Sprite(new THREE.SpriteMaterial({ map: circleTex, color: 0xffeedd, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending }));
mwLocalGlow.scale.setScalar(120000);
mwLocalGlow.visible = false;
localGroupGroup.add(mwLocalGlow);

// --- Phase 4.5: Superclusters (~2000000 - 30000000 units) ---
const superclusterGroup = new THREE.Group();
scene.add(superclusterGroup);


// Laniakea Supercluster -- flowing streamlines converging on the Great Attractor
const LAN_CENTER = new THREE.Vector3(2500000, -200000, -1800000);
const LAN_RADIUS = 7000000;
const LAN_STREAMS = 100;
const lanGroup = new THREE.Group();
superclusterGroup.add(lanGroup);

// Generate flowing streamline curves converging toward the Great Attractor
const lanCurves = [];
for (let i = 0; i < LAN_STREAMS; i++) {
  const startTh = Math.random() * Math.PI * 2;
  const startPh = Math.acos(2 * Math.random() - 1);
  const startR = LAN_RADIUS * (0.4 + Math.random() * 0.6);
  const flatY = 0.35;
  const startPt = new THREE.Vector3(
    LAN_CENTER.x + startR * Math.sin(startPh) * Math.cos(startTh),
    LAN_CENTER.y + startR * Math.sin(startPh) * Math.sin(startTh) * flatY,
    LAN_CENTER.z + startR * Math.cos(startPh)
  );
  const endScatter = 150000 + Math.random() * 300000;
  const endPt = LAN_CENTER.clone().add(new THREE.Vector3(
    (Math.random() - 0.5) * endScatter, (Math.random() - 0.5) * endScatter * 0.2, (Math.random() - 0.5) * endScatter
  ));
  const curveMag = LAN_RADIUS * (0.1 + Math.random() * 0.25);
  const mid1 = startPt.clone().lerp(endPt, 0.3).add(new THREE.Vector3(
    (Math.random() - 0.5) * curveMag, (Math.random() - 0.5) * curveMag * 0.15, (Math.random() - 0.5) * curveMag
  ));
  const mid2 = startPt.clone().lerp(endPt, 0.65).add(new THREE.Vector3(
    (Math.random() - 0.5) * curveMag * 0.6, (Math.random() - 0.5) * curveMag * 0.08, (Math.random() - 0.5) * curveMag * 0.6
  ));
  const curve = new THREE.CatmullRomCurve3([startPt, mid1, mid2, endPt]);
  lanCurves.push(curve);

  // Luminous tube for the stream
  const thickness = 6000 + Math.random() * 18000;
  const tubeGeo = new THREE.TubeGeometry(curve, 48, thickness, 4, false);
  const brightness = 0.7 + Math.random() * 0.3;
  lanGroup.add(new THREE.Mesh(tubeGeo, new THREE.MeshBasicMaterial({
    color: new THREE.Color(1.0 * brightness, 0.82 * brightness, 0.32 * brightness),
    transparent: true, opacity: 0.06 + Math.random() * 0.10,
    depthWrite: false, blending: THREE.AdditiveBlending,
  })));
}

// Brighter core streams (thinner, more opaque, converge tightly)
for (let i = 0; i < 40; i++) {
  const startTh = Math.random() * Math.PI * 2;
  const startPh = Math.acos(2 * Math.random() - 1);
  const startR = LAN_RADIUS * (0.15 + Math.random() * 0.45);
  const startPt = new THREE.Vector3(
    LAN_CENTER.x + startR * Math.sin(startPh) * Math.cos(startTh),
    LAN_CENTER.y + startR * Math.sin(startPh) * Math.sin(startTh) * 0.25,
    LAN_CENTER.z + startR * Math.cos(startPh)
  );
  const endPt = LAN_CENTER.clone().add(new THREE.Vector3(
    (Math.random() - 0.5) * 80000, (Math.random() - 0.5) * 20000, (Math.random() - 0.5) * 80000
  ));
  const curveMag = LAN_RADIUS * 0.08;
  const mid = startPt.clone().lerp(endPt, 0.5).add(new THREE.Vector3(
    (Math.random() - 0.5) * curveMag, (Math.random() - 0.5) * curveMag * 0.1, (Math.random() - 0.5) * curveMag
  ));
  const curve = new THREE.CatmullRomCurve3([startPt, mid, endPt]);
  lanCurves.push(curve);
  const tubeGeo = new THREE.TubeGeometry(curve, 32, 3000 + Math.random() * 8000, 4, false);
  const b = 0.85 + Math.random() * 0.15;
  lanGroup.add(new THREE.Mesh(tubeGeo, new THREE.MeshBasicMaterial({
    color: new THREE.Color(1.2 * b, 1.0 * b, 0.55 * b),
    transparent: true, opacity: 0.12 + Math.random() * 0.12,
    depthWrite: false, blending: THREE.AdditiveBlending,
  })));
}

// Galaxy dot particles scattered along the streamlines
const LAN_GAL_N = 80000;
const lanGalPos = new Float32Array(LAN_GAL_N * 3);
const lanGalCol = new Float32Array(LAN_GAL_N * 3);
for (let i = 0; i < LAN_GAL_N; i++) {
  const curve = lanCurves[Math.floor(Math.random() * lanCurves.length)];
  const t = Math.random();
  const pt = curve.getPointAt(t);
  const scatter = 20000 + Math.random() * 60000;
  lanGalPos[i*3] = pt.x + (Math.random() - 0.5) * scatter;
  lanGalPos[i*3+1] = pt.y + (Math.random() - 0.5) * scatter * 0.25;
  lanGalPos[i*3+2] = pt.z + (Math.random() - 0.5) * scatter;
  const distToCenter = pt.distanceTo(LAN_CENTER) / LAN_RADIUS;
  const b = 0.6 + Math.random() * 0.8;
  if (distToCenter < 0.15) {
    lanGalCol[i*3] = 1.5*b; lanGalCol[i*3+1] = 1.3*b; lanGalCol[i*3+2] = 0.8*b;
  } else if (Math.random() < 0.7) {
    lanGalCol[i*3] = 1.0*b; lanGalCol[i*3+1] = 0.9*b; lanGalCol[i*3+2] = 0.7*b;
  } else {
    lanGalCol[i*3] = 0.8*b; lanGalCol[i*3+1] = 0.85*b; lanGalCol[i*3+2] = 1.0*b;
  }
}
const lanGalGeo = new THREE.BufferGeometry();
lanGalGeo.setAttribute('position', new THREE.BufferAttribute(lanGalPos, 3));
lanGalGeo.setAttribute('color', new THREE.BufferAttribute(lanGalCol, 3));
lanGroup.add(new THREE.Points(lanGalGeo, new THREE.PointsMaterial({
  map: circleTex, size: 5000, sizeAttenuation: true, vertexColors: true,
  transparent: true, opacity: 0.6, depthWrite: false, blending: THREE.AdditiveBlending,
})));

// Warm diffuse glow sprites along major streams
for (let i = 0; i < 60; i++) {
  const curve = lanCurves[i % lanCurves.length];
  const t = 0.1 + Math.random() * 0.7;
  const pt = curve.getPointAt(t);
  const cols = [0xffcc44, 0xffdd66, 0xeebb33, 0xffaa22, 0xffe077];
  const sp = new THREE.Sprite(new THREE.SpriteMaterial({
    map: nebulaGlowTex, color: cols[Math.floor(Math.random() * cols.length)],
    transparent: true, opacity: 0.03 + Math.random() * 0.04,
    depthWrite: false, blending: THREE.AdditiveBlending,
  }));
  sp.position.copy(pt);
  sp.scale.setScalar(400000 + Math.random() * 800000);
  lanGroup.add(sp);
}

// Bright central convergence glow layers (Great Attractor)
const lanCenterGlows = [
  { color: 0xfff8dd, opacity: 0.3, scale: 600000 },
  { color: 0xffee88, opacity: 0.2, scale: 1200000 },
  { color: 0xffdd55, opacity: 0.12, scale: 2500000 },
  { color: 0xddbb44, opacity: 0.06, scale: 5000000 },
  { color: 0xbb9933, opacity: 0.03, scale: 8000000 },
];
lanCenterGlows.forEach(g => {
  const sp = new THREE.Sprite(new THREE.SpriteMaterial({
    map: nebulaGlowTex, color: g.color,
    transparent: true, opacity: g.opacity, depthWrite: false, blending: THREE.AdditiveBlending,
  }));
  sp.position.copy(LAN_CENTER);
  sp.scale.setScalar(g.scale);
  lanGroup.add(sp);
});

// Clickable label sprite for Laniakea
const lanLabelSprite = new THREE.Sprite(new THREE.SpriteMaterial({
  map: nebulaGlowTex, color: 0xffcc66,
  transparent: true, opacity: 0.25, depthWrite: false, blending: THREE.AdditiveBlending,
}));
lanLabelSprite.position.copy(LAN_CENTER);
lanLabelSprite.scale.setScalar(4000000);
lanLabelSprite.userData.name = 'Laniakea Supercluster';
lanLabelSprite.userData.flyDist = 12000000;
lanGroup.add(lanLabelSprite);

const laniakea = { group: lanGroup, labelSprite: lanLabelSprite, center: LAN_CENTER };

// 3D text label helper: renders text to a canvas and returns a sprite
function make3DLabel(text, position, scale, color) {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  const fontSize = 64;
  ctx.font = `bold ${fontSize}px Arial, sans-serif`;
  const metrics = ctx.measureText(text);
  const textW = metrics.width + 40;
  const textH = fontSize + 30;
  canvas.width = Math.min(2048, Math.pow(2, Math.ceil(Math.log2(textW))));
  canvas.height = Math.pow(2, Math.ceil(Math.log2(textH)));
  ctx.font = `bold ${fontSize}px Arial, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.shadowColor = 'rgba(0,0,0,0.8)';
  ctx.shadowBlur = 8;
  ctx.fillStyle = color || '#ffffff';
  ctx.fillText(text, canvas.width / 2, canvas.height / 2);
  const tex = new THREE.CanvasTexture(canvas);
  tex.needsUpdate = true;
  const sp = new THREE.Sprite(new THREE.SpriteMaterial({
    map: tex, transparent: true, opacity: 0.9, depthWrite: false, depthTest: false,
    sizeAttenuation: true,
  }));
  sp.position.copy(position);
  const aspect = canvas.width / canvas.height;
  sp.scale.set(scale * aspect, scale, 1);
  sp.userData.name = text;
  sp.renderOrder = 999;
  return sp;
}

// Laniakea text label
lanGroup.add(make3DLabel('Laniakea Supercluster', LAN_CENTER.clone().add(new THREE.Vector3(0, 1500000, 0)), 1200000, '#ffe488'));

// Great Attractor text label
lanGroup.add(make3DLabel('Great Attractor', LAN_CENTER.clone().add(new THREE.Vector3(0, 600000, 0)), 600000, '#ffeeaa'));

// Great Attractor -- the gravitational center of Laniakea
const greatAttractorGlow = new THREE.Sprite(new THREE.SpriteMaterial({
  map: nebulaGlowTex, color: 0xffee99,
  transparent: true, opacity: 0.25, depthWrite: false, blending: THREE.AdditiveBlending,
}));
greatAttractorGlow.position.copy(LAN_CENTER);
greatAttractorGlow.scale.setScalar(1000000);
greatAttractorGlow.userData.name = 'Great Attractor';
greatAttractorGlow.userData.flyDist = 2000000;
superclusterGroup.add(greatAttractorGlow);

// Reusable: build a Laniakea-style flowing streamline cluster
function makeStreamCluster(center, radius, outerStreams, innerStreams, galaxyN, glowN, tint) {
  const group = new THREE.Group();
  const curves = [];
  const cx = center.x, cy = center.y, cz = center.z;

  // Outer flowing streams
  for (let i = 0; i < outerStreams; i++) {
    const th = Math.random() * Math.PI * 2;
    const ph = Math.acos(2 * Math.random() - 1);
    const r = radius * (0.4 + Math.random() * 0.6);
    const startPt = new THREE.Vector3(
      cx + r * Math.sin(ph) * Math.cos(th),
      cy + r * Math.sin(ph) * Math.sin(th) * 0.35,
      cz + r * Math.cos(ph)
    );
    const endScatter = radius * 0.04;
    const endPt = center.clone().add(new THREE.Vector3(
      (Math.random() - 0.5) * endScatter, (Math.random() - 0.5) * endScatter * 0.2, (Math.random() - 0.5) * endScatter
    ));
    const cm = radius * (0.1 + Math.random() * 0.25);
    const mid1 = startPt.clone().lerp(endPt, 0.3).add(new THREE.Vector3(
      (Math.random() - 0.5) * cm, (Math.random() - 0.5) * cm * 0.15, (Math.random() - 0.5) * cm
    ));
    const mid2 = startPt.clone().lerp(endPt, 0.65).add(new THREE.Vector3(
      (Math.random() - 0.5) * cm * 0.6, (Math.random() - 0.5) * cm * 0.08, (Math.random() - 0.5) * cm * 0.6
    ));
    const curve = new THREE.CatmullRomCurve3([startPt, mid1, mid2, endPt]);
    curves.push(curve);
    const thick = radius * 0.001 + Math.random() * radius * 0.0025;
    const b = 0.7 + Math.random() * 0.3;
    group.add(new THREE.Mesh(
      new THREE.TubeGeometry(curve, 48, thick, 4, false),
      new THREE.MeshBasicMaterial({
        color: new THREE.Color(tint[0] * b, tint[1] * b, tint[2] * b),
        transparent: true, opacity: 0.06 + Math.random() * 0.10,
        depthWrite: false, blending: THREE.AdditiveBlending,
      })
    ));
  }

  // Brighter inner streams
  for (let i = 0; i < innerStreams; i++) {
    const th = Math.random() * Math.PI * 2;
    const ph = Math.acos(2 * Math.random() - 1);
    const r = radius * (0.15 + Math.random() * 0.45);
    const startPt = new THREE.Vector3(
      cx + r * Math.sin(ph) * Math.cos(th),
      cy + r * Math.sin(ph) * Math.sin(th) * 0.25,
      cz + r * Math.cos(ph)
    );
    const endPt = center.clone().add(new THREE.Vector3(
      (Math.random() - 0.5) * radius * 0.015, (Math.random() - 0.5) * radius * 0.004, (Math.random() - 0.5) * radius * 0.015
    ));
    const cm = radius * 0.08;
    const mid = startPt.clone().lerp(endPt, 0.5).add(new THREE.Vector3(
      (Math.random() - 0.5) * cm, (Math.random() - 0.5) * cm * 0.1, (Math.random() - 0.5) * cm
    ));
    const curve = new THREE.CatmullRomCurve3([startPt, mid, endPt]);
    curves.push(curve);
    const thick = radius * 0.0005 + Math.random() * radius * 0.001;
    const b = 0.85 + Math.random() * 0.15;
    group.add(new THREE.Mesh(
      new THREE.TubeGeometry(curve, 32, thick, 4, false),
      new THREE.MeshBasicMaterial({
        color: new THREE.Color(tint[0] * 1.2 * b, tint[1] * 1.1 * b, tint[2] * 0.8 * b),
        transparent: true, opacity: 0.12 + Math.random() * 0.12,
        depthWrite: false, blending: THREE.AdditiveBlending,
      })
    ));
  }

  // Galaxy dot particles along the streams
  const gPos = new Float32Array(galaxyN * 3);
  const gCol = new Float32Array(galaxyN * 3);
  for (let i = 0; i < galaxyN; i++) {
    const curve = curves[Math.floor(Math.random() * curves.length)];
    const t = Math.random();
    const pt = curve.getPointAt(t);
    const scatter = radius * 0.005 + Math.random() * radius * 0.01;
    gPos[i*3] = pt.x + (Math.random() - 0.5) * scatter;
    gPos[i*3+1] = pt.y + (Math.random() - 0.5) * scatter * 0.25;
    gPos[i*3+2] = pt.z + (Math.random() - 0.5) * scatter;
    const distR = pt.distanceTo(center) / radius;
    const gb = 0.6 + Math.random() * 0.8;
    if (distR < 0.15) {
      gCol[i*3] = tint[0]*1.5*gb; gCol[i*3+1] = tint[1]*1.3*gb; gCol[i*3+2] = tint[2]*0.8*gb;
    } else if (Math.random() < 0.7) {
      gCol[i*3] = tint[0]*gb; gCol[i*3+1] = tint[1]*0.9*gb; gCol[i*3+2] = tint[2]*0.7*gb;
    } else {
      gCol[i*3] = 0.8*gb; gCol[i*3+1] = 0.85*gb; gCol[i*3+2] = 1.0*gb;
    }
  }
  const gGeo = new THREE.BufferGeometry();
  gGeo.setAttribute('position', new THREE.BufferAttribute(gPos, 3));
  gGeo.setAttribute('color', new THREE.BufferAttribute(gCol, 3));
  group.add(new THREE.Points(gGeo, new THREE.PointsMaterial({
    map: circleTex, size: radius * 0.0008, sizeAttenuation: true, vertexColors: true,
    transparent: true, opacity: 0.6, depthWrite: false, blending: THREE.AdditiveBlending,
  })));

  // Warm glow sprites along streams
  for (let i = 0; i < glowN; i++) {
    const curve = curves[i % curves.length];
    const t = 0.1 + Math.random() * 0.7;
    const pt = curve.getPointAt(t);
    const hexCol = new THREE.Color(tint[0] * 0.9, tint[1] * 0.8, tint[2] * 0.5);
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({
      map: nebulaGlowTex, color: hexCol,
      transparent: true, opacity: 0.03 + Math.random() * 0.04,
      depthWrite: false, blending: THREE.AdditiveBlending,
    }));
    sp.position.copy(pt);
    sp.scale.setScalar(radius * 0.06 + Math.random() * radius * 0.12);
    group.add(sp);
  }

  // Center glow layers
  const glowDefs = [
    { f: 0.09, o: 0.3 }, { f: 0.17, o: 0.2 }, { f: 0.35, o: 0.1 }, { f: 0.7, o: 0.04 },
  ];
  glowDefs.forEach(g => {
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({
      map: nebulaGlowTex, color: new THREE.Color(tint[0], tint[1] * 0.9, tint[2] * 0.6),
      transparent: true, opacity: g.o, depthWrite: false, blending: THREE.AdditiveBlending,
    }));
    sp.position.copy(center);
    sp.scale.setScalar(radius * g.f);
    group.add(sp);
  });

  return { group, curves };
}

// Filamentary bridge between two points (galaxy particles + glow)
function makeFilamentBridge(start, end, particleN, tint) {
  const bPos = new Float32Array(particleN * 3);
  const bCol = new Float32Array(particleN * 3);
  const mid = start.clone().lerp(end, 0.5).add(new THREE.Vector3(
    (Math.random() - 0.5) * start.distanceTo(end) * 0.2,
    (Math.random() - 0.5) * start.distanceTo(end) * 0.05,
    (Math.random() - 0.5) * start.distanceTo(end) * 0.2
  ));
  const curve = new THREE.CatmullRomCurve3([start, mid, end]);
  for (let i = 0; i < particleN; i++) {
    const t = Math.random();
    const pt = curve.getPointAt(t);
    const spread = start.distanceTo(end) * 0.04;
    bPos[i*3] = pt.x + (Math.random() - 0.5) * spread;
    bPos[i*3+1] = pt.y + (Math.random() - 0.5) * spread * 0.25;
    bPos[i*3+2] = pt.z + (Math.random() - 0.5) * spread;
    const fb = 0.2 + Math.random() * 0.4;
    bCol[i*3] = tint[0]*fb; bCol[i*3+1] = tint[1]*fb; bCol[i*3+2] = tint[2]*fb;
  }
  const bGeo = new THREE.BufferGeometry();
  bGeo.setAttribute('position', new THREE.BufferAttribute(bPos, 3));
  bGeo.setAttribute('color', new THREE.BufferAttribute(bCol, 3));
  return new THREE.Points(bGeo, new THREE.PointsMaterial({
    map: circleTex, size: 6000, sizeAttenuation: true, vertexColors: true,
    transparent: true, opacity: 0.25, depthWrite: false, blending: THREE.AdditiveBlending,
  }));
}

// Pisces-Cetus Supercluster Complex -- multiple flowing clusters connected by filaments
const pcGroup = new THREE.Group();
superclusterGroup.add(pcGroup);
const PC_CENTER = new THREE.Vector3(-8000000, 1000000, 6000000);

const pcSubClusters = [
  { name: 'Perseus-Pisces',    pos: [-5000000,  800000,  4000000], r: 4000000, oS: 60, iS: 25, gN: 25000, glN: 25, tint: [1.0, 0.85, 0.35] },
  { name: 'Sculptor Wall',     pos: [-9000000,  200000,  8000000], r: 3500000, oS: 50, iS: 20, gN: 20000, glN: 20, tint: [1.0, 0.75, 0.45] },
  { name: 'Hercules',          pos: [-11000000, 2000000, 4500000], r: 3000000, oS: 45, iS: 18, gN: 18000, glN: 18, tint: [0.95, 0.90, 0.40] },
  { name: 'Coma',              pos: [-7000000,  2500000, 3000000], r: 2800000, oS: 40, iS: 15, gN: 15000, glN: 15, tint: [1.0, 0.80, 0.30] },
  { name: 'Leo',               pos: [-4500000,  1800000, 7000000], r: 2500000, oS: 35, iS: 12, gN: 12000, glN: 12, tint: [0.90, 0.85, 0.50] },
  { name: 'Shapley',           pos: [-12000000, 500000,  7500000], r: 4500000, oS: 65, iS: 28, gN: 28000, glN: 28, tint: [1.0, 0.90, 0.38] },
  { name: 'Horologium-Reticulum', pos: [-6500000, -500000, 9500000], r: 3000000, oS: 45, iS: 18, gN: 18000, glN: 18, tint: [0.95, 0.82, 0.42] },
];

const pcClusterCenters = [];
pcSubClusters.forEach(sc => {
  const c = new THREE.Vector3(sc.pos[0], sc.pos[1], sc.pos[2]);
  pcClusterCenters.push(c);
  const result = makeStreamCluster(c, sc.r, sc.oS, sc.iS, sc.gN, sc.glN, sc.tint);
  pcGroup.add(result.group);
});

// Filamentary bridges connecting sub-clusters
const bridgeTint = [0.9, 0.8, 0.4];
for (let i = 0; i < pcClusterCenters.length; i++) {
  for (let j = i + 1; j < pcClusterCenters.length; j++) {
    const dist = pcClusterCenters[i].distanceTo(pcClusterCenters[j]);
    if (dist < 9000000) {
      pcGroup.add(makeFilamentBridge(pcClusterCenters[i], pcClusterCenters[j], 8000, bridgeTint));
    }
  }
}

// Bridge from Laniakea to nearest Pisces-Cetus sub-cluster
pcGroup.add(makeFilamentBridge(LAN_CENTER, pcClusterCenters[0], 12000, [1.0, 0.85, 0.4]));
pcGroup.add(makeFilamentBridge(LAN_CENTER, pcClusterCenters[4], 8000, [0.95, 0.82, 0.42]));

// Overall diffuse glow around the whole complex
const pcOuterGlow = new THREE.Sprite(new THREE.SpriteMaterial({
  map: nebulaGlowTex, color: 0xddbb55,
  transparent: true, opacity: 0.025, depthWrite: false, blending: THREE.AdditiveBlending,
}));
pcOuterGlow.position.copy(PC_CENTER);
pcOuterGlow.scale.setScalar(25000000);
pcGroup.add(pcOuterGlow);

// Clickable label sprite for the whole complex
const pcLabelSprite = new THREE.Sprite(new THREE.SpriteMaterial({
  map: nebulaGlowTex, color: 0xffcc55,
  transparent: true, opacity: 0.2, depthWrite: false, blending: THREE.AdditiveBlending,
}));
pcLabelSprite.position.copy(PC_CENTER);
pcLabelSprite.scale.setScalar(6000000);
pcLabelSprite.userData.name = 'Pisces-Cetus Supercluster Complex';
pcLabelSprite.userData.flyDist = 25000000;
pcGroup.add(pcLabelSprite);

// Pisces-Cetus main text label
pcGroup.add(make3DLabel('Pisces-Cetus Supercluster Complex', PC_CENTER.clone().add(new THREE.Vector3(0, 3000000, 0)), 2000000, '#ffe488'));

// Sub-cluster text labels
pcSubClusters.forEach(sc => {
  const pos = new THREE.Vector3(sc.pos[0], sc.pos[1] + sc.r * 0.35, sc.pos[2]);
  pcGroup.add(make3DLabel(sc.name, pos, sc.r * 0.25, '#ffd877'));
});

const piscesCetus = { group: pcGroup, labelSprite: pcLabelSprite, center: PC_CENTER };

// --- Phase 5: Observable Universe / Cosmic Web (~2000000+ units) ---
const cosmicGroup = new THREE.Group();
scene.add(cosmicGroup);

// Cosmic web filaments
const FILAMENT_N = 200000;
const filPos = new Float32Array(FILAMENT_N * 3);
const filCol = new Float32Array(FILAMENT_N * 3);
for (let i = 0; i < FILAMENT_N; i++) {
  const baseR = 500000 + Math.random() * 4500000;
  const th = Math.random() * Math.PI * 2;
  const ph = Math.acos(2 * Math.random() - 1);
  let x = baseR * Math.sin(ph) * Math.cos(th);
  let y = baseR * Math.sin(ph) * Math.sin(th);
  let z = baseR * Math.cos(ph);
  const freq = 0.0000015;
  const nx = Math.sin(x * freq * 1.3 + y * freq * 0.7) * Math.cos(z * freq * 0.9);
  const ny = Math.sin(y * freq * 1.1 + z * freq * 0.8) * Math.cos(x * freq * 0.6);
  const nz = Math.sin(z * freq * 1.2 + x * freq * 0.5) * Math.cos(y * freq * 1.0);
  const density = (nx + ny + nz + 3) / 6;
  if (density < 0.52) { i--; continue; }
  const pull = (density - 0.5) * 300000;
  x += nx * pull; y += ny * pull; z += nz * pull;
  filPos[i*3] = x; filPos[i*3+1] = y; filPos[i*3+2] = z;
  const bright = 0.3 + density * 0.7;
  filCol[i*3] = 0.6 * bright; filCol[i*3+1] = 0.7 * bright; filCol[i*3+2] = 1.0 * bright;
}
const filGeo = new THREE.BufferGeometry();
filGeo.setAttribute('position', new THREE.BufferAttribute(filPos, 3));
filGeo.setAttribute('color', new THREE.BufferAttribute(filCol, 3));
const cosmicPoints = new THREE.Points(filGeo, new THREE.PointsMaterial({
  map: circleTex, size: 4000, sizeAttenuation: true, vertexColors: true, transparent: true, opacity: 0.45, depthWrite: false, blending: THREE.AdditiveBlending,
}));
cosmicGroup.add(cosmicPoints);

// Galaxy clusters (bright nodes in the cosmic web)
const CLUSTER_N = 500;
for (let i = 0; i < CLUSTER_N; i++) {
  const r = 600000 + Math.random() * 4000000;
  const th = Math.random() * Math.PI * 2;
  const ph = Math.acos(2 * Math.random() - 1);
  const x = r * Math.sin(ph) * Math.cos(th);
  const y = r * Math.sin(ph) * Math.sin(th);
  const z = r * Math.cos(ph);
  const clr = Math.random() < 0.5 ? 0xffeedd : (Math.random() < 0.5 ? 0xddccff : 0xccddff);
  const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: circleTex, color: clr, transparent: true, opacity: 0.4, depthWrite: false, blending: THREE.AdditiveBlending }));
  sp.position.set(x, y, z);
  sp.scale.setScalar(15000 + Math.random() * 35000);
  cosmicGroup.add(sp);
}

// CMB boundary (faint spherical shell at the edge of the observable universe)
const cmbGeo = new THREE.SphereGeometry(5000000, 64, 64);
const cmbMat = new THREE.MeshBasicMaterial({
  color: 0x332211, transparent: true, opacity: 0.08, side: THREE.BackSide, depthWrite: false,
});
cosmicGroup.add(new THREE.Mesh(cmbGeo, cmbMat));
const cmbGlow = new THREE.Mesh(
  new THREE.SphereGeometry(4800000, 32, 32),
  new THREE.MeshBasicMaterial({ color: 0x554422, transparent: true, opacity: 0.04, side: THREE.BackSide, depthWrite: false })
);
cosmicGroup.add(cmbGlow);

// Populate cosmic sprite array for interaction
cosmicSprites = [...starSprites, bhGlow, mwLabelSprite, ...nebulaSprites, ...galaxySprites, mwLocalSprite, laniakea.labelSprite, greatAttractorGlow, piscesCetus.labelSprite];

// Populate map with cosmic-scale objects now that all phases are defined
populateCosmicMapObjects();

// === SCALE LAYER VISIBILITY MANAGEMENT ===
function smoothStep(edge0, edge1, x) {
  const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

function getAncestorGroup(obj) {
  let p = obj;
  while (p && p.parent !== scene) p = p.parent;
  return p;
}

function updateScaleLayers() {
  const camDist = camera.position.length();
  const flyGroup = flyingIn ? getAncestorGroup(focusTarget) : null;

  // Solar system: full visibility nearby, fade far
  const solarAlpha = 1 - smoothStep(300, 800, camDist);
  solarSystem.visible = solarAlpha > 0.01 || flyGroup === solarSystem;
  earth.visible = solarAlpha > 0.01 || flyGroup === solarSystem;
  dustGroup.visible = solarAlpha > 0.01;

  // Stellar neighborhood
  const snIn = smoothStep(200, 600, camDist);
  const snOut = 1 - smoothStep(5000, 12000, camDist);
  const snAlpha = snIn * snOut;
  stellarGroup.visible = snAlpha > 0.01 || flyGroup === stellarGroup;
  stellarPoints.material.opacity = Math.max(snAlpha * 0.8, flyGroup === stellarGroup ? 0.5 : 0);

  // Milky Way galaxy
  const mwIn = smoothStep(5000, 15000, camDist);
  const mwOut = 1 - smoothStep(200000, 500000, camDist);
  const mwAlpha = mwIn * mwOut;
  galaxyGroup.visible = mwAlpha > 0.01 || flyGroup === galaxyGroup;
  galaxyPoints.material.opacity = Math.max(mwAlpha * 0.7, flyGroup === galaxyGroup ? 0.3 : 0);

  // Local Group
  const lgIn = smoothStep(100000, 300000, camDist);
  const lgOut = 1 - smoothStep(2000000, 4000000, camDist);
  const lgAlpha = lgIn * lgOut;
  localGroupGroup.visible = lgAlpha > 0.01 || flyGroup === localGroupGroup;

  // Superclusters
  const scIn = smoothStep(800000, 2000000, camDist);
  const scOut = 1 - smoothStep(20000000, 40000000, camDist);
  const scAlpha = scIn * scOut;
  superclusterGroup.visible = scAlpha > 0.01 || flyGroup === superclusterGroup;

  // Observable Universe / Cosmic Web
  const cwIn = smoothStep(1500000, 3000000, camDist);
  cosmicGroup.visible = cwIn > 0.01 || flyGroup === cosmicGroup;
  cosmicPoints.material.opacity = Math.max(cwIn * 0.45, flyGroup === cosmicGroup ? 0.3 : 0);
}

// --- Animation ---
const clock = new THREE.Clock();
const targetPos = new THREE.Vector3();
const desiredCamPos = new THREE.Vector3();

function animate() {
  requestAnimationFrame(animate);
  const dt = clock.getDelta();
  const t = clock.getElapsedTime();

  earth.rotation.y += dt * 0.15;
  if (earthClouds) earthClouds.rotation.y += dt * 0.02;
  sunCore.rotation.y += dt * 0.02;
  sunPivot.rotation.y += dt * 0.008;

  for (const p of planets) {
    p.pivot.rotation.y += dt * p.speed;
    p.mesh.rotation.y += dt * 0.3;
  }

  for (const dp of dwarfPlanets) {
    dp.pivot.rotation.y += dt * dp.speed;
    dp.mesh.rotation.y += dt * 0.2;
  }

  // Comet orbits (elliptical) with dual tails
  for (const c of comets) {
    c.angle += dt * c.spd;
    const e = (c.aph - c.peri) / (c.aph + c.peri);
    const a = (c.aph + c.peri) / 2;
    const r = a * (1 - e * e) / (1 + e * Math.cos(c.angle));
    const cx = Math.cos(c.angle) * r;
    const cz = Math.sin(c.angle) * r;
    c.head.position.set(cx, 0, cz);
    c.coma.position.set(cx, 0, cz);
    const sunDir = new THREE.Vector3(-cx, 0, -cz).normalize();
    const closeness = Math.max(0.3, 1 - r / c.aph);

    // Ion tail: straight away from sun, vivid blue, narrow
    for (let ti = 0; ti < 200; ti++) {
      const frac = ti / 200;
      const spread = frac * 20 * closeness;
      const narrow = spread * 0.05;
      c.ionArr[ti * 3] = cx - sunDir.x * spread + (Math.random() - 0.5) * narrow;
      c.ionArr[ti * 3 + 1] = (Math.random() - 0.5) * narrow;
      c.ionArr[ti * 3 + 2] = cz - sunDir.z * spread + (Math.random() - 0.5) * narrow;
      const fade = Math.pow(1 - frac, 0.7);
      c.ionCol[ti * 3] = 0.3 * fade; c.ionCol[ti * 3 + 1] = 0.6 * fade; c.ionCol[ti * 3 + 2] = 1.5 * fade;
    }
    c.ionGeo.attributes.position.needsUpdate = true;
    c.ionGeo.attributes.color.needsUpdate = true;

    // Dust tail: curved behind orbit, golden, wider, longer
    const orbitDir = new THREE.Vector3(-Math.sin(c.angle), 0, Math.cos(c.angle)).normalize();
    for (let ti = 0; ti < 160; ti++) {
      const frac = ti / 160;
      const spread = frac * 18 * closeness;
      const wide = spread * 0.25;
      const curve = frac * frac * 5;
      c.dustArr[ti * 3] = cx - sunDir.x * spread + orbitDir.x * curve + (Math.random() - 0.5) * wide;
      c.dustArr[ti * 3 + 1] = (Math.random() - 0.5) * wide * 0.5;
      c.dustArr[ti * 3 + 2] = cz - sunDir.z * spread + orbitDir.z * curve + (Math.random() - 0.5) * wide;
      const fade = Math.pow(1 - frac, 0.7);
      c.dustCol[ti * 3] = 1.4 * fade; c.dustCol[ti * 3 + 1] = 1.0 * fade; c.dustCol[ti * 3 + 2] = 0.4 * fade;
    }
    c.dustGeo.attributes.position.needsUpdate = true;
    c.dustGeo.attributes.color.needsUpdate = true;
  }

  // Asteroid belt slow rotation
  asteroidBelt.rotation.y += dt * 0.003;
  kuiperBelt.rotation.y += dt * 0.001;

  for (const ms of allMoonSystems) {
    if (ms.group.visible) {
      for (const m of ms.moons) m.pivot.rotation.y += dt * m.speed;
    }
  }

  for (let i = 0; i < coronaLayers.length; i++) {
    const base = coronaLayers[i].scale;
    coronaMeshes[i].scale.setScalar(base + Math.sin(t * 1.5 + i) * 0.02);
  }

  // Animate solar flares -- big, dramatic
  for (const f of solarFlares) {
    const pulse = Math.sin(t * f.speed + f.phase);
    const pulse2 = Math.sin(t * f.speed * 1.7 + f.phase * 2.3);
    const r = f.baseR + pulse * 1.2 + pulse2 * 0.4;
    f.sprite.position.x = Math.cos(f.angle + t * 0.04) * r;
    f.sprite.position.y = Math.sin(f.angle + t * 0.04) * r;
    f.sprite.scale.setScalar(f.scaleBase * (0.6 + pulse * 0.4 + 0.4));
    f.sprite.material.opacity = 0.35 + pulse * 0.25;
  }

  stars.rotation.y += dt * 0.002;
  stars.rotation.x += dt * 0.0005;

  // Star twinkling
  stars.material.size = 0.20 + Math.sin(t * 0.8) * 0.04 + Math.sin(t * 1.3) * 0.02;

  // Black hole accretion disk -- fluid swirling animation
  if (accretion.visible) {
    accretion.rotation.z += dt * 0.08;
    accInner.rotation.z += dt * 0.14;
    acc2.rotation.z -= dt * 0.04;
    acc3.rotation.z -= dt * 0.06;
    photonRing.rotation.z += dt * 0.2;
    photonRing2.rotation.z -= dt * 0.25;
    // Fluid pulsing -- accretion disk opacity and texture offset wobble
    accretionMat.opacity = 0.65 + Math.sin(t * 1.5) * 0.1;
    accInner.material.opacity = 0.75 + Math.sin(t * 2.1 + 1) * 0.1;
    acc3.material.opacity = 0.25 + Math.sin(t * 1.8 + 2) * 0.08;
    photonRingMat.opacity = 0.6 + Math.sin(t * 3) * 0.15;
    photonRing2Mat.opacity = 0.4 + Math.sin(t * 3.5 + 0.5) * 0.12;
    // Texture scroll for swirl effect
    if (accDiskTex.offset) accDiskTex.offset.x = t * 0.02;
    if (accInnerTex.offset) accInnerTex.offset.x = t * 0.035;
  }

  // Scale layer visibility
  updateScaleLayers();

  // Always track focusTarget -- camera stays on what you clicked
  focusTarget.getWorldPosition(targetPos);
  controls.target.lerp(targetPos, flyingIn ? 0.08 : 0.04);

  // Fly camera in on click
  if (flyingIn) {
    const camDir = camera.position.clone().sub(targetPos).normalize();
    const idealDist = Math.max(focusSize * 4, 1);
    desiredCamPos.copy(targetPos).addScaledVector(camDir, idealDist);
    camera.position.lerp(desiredCamPos, 0.05);

    const distToGoal = camera.position.distanceTo(desiredCamPos);
    if (distToGoal < idealDist * 0.05 + 0.1) flyingIn = false;
  }

  // Smooth fly to aerial center view
  if (flyingToCenter) {
    sunCore.getWorldPosition(targetPos);
    centerCamGoal.copy(targetPos).addScaledVector(centerNormal, CENTER_DIST);
    camera.position.lerp(centerCamGoal, 0.035);
    camera.up.lerp(centerUpGoal, 0.035);
    camera.lookAt(targetPos);

    if (camera.position.distanceTo(centerCamGoal) < 0.5) {
      flyingToCenter = false;
      controls.target.copy(targetPos);
    }
  }

  controls.update();

  drawMap();

  renderer.render(scene, camera);
}

animate();
