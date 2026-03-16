import * as THREE from 'https://esm.sh/three@0.160.0';
import { EffectComposer } from 'https://esm.sh/three@0.160.0/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'https://esm.sh/three@0.160.0/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'https://esm.sh/three@0.160.0/examples/jsm/postprocessing/UnrealBloomPass.js';

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

const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
const bloomPass = new UnrealBloomPass(
  new THREE.Vector2(container.clientWidth, container.clientHeight),
  0.4,
  0.6,
  0.7
);
composer.addPass(bloomPass);

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

function onResize() {
  const w = container.clientWidth;
  const h = container.clientHeight;
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  renderer.setSize(w, h);
  composer.setSize(w, h);
}

export { scene, camera, renderer, composer, bloomPass, circleTex, nebulaGlowTex, container, onResize };
