import * as THREE from 'https://esm.sh/three@0.160.0';
import { camera } from '../core/scene.js';
import { planetFacts, cosmicFacts, objectStats, travelTimes } from '../data/facts.js';
import { nearbyStarData } from '../galaxy/galaxy.js';

// === INFO PANEL ===
const infoPanel = document.getElementById('info-panel');
const infoName = document.getElementById('info-name');
const infoFacts = document.getElementById('info-facts');
document.getElementById('info-close')?.addEventListener('click', () => hideInfoPanel());

function showInfoPanel(name) {
  const facts = planetFacts[name] || cosmicFacts[name];
  if (!facts) { hideInfoPanel(); return; }
  hidingPanel = false;
  infoPanel.classList.remove('pixel-fade-out');
  infoName.textContent = name;
  let html = facts.join('<br>');
  const stats = objectStats[name];
  if (stats) {
    html += '<br><span style="color:#ff6600;font-size:11px;opacity:0.7">───────────</span>';
    if (stats.diameter) html += `<br><span style="opacity:0.6">⌀</span> ${stats.diameter}`;
    if (stats.mass) html += `<br><span style="opacity:0.6">Mass:</span> ${stats.mass}`;
    if (stats.temp) html += `<br><span style="opacity:0.6">Temp:</span> ${stats.temp}`;
    if (stats.vs_earth) html += `<br><span style="opacity:0.6">vs Earth:</span> ${stats.vs_earth}`;
  }
  const travel = travelTimes[name];
  if (travel) {
    html += `<br><span style="color:#4488ff;font-size:10px;opacity:0.6">Light: ${travel.light} · Voyager: ${travel.voyager}</span>`;
  }
  const star = nearbyStarData.find(s => s.name === name);
  if (star && star.spectral) {
    html += `<br><span style="color:#aaccff;font-size:10px;opacity:0.6">Spectral: ${star.spectral} · Luminosity: ${star.luminosity}× Sun</span>`;
  }
  infoFacts.innerHTML = html;
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

// === SEARCH BAR ===
const searchInput = document.getElementById('search-input');
const searchResults = document.getElementById('search-results');
const allSearchableObjects = [];
let focusHandler = null;
let wallFocusTargetRef = null;

export function setUIFocusHandler(handler) {
  focusHandler = handler;
}

export function setWallFocusTarget(ref) {
  wallFocusTargetRef = ref;
}

function buildSearchIndex(hitTargets, cosmicSprites, wallLabelsData = []) {
  hitTargets.forEach(h => {
    if (h.userData.name) allSearchableObjects.push({ name: h.userData.name, mesh: h.userData.planetMesh || h, size: h.userData.size || 1, type: 'solar' });
  });
  cosmicSprites.forEach(s => {
    if (s.userData.name) allSearchableObjects.push({ name: s.userData.name, mesh: s, size: s.userData.flyDist ? s.userData.flyDist / 4 : 50, type: 'cosmic' });
  });
  wallLabelsData.forEach(w => {
    allSearchableObjects.push({ name: w.name, mesh: null, size: 8000000, pos: w.pos, type: 'wall' });
  });
}

searchInput.addEventListener('input', () => {
  const q = searchInput.value.trim().toLowerCase();
  if (q.length < 1) { searchResults.style.display = 'none'; return; }
  const matches = allSearchableObjects.filter(o => o.name.toLowerCase().includes(q)).slice(0, 12);
  if (matches.length === 0) { searchResults.style.display = 'none'; return; }
  searchResults.innerHTML = '';
  matches.forEach(m => {
    const div = document.createElement('div');
    div.className = 'search-result-item';
    div.textContent = m.name;
    div.addEventListener('click', () => {
      let mesh = m.mesh;
      if (m.type === 'wall' && m.pos && wallFocusTargetRef) {
        wallFocusTargetRef.position.copy(m.pos);
        mesh = wallFocusTargetRef;
      }
      if (focusHandler && mesh) {
        focusHandler(mesh, m.size, { minDistance: m.size * 0.5, showReturn: true });
      }
      showInfoPanel(m.name);
      searchResults.style.display = 'none';
      searchInput.value = '';
      searchInput.blur();
    });
    searchResults.appendChild(div);
  });
  searchResults.style.display = 'block';
});

searchInput.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') { searchResults.style.display = 'none'; searchInput.blur(); }
  if (e.key === 'Enter') {
    const first = searchResults.querySelector('.search-result-item');
    if (first) first.click();
  }
});

document.addEventListener('click', (e) => {
  if (!e.target.closest('#search-panel')) searchResults.style.display = 'none';
});

// === TIME CONTROLS ===
export let timeSpeed = 1;
export let simTime = Date.now();
export function setTimeSpeed(v) { timeSpeed = v; }
export function setSimTime(v) { simTime = v; }

const timeSpeedDisplay = document.getElementById('time-speed');
const timeDateDisplay = document.getElementById('time-date');
const speeds = [0, 0.1, 0.25, 0.5, 1, 2, 5, 10, 50, 100, 500, 1000];
let speedIndex = 4;

function updateTimeDisplay() {
  timeSpeedDisplay.textContent = timeSpeed === 0 ? 'II' : timeSpeed < 1 ? timeSpeed + 'x' : Math.round(timeSpeed) + 'x';
  const d = new Date(simTime);
  timeDateDisplay.textContent = d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}
updateTimeDisplay();

document.getElementById('time-pause').addEventListener('click', () => {
  timeSpeed = 0; speedIndex = 0; updateTimeDisplay();
});
document.getElementById('time-play').addEventListener('click', () => {
  timeSpeed = 1; speedIndex = 4; updateTimeDisplay();
});
document.getElementById('time-faster').addEventListener('click', () => {
  speedIndex = Math.min(speedIndex + 1, speeds.length - 1);
  timeSpeed = speeds[speedIndex]; updateTimeDisplay();
});
document.getElementById('time-slower').addEventListener('click', () => {
  speedIndex = Math.max(speedIndex - 1, 0);
  timeSpeed = speeds[speedIndex]; updateTimeDisplay();
});

// === SCALE INDICATOR ===
const scaleBar = document.getElementById('scale-bar');
const scaleLabelEl = document.getElementById('scale-label');
const container = document.getElementById('canvas-container');

function updateScaleIndicator() {
  const camDist = camera.position.length();
  let label, barUnits;
  if (camDist < 5) { label = '1 Earth Diameter'; barUnits = 1; }
  else if (camDist < 50) { label = '1 AU'; barUnits = 40; }
  else if (camDist < 500) { label = '10 AU'; barUnits = 400; }
  else if (camDist < 5000) { label = '100 Light-years'; barUnits = 2000; }
  else if (camDist < 50000) { label = '1,000 Light-years'; barUnits = 20000; }
  else if (camDist < 500000) { label = '10,000 Light-years'; barUnits = 100000; }
  else if (camDist < 3000000) { label = '1 Million Light-years'; barUnits = 500000; }
  else if (camDist < 15000000) { label = '10 Million Light-years'; barUnits = 5000000; }
  else { label = '100 Million Light-years'; barUnits = 20000000; }
  scaleLabelEl.textContent = label;
  const fov = camera.fov * Math.PI / 180;
  const viewWidth = 2 * camDist * Math.tan(fov / 2) * camera.aspect;
  const pixPerUnit = (container ? container.clientWidth : window.innerWidth) / viewWidth;
  const barPx = Math.max(30, Math.min(200, barUnits * pixPerUnit));
  scaleBar.style.width = barPx + 'px';
}

// === AMBIENT SOUNDSCAPE (Web Audio API) ===
let audioCtx = null;
let audioEnabled = false;
let masterGain = null;
const audioLayers = {};

function initAudio() {
  audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  masterGain = audioCtx.createGain();
  masterGain.gain.value = 0.3;
  masterGain.connect(audioCtx.destination);

  // Deep cosmic drone (low oscillator + filter)
  const droneOsc = audioCtx.createOscillator();
  droneOsc.type = 'sine';
  droneOsc.frequency.value = 40;
  const droneGain = audioCtx.createGain();
  droneGain.gain.value = 0;
  const droneFilter = audioCtx.createBiquadFilter();
  droneFilter.type = 'lowpass';
  droneFilter.frequency.value = 120;
  droneOsc.connect(droneFilter);
  droneFilter.connect(droneGain);
  droneGain.connect(masterGain);
  droneOsc.start();
  audioLayers.drone = { gain: droneGain, osc: droneOsc };

  // Mid-frequency space ambience
  const ambOsc = audioCtx.createOscillator();
  ambOsc.type = 'triangle';
  ambOsc.frequency.value = 110;
  const ambGain = audioCtx.createGain();
  ambGain.gain.value = 0;
  const ambFilter = audioCtx.createBiquadFilter();
  ambFilter.type = 'bandpass';
  ambFilter.frequency.value = 200;
  ambFilter.Q.value = 0.5;
  ambOsc.connect(ambFilter);
  ambFilter.connect(ambGain);
  ambGain.connect(masterGain);
  ambOsc.start();
  audioLayers.ambience = { gain: ambGain, osc: ambOsc };

  // High ethereal shimmer
  const shimOsc = audioCtx.createOscillator();
  shimOsc.type = 'sine';
  shimOsc.frequency.value = 528;
  const shimGain = audioCtx.createGain();
  shimGain.gain.value = 0;
  const shimFilter = audioCtx.createBiquadFilter();
  shimFilter.type = 'highpass';
  shimFilter.frequency.value = 400;
  shimOsc.connect(shimFilter);
  shimFilter.connect(shimGain);
  shimGain.connect(masterGain);
  shimOsc.start();
  audioLayers.shimmer = { gain: shimGain, osc: shimOsc };

  // Black hole rumble (very low)
  const bhOsc = audioCtx.createOscillator();
  bhOsc.type = 'sawtooth';
  bhOsc.frequency.value = 22;
  const bhGainNode = audioCtx.createGain();
  bhGainNode.gain.value = 0;
  const bhFilter2 = audioCtx.createBiquadFilter();
  bhFilter2.type = 'lowpass';
  bhFilter2.frequency.value = 60;
  bhOsc.connect(bhFilter2);
  bhFilter2.connect(bhGainNode);
  bhGainNode.connect(masterGain);
  bhOsc.start();
  audioLayers.blackhole = { gain: bhGainNode, osc: bhOsc };

  // Noise generator for solar wind and whoosh
  const bufferSize = audioCtx.sampleRate * 2;
  const noiseBuffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
  const output = noiseBuffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) output[i] = Math.random() * 2 - 1;
  const noiseNode = audioCtx.createBufferSource();
  noiseNode.buffer = noiseBuffer;
  noiseNode.loop = true;
  const noiseGain = audioCtx.createGain();
  noiseGain.gain.value = 0;
  const noiseFilter = audioCtx.createBiquadFilter();
  noiseFilter.type = 'bandpass';
  noiseFilter.frequency.value = 800;
  noiseFilter.Q.value = 0.3;
  noiseNode.connect(noiseFilter);
  noiseFilter.connect(noiseGain);
  noiseGain.connect(masterGain);
  noiseNode.start();
  audioLayers.solarWind = { gain: noiseGain };
}

function updateAudio() {
  if (!audioEnabled || !audioCtx) return;
  const camDist = camera.position.length();
  const t = audioCtx.currentTime;

  const solarProximity = Math.max(0, 1 - camDist / 100);
  const stellarZone = camDist > 100 && camDist < 5000 ? Math.min(1, (camDist - 100) / 500) * Math.min(1, (5000 - camDist) / 2000) : 0;
  const galaxyZone = camDist > 5000 && camDist < 200000 ? Math.min(1, (camDist - 5000) / 10000) * Math.min(1, (200000 - camDist) / 100000) : 0;
  const cosmicZone = camDist > 200000 ? Math.min(1, (camDist - 200000) / 500000) : 0;

  const bhDist = camera.position.distanceTo(new THREE.Vector3(50000, 2000, -30000));
  const bhProximity = Math.max(0, 1 - bhDist / 30000);

  audioLayers.solarWind.gain.gain.linearRampToValueAtTime(solarProximity * 0.15, t + 0.1);
  audioLayers.drone.gain.gain.linearRampToValueAtTime(0.05 + stellarZone * 0.1 + galaxyZone * 0.15 + cosmicZone * 0.2, t + 0.1);
  audioLayers.ambience.gain.gain.linearRampToValueAtTime(stellarZone * 0.08 + galaxyZone * 0.12, t + 0.1);
  audioLayers.shimmer.gain.gain.linearRampToValueAtTime(cosmicZone * 0.06 + galaxyZone * 0.04, t + 0.1);
  audioLayers.blackhole.gain.gain.linearRampToValueAtTime(bhProximity * 0.3, t + 0.1);

  audioLayers.drone.osc.frequency.linearRampToValueAtTime(30 + cosmicZone * 20 + bhProximity * 10, t + 0.2);
  audioLayers.shimmer.osc.frequency.linearRampToValueAtTime(400 + cosmicZone * 300 + Math.sin(t * 0.1) * 50, t + 0.2);
}

const audioBtn = document.getElementById('audio-btn');
const audioIconOn = document.getElementById('audio-icon-on');
const audioIconOff = document.getElementById('audio-icon-off');
audioBtn.addEventListener('click', () => {
  if (!audioCtx) initAudio();
  audioEnabled = !audioEnabled;
  audioBtn.classList.toggle('muted', !audioEnabled);
  audioIconOn.style.display = audioEnabled ? '' : 'none';
  audioIconOff.style.display = audioEnabled ? 'none' : '';
  if (audioCtx) masterGain.gain.value = audioEnabled ? 0.3 : 0;
});

// === GUIDED TOURS ===
const tourStops = [
  { target: 'Earth', narration: 'Welcome to Earth — our pale blue dot, the only known world harboring life.', duration: 5000 },
  { target: 'Sun', narration: 'The Sun — a G-type star powering our entire solar system with nuclear fusion.', duration: 5000 },
  { target: 'Jupiter', narration: 'Jupiter — the king of planets, with a mass greater than all other planets combined.', duration: 5000 },
  { target: 'Saturn', narration: 'Saturn — adorned with magnificent rings of ice and rock particles.', duration: 5000 },
  { target: 'Pluto', narration: 'Pluto — once the ninth planet, now a dwarf planet at the edge of the Kuiper Belt.', duration: 4000 },
  { target: 'Alpha Centauri', narration: 'Alpha Centauri — our nearest stellar neighbor, 4.37 light-years away.', duration: 5000 },
  { target: 'Sirius', narration: 'Sirius — the brightest star in our night sky, a brilliant blue-white beacon.', duration: 4000 },
  { target: 'Sagittarius A*', narration: 'Sagittarius A* — the supermassive black hole at the heart of the Milky Way.', duration: 6000 },
  { target: 'Orion Nebula', narration: 'The Orion Nebula — a stellar nursery where new stars are being born.', duration: 5000 },
  { target: 'Milky Way Galaxy', narration: 'The Milky Way — our home galaxy, a barred spiral containing 100-400 billion stars.', duration: 5000 },
  { target: 'Andromeda (M31)', narration: 'Andromeda — the nearest large galaxy, destined to merge with the Milky Way in 4.5 billion years.', duration: 5000 },
  { target: 'Laniakea', narration: 'Laniakea — our home supercluster, 520 million light-years of flowing cosmic rivers.', duration: 6000 },
];

let tourActive = false;
let tourIndex = 0;
const tourNarration = document.getElementById('tour-narration');
const tourBtn = document.getElementById('tour-btn');

function startTour() {
  tourActive = true;
  tourIndex = 0;
  tourBtn.textContent = 'Stop Tour';
  playTourStop();
}

function stopTour() {
  tourActive = false;
  tourBtn.textContent = 'Guided Tour';
  tourNarration.style.display = 'none';
}

function playTourStop() {
  if (!tourActive || tourIndex >= tourStops.length) { stopTour(); return; }
  const stop = tourStops[tourIndex];
  const obj = allSearchableObjects.find(o => o.name === stop.target);
  if (obj) {
    if (focusHandler) {
      focusHandler(obj.mesh, obj.size, { minDistance: obj.size * 0.5, showReturn: true });
    }
    showInfoPanel(obj.name);
  }
  tourNarration.textContent = stop.narration;
  tourNarration.style.display = 'block';
  tourNarration.style.animation = 'none';
  tourNarration.offsetHeight;
  tourNarration.style.animation = '';

  tourIndex++;
  setTimeout(() => {
    if (tourActive) playTourStop();
  }, stop.duration);
}

tourBtn.addEventListener('click', () => {
  if (tourActive) stopTour(); else startTour();
});

// === COMPARISON MODE ===
let compareMode = false;
let compareA = null;
let compareB = null;

function showComparison(nameA, nameB) {
  const factsA = planetFacts[nameA] || cosmicFacts[nameA] || [];
  const factsB = planetFacts[nameB] || cosmicFacts[nameB] || [];
  const statsA = objectStats[nameA] || {};
  const statsB = objectStats[nameB] || {};
  hidingPanel = false;
  infoPanel.classList.remove('pixel-fade-out');
  infoName.textContent = `${nameA}  vs  ${nameB}`;
  let html = '<div style="display:flex;gap:24px;justify-content:center;font-size:11px">';
  html += `<div style="text-align:left">`;
  if (statsA.diameter) html += `⌀ ${statsA.diameter}<br>`;
  if (statsA.mass) html += `Mass: ${statsA.mass}<br>`;
  if (statsA.temp) html += `Temp: ${statsA.temp}<br>`;
  if (factsA[0]) html += `${factsA[0]}`;
  html += `</div><div style="text-align:left">`;
  if (statsB.diameter) html += `⌀ ${statsB.diameter}<br>`;
  if (statsB.mass) html += `Mass: ${statsB.mass}<br>`;
  if (statsB.temp) html += `Temp: ${statsB.temp}<br>`;
  if (factsB[0]) html += `${factsB[0]}`;
  html += `</div></div>`;
  infoFacts.innerHTML = html;
  infoPanel.style.display = 'block';
}

export {
  showInfoPanel, hideInfoPanel,
  buildSearchIndex,
  updateTimeDisplay,
  updateScaleIndicator,
  initAudio, updateAudio,
  startTour, stopTour, tourStops,
  showComparison
};
