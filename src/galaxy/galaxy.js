import * as THREE from 'https://esm.sh/three@0.160.0';
import { scene, circleTex, nebulaGlowTex } from '../core/scene.js';

// --- Phase 2: Stellar Neighborhood (~500-5000 units) ---
const stellarGroup = new THREE.Group();
scene.add(stellarGroup);

const nearbyStarData = [
  { name: 'Alpha Centauri', x: 320, y: 30, z: -180, color: 0xfff4d0, sz: 3.0, spectral: 'G2V', luminosity: 1.5 },
  { name: "Barnard's Star", x: -440, y: 210, z: 150, color: 0xff8844, sz: 1.2, spectral: 'M4V', luminosity: 0.0004 },
  { name: 'Wolf 359', x: -380, y: 100, z: -250, color: 0xff6644, sz: 0.8, spectral: 'M6.5V', luminosity: 0.00002 },
  { name: 'Lalande 21185', x: -520, y: -300, z: 400, color: 0xff8866, sz: 1.1, spectral: 'M2V', luminosity: 0.02 },
  { name: 'Sirius', x: 650, y: -120, z: 480, color: 0xd0e8ff, sz: 4.5, spectral: 'A1V', luminosity: 25.4 },
  { name: 'Luyten 726-8', x: 500, y: -400, z: 350, color: 0xff8855, sz: 0.8, spectral: 'M5.5V', luminosity: 0.00006 },
  { name: 'Ross 154', x: 580, y: 450, z: -200, color: 0xff7744, sz: 0.9, spectral: 'M3.5V', luminosity: 0.005 },
  { name: 'Ross 248', x: -610, y: 300, z: 280, color: 0xff7755, sz: 0.8, spectral: 'M5.5V', luminosity: 0.0001 },
  { name: 'Epsilon Eridani', x: -500, y: -200, z: 700, color: 0xffcc88, sz: 1.8, spectral: 'K2V', luminosity: 0.34 },
  { name: 'Lacaille 9352', x: -700, y: -100, z: -550, color: 0xff9966, sz: 1.1, spectral: 'M1V', luminosity: 0.013 },
  { name: 'Ross 128', x: 650, y: 180, z: 300, color: 0xff7755, sz: 0.9, spectral: 'M4V', luminosity: 0.0004 },
  { name: 'Procyon', x: -380, y: 420, z: -520, color: 0xfff0d0, sz: 3.2, spectral: 'F5IV-V', luminosity: 6.9 },
  { name: 'Tau Ceti', x: 720, y: -350, z: -620, color: 0xffe8c0, sz: 1.8, spectral: 'G8.5V', luminosity: 0.52 },
  { name: 'Altair', x: -950, y: 220, z: 1150, color: 0xfff4e0, sz: 2.8, spectral: 'A7V', luminosity: 10.6 },
  { name: 'Vega', x: 1300, y: 850, z: -420, color: 0xd8e8ff, sz: 4.0, spectral: 'A0V', luminosity: 40.1 },
  { name: 'Fomalhaut', x: 1550, y: -620, z: 850, color: 0xe0f0ff, sz: 3.2, spectral: 'A3V', luminosity: 16.6 },
  { name: 'Pollux', x: -2100, y: 1250, z: -950, color: 0xffcc66, sz: 4.2, spectral: 'K0III', luminosity: 32.7 },
  { name: 'Arcturus', x: 2600, y: 650, z: 1900, color: 0xffaa44, sz: 5.0, spectral: 'K1.5III', luminosity: 170 },
  { name: 'Aldebaran', x: -3600, y: -1550, z: 2100, color: 0xff8833, sz: 5.5, spectral: 'K5III', luminosity: 518 },
  { name: 'Betelgeuse', x: 4600, y: 2100, z: -3100, color: 0xff4422, sz: 9.0, spectral: 'M1-2Ia', luminosity: 126000 },
  { name: 'Rigel', x: -4900, y: -2600, z: -3600, color: 0xaaccff, sz: 8.0, spectral: 'B8Ia', luminosity: 120000 },
  { name: 'Capella', x: 2800, y: -1800, z: 2200, color: 0xffe866, sz: 4.0, spectral: 'G5IIIe', luminosity: 78.7 },
  { name: 'Deneb', x: -4200, y: 3400, z: 1500, color: 0xddeeFF, sz: 8.5, spectral: 'A2Ia', luminosity: 196000 },
  { name: 'Spica', x: 3200, y: -2800, z: -2400, color: 0xccddff, sz: 5.5, spectral: 'B1III-IV', luminosity: 12100 },
  { name: 'Antares', x: -3800, y: 800, z: 3200, color: 0xff3322, sz: 7.0, spectral: 'M1.5Iab', luminosity: 75900 },
  { name: "Luyten's Star", x: -800, y: 150, z: 600, color: 0xff8855, sz: 0.9, spectral: 'M3.5V', luminosity: 0.001 },
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

// Broad gold-haze texture: stays bright across most of its area for full-screen drowning
const goldHazeTex = (() => {
  const c = document.createElement('canvas'); c.width = 256; c.height = 256;
  const ctx = c.getContext('2d');
  const g = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
  g.addColorStop(0, 'rgba(255,255,255,1)');
  g.addColorStop(0.3, 'rgba(255,255,255,0.92)');
  g.addColorStop(0.55, 'rgba(255,255,255,0.7)');
  g.addColorStop(0.75, 'rgba(255,255,255,0.35)');
  g.addColorStop(0.9, 'rgba(255,255,255,0.1)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g; ctx.fillRect(0, 0, 256, 256);
  return new THREE.CanvasTexture(c);
})();

// Golden wash overlays used during MW -> supercluster transition.
// Lives in its own group (not galaxyGroup) so it stays visible after MW fades.
// Sized so the sprite fills the entire screen at close range, then naturally
// shrinks to a band shape and then a thin filament as the camera pulls back.
const goldHazeGroup = new THREE.Group();
scene.add(goldHazeGroup);

const milkyWayGoldWash = new THREE.Sprite(new THREE.SpriteMaterial({
  map: goldHazeTex, color: 0xffc861, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending,
}));
milkyWayGoldWash.position.copy(GALAXY_OFFSET);
milkyWayGoldWash.scale.set(2400000, 1200000, 1);
goldHazeGroup.add(milkyWayGoldWash);

const milkyWayGoldCore = new THREE.Sprite(new THREE.SpriteMaterial({
  map: goldHazeTex, color: 0xffe08a, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending,
}));
milkyWayGoldCore.position.copy(GALAXY_OFFSET);
milkyWayGoldCore.scale.set(1400000, 700000, 1);
goldHazeGroup.add(milkyWayGoldCore);

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

// === CONSTELLATION OVERLAYS ===
const constellationGroup = new THREE.Group();
constellationGroup.visible = false;
scene.add(constellationGroup);

// Constellations with positions on a celestial sphere (radius ~2000 units in stellar neighborhood)
const CSR = 2000;
function csPos(ra, dec) {
  const raRad = (ra / 24) * Math.PI * 2;
  const decRad = (dec / 180) * Math.PI;
  return new THREE.Vector3(
    CSR * Math.cos(decRad) * Math.cos(raRad),
    CSR * Math.sin(decRad),
    -CSR * Math.cos(decRad) * Math.sin(raRad)
  );
}

const constellations = [
  { name: 'Orion', stars: [
    [5.92, 7.41], [5.24, -8.20], [5.42, 6.35], [5.80, -9.67],
    [5.53, -1.20], [5.60, -1.94], [5.68, -1.94]
  ], lines: [[0,4],[4,1],[0,2],[2,4],[1,3],[4,5],[5,6]] },
  { name: 'Big Dipper', stars: [
    [11.06, 61.75], [11.03, 56.38], [11.90, 53.69], [12.26, 57.03],
    [12.90, 55.96], [13.40, 54.93], [13.79, 49.31]
  ], lines: [[0,1],[1,2],[2,3],[3,4],[4,5],[5,6]] },
  { name: 'Cassiopeia', stars: [
    [0.15, 59.15], [0.68, 56.54], [0.95, 60.72], [1.43, 60.24], [1.91, 63.67]
  ], lines: [[0,1],[1,2],[2,3],[3,4]] },
  { name: 'Scorpius', stars: [
    [16.49, -26.43], [16.00, -22.62], [15.98, -26.11], [16.09, -20.67],
    [16.84, -34.29], [17.56, -37.10], [17.62, -43.00], [17.71, -39.03]
  ], lines: [[3,1],[1,2],[2,0],[0,4],[4,5],[5,7],[7,6]] },
  { name: 'Leo', stars: [
    [10.14, 11.97], [11.24, 20.52], [10.33, 19.84], [11.82, 14.57],
    [10.07, 16.76], [9.76, 23.77]
  ], lines: [[5,4],[4,0],[0,3],[3,1],[1,2],[2,4]] },
  { name: 'Cygnus', stars: [
    [20.69, 45.28], [19.51, 27.96], [20.37, 40.26], [19.75, 45.13], [20.77, 33.97]
  ], lines: [[0,2],[2,1],[3,2],[2,4]] },
  { name: 'Gemini', stars: [
    [7.76, 28.03], [7.58, 31.89], [6.63, 16.40], [6.75, 33.96],
    [7.07, 20.57], [7.34, 21.98]
  ], lines: [[0,1],[0,5],[5,4],[4,2],[1,3]] },
  { name: 'Southern Cross', stars: [
    [12.44, -63.10], [12.52, -57.11], [12.25, -58.75], [12.69, -59.69]
  ], lines: [[0,1],[2,3]] },
  { name: 'Taurus', stars: [
    [4.60, 16.51], [5.63, 21.14], [5.44, 28.61], [4.33, 15.63],
    [4.48, 19.18], [4.01, 12.49]
  ], lines: [[5,3],[3,0],[0,4],[4,2],[0,1]] },
  { name: 'Lyra', stars: [
    [18.62, 38.78], [18.98, 32.69], [18.83, 33.36], [19.23, 39.15], [18.75, 37.60]
  ], lines: [[0,4],[4,1],[4,2],[1,2],[4,3]] },
];

constellations.forEach(cd => {
  const pts = cd.stars.map(([ra, dec]) => csPos(ra, dec));
  cd.lines.forEach(([a, b]) => {
    const geo = new THREE.BufferGeometry().setFromPoints([pts[a], pts[b]]);
    constellationGroup.add(new THREE.Line(geo, new THREE.LineBasicMaterial({
      color: 0x3b8cff, transparent: true, opacity: 0.22, depthWrite: false, blending: THREE.AdditiveBlending,
    })));
    constellationGroup.add(new THREE.Line(geo, new THREE.LineBasicMaterial({
      color: 0x8ed2ff, transparent: true, opacity: 0.82, depthWrite: false, blending: THREE.AdditiveBlending,
    })));

    // Mid-segment glow node to make lines feel luminous
    const mid = pts[a].clone().lerp(pts[b], 0.5);
    const glow = new THREE.Sprite(new THREE.SpriteMaterial({
      map: nebulaGlowTex, color: 0x5fb8ff, transparent: true, opacity: 0.22, depthWrite: false, blending: THREE.AdditiveBlending,
    }));
    glow.position.copy(mid);
    glow.scale.setScalar(70);
    constellationGroup.add(glow);
  });
  // Small label at first star
  const labelCanvas = document.createElement('canvas');
  const lCtx = labelCanvas.getContext('2d');
  labelCanvas.width = 256; labelCanvas.height = 64;
  lCtx.font = '700 28px "Orbitron", sans-serif';
  lCtx.textAlign = 'center'; lCtx.textBaseline = 'middle';
  lCtx.fillStyle = 'rgba(80,140,255,0.6)';
  lCtx.fillText(cd.name, 128, 32);
  const lTex = new THREE.CanvasTexture(labelCanvas);
  const lSprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: lTex, transparent: true, depthWrite: false }));
  const center = pts.reduce((acc, p) => acc.add(p), new THREE.Vector3()).divideScalar(pts.length);
  lSprite.position.copy(center).add(new THREE.Vector3(0, 80, 0));
  lSprite.scale.set(300, 75, 1);
  constellationGroup.add(lSprite);
});

export {
  stellarGroup, stellarPoints, nearbyStarData, starSprites,
  galaxyGroup, galaxyPoints, GALAXY_OFFSET,
  accretion, accInner, acc2, acc3, photonRing, photonRing2, accretionMat, accDiskTex, accInnerTex, photonRingMat, photonRing2Mat,
  bhGlow, mwLabelSprite,
  nebulaDefs, nebulaSprites, makeNebulaTex,
  galaxyDefs, localGroupGroup, galaxySprites, mwLocalSprite,
  constellationGroup, goldHazeGroup, milkyWayGoldWash, milkyWayGoldCore
};
