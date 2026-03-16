import * as THREE from 'https://esm.sh/three@0.160.0';
import { scene, circleTex } from '../core/scene.js';

// --- Deep Field Background Sphere ---
const deepFieldGeo = new THREE.SphereGeometry(49000000, 64, 64);
const deepFieldCanvas = document.createElement('canvas');
deepFieldCanvas.width = 2048; deepFieldCanvas.height = 1024;
const dfCtx = deepFieldCanvas.getContext('2d');
dfCtx.fillStyle = '#020208';
dfCtx.fillRect(0, 0, 2048, 1024);
for (let i = 0; i < 12000; i++) {
  const x = Math.random() * 2048, y = Math.random() * 1024;
  const s = Math.random();
  const radius = s < 0.95 ? 0.3 + Math.random() * 0.6 : 1 + Math.random() * 1.5;
  const bright = 40 + Math.floor(Math.random() * 160);
  const colors = [
    `rgba(${bright},${bright},${Math.min(255,bright+60)},${0.3+Math.random()*0.7})`,
    `rgba(${Math.min(255,bright+40)},${bright},${bright-20},${0.3+Math.random()*0.7})`,
    `rgba(${bright},${Math.min(255,bright+20)},${bright},${0.3+Math.random()*0.7})`,
  ];
  dfCtx.fillStyle = colors[Math.floor(Math.random()*3)];
  dfCtx.beginPath(); dfCtx.arc(x, y, radius, 0, Math.PI*2); dfCtx.fill();
}
for (let i = 0; i < 30; i++) {
  const x = Math.random() * 2048, y = Math.random() * 1024;
  const g = dfCtx.createRadialGradient(x, y, 0, x, y, 8 + Math.random() * 15);
  const hue = Math.random() < 0.5 ? `rgba(60,40,80,0.04)` : `rgba(40,50,80,0.04)`;
  g.addColorStop(0, hue); g.addColorStop(1, 'rgba(0,0,0,0)');
  dfCtx.fillStyle = g; dfCtx.fillRect(x-20, y-20, 40, 40);
}
const deepFieldTex = new THREE.CanvasTexture(deepFieldCanvas);
export const deepFieldSphere = new THREE.Mesh(deepFieldGeo, new THREE.MeshBasicMaterial({
  map: deepFieldTex, side: THREE.BackSide, depthWrite: false,
}));
scene.add(deepFieldSphere);

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
export const stars = createStarfield();
scene.add(stars);

// Background cosmic dust haze -- subtle colored nebulosity behind the stars
const dustCount = 120;
export const dustGroup = new THREE.Group();
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
