import * as THREE from 'https://esm.sh/three@0.160.0';
import { scene, camera } from './scene.js';

const ambientLight = new THREE.AmbientLight(0x404060, 0.4);
const cameraLight = new THREE.PointLight(0xffffff, 1.5, 0, 0.5);

export function applyBrightness(value) {
  const t = value / 100;
  ambientLight.intensity = THREE.MathUtils.lerp(0.05, 2.5, t);
  cameraLight.intensity = THREE.MathUtils.lerp(0.3, 8.0, t);
}

export function initLighting() {
  scene.add(ambientLight);
  camera.add(cameraLight);
  scene.add(camera);

  const slider = document.getElementById('brightness-slider');
  slider.addEventListener('input', (e) => applyBrightness(Number(e.target.value)));
  applyBrightness(Number(slider.value));
}
