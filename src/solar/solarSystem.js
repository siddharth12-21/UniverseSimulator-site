import * as THREE from 'https://esm.sh/three@0.160.0';
import { scene, circleTex } from '../core/scene.js';
import { earth } from '../objects/earth.js';
import { makePlanetTexture, makeHeightMap, addNoise, heightMercury, heightVenus, heightMars, heightJupiter, heightSaturn, heightUranus, heightNeptune, heightMoonGeneric, texMercury, texVenus, texMars, texJupiter, texSaturn, texUranus, texNeptune } from '../textures/planetTextures.js';

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
  { name: 'Mercury', tex: texMercury, height: heightMercury, dispScale: 0.06,  size: 0.3,  orbit: 12, speed: 0.08, tilt: 0.1,  segs: 128, ecc: 0.205, incl: 7.0, axialTilt: 0.03 },
  { name: 'Venus',   tex: texVenus,   height: heightVenus,   dispScale: 0.04,  size: 0.5,  orbit: 18, speed: 0.055, tilt: 0.05, segs: 128, ecc: 0.007, incl: 3.4, axialTilt: 177.4 },
  { name: 'Mars',    tex: texMars,    height: heightMars,    dispScale: 0.06,  size: 0.4,  orbit: 25, speed: 0.035, tilt: 0.08, segs: 128, ecc: 0.093, incl: 1.85, axialTilt: 25.2 },
  { name: 'Jupiter', tex: texJupiter, height: heightJupiter, dispScale: 0.04,  size: 1.6,  orbit: 38, speed: 0.018, tilt: 0.03, segs: 128, ecc: 0.049, incl: 1.3, axialTilt: 3.1 },
  { name: 'Saturn',  tex: texSaturn,  height: heightSaturn,  dispScale: 0.03,  size: 1.3,  orbit: 52, speed: 0.012, tilt: 0.06, segs: 128, hasRing: true, ecc: 0.057, incl: 2.49, axialTilt: 26.7 },
  { name: 'Uranus',  tex: texUranus,  height: heightUranus,  dispScale: 0.03,  size: 0.8,  orbit: 65, speed: 0.008, tilt: 0.1, segs: 128, ecc: 0.046, incl: 0.77, axialTilt: 97.8 },
  { name: 'Neptune', tex: texNeptune, height: heightNeptune, dispScale: 0.035, size: 0.75, orbit: 78, speed: 0.005, tilt: 0.04, segs: 128, ecc: 0.011, incl: 1.77, axialTilt: 28.3 },
];

const planetStartAngles = [0, 2.2, 4.1, 1.3, 3.7, 5.5, 0.8];
const planets = planetDefs.map((def, idx) => {
  const pivot = new THREE.Group();
  pivot.rotation.x = (def.incl || 0) * Math.PI / 180;
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
  mesh.rotation.z = (def.axialTilt || 0) * Math.PI / 180;
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
    mesh.add(ring);
  }

  return { pivot, mesh, hitSphere, speed: def.speed, name: def.name, size: def.size, moons: [], moonGroup: null, ecc: def.ecc || 0, orbit: def.orbit, angle: planetStartAngles[idx] || 0 };
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

function updateMoonVisibility(focusTarget) {
  for (const ms of allMoonSystems) {
    ms.group.visible = (focusTarget === ms.target);
  }
}


// Glowing green orbit lines for each planet (elliptical, inclination matches pivot)
planetDefs.forEach((def) => {
  const inclRad = (def.incl || 0) * Math.PI / 180;
  const ecc = def.ecc || 0;
  const semiLatusRectum = def.orbit * (1 - ecc * ecc);
  const curve = new THREE.CatmullRomCurve3(
    Array.from({ length: 361 }, (_, i) => {
      const a = (i / 360) * Math.PI * 2;
      const r = semiLatusRectum / (1 + ecc * Math.cos(a));
      return new THREE.Vector3(Math.cos(a) * r, 0, -Math.sin(a) * r);
    }),
    true
  );

  const glowGeo = new THREE.TubeGeometry(curve, 360, 0.25, 6, true);
  const glowMesh = new THREE.Mesh(glowGeo, new THREE.MeshBasicMaterial({
    color: 0x44ff66, transparent: true, opacity: 0.06, side: THREE.DoubleSide,
  }));
  glowMesh.rotation.x = inclRad;
  sunGroup.add(glowMesh);

  const midGeo = new THREE.TubeGeometry(curve, 360, 0.12, 6, true);
  const midMesh = new THREE.Mesh(midGeo, new THREE.MeshBasicMaterial({
    color: 0x66ff88, transparent: true, opacity: 0.12, side: THREE.DoubleSide,
  }));
  midMesh.rotation.x = inclRad;
  sunGroup.add(midMesh);

  const coreGeo = new THREE.TubeGeometry(curve, 360, 0.04, 4, true);
  const coreMesh = new THREE.Mesh(coreGeo, new THREE.MeshBasicMaterial({
    color: 0xaaffbb, transparent: true, opacity: 0.35,
  }));
  coreMesh.rotation.x = inclRad;
  sunGroup.add(coreMesh);
});

// Earth orbit ring (layered green glow)
{
  const earthOrbit = 22;
  const earthCurve = new THREE.CatmullRomCurve3(
    Array.from({ length: 181 }, (_, i) => {
      const a = (i / 180) * Math.PI * 2;
      return new THREE.Vector3(Math.cos(a) * earthOrbit, 0, Math.sin(a) * earthOrbit);
    }),
    true
  );

  sunGroup.add(new THREE.Mesh(
    new THREE.TubeGeometry(earthCurve, 180, 0.25, 6, true),
    new THREE.MeshBasicMaterial({ color: 0x44ff66, transparent: true, opacity: 0.06, side: THREE.DoubleSide })
  ));
  sunGroup.add(new THREE.Mesh(
    new THREE.TubeGeometry(earthCurve, 180, 0.12, 6, true),
    new THREE.MeshBasicMaterial({ color: 0x66ff88, transparent: true, opacity: 0.12, side: THREE.DoubleSide })
  ));
  sunGroup.add(new THREE.Mesh(
    new THREE.TubeGeometry(earthCurve, 180, 0.04, 4, true),
    new THREE.MeshBasicMaterial({ color: 0xaaffbb, transparent: true, opacity: 0.35 })
  ));
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

export { solarSystem, sunPivot, sunGroup, sunCore, sunHit, planets, dwarfPlanets, planetDefs, dwarfPlanetDefs, asteroidBelt, kuiperBelt, comets, coronaLayers, coronaMeshes, solarFlares, allMoonSystems, updateMoonVisibility };
