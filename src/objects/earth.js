import * as THREE from 'https://esm.sh/three@0.160.0';
import { scene, circleTex } from '../core/scene.js';
import { makePlanetTexture, makeHeightMap, heightEarth, texEarth } from '../textures/planetTextures.js';
import { EARTH_TEXTURE_URL } from '../config.js';

// --- Earth globe at the origin (stationary) ---
const earthGeo = new THREE.SphereGeometry(1, 192, 192);
const earthHeight = makeHeightMap(1024, 512, heightEarth);
export const earthMat = new THREE.MeshStandardMaterial({
  roughness: 0.8, metalness: 0.1,
  displacementMap: earthHeight, displacementScale: 0.06, displacementBias: -0.03,
  bumpMap: earthHeight, bumpScale: 0.8,
});
export const earth = new THREE.Mesh(earthGeo, earthMat);
earth.userData.name = 'Earth';
earth.userData.size = 1.0;
scene.add(earth);

export const earthHit = new THREE.Mesh(
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
export const earthClouds = new THREE.Mesh(
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
