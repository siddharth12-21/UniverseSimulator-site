import * as THREE from 'https://esm.sh/three@0.160.0';
import { scene, circleTex, nebulaGlowTex } from '../core/scene.js';
import { starSprites, bhGlow, mwLabelSprite, nebulaSprites, galaxySprites, mwLocalSprite, GALAXY_OFFSET } from '../galaxy/galaxy.js';

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

// Laniakea tooltip via its center glow (no overarching label)
const laniakea = { group: lanGroup, center: LAN_CENTER };

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

// Great Attractor -- the gravitational center of Laniakea
const greatAttractorGlow = new THREE.Sprite(new THREE.SpriteMaterial({
  map: nebulaGlowTex, color: 0xffee99,
  transparent: true, opacity: 0.25, depthWrite: false, blending: THREE.AdditiveBlending,
}));
greatAttractorGlow.position.copy(LAN_CENTER);
greatAttractorGlow.scale.setScalar(1000000);
greatAttractorGlow.userData.name = 'Laniakea';
greatAttractorGlow.userData.flyDist = 12000000;
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

// === Cosmic Web of Superclusters — massive interconnected golden light ===
const webGroup = new THREE.Group();
superclusterGroup.add(webGroup);

const allSuperclusters = [
  // Original 7 — repositioned closer to Laniakea and scaled up
  { name: 'Perseus-Pisces',       pos: [-2000000,  600000,  4500000],  r: 5500000, oS: 65, iS: 28, gN: 22000, glN: 22, tint: [1.0, 0.85, 0.35] },
  { name: 'Sculptor Wall',        pos: [-5500000,  100000,  3500000],  r: 5000000, oS: 55, iS: 22, gN: 18000, glN: 18, tint: [1.0, 0.75, 0.45] },
  { name: 'Hercules',             pos: [-4000000,  2500000, -1000000], r: 4500000, oS: 50, iS: 20, gN: 16000, glN: 16, tint: [0.95, 0.90, 0.40] },
  { name: 'Coma',                 pos: [-1500000,  3500000,  1500000], r: 4200000, oS: 48, iS: 18, gN: 14000, glN: 14, tint: [1.0, 0.80, 0.30] },
  { name: 'Shapley',              pos: [-6000000,  400000, -3000000],  r: 6000000, oS: 70, iS: 30, gN: 26000, glN: 26, tint: [1.0, 0.90, 0.38] },
  { name: 'Horologium-Reticulum', pos: [ 1000000, -3500000, 5000000], r: 4800000, oS: 52, iS: 22, gN: 16000, glN: 16, tint: [0.95, 0.82, 0.42] },
  { name: 'Leo',                  pos: [ 5500000,  2000000, 2000000],  r: 4000000, oS: 42, iS: 16, gN: 12000, glN: 12, tint: [0.90, 0.85, 0.50] },
  // Ring 1 — close neighbors (~8-12M from Laniakea)
  { name: 'Hydra-Centaurus',      pos: [ 7000000,  -500000, -3500000], r: 5200000, oS: 55, iS: 22, gN: 18000, glN: 18, tint: [1.0, 0.88, 0.36] },
  { name: 'Corona Borealis',      pos: [-3000000,  5000000, -4000000], r: 4000000, oS: 42, iS: 16, gN: 12000, glN: 12, tint: [0.95, 0.82, 0.45] },
  { name: 'Boötes',               pos: [ 4000000,  4500000, -2500000], r: 4500000, oS: 48, iS: 18, gN: 14000, glN: 14, tint: [1.0, 0.80, 0.40] },
  { name: 'Saraswati',            pos: [ 8000000,  1500000,  3000000], r: 5500000, oS: 58, iS: 24, gN: 20000, glN: 20, tint: [1.0, 0.92, 0.35] },
  { name: 'Ophiuchus',            pos: [ 2000000, -4500000, -5000000], r: 3800000, oS: 40, iS: 15, gN: 10000, glN: 10, tint: [0.92, 0.85, 0.48] },
  { name: 'Vela',                 pos: [-7000000, -2500000,  500000],  r: 4200000, oS: 45, iS: 18, gN: 13000, glN: 13, tint: [0.98, 0.78, 0.42] },
  { name: 'Phoenix',              pos: [ 3500000, -3000000,  6500000], r: 4600000, oS: 50, iS: 20, gN: 15000, glN: 15, tint: [1.0, 0.86, 0.38] },
  { name: 'Pavo-Indus',           pos: [ 6000000, -4000000, -1000000], r: 3500000, oS: 38, iS: 14, gN: 10000, glN: 10, tint: [0.95, 0.80, 0.44] },
  // Ring 2 — more distant (~14-22M from Laniakea)
  { name: 'Aquarius',             pos: [-10000000, 1000000,  7000000], r: 5000000, oS: 45, iS: 18, gN: 12000, glN: 12, tint: [0.95, 0.83, 0.40] },
  { name: 'Columba',              pos: [ 9000000, -5000000,  5000000], r: 4500000, oS: 42, iS: 16, gN: 11000, glN: 11, tint: [1.0, 0.85, 0.38] },
  { name: 'Microscopium',         pos: [-8000000, -4000000, -4000000], r: 3800000, oS: 38, iS: 14, gN: 9000,  glN: 9,  tint: [0.92, 0.80, 0.45] },
  { name: 'Centaurus',            pos: [10000000,  3000000, -2000000], r: 5500000, oS: 52, iS: 22, gN: 16000, glN: 16, tint: [1.0, 0.88, 0.34] },
  { name: 'Caelum',               pos: [-4000000, -5500000,  8000000], r: 4000000, oS: 40, iS: 15, gN: 10000, glN: 10, tint: [0.95, 0.82, 0.42] },
  { name: 'Pisces-Cetus',         pos: [-9000000,  4000000,  2000000], r: 5800000, oS: 55, iS: 22, gN: 18000, glN: 18, tint: [1.0, 0.90, 0.36] },
  { name: 'Fornax-Eridanus',      pos: [ 7000000, -2000000,  8000000], r: 4200000, oS: 44, iS: 16, gN: 12000, glN: 12, tint: [0.98, 0.84, 0.40] },
  { name: 'Draco',                pos: [ 1000000,  7000000, -5000000], r: 3600000, oS: 36, iS: 14, gN: 9000,  glN: 9,  tint: [0.92, 0.86, 0.48] },
  { name: 'Abell 2199',           pos: [-6000000,  6000000, -2000000], r: 4000000, oS: 40, iS: 16, gN: 10000, glN: 10, tint: [1.0, 0.82, 0.38] },
  // Ring 3 — outer shell (~20-30M), lighter for performance
  { name: 'Lynx-Ursa Major',      pos: [-12000000, 4000000, -8000000], r: 5000000, oS: 30, iS: 10, gN: 7000,  glN: 7,  tint: [0.95, 0.85, 0.40] },
  { name: 'Ursa Major',           pos: [ 11000000, 6000000,  3000000], r: 4800000, oS: 28, iS: 10, gN: 6500,  glN: 7,  tint: [1.0, 0.88, 0.36] },
  { name: 'Southern Wall',        pos: [ 5000000, -8000000,  7000000], r: 5200000, oS: 32, iS: 12, gN: 8000,  glN: 8,  tint: [0.98, 0.82, 0.42] },
  { name: 'Sloan Great Wall',     pos: [-14000000, 2000000,  4000000], r: 6500000, oS: 35, iS: 14, gN: 9000,  glN: 9,  tint: [1.0, 0.90, 0.35] },
  { name: 'CfA2 Great Wall',      pos: [ 13000000, -3000000, -6000000],r: 5500000, oS: 32, iS: 12, gN: 8000,  glN: 8,  tint: [0.95, 0.84, 0.40] },
  { name: 'Sculptor-Cetus',       pos: [-5000000, -7000000, -8000000], r: 4500000, oS: 30, iS: 10, gN: 7000,  glN: 7,  tint: [0.92, 0.80, 0.44] },
  { name: 'Eridanus',             pos: [ 12000000, -6000000,  2000000],r: 4000000, oS: 28, iS: 10, gN: 6000,  glN: 6,  tint: [1.0, 0.86, 0.38] },
  { name: 'Antlia',               pos: [-2000000, -8000000, -6000000], r: 3800000, oS: 26, iS: 10, gN: 5500,  glN: 6,  tint: [0.95, 0.82, 0.45] },
  { name: 'Puppis',               pos: [ 8000000,  7000000, -4000000], r: 4200000, oS: 28, iS: 10, gN: 6000,  glN: 6,  tint: [0.98, 0.88, 0.40] },
];

const allClusterCenters = [];
const allClusterSprites = [];

allSuperclusters.forEach(sc => {
  const c = new THREE.Vector3(sc.pos[0], sc.pos[1], sc.pos[2]);
  allClusterCenters.push(c);
  const result = makeStreamCluster(c, sc.r, sc.oS, sc.iS, sc.gN, sc.glN, sc.tint);
  webGroup.add(result.group);
});

// Transitional single-filament reveal (appears before full supercluster web)
const transitionFilamentGroup = new THREE.Group();
transitionFilamentGroup.visible = false;
scene.add(transitionFilamentGroup);
// Anchor starts right at the Milky Way so the tube encases the gold haze
const heroStart = GALAXY_OFFSET.clone();
const heroEnd = allClusterCenters[0] ? allClusterCenters[0].clone() : LAN_CENTER.clone().add(new THREE.Vector3(-2500000, 300000, 3200000));
const heroMid = heroStart.clone().lerp(heroEnd, 0.5).add(new THREE.Vector3(-1400000, 250000, 1200000));
const heroCurve = new THREE.CatmullRomCurve3([heroStart, heroMid, heroEnd]);
const heroFilamentSegments = [];
const HERO_SEGMENTS = 12;
for (let i = 0; i < HERO_SEGMENTS; i++) {
  const t0 = i / HERO_SEGMENTS;
  const t1 = (i + 1) / HERO_SEGMENTS;
  const p0 = heroCurve.getPointAt(t0);
  const p1 = heroCurve.getPointAt((t0 + t1) * 0.5);
  const p2 = heroCurve.getPointAt(t1);
  const segCurve = new THREE.CatmullRomCurve3([p0, p1, p2]);

  const glow = new THREE.Mesh(
    new THREE.TubeGeometry(segCurve, 32, 600000, 8, false),
    new THREE.MeshBasicMaterial({
      color: 0xffcc66, transparent: true, opacity: 0.0, depthWrite: false, blending: THREE.AdditiveBlending,
    })
  );
  const mid = new THREE.Mesh(
    new THREE.TubeGeometry(segCurve, 32, 300000, 8, false),
    new THREE.MeshBasicMaterial({
      color: 0xffd980, transparent: true, opacity: 0.0, depthWrite: false, blending: THREE.AdditiveBlending,
    })
  );
  const core = new THREE.Mesh(
    new THREE.TubeGeometry(segCurve, 32, 120000, 8, false),
    new THREE.MeshBasicMaterial({
      color: 0xffefb0, transparent: true, opacity: 0.0, depthWrite: false, blending: THREE.AdditiveBlending,
    })
  );
  const thin = new THREE.Mesh(
    new THREE.TubeGeometry(segCurve, 32, 12000, 4, false),
    new THREE.MeshBasicMaterial({
      color: 0xffdd88, transparent: true, opacity: 0.0, depthWrite: false, blending: THREE.AdditiveBlending,
    })
  );
  transitionFilamentGroup.add(glow);
  transitionFilamentGroup.add(mid);
  transitionFilamentGroup.add(core);
  transitionFilamentGroup.add(thin);
  heroFilamentSegments.push({ glow, mid, core, thin, t0, t1 });
}

// Dense filamentary bridges between ALL nearby superclusters
const webBridgeTint = [1.0, 0.85, 0.4];
const WEB_BRIDGE_DIST = 14000000;
for (let i = 0; i < allClusterCenters.length; i++) {
  for (let j = i + 1; j < allClusterCenters.length; j++) {
    const dist = allClusterCenters[i].distanceTo(allClusterCenters[j]);
    if (dist < WEB_BRIDGE_DIST) {
      const n = Math.floor(4000 + 8000 * (1 - dist / WEB_BRIDGE_DIST));
      webGroup.add(makeFilamentBridge(allClusterCenters[i], allClusterCenters[j], n, webBridgeTint));
    }
  }
}

// Bridge every supercluster to Laniakea if within range
const lanWebDist = 18000000;
allClusterCenters.forEach(cc => {
  const dist = LAN_CENTER.distanceTo(cc);
  if (dist < lanWebDist) {
    const n = Math.floor(6000 + 8000 * (1 - dist / lanWebDist));
    superclusterGroup.add(makeFilamentBridge(LAN_CENTER, cc, n, [1.0, 0.88, 0.42]));
  }
});

// Multiple diffuse golden glow layers over the entire web
const webCenter = new THREE.Vector3(0, 0, 0);
[
  { s: 18000000, o: 0.018 },
  { s: 30000000, o: 0.012 },
  { s: 45000000, o: 0.006 },
].forEach(g => {
  const sp = new THREE.Sprite(new THREE.SpriteMaterial({
    map: nebulaGlowTex, color: 0xddbb55,
    transparent: true, opacity: g.o, depthWrite: false, blending: THREE.AdditiveBlending,
  }));
  sp.position.copy(webCenter);
  sp.scale.setScalar(g.s);
  webGroup.add(sp);
});

// Tooltip sprites for each supercluster
allSuperclusters.forEach((sc, idx) => {
  const sp = new THREE.Sprite(new THREE.SpriteMaterial({
    map: nebulaGlowTex, color: 0xffcc55,
    transparent: true, opacity: 0.15, depthWrite: false, blending: THREE.AdditiveBlending,
  }));
  sp.position.copy(allClusterCenters[idx]);
  sp.scale.setScalar(sc.r * 0.5);
  sp.userData.name = sc.name;
  sp.userData.flyDist = sc.r * 2;
  webGroup.add(sp);
  allClusterSprites.push(sp);
});

// === Large-Scale Cosmic Walls ===
// Distinct galaxy wall sheets separated by dark voids.

function makeLightCluster(center, radius, particleN, tint) {
  const group = new THREE.Group();
  const pPos = new Float32Array(particleN * 3);
  const pCol = new Float32Array(particleN * 3);
  for (let i = 0; i < particleN; i++) {
    const th = Math.random() * Math.PI * 2;
    const ph = Math.acos(2 * Math.random() - 1);
    const r = radius * Math.pow(Math.random(), 0.4);
    pPos[i*3]   = center.x + r * Math.sin(ph) * Math.cos(th);
    pPos[i*3+1] = center.y + r * Math.sin(ph) * Math.sin(th) * 0.35;
    pPos[i*3+2] = center.z + r * Math.cos(ph);
    const b = 0.3 + Math.random() * 0.7;
    pCol[i*3] = tint[0]*b; pCol[i*3+1] = tint[1]*b; pCol[i*3+2] = tint[2]*b;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
  geo.setAttribute('color', new THREE.BufferAttribute(pCol, 3));
  group.add(new THREE.Points(geo, new THREE.PointsMaterial({
    map: circleTex, size: 20000, sizeAttenuation: true, vertexColors: true,
    transparent: true, opacity: 0.6, depthWrite: false, blending: THREE.AdditiveBlending,
  })));
  const sp1 = new THREE.Sprite(new THREE.SpriteMaterial({
    map: nebulaGlowTex, color: new THREE.Color(tint[0], tint[1] * 0.9, tint[2] * 0.6),
    transparent: true, opacity: 0.22, depthWrite: false, blending: THREE.AdditiveBlending,
  }));
  sp1.position.copy(center);
  sp1.scale.setScalar(radius * 0.8);
  group.add(sp1);
  const sp2 = new THREE.Sprite(new THREE.SpriteMaterial({
    map: nebulaGlowTex, color: new THREE.Color(tint[0] * 0.8, tint[1] * 0.7, tint[2] * 0.5),
    transparent: true, opacity: 0.07, depthWrite: false, blending: THREE.AdditiveBlending,
  }));
  sp2.position.copy(center);
  sp2.scale.setScalar(radius * 2.5);
  group.add(sp2);
  return { group };
}

const wallTints = [
  [1.0, 0.85, 0.38], [0.95, 0.82, 0.42], [1.0, 0.80, 0.35],
  [0.92, 0.86, 0.45], [0.98, 0.84, 0.40], [1.0, 0.90, 0.36],
];

const wallDefs = [
  { c: [0, 0, 0],                            n: [0, 1, 0.1],      spread: 55000000, thick: 3000000, count: 65, name: 'CfA2 Great Wall' },
  { c: [-22000000, 15000000, 20000000],       n: [0.3, 1, -0.2],   spread: 50000000, thick: 3500000, count: 55, name: 'Sloan Great Wall' },
  { c: [30000000, -6000000, -24000000],       n: [1, 0.15, 0.3],   spread: 45000000, thick: 3000000, count: 50, name: 'Hercules-Corona Borealis Wall' },
  { c: [6000000, -22000000, 14000000],        n: [-0.15, 1, 0.25], spread: 40000000, thick: 2500000, count: 45, name: 'Southern Wall' },
  { c: [-34000000, 10000000, -30000000],      n: [0.4, 0.8, -0.3], spread: 38000000, thick: 3000000, count: 40, name: 'Boss Great Wall' },
  { c: [40000000, 18000000, 10000000],        n: [-0.2, 1, 0.5],   spread: 35000000, thick: 2800000, count: 35, name: 'Pisces-Cetus Wall' },
];

const wallCenters = [];

wallDefs.forEach(wall => {
  const ctr = new THREE.Vector3(wall.c[0], wall.c[1], wall.c[2]);
  const norm = new THREE.Vector3(wall.n[0], wall.n[1], wall.n[2]).normalize();
  const ref = Math.abs(norm.y) < 0.9 ? new THREE.Vector3(0, 1, 0) : new THREE.Vector3(1, 0, 0);
  const uAxis = new THREE.Vector3().crossVectors(norm, ref).normalize();
  const vAxis = new THREE.Vector3().crossVectors(norm, uAxis).normalize();

  const wallPositions = [];
  let placed = 0, tries = 0;
  while (placed < wall.count && tries < wall.count * 120) {
    tries++;
    const pu = (Math.random() - 0.5) * 2 * wall.spread;
    const pv = (Math.random() - 0.5) * 2 * wall.spread;
    const pn = (Math.random() - 0.5) * 2 * wall.thick;
    const pos = ctr.clone()
      .addScaledVector(uAxis, pu)
      .addScaledVector(vAxis, pv)
      .addScaledVector(norm, pn);

    if (allClusterCenters.some(cc => cc.distanceTo(pos) < 3500000)) continue;
    if (wallCenters.some(cc => cc.distanceTo(pos) < 3500000)) continue;

    wallCenters.push(pos);
    wallPositions.push(pos);
    const r = 1500000 + Math.random() * 2500000;
    const tint = wallTints[Math.floor(Math.random() * wallTints.length)];
    webGroup.add(makeLightCluster(pos, r, 1200 + Math.floor(Math.random() * 1200), tint).group);

    // Purple glow label (same style as supercluster tooltips, but purple)
    const lbl = new THREE.Sprite(new THREE.SpriteMaterial({
      map: nebulaGlowTex, color: 0xbb77ff,
      transparent: true, opacity: 0.18, depthWrite: false, blending: THREE.AdditiveBlending,
    }));
    lbl.position.copy(pos);
    lbl.scale.setScalar(r * 0.5);
    lbl.userData.name = wall.name;
    lbl.userData.flyDist = r * 2;
    webGroup.add(lbl);
    allClusterSprites.push(lbl);
    placed++;
  }

  // Large diffuse purple glow patches along the wall plane
  const GLOW_PER_WALL = 10;
  for (let g = 0; g < GLOW_PER_WALL; g++) {
    const pu = (Math.random() - 0.5) * 1.6 * wall.spread;
    const pv = (Math.random() - 0.5) * 1.6 * wall.spread;
    const gpos = ctr.clone()
      .addScaledVector(uAxis, pu)
      .addScaledVector(vAxis, pv);
    const gsp = new THREE.Sprite(new THREE.SpriteMaterial({
      map: nebulaGlowTex, color: 0x9966cc,
      transparent: true, opacity: 0.025, depthWrite: false, blending: THREE.AdditiveBlending,
    }));
    gsp.position.copy(gpos);
    gsp.scale.setScalar(25000000 + Math.random() * 15000000);
    webGroup.add(gsp);
  }
});

const wallLabelsData = wallDefs.map(w => ({
  name: w.name,
  pos: new THREE.Vector3(w.c[0], w.c[1], w.c[2]),
}));

// Batched wall bridge particles (single draw call for all bridges)
const wallBridgePairs = [];
const W_BRIDGE = 16000000;
for (let i = 0; i < wallCenters.length; i++) {
  for (let j = 0; j < allClusterCenters.length; j++) {
    const d = wallCenters[i].distanceTo(allClusterCenters[j]);
    if (d < W_BRIDGE) wallBridgePairs.push([wallCenters[i], allClusterCenters[j], d]);
  }
  for (let j = i + 1; j < wallCenters.length; j++) {
    const d = wallCenters[i].distanceTo(wallCenters[j]);
    if (d < W_BRIDGE) wallBridgePairs.push([wallCenters[i], wallCenters[j], d]);
  }
}
const wbTotal = wallBridgePairs.reduce((s, bp) => s + Math.floor(300 + 800 * (1 - bp[2] / W_BRIDGE)), 0);
if (wbTotal > 0) {
  const wbPos = new Float32Array(wbTotal * 3);
  const wbCol = new Float32Array(wbTotal * 3);
  let wbI = 0;
  wallBridgePairs.forEach(([a, b, d]) => {
    const n = Math.floor(300 + 800 * (1 - d / W_BRIDGE));
    const mid = a.clone().lerp(b, 0.5).add(new THREE.Vector3(
      (Math.random() - 0.5) * d * 0.2, (Math.random() - 0.5) * d * 0.05, (Math.random() - 0.5) * d * 0.2
    ));
    const curve = new THREE.CatmullRomCurve3([a, mid, b]);
    for (let i = 0; i < n; i++) {
      const t = Math.random();
      const pt = curve.getPointAt(t);
      const spread = d * 0.04;
      wbPos[wbI * 3]     = pt.x + (Math.random() - 0.5) * spread;
      wbPos[wbI * 3 + 1] = pt.y + (Math.random() - 0.5) * spread * 0.25;
      wbPos[wbI * 3 + 2] = pt.z + (Math.random() - 0.5) * spread;
      const fb = 0.2 + Math.random() * 0.4;
      wbCol[wbI * 3] = 0.95 * fb; wbCol[wbI * 3 + 1] = 0.82 * fb; wbCol[wbI * 3 + 2] = 0.38 * fb;
      wbI++;
    }
  });
  const wbGeo = new THREE.BufferGeometry();
  wbGeo.setAttribute('position', new THREE.BufferAttribute(wbPos, 3));
  wbGeo.setAttribute('color', new THREE.BufferAttribute(wbCol, 3));
  webGroup.add(new THREE.Points(wbGeo, new THREE.PointsMaterial({
    map: circleTex, size: 6000, sizeAttenuation: true, vertexColors: true,
    transparent: true, opacity: 0.25, depthWrite: false, blending: THREE.AdditiveBlending,
  })));
}

const piscesCetus = { group: webGroup, sprites: allClusterSprites, center: webCenter };

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

// CMB boundary with procedural anisotropy pattern (Planck-inspired)
const cmbCanvas = document.createElement('canvas');
cmbCanvas.width = 1024; cmbCanvas.height = 512;
const cmbCtx = cmbCanvas.getContext('2d');
const cmbImgData = cmbCtx.createImageData(1024, 512);
for (let y = 0; y < 512; y++) {
  for (let x = 0; x < 1024; x++) {
    const nx = x / 1024 * 12, ny = y / 512 * 6;
    const n1 = Math.sin(nx * 2.3 + ny * 1.7) * Math.cos(ny * 3.1 - nx * 0.8);
    const n2 = Math.sin(nx * 5.1 - ny * 4.2) * Math.cos(nx * 1.3 + ny * 2.8);
    const n3 = Math.sin(nx * 0.7 + ny * 0.4) * Math.cos(ny * 1.1);
    const v = (n1 + n2 * 0.5 + n3 * 0.3) / 1.8;
    const t = v * 0.5 + 0.5;
    let r, g, b;
    if (t < 0.2) { r = 10; g = 10; b = 80 + t * 400; }
    else if (t < 0.4) { r = (t - 0.2) * 500; g = 30; b = 80 + (0.4 - t) * 200; }
    else if (t < 0.6) { r = 100 + (t - 0.4) * 400; g = 80 + (t - 0.4) * 300; b = 20; }
    else if (t < 0.8) { r = 180 + (t - 0.6) * 300; g = 140 + (t - 0.6) * 200; b = 30; }
    else { r = 240; g = 200 + (t - 0.8) * 200; b = 150 + (t - 0.8) * 400; }
    const idx = (y * 1024 + x) * 4;
    cmbImgData.data[idx] = Math.min(255, r);
    cmbImgData.data[idx+1] = Math.min(255, g);
    cmbImgData.data[idx+2] = Math.min(255, b);
    cmbImgData.data[idx+3] = 30;
  }
}
cmbCtx.putImageData(cmbImgData, 0, 0);
const cmbTex = new THREE.CanvasTexture(cmbCanvas);
const cmbGeo = new THREE.SphereGeometry(110000000, 64, 64);
const cmbMat = new THREE.MeshBasicMaterial({
  map: cmbTex, transparent: true, opacity: 0.15, side: THREE.BackSide, depthWrite: false,
});
cosmicGroup.add(new THREE.Mesh(cmbGeo, cmbMat));
const cmbGlow = new THREE.Mesh(
  new THREE.SphereGeometry(108000000, 32, 32),
  new THREE.MeshBasicMaterial({ color: 0x554422, transparent: true, opacity: 0.04, side: THREE.BackSide, depthWrite: false })
);
cosmicGroup.add(cmbGlow);

// Populate cosmic sprite array for interaction
const cosmicSprites = [...starSprites, bhGlow, mwLabelSprite, ...nebulaSprites, ...galaxySprites, mwLocalSprite, greatAttractorGlow, ...piscesCetus.sprites];

export { superclusterGroup, lanGroup, LAN_CENTER, greatAttractorGlow, makeStreamCluster, makeFilamentBridge, piscesCetus, cosmicGroup, cosmicSprites, cosmicPoints, make3DLabel, transitionFilamentGroup, heroFilamentSegments, wallLabelsData };
