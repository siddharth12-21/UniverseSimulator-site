import * as THREE from 'https://esm.sh/three@0.160.0';
import { circleTex } from '../core/scene.js';
import { galaxyDefs, localGroupGroup } from './galaxy.js';

// Seeded PRNG for deterministic generation per galaxy
function mulberry32(seed) {
  return function() {
    seed |= 0; seed = seed + 0x6D2B79F5 | 0;
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

function hashString(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = ((h << 5) - h + str.charCodeAt(i)) | 0;
  return h;
}

const STAR_TYPES = [
  { label: 'Red Dwarf',     color: 0xff6644, tempK: 3200, luminosity: 0.04, size: 400 },
  { label: 'Orange Dwarf',  color: 0xffaa44, tempK: 4500, luminosity: 0.3,  size: 500 },
  { label: 'Yellow Star',   color: 0xffee88, tempK: 5800, luminosity: 1.0,  size: 600 },
  { label: 'White Star',    color: 0xeeeeff, tempK: 7500, luminosity: 5.0,  size: 700 },
  { label: 'Blue Giant',    color: 0x88aaff, tempK: 20000, luminosity: 50,  size: 1000 },
];

const PLANET_TEMPLATES = [
  { type: 'Rocky',      colors: [0xaa8866, 0xcc9977, 0x887755, 0xbbaa88], sizeRange: [0.2, 0.6] },
  { type: 'Super-Earth', colors: [0x66aa88, 0x88bb99, 0x55aa77, 0x77ccaa], sizeRange: [0.5, 0.9] },
  { type: 'Gas Giant',  colors: [0xddaa66, 0xeecc88, 0xccbb77, 0xffddaa], sizeRange: [0.8, 1.6] },
  { type: 'Ice Giant',  colors: [0x6688cc, 0x77aadd, 0x5577bb, 0x88bbee], sizeRange: [0.6, 1.2] },
  { type: 'Lava World', colors: [0xcc4422, 0xdd5533, 0xbb3311, 0xee6644], sizeRange: [0.2, 0.5] },
];

const GREEK = ['Alpha', 'Beta', 'Gamma', 'Delta', 'Epsilon', 'Zeta', 'Eta', 'Theta'];
const PLANET_SUFFIX = ['b', 'c', 'd', 'e'];

const sharedPlanetGeo = new THREE.SphereGeometry(1, 16, 16);

const allMiniSystems = [];
const miniStarSprites = [];
const miniSystemFacts = {};

galaxyDefs.forEach((gd) => {
  const rng = mulberry32(hashString(gd.name));
  const systemCount = gd.type === 'dwarf' ? 2 : 3;

  for (let si = 0; si < systemCount; si++) {
    const starType = STAR_TYPES[Math.floor(rng() * STAR_TYPES.length)];
    const starName = `${gd.name} ${GREEK[si]}`;

    const offsetScale = gd.sz * 0.3;
    const sx = gd.x + (rng() - 0.5) * offsetScale;
    const sy = gd.y + (rng() - 0.5) * offsetScale * 0.3;
    const sz = gd.z + (rng() - 0.5) * offsetScale;

    const systemGroup = new THREE.Group();
    systemGroup.position.set(sx, sy, sz);

    const starSprite = new THREE.Sprite(new THREE.SpriteMaterial({
      map: circleTex,
      color: starType.color,
      transparent: true,
      opacity: 0.9,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    }));
    const spriteScale = starType.size;
    starSprite.scale.setScalar(spriteScale);
    starSprite.userData.name = starName;
    starSprite.userData.flyDist = 5000;
    starSprite.userData.isMiniStar = true;
    systemGroup.add(starSprite);
    miniStarSprites.push(starSprite);

    const planetCount = 2 + Math.floor(rng() * 3);
    const planets = [];
    const planetFactLines = [];

    for (let pi = 0; pi < planetCount; pi++) {
      const tmpl = PLANET_TEMPLATES[Math.floor(rng() * PLANET_TEMPLATES.length)];
      const planetName = `${starName} ${PLANET_SUFFIX[pi]}`;
      const pColor = tmpl.colors[Math.floor(rng() * tmpl.colors.length)];
      const pSize = tmpl.sizeRange[0] + rng() * (tmpl.sizeRange[1] - tmpl.sizeRange[0]);
      const orbitRadius = 800 + pi * 600 + rng() * 400;
      const speed = 0.02 + rng() * 0.06;
      const startAngle = rng() * Math.PI * 2;

      const pivot = new THREE.Group();
      pivot.rotation.y = startAngle;

      const mesh = new THREE.Mesh(
        sharedPlanetGeo,
        new THREE.MeshBasicMaterial({ color: pColor })
      );
      mesh.scale.setScalar(pSize * 80);
      mesh.position.x = orbitRadius;
      pivot.add(mesh);

      systemGroup.add(pivot);
      planets.push({ pivot, mesh, speed, angle: startAngle, orbit: orbitRadius, name: planetName });

      const radiusKm = Math.round(pSize * 6371);
      const periodYears = (orbitRadius / 1000).toFixed(1);
      planetFactLines.push(`${PLANET_SUFFIX[pi].toUpperCase()}: ${tmpl.type} — ${radiusKm.toLocaleString()} km radius, ~${periodYears} yr orbit`);
    }

    localGroupGroup.add(systemGroup);
    allMiniSystems.push({ group: systemGroup, starSprite, planets, starName, galaxyName: gd.name });

    miniSystemFacts[starName] = [
      `Star system in ${gd.name}`,
      `Star type: ${starType.label} (${starType.tempK.toLocaleString()}K)`,
      `Luminosity: ${starType.luminosity}× Sun`,
      `${planetCount} known planets:`,
      ...planetFactLines,
    ];
  }
});

function updateMiniSystems(dt) {
  for (const sys of allMiniSystems) {
    if (!sys.group.parent?.visible) continue;
    for (const p of sys.planets) {
      p.angle += dt * p.speed;
      p.pivot.rotation.y = p.angle;
      p.mesh.rotation.y += dt * 0.5;
    }
  }
}

export { allMiniSystems, miniStarSprites, miniSystemFacts, updateMiniSystems };
