import * as THREE from 'https://esm.sh/three@0.160.0';
import { OrbitControls } from 'https://esm.sh/three@0.160.0/examples/jsm/controls/OrbitControls.js';

// Core
import { scene, camera, renderer, composer, bloomPass, circleTex, nebulaGlowTex, container, onResize } from './core/scene.js';
import { initLighting } from './core/lighting.js';
import { EARTH_MIN, EARTH_MAX, CENTER_DIST, MAP_SIZE, MAP_VIEW_MIN, MAP_VIEW_MAX, SUN_DIST } from './config.js';

// Objects
import { earth, earthHit, earthClouds } from './objects/earth.js';
import { stars, dustGroup } from './objects/starfield.js';

// Solar
import { solarSystem, sunPivot, sunGroup, sunCore, sunHit, planets, dwarfPlanets, planetDefs, dwarfPlanetDefs, asteroidBelt, kuiperBelt, comets, coronaLayers, coronaMeshes, solarFlares, allMoonSystems, updateMoonVisibility } from './solar/solarSystem.js';

// Galaxy
import { stellarGroup, stellarPoints, nearbyStarData, starSprites, galaxyGroup, galaxyPoints, GALAXY_OFFSET, accretion, accInner, acc2, acc3, photonRing, photonRing2, accretionMat, accDiskTex, accInnerTex, photonRingMat, photonRing2Mat, bhGlow, mwLabelSprite, nebulaDefs, nebulaSprites, galaxyDefs, localGroupGroup, galaxySprites, mwLocalSprite, constellationGroup, goldHazeGroup, milkyWayGoldWash, milkyWayGoldCore } from './galaxy/galaxy.js';

// Cosmic
import { superclusterGroup, greatAttractorGlow, cosmicGroup, cosmicSprites, cosmicPoints, piscesCetus, transitionFilamentGroup, heroFilamentSegments, wallLabelsData } from './cosmic/cosmic.js';

// Data
import { planetFacts, cosmicFacts, objectStats, travelTimes } from './data/facts.js';

// UI
import { showInfoPanel, hideInfoPanel, buildSearchIndex, setUIFocusHandler, setWallFocusTarget, timeSpeed, simTime, setTimeSpeed, setSimTime, updateTimeDisplay, updateScaleIndicator, initAudio, updateAudio } from './ui/ui.js';

// ============================================================
// INITIALIZATION
// ============================================================

initLighting();

// --- OrbitControls (targets Earth at origin) ---
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.minDistance = 0.5;
controls.maxDistance = 100000000;
controls.autoRotate = true;
controls.autoRotateSpeed = 0.5;

window.addEventListener('resize', onResize);

// --- Planet Info Panel ---
const infoPanel = document.getElementById('info-panel');
const infoName = document.getElementById('info-name');
const infoFacts = document.getElementById('info-facts');

// ============================================================
// RAYCASTER + TOOLTIP + CLICK-TO-FOCUS
// ============================================================

const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
const tooltip = document.getElementById('tooltip');
const hitTargets = [earthHit, sunHit, ...planets.map(p => p.hitSphere), ...dwarfPlanets.map(d => d.hitSphere)];

let focusTarget = earth;
let focusSize = 1.0;
let flyingIn = false;

renderer.domElement.addEventListener('wheel', () => { flyingIn = false; flyingToCenter = false; }, { passive: true });

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

// Permanent HTML labels for galaxy walls (tooltip style, purple, always visible, clickable)
const wallFocusTarget = new THREE.Object3D();
const wallLabelEls = wallLabelsData.map(w => {
  const el = document.createElement('div');
  el.className = 'wall-label';
  el.textContent = w.name;
  el.style.opacity = '0';
  el.style.pointerEvents = 'none';
  el.addEventListener('click', () => {
    wallFocusTarget.position.copy(w.pos);
    focusTarget = wallFocusTarget;
    focusSize = 8000000;
    flyingIn = true;
    flyingToCenter = false;
    controls.autoRotate = false;
    returnBtn.style.display = 'block';
    updateMoonVisibility(focusTarget);
    showInfoPanel(w.name);
  });
  document.body.appendChild(el);
  return { el, pos: w.pos, name: w.name };
});

function updateWallLabels(scVis) {
  const projVec = new THREE.Vector3();
  wallLabelEls.forEach(({ el, pos }) => {
    if (scVis < 0.01) {
      el.style.opacity = '0';
      el.style.pointerEvents = 'none';
      return;
    }
    projVec.copy(pos).project(camera);
    if (projVec.z > 1) {
      el.style.opacity = '0';
      el.style.pointerEvents = 'none';
      return;
    }
    el.style.left = ((projVec.x * 0.5 + 0.5) * container.clientWidth) + 'px';
    el.style.top = ((-projVec.y * 0.5 + 0.5) * container.clientHeight) + 'px';
    el.style.opacity = String(Math.min(scVis, 1));
    el.style.pointerEvents = 'auto';
    el.style.cursor = 'pointer';
  });
}

container.addEventListener('pointermove', (e) => {
  mouse.x = (e.clientX / container.clientWidth) * 2 - 1;
  mouse.y = -(e.clientY / container.clientHeight) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);

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
    updateMoonVisibility(focusTarget);
    showInfoPanel(obj.userData.name);
    return;
  }

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
    updateMoonVisibility(focusTarget);
    showInfoPanel(obj.userData.name);
  }
});

// Return to Earth button
const returnBtn = document.getElementById('return-btn');
setUIFocusHandler((mesh, size, opts = {}) => {
  focusTarget = mesh;
  focusSize = size;
  flyingIn = true;
  flyingToCenter = false;
  controls.autoRotate = false;
  controls.minDistance = opts.minDistance || Math.max(size * 0.5, 0.5);
  returnBtn.style.display = opts.showReturn ? 'block' : 'none';
  updateMoonVisibility(focusTarget);
});
returnBtn.addEventListener('click', () => {
  focusTarget = earth;
  focusSize = 1.0;
  flyingIn = true;
  flyingToCenter = false;
  camera.up.set(0, 1, 0);
  controls.autoRotate = true;
  controls.minDistance = 0.5;
  returnBtn.style.display = 'none';
  updateMoonVisibility(focusTarget);
  hideInfoPanel();
});

// Center (aerial view) button
let flyingToCenter = false;
const centerCamGoal = new THREE.Vector3();
const centerUpGoal = new THREE.Vector3();
const centerNormal = new THREE.Vector3();

const centerBtn = document.getElementById('center-btn');
centerBtn.addEventListener('click', () => {
  focusTarget = sunCore;
  focusSize = 3.0;
  flyingIn = false;
  flyingToCenter = true;
  controls.autoRotate = false;
  controls.minDistance = 5;
  returnBtn.style.display = 'block';
  updateMoonVisibility(focusTarget);
  hideInfoPanel();

  centerNormal.set(0, 1, 0);
  centerUpGoal.set(0, 0, -1);
});

// ============================================================
// 2D ZOOMABLE UNIVERSE MAP
// ============================================================

const mapBtn = document.getElementById('map-btn');
const mapPanel = document.getElementById('map-panel');
const mapClose = document.getElementById('map-close');
const mapCanvas = document.getElementById('map-canvas');
const mapCtx = mapCanvas.getContext('2d');
const mapZoomLabel = document.getElementById('map-zoom-label');
let mapOpen = false;

mapBtn.addEventListener('click', () => { mapOpen = true; mapPanel.style.display = 'block'; });
mapClose.addEventListener('click', () => { mapOpen = false; mapPanel.style.display = 'none'; });

const MAP_CX = MAP_SIZE / 2;
const MAP_CY = MAP_SIZE / 2;

let mapViewRadius = 100;

const planetColors = ['#aaaaaa', '#e8c06a', '#cc5533', '#d4a56a', '#e8d5a3', '#7ec8e3', '#4466ee'];

const mapObjects = [];

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
  mapObjects.push({ name: 'Laniakea', color: '#ffcc66', baseR: 7, getPos: () => [2500000, -1800000], mesh: greatAttractorGlow, scale: 'supercluster' });
}

let mapHover = null;

function getMapScale() { return MAP_CX / mapViewRadius; }

function getScaleLabel() {
  if (mapViewRadius < 200) return 'Solar System';
  if (mapViewRadius < 30000) return 'Stellar Neighborhood';
  if (mapViewRadius < 1000000) return 'Milky Way Galaxy';
  if (mapViewRadius < 5000000) return 'Local Group';
  if (mapViewRadius < 60000000) return 'Superclusters';
  return 'Observable Universe';
}

function isScaleVisible(scale) {
  if (scale === 'solar') return mapViewRadius < 250;
  if (scale === 'stellar') return mapViewRadius > 50 && mapViewRadius < 50000;
  if (scale === 'galaxy') return mapViewRadius > 3000 && mapViewRadius < 2000000;
  if (scale === 'localgroup') return mapViewRadius > 200000;
  if (scale === 'supercluster') return mapViewRadius > 4000000;
  return true;
}

function scaleAlpha(scale) {
  if (scale === 'solar') { const t = Math.max(0, Math.min(1, (250 - mapViewRadius) / 150)); return t; }
  if (scale === 'stellar') {
    const fadeIn = Math.max(0, Math.min(1, (mapViewRadius - 50) / 200));
    const fadeOut = Math.max(0, Math.min(1, (50000 - mapViewRadius) / 30000));
    return fadeIn * fadeOut;
  }
  if (scale === 'galaxy') {
    const fadeIn = Math.max(0, Math.min(1, (mapViewRadius - 3000) / 5000));
    const fadeOut = Math.max(0, Math.min(1, (2000000 - mapViewRadius) / 1000000));
    return fadeIn * fadeOut;
  }
  if (scale === 'localgroup') { const t = Math.max(0, Math.min(1, (mapViewRadius - 200000) / 500000)); return t; }
  if (scale === 'supercluster') { const t = Math.max(0, Math.min(1, (mapViewRadius - 4000000) / 6000000)); return t; }
  return 1;
}

function drawMap() {
  if (!mapOpen) return;

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

  const mapCenterX = controls.target.x;
  const mapCenterZ = controls.target.z;

  const toSX = (wx) => MAP_CX + (wx - mapCenterX) * s;
  const toSZ = (wz) => MAP_CY + (wz - mapCenterZ) * s;

  // Orbit rings at solar system scale
  if (mapViewRadius < 250) {
    const alpha = scaleAlpha('solar');
    const sunOrbitR = SUN_DIST * s;
    const earthSX = toSX(0), earthSZ = toSZ(0);
    if (sunOrbitR > 2 && sunOrbitR < MAP_SIZE) {
      ctx.beginPath(); ctx.arc(earthSX, earthSZ, sunOrbitR, 0, Math.PI * 2);
      ctx.lineWidth = 1.5; ctx.strokeStyle = `rgba(200,255,220,${0.5 * alpha})`; ctx.stroke();
    }
    const sunWP = new THREE.Vector3(); sunCore.getWorldPosition(sunWP);
    const sunSX = toSX(sunWP.x);
    const sunSZ = toSZ(sunWP.z);
    for (const def of planetDefs) {
      const r = def.orbit * s;
      if (r < 2 || r > MAP_SIZE * 2) continue;
      ctx.beginPath(); ctx.arc(sunSX, sunSZ, r, 0, Math.PI * 2);
      ctx.lineWidth = 1; ctx.strokeStyle = `rgba(68,255,102,${0.15 * alpha})`; ctx.stroke();
    }
    const abInner = 28 * s, abOuter = 36 * s;
    if (abInner > 2) {
      ctx.beginPath(); ctx.arc(sunSX, sunSZ, (abInner + abOuter) / 2, 0, Math.PI * 2);
      ctx.lineWidth = (abOuter - abInner); ctx.strokeStyle = `rgba(153,136,119,${0.08 * alpha})`; ctx.stroke();
    }
    const kbInner = 85 * s, kbOuter = 130 * s;
    if (kbInner > 2) {
      ctx.beginPath(); ctx.arc(sunSX, sunSZ, (kbInner + kbOuter) / 2, 0, Math.PI * 2);
      ctx.lineWidth = Math.max(1, kbOuter - kbInner); ctx.strokeStyle = `rgba(102,119,136,${0.06 * alpha})`; ctx.stroke();
    }
  }

  // Milky Way spiral arms hint
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

  // CMB boundary at cosmic scale
  if (mapViewRadius > 2000000) {
    const r = 5000000 * s;
    const cmx = toSX(0), cmz = toSZ(0);
    if (r > 10) {
      ctx.beginPath(); ctx.arc(cmx, cmz, r, 0, Math.PI * 2);
      ctx.lineWidth = 2; ctx.strokeStyle = 'rgba(80,60,40,0.25)'; ctx.stroke();
    }
  }

  // All visible objects
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

    const glow = ctx.createRadialGradient(sx, sz, 0, sx, sz, r * 3);
    glow.addColorStop(0, obj.color + Math.floor(alpha * 68).toString(16).padStart(2, '0'));
    glow.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = glow;
    ctx.beginPath(); ctx.arc(sx, sz, r * 3, 0, Math.PI * 2); ctx.fill();

    ctx.globalAlpha = alpha;
    ctx.fillStyle = obj.color;
    ctx.beginPath(); ctx.arc(sx, sz, r, 0, Math.PI * 2); ctx.fill();

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

  // "You are here"
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

  // Crosshair
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

  updateMoonVisibility(focusTarget);
  showInfoPanel(obj.name);
  mapOpen = false;
  mapPanel.style.display = 'none';
});

// ============================================================
// POPULATE MAP & SEARCH INDEX
// ============================================================

populateCosmicMapObjects();
setWallFocusTarget(wallFocusTarget);
buildSearchIndex(hitTargets, cosmicSprites, wallLabelsData);

// ============================================================
// LIGHT TRAVEL VISUALIZATION
// ============================================================

const lightPulses = [];
const LIGHT_SPEED_UNITS = 80;
const LIGHT_PULSE_INTERVAL = 3;
let lastLightPulse = 0;

function spawnLightPulse(t) {
  const geo = new THREE.RingGeometry(0.1, 0.3, 64);
  const mat = new THREE.MeshBasicMaterial({
    color: 0xffffaa, transparent: true, opacity: 0.4, side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending,
  });
  const ring = new THREE.Mesh(geo, mat);
  ring.rotation.x = -Math.PI / 2;
  ring.position.copy(sunGroup.position);
  solarSystem.add(ring);
  lightPulses.push({ ring, born: t, radius: 0.3 });
}

function updateLightPulses(t, dt) {
  const camDist = camera.position.length();
  if (camDist > 200) {
    lightPulses.forEach(lp => { solarSystem.remove(lp.ring); lp.ring.geometry.dispose(); });
    lightPulses.length = 0;
    return;
  }
  if (t - lastLightPulse > LIGHT_PULSE_INTERVAL && timeSpeed > 0) {
    spawnLightPulse(t);
    lastLightPulse = t;
  }
  for (let i = lightPulses.length - 1; i >= 0; i--) {
    const lp = lightPulses[i];
    lp.radius += LIGHT_SPEED_UNITS * dt;
    const scale = lp.radius;
    lp.ring.scale.set(scale, scale, scale);
    const age = t - lp.born;
    lp.ring.material.opacity = Math.max(0, 0.3 - age * 0.015);
    if (lp.ring.material.opacity <= 0 || lp.radius > 120) {
      solarSystem.remove(lp.ring);
      lp.ring.geometry.dispose();
      lightPulses.splice(i, 1);
    }
  }
}

// ============================================================
// REDSHIFT ON DISTANT GALAXIES
// ============================================================

const galaxyBaseCols = galaxyDefs.map(gd => {
  const type = gd.type;
  return type === 'spiral' ? 0xaabbff : (type === 'elliptical' ? 0xffcc88 : (type === 'irregular' ? 0xccaaff : 0xccccbb));
});

function updateRedshift() {
  const camDist = camera.position.length();
  if (camDist < 100000) return;
  galaxySprites.forEach((sp, i) => {
    if (!sp.visible) return;
    const dist = camera.position.distanceTo(sp.position);
    const redFactor = Math.min(0.5, dist / 8000000);
    const base = new THREE.Color(galaxyBaseCols[i]);
    base.r = Math.min(1, base.r + redFactor * 0.3);
    base.g = Math.max(0, base.g - redFactor * 0.15);
    base.b = Math.max(0, base.b - redFactor * 0.3);
    sp.material.color.copy(base);
  });
}

// ============================================================
// SCALE LAYER VISIBILITY MANAGEMENT
// ============================================================

function smoothStep(edge0, edge1, x) {
  const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

function getAncestorGroup(obj) {
  let p = obj;
  while (p && p.parent !== scene) p = p.parent;
  return p;
}

let _scMaterialsCache = [];
let _scMaterialsCacheChildCount = -1;

function updateScaleLayers() {
  const camDist = camera.position.length();
  const focusGroup = getAncestorGroup(focusTarget);
  const isWallFocus = focusTarget === wallFocusTarget;
  const isFly = (g) => focusGroup === g || (isWallFocus && (g === superclusterGroup || g === cosmicGroup));

  const solarAlpha = 1 - smoothStep(300, 3000, camDist);
  const solarVis = isFly(solarSystem) ? Math.max(solarAlpha, 0.3) : solarAlpha;
  solarSystem.visible = solarVis > 0.001;
  earth.visible = solarVis > 0.001;
  solarSystem.scale.setScalar(Math.max(0.001, solarVis));
  dustGroup.visible = solarAlpha > 0.01;
  dustGroup.children.forEach(c => { if (c.material) c.material.opacity = solarAlpha * (0.08 + Math.random() * 0.001); });

  const snIn = smoothStep(200, 600, camDist);
  const snOut = 1 - smoothStep(5000, 15000, camDist);
  const snAlpha = snIn * snOut;
  stellarGroup.visible = snAlpha > 0.001 || isFly(stellarGroup);
  stellarPoints.material.opacity = Math.max(snAlpha * 0.8, isFly(stellarGroup) ? 0.5 : 0);

  const mwIn = smoothStep(8000, 30000, camDist);
  const mwOut = 1 - smoothStep(500000, 2000000, camDist);
  const mwAlpha = mwIn * mwOut;
  galaxyGroup.visible = mwAlpha > 0.001 || isFly(galaxyGroup);
  galaxyPoints.material.opacity = Math.max(mwAlpha * 0.7, isFly(galaxyGroup) ? 0.3 : 0);
  goldHazeGroup.visible = false;
  milkyWayGoldWash.material.opacity = 0;
  milkyWayGoldCore.material.opacity = 0;

  const lgIn = smoothStep(500000, 1500000, camDist);
  const lgOut = 1 - smoothStep(2000000, 4000000, camDist);
  const lgAlpha = lgIn * lgOut;
  localGroupGroup.visible = lgAlpha > 0.001 || isFly(localGroupGroup);
  localGroupGroup.children.forEach(c => {
    if (!c.material) return;
    if (c.material._baseOpacity === undefined) c.material._baseOpacity = c.material.opacity;
    c.material.opacity = c.material._baseOpacity * Math.max(lgAlpha, isFly(localGroupGroup) ? 0.3 : 0);
  });

  // Phase 2-3: Hero filament thins progressively — glow dies first, then mid,
  // then core, while a thin tube (r ≈ 12k, matching supercluster streamlines)
  // crossfades in. Superclusters only appear once only the thin tube remains.
  const filBaseIn = smoothStep(1200000, 3000000, camDist);
  const filamentLength = smoothStep(1200000, 2500000, camDist);
  const glowFade = 1 - smoothStep(6000000, 14000000, camDist);
  const midFade  = 1 - smoothStep(10000000, 20000000, camDist);
  const coreFade = 1 - smoothStep(14000000, 24000000, camDist);
  const thinIn   = smoothStep(10000000, 20000000, camDist);
  const thinOut  = 1 - smoothStep(30000000, 42000000, camDist);
  const thinAlpha = thinIn * thinOut;

  const anyVis = filBaseIn * Math.max(glowFade, midFade, coreFade, thinAlpha);
  transitionFilamentGroup.visible = anyVis > 0.002 || isFly(superclusterGroup);
  heroFilamentSegments.forEach(seg => {
    const segOn = Math.max(0, Math.min(1, (filamentLength - seg.t0) / Math.max(0.0001, (seg.t1 - seg.t0))));
    seg.glow.material.opacity = 0.05 * filBaseIn * glowFade * segOn;
    seg.mid.material.opacity  = 0.09 * filBaseIn * midFade  * segOn;
    seg.core.material.opacity = 0.18 * filBaseIn * coreFade * segOn;
    seg.thin.material.opacity = 0.12 * filBaseIn * thinAlpha * segOn;
  });

  // Phase 4: Superclusters fade in once the hero tube has thinned to
  // match supercluster streamline thickness (core gone at ~24M).
  const scIn = smoothStep(24000000, 28000000, camDist);
  const scOut = 1 - smoothStep(85000000, 100000000, camDist);
  const scAlpha = scIn * scOut;
  const scVis = Math.max(scAlpha, isFly(superclusterGroup) ? 1 : 0);
  superclusterGroup.visible = scVis > 0.001;
  if (scVis > 0.001) {
    const childCount = superclusterGroup.children.length;
    if (!_scMaterialsCache || _scMaterialsCacheChildCount !== childCount) {
      _scMaterialsCache = [];
      superclusterGroup.traverse(child => {
        if (child.material) {
          if (child.material._baseOpacity === undefined) child.material._baseOpacity = child.material.opacity;
          _scMaterialsCache.push(child.material);
        }
      });
      _scMaterialsCacheChildCount = childCount;
    }
    for (let i = 0; i < _scMaterialsCache.length; i++) {
      const m = _scMaterialsCache[i];
      m.opacity = m._baseOpacity * scVis;
    }
  }
  updateWallLabels(scVis);

  const cwIn = smoothStep(20000000, 28000000, camDist);
  const cwVis = Math.max(cwIn, isFly(cosmicGroup) ? 1 : 0);
  cosmicGroup.visible = cwVis > 0.001;
  cosmicPoints.material.opacity = 0.45 * cwVis;
}

// ============================================================
// ANIMATION LOOP
// ============================================================

const clock = new THREE.Clock();
const targetPos = new THREE.Vector3();
const desiredCamPos = new THREE.Vector3();
let loadingDismissed = false;
let frameCount = 0;

function animate() {
  frameCount++;
  requestAnimationFrame(animate);
  const rawDt = clock.getDelta();
  const dt = rawDt * timeSpeed;
  const t = clock.getElapsedTime();
  setSimTime(simTime + rawDt * 1000 * 86400 * timeSpeed);
  if (Math.floor(t * 2) !== Math.floor((t - rawDt) * 2)) updateTimeDisplay();

  earth.rotation.y += dt * 0.15;
  if (earthClouds) earthClouds.rotation.y += dt * 0.02;
  sunCore.rotation.y += dt * 0.02;
  sunPivot.rotation.y += dt * 0.008;

  for (const p of planets) {
    p.angle += dt * p.speed;
    p.pivot.rotation.y = p.angle;
    const r = p.orbit * (1 - p.ecc * p.ecc) / (1 + p.ecc * Math.cos(p.angle));
    p.mesh.position.x = r;
    p.hitSphere.position.x = r;
    p.mesh.rotation.y += dt * 0.3;
  }

  for (const dp of dwarfPlanets) {
    dp.pivot.rotation.y += dt * dp.speed;
    dp.mesh.rotation.y += dt * 0.2;
  }

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

  stars.material.size = 0.20 + Math.sin(t * 0.8) * 0.04 + Math.sin(t * 1.3) * 0.02;

  if (accretion.visible) {
    accretion.rotation.z += dt * 0.08;
    accInner.rotation.z += dt * 0.14;
    acc2.rotation.z -= dt * 0.04;
    acc3.rotation.z -= dt * 0.06;
    photonRing.rotation.z += dt * 0.2;
    photonRing2.rotation.z -= dt * 0.25;
    accretionMat.opacity = 0.65 + Math.sin(t * 1.5) * 0.1;
    accInner.material.opacity = 0.75 + Math.sin(t * 2.1 + 1) * 0.1;
    acc3.material.opacity = 0.25 + Math.sin(t * 1.8 + 2) * 0.08;
    photonRingMat.opacity = 0.6 + Math.sin(t * 3) * 0.15;
    photonRing2Mat.opacity = 0.4 + Math.sin(t * 3.5 + 0.5) * 0.12;
    if (accDiskTex.offset) accDiskTex.offset.x = t * 0.02;
    if (accInnerTex.offset) accInnerTex.offset.x = t * 0.035;
  }

  updateScaleLayers();

  focusTarget.getWorldPosition(targetPos);
  controls.target.lerp(targetPos, flyingIn ? 0.08 : 0.04);

  if (flyingIn) {
    const camDir = camera.position.clone().sub(targetPos).normalize();
    const idealDist = Math.max(focusSize * 4, 1);
    desiredCamPos.copy(targetPos).addScaledVector(camDir, idealDist);
    camera.position.lerp(desiredCamPos, 0.05);

    const distToGoal = camera.position.distanceTo(desiredCamPos);
    if (distToGoal < idealDist * 0.05 + 0.1) flyingIn = false;
  }

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

  updateLightPulses(t, dt);

  updateAudio();

  updateScaleIndicator();

  if (frameCount % 3 === 0) updateRedshift();

  const camDist2 = camera.position.length();
  constellationGroup.visible = camDist2 > 200 && camDist2 < 5000;

  drawMap();

  composer.render();

  if (!loadingDismissed) {
    loadingDismissed = true;
    const loadingEl = document.getElementById('loading');
    if (loadingEl) {
      loadingEl.classList.add('loaded');
      loadingEl.addEventListener('transitionend', () => loadingEl.remove(), { once: true });
    }
  }
}

animate();
