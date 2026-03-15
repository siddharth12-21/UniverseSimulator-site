/**
 * Three.js scene, camera, renderer, and shared textures.
 */

import * as THREE from 'https://esm.sh/three@0.160.0';

const container = document.getElementById('canvas-container');
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
  45,
  container.clientWidth / container.clientHeight,
  0.01,
  50000000
);
camera.position.set(0, 1.5, 4);

const renderer = new THREE.WebGLRenderer({
  antialias: true,
  alpha: true,
  logarithmicDepthBuffer: true,
});
renderer.setSize(container.clientWidth, container.clientHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setClearColor(0x020208, 1);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.4;
renderer.outputColorSpace = THREE.SRGBColorSpace;
container.appendChild(renderer.domElement);

// Shared circular sprite/point texture
const _sprC = document.createElement('canvas');
_sprC.width = 128;
_sprC.height = 128;
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

export function onResize() {
  const w = container.clientWidth;
  const h = container.clientHeight;
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  renderer.setSize(w, h);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
}

window.addEventListener('resize', onResize);

export { scene, camera, renderer, container, circleTex };
