/**
 * Procedural planet textures and height maps.
 * Canvas-based texture generation for all solar system bodies.
 */

import * as THREE from 'https://esm.sh/three@0.160.0';

export function makePlanetTexture(w, h, drawFn) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  drawFn(c.getContext('2d'), w, h);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export function addNoise(ctx, w, h, alpha) {
  const img = ctx.getImageData(0, 0, w, h);
  const d = img.data;
  for (let i = 0; i < d.length; i += 4) {
    const n = (Math.random() - 0.5) * alpha;
    d[i] += n;
    d[i + 1] += n;
    d[i + 2] += n;
  }
  ctx.putImageData(img, 0, 0);
}

export function makeHeightMap(w, h, drawFn) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  drawFn(c.getContext('2d'), w, h);
  return new THREE.CanvasTexture(c);
}

function heightCraters(ctx, w, h, count, minR, maxR) {
  for (let i = 0; i < count; i++) {
    const x = Math.random() * w,
      y = Math.random() * h;
    const r = minR + Math.random() * (maxR - minR);
    const rg = ctx.createRadialGradient(x, y, 0, x, y, r);
    rg.addColorStop(0, '#000');
    rg.addColorStop(0.25, '#111');
    rg.addColorStop(0.6, '#222');
    rg.addColorStop(0.85, '#ddd');
    rg.addColorStop(1, '#888');
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fillStyle = rg;
    ctx.fill();
  }
}

export function heightMercury(ctx, w, h) {
  ctx.fillStyle = '#999';
  ctx.fillRect(0, 0, w, h);
  heightCraters(ctx, w, h, 500, 3, 25);
  heightCraters(ctx, w, h, 100, 18, 50);
  heightCraters(ctx, w, h, 20, 35, 70);
  addNoise(ctx, w, h, 60);
}

export function heightVenus(ctx, w, h) {
  ctx.fillStyle = '#777';
  ctx.fillRect(0, 0, w, h);
  for (let i = 0; i < 40; i++) {
    const x = Math.random() * w,
      y = Math.random() * h;
    const rx = 40 + Math.random() * 100,
      ry = 20 + Math.random() * 60;
    ctx.beginPath();
    ctx.ellipse(x, y, rx, ry, Math.random() * Math.PI, 0, Math.PI * 2);
    const v = Math.floor(60 + Math.random() * 140);
    ctx.fillStyle = `rgb(${v},${v},${v})`;
    ctx.fill();
  }
  heightCraters(ctx, w, h, 60, 5, 20);
  for (let i = 0; i < 50; i++) {
    const y = Math.random() * h;
    const bh = 3 + Math.random() * 12;
    const v = Math.floor(80 + Math.random() * 100);
    ctx.fillStyle = `rgba(${v},${v},${v},0.4)`;
    ctx.fillRect(0, y, w, bh);
  }
  addNoise(ctx, w, h, 40);
}

export function heightMars(ctx, w, h) {
  ctx.fillStyle = '#888';
  ctx.fillRect(0, 0, w, h);
  heightCraters(ctx, w, h, 300, 2, 15);
  heightCraters(ctx, w, h, 50, 12, 35);
  const omRg = ctx.createRadialGradient(w * 0.3, h * 0.4, 0, w * 0.3, h * 0.4, w * 0.08);
  omRg.addColorStop(0, '#fff');
  omRg.addColorStop(0.4, '#ddd');
  omRg.addColorStop(1, '#888');
  ctx.beginPath();
  ctx.arc(w * 0.3, h * 0.4, w * 0.08, 0, Math.PI * 2);
  ctx.fillStyle = omRg;
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(w * 0.15, h * 0.48);
  for (let x = w * 0.15; x < w * 0.8; x += 3) {
    ctx.lineTo(x, h * 0.48 + Math.sin(x * 0.025) * 12 + (Math.random() - 0.5) * 6);
  }
  ctx.lineWidth = 6;
  ctx.strokeStyle = '#111';
  ctx.stroke();
  ctx.lineWidth = 3;
  ctx.strokeStyle = '#222';
  ctx.stroke();
  const pg = ctx.createLinearGradient(0, 0, 0, h);
  pg.addColorStop(0, '#eee');
  pg.addColorStop(0.06, '#888');
  pg.addColorStop(0.94, '#888');
  pg.addColorStop(1, '#eee');
  ctx.fillStyle = pg;
  ctx.fillRect(0, 0, w, h);
  addNoise(ctx, w, h, 45);
}

export function heightJupiter(ctx, w, h) {
  ctx.fillStyle = '#777';
  ctx.fillRect(0, 0, w, h);
  const bandCount = 24;
  const bh = h / bandCount;
  for (let i = 0; i < bandCount; i++) {
    const v = i % 2 === 0 ? 55 : 200;
    ctx.fillStyle = `rgb(${v},${v},${v})`;
    ctx.fillRect(0, i * bh, w, bh + 1);
  }
  for (let i = 0; i < 80; i++) {
    const y = Math.random() * h;
    ctx.beginPath();
    ctx.moveTo(0, y);
    for (let x = 0; x < w; x += 3) {
      ctx.lineTo(x, y + Math.sin(x * 0.015 + Math.random() * 2) * 5);
    }
    ctx.lineWidth = 2 + Math.random() * 3;
    const v = Math.floor(50 + Math.random() * 160);
    ctx.strokeStyle = `rgba(${v},${v},${v},0.4)`;
    ctx.stroke();
  }
  const grs = ctx.createRadialGradient(w * 0.62, h * 0.55, 0, w * 0.62, h * 0.55, w * 0.06);
  grs.addColorStop(0, '#222');
  grs.addColorStop(0.5, '#555');
  grs.addColorStop(1, '#888');
  ctx.beginPath();
  ctx.ellipse(w * 0.62, h * 0.55, w * 0.08, h * 0.04, 0, 0, Math.PI * 2);
  ctx.fillStyle = grs;
  ctx.fill();
  addNoise(ctx, w, h, 30);
}

export function heightSaturn(ctx, w, h) {
  ctx.fillStyle = '#888';
  ctx.fillRect(0, 0, w, h);
  const bandCount = 20;
  const bh = h / bandCount;
  for (let i = 0; i < bandCount; i++) {
    const v = i % 2 === 0 ? 70 : 180;
    ctx.fillStyle = `rgb(${v},${v},${v})`;
    ctx.fillRect(0, i * bh, w, bh + 1);
  }
  for (let i = 0; i < 50; i++) {
    const y = Math.random() * h;
    const bh2 = 2 + Math.random() * 6;
    const v = Math.floor(60 + Math.random() * 140);
    ctx.fillStyle = `rgba(${v},${v},${v},0.5)`;
    ctx.fillRect(0, y, w, bh2);
  }
  addNoise(ctx, w, h, 20);
}

export function heightUranus(ctx, w, h) {
  ctx.fillStyle = '#888';
  ctx.fillRect(0, 0, w, h);
  for (let i = 0; i < 30; i++) {
    const y = Math.random() * h;
    const bh = 4 + Math.random() * 15;
    const v = Math.floor(60 + Math.random() * 130);
    ctx.fillStyle = `rgba(${v},${v},${v},0.5)`;
    ctx.fillRect(0, y, w, bh);
  }
  for (let i = 0; i < 15; i++) {
    const x = Math.random() * w,
      y = Math.random() * h;
    const rx = 25 + Math.random() * 60,
      ry = 10 + Math.random() * 30;
    ctx.beginPath();
    ctx.ellipse(x, y, rx, ry, Math.random() * Math.PI, 0, Math.PI * 2);
    const v = Math.floor(70 + Math.random() * 120);
    ctx.fillStyle = `rgba(${v},${v},${v},0.35)`;
    ctx.fill();
  }
  addNoise(ctx, w, h, 25);
}

export function heightNeptune(ctx, w, h) {
  ctx.fillStyle = '#777';
  ctx.fillRect(0, 0, w, h);
  for (let i = 0; i < 35; i++) {
    const y = Math.random() * h;
    const bh = 3 + Math.random() * 10;
    const v = Math.floor(50 + Math.random() * 150);
    ctx.fillStyle = `rgba(${v},${v},${v},0.45)`;
    ctx.fillRect(0, y, w, bh);
  }
  const gds = ctx.createRadialGradient(w * 0.38, h * 0.42, 0, w * 0.38, h * 0.42, w * 0.06);
  gds.addColorStop(0, '#111');
  gds.addColorStop(0.6, '#444');
  gds.addColorStop(1, '#777');
  ctx.beginPath();
  ctx.ellipse(w * 0.38, h * 0.42, w * 0.07, h * 0.035, -0.15, 0, Math.PI * 2);
  ctx.fillStyle = gds;
  ctx.fill();
  for (let i = 0; i < 20; i++) {
    const x = Math.random() * w,
      y = Math.random() * h;
    const rx = 15 + Math.random() * 35,
      ry = 6 + Math.random() * 15;
    ctx.beginPath();
    ctx.ellipse(x, y, rx, ry, Math.random(), 0, Math.PI * 2);
    const v = Math.floor(60 + Math.random() * 140);
    ctx.fillStyle = `rgba(${v},${v},${v},0.3)`;
    ctx.fill();
  }
  addNoise(ctx, w, h, 30);
}

export function heightEarth(ctx, w, h) {
  ctx.fillStyle = '#333';
  ctx.fillRect(0, 0, w, h);
  const continents = [
    { x: 0.25, y: 0.35, rx: 0.12, ry: 0.15 },
    { x: 0.28, y: 0.62, rx: 0.08, ry: 0.2 },
    { x: 0.55, y: 0.28, rx: 0.16, ry: 0.13 },
    { x: 0.58, y: 0.55, rx: 0.06, ry: 0.1 },
    { x: 0.72, y: 0.38, rx: 0.13, ry: 0.16 },
    { x: 0.85, y: 0.48, rx: 0.09, ry: 0.12 },
    { x: 0.12, y: 0.42, rx: 0.07, ry: 0.14 },
  ];
  for (const c of continents) {
    const rg = ctx.createRadialGradient(
      c.x * w,
      c.y * h,
      0,
      c.x * w,
      c.y * h,
      Math.max(c.rx, c.ry) * w
    );
    rg.addColorStop(0, '#eee');
    rg.addColorStop(0.5, '#ccc');
    rg.addColorStop(0.8, '#777');
    rg.addColorStop(1, '#333');
    ctx.beginPath();
    ctx.ellipse(c.x * w, c.y * h, c.rx * w, c.ry * h, Math.random() * 0.4, 0, Math.PI * 2);
    ctx.fillStyle = rg;
    ctx.fill();
  }
  for (let i = 0; i < 60; i++) {
    const ci = continents[Math.floor(Math.random() * continents.length)];
    const x = (ci.x + (Math.random() - 0.5) * ci.rx) * w;
    const y = (ci.y + (Math.random() - 0.5) * ci.ry) * h;
    ctx.beginPath();
    ctx.arc(x, y, 3 + Math.random() * 8, 0, Math.PI * 2);
    ctx.fillStyle = `rgb(${200 + Math.floor(Math.random() * 55)},${200 + Math.floor(Math.random() * 55)},${200 + Math.floor(Math.random() * 55)})`;
    ctx.fill();
  }
  addNoise(ctx, w, h, 40);
}

export function heightMoonGeneric(ctx, w, h) {
  ctx.fillStyle = '#888';
  ctx.fillRect(0, 0, w, h);
  heightCraters(ctx, w, h, Math.floor(120 + Math.random() * 150), 2, 12);
  heightCraters(ctx, w, h, Math.floor(15 + Math.random() * 25), 8, 22);
  addNoise(ctx, w, h, 55);
}

export function texMercury(ctx, w, h) {
  const g = ctx.createLinearGradient(0, 0, w, h);
  g.addColorStop(0, '#9a9a9a');
  g.addColorStop(0.3, '#b8b0a0');
  g.addColorStop(0.6, '#8a8278');
  g.addColorStop(1, '#a09888');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
  for (let i = 0; i < 250; i++) {
    const x = Math.random() * w,
      y = Math.random() * h;
    const r = 1 + Math.random() * 12;
    const rg = ctx.createRadialGradient(x, y, 0, x, y, r);
    rg.addColorStop(0, `rgba(50,48,44,${0.25 + Math.random() * 0.2})`);
    rg.addColorStop(0.7, `rgba(70,68,62,${0.1 + Math.random() * 0.1})`);
    rg.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fillStyle = rg;
    ctx.fill();
  }
  for (let i = 0; i < 40; i++) {
    const x = Math.random() * w,
      y = Math.random() * h;
    ctx.beginPath();
    ctx.arc(x, y, 0.5 + Math.random() * 2, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(180,170,160,${0.15 + Math.random() * 0.15})`;
    ctx.fill();
  }
  addNoise(ctx, w, h, 30);
}

export function texVenus(ctx, w, h) {
  const g = ctx.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, '#f0d88a');
  g.addColorStop(0.2, '#e0b858');
  g.addColorStop(0.5, '#d4a040');
  g.addColorStop(0.8, '#dab050');
  g.addColorStop(1, '#e8c470');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
  for (let i = 0; i < 50; i++) {
    const y = Math.random() * h;
    const bh = 2 + Math.random() * 10;
    ctx.fillStyle = `rgba(210,180,90,${0.08 + Math.random() * 0.12})`;
    ctx.fillRect(0, y, w, bh);
  }
  for (let i = 0; i < 30; i++) {
    const x = Math.random() * w,
      y = Math.random() * h;
    const rx = 10 + Math.random() * 40,
      ry = 5 + Math.random() * 15;
    ctx.beginPath();
    ctx.ellipse(x, y, rx, ry, Math.random() * Math.PI, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(230,200,120,${0.06 + Math.random() * 0.08})`;
    ctx.fill();
  }
  addNoise(ctx, w, h, 20);
}

export function texMars(ctx, w, h) {
  const g = ctx.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, '#ede0d4');
  g.addColorStop(0.1, '#d8a880');
  g.addColorStop(0.3, '#c86838');
  g.addColorStop(0.5, '#b84820');
  g.addColorStop(0.7, '#c86838');
  g.addColorStop(0.9, '#d8a880');
  g.addColorStop(1, '#ede0d4');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
  for (let i = 0; i < 20; i++) {
    const x = Math.random() * w,
      y = 0.15 * h + Math.random() * 0.7 * h;
    const rx = 15 + Math.random() * 50,
      ry = 8 + Math.random() * 25;
    ctx.beginPath();
    ctx.ellipse(x, y, rx, ry, Math.random() * Math.PI, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(160,70,30,${0.08 + Math.random() * 0.12})`;
    ctx.fill();
  }
  for (let i = 0; i < 120; i++) {
    const x = Math.random() * w,
      y = 0.15 * h + Math.random() * 0.7 * h;
    const r = 1 + Math.random() * 6;
    const rg = ctx.createRadialGradient(x, y, 0, x, y, r);
    rg.addColorStop(0, `rgba(80,25,8,${0.15 + Math.random() * 0.2})`);
    rg.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fillStyle = rg;
    ctx.fill();
  }
  ctx.beginPath();
  ctx.ellipse(w * 0.35, h * 0.42, w * 0.12, h * 0.06, -0.2, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(100,40,15,0.18)';
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(w * 0.5, h * 0.48);
  ctx.lineTo(w * 0.7, h * 0.5);
  ctx.lineWidth = 2;
  ctx.strokeStyle = 'rgba(90,35,10,0.12)';
  ctx.stroke();
  addNoise(ctx, w, h, 25);
}

export function texJupiter(ctx, w, h) {
  const bands = [
    '#d8c4a0', '#c8a06a', '#a87040', '#dcc8a8', '#c09060', '#8c5830',
    '#d4b888', '#b88858', '#a06838', '#d8c090', '#c4a474', '#9c6c40',
    '#d0b880', '#b88050', '#dcc898',
  ];
  const bh = h / bands.length;
  bands.forEach((col, i) => {
    ctx.fillStyle = col;
    ctx.fillRect(0, i * bh, w, bh + 1);
  });
  for (let i = 0; i < 40; i++) {
    const y = Math.random() * h;
    const wave = Math.sin(y * 0.05) * 3;
    ctx.beginPath();
    ctx.moveTo(0, y);
    for (let x = 0; x < w; x += 4) {
      ctx.lineTo(x, y + Math.sin(x * 0.02 + wave) * (1 + Math.random() * 2));
    }
    ctx.lineWidth = 1 + Math.random() * 2;
    ctx.strokeStyle = `rgba(140,90,40,${0.06 + Math.random() * 0.08})`;
    ctx.stroke();
  }
  for (let i = 0; i < 15; i++) {
    const x = Math.random() * w,
      y = Math.random() * h;
    const rx = 4 + Math.random() * 15,
      ry = 2 + Math.random() * 6;
    ctx.beginPath();
    ctx.ellipse(x, y, rx, ry, Math.random(), 0, Math.PI * 2);
    ctx.fillStyle = `rgba(180,120,60,${0.06 + Math.random() * 0.08})`;
    ctx.fill();
  }
  ctx.beginPath();
  ctx.ellipse(w * 0.62, h * 0.55, w * 0.09, h * 0.04, 0, 0, Math.PI * 2);
  ctx.fillStyle = '#b85028';
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(w * 0.62, h * 0.55, w * 0.065, h * 0.025, 0, 0, Math.PI * 2);
  ctx.fillStyle = '#d06838';
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(w * 0.62, h * 0.54, w * 0.03, h * 0.012, 0, 0, Math.PI * 2);
  ctx.fillStyle = '#e08850';
  ctx.fill();
  addNoise(ctx, w, h, 15);
}

export function texSaturn(ctx, w, h) {
  const bands = [
    '#eedcc0', '#dcc8a0', '#ccb488', '#d8c498', '#c4a878',
    '#d0bc90', '#c8b080', '#dcc898', '#c8ac78', '#d4c090',
    '#c0a870', '#d8c898',
  ];
  const bh = h / bands.length;
  bands.forEach((col, i) => {
    ctx.fillStyle = col;
    ctx.fillRect(0, i * bh, w, bh + 1);
  });
  for (let i = 0; i < 30; i++) {
    const y = Math.random() * h;
    ctx.beginPath();
    ctx.moveTo(0, y);
    for (let x = 0; x < w; x += 4) {
      ctx.lineTo(x, y + Math.sin(x * 0.015) * (0.5 + Math.random()));
    }
    ctx.lineWidth = 0.5 + Math.random() * 1.5;
    ctx.strokeStyle = `rgba(170,140,90,${0.04 + Math.random() * 0.06})`;
    ctx.stroke();
  }
  for (let i = 0; i < 8; i++) {
    const x = Math.random() * w,
      y = Math.random() * h;
    const rx = 6 + Math.random() * 20,
      ry = 2 + Math.random() * 5;
    ctx.beginPath();
    ctx.ellipse(x, y, rx, ry, Math.random() * 0.3, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(200,180,130,${0.04 + Math.random() * 0.06})`;
    ctx.fill();
  }
  addNoise(ctx, w, h, 12);
}

export function texUranus(ctx, w, h) {
  const g = ctx.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, '#b8e8f0');
  g.addColorStop(0.2, '#8ed0e0');
  g.addColorStop(0.5, '#6cc0d4');
  g.addColorStop(0.8, '#88cce0');
  g.addColorStop(1, '#aadce8');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
  for (let i = 0; i < 20; i++) {
    const y = Math.random() * h;
    const bh = 2 + Math.random() * 8;
    ctx.fillStyle = `rgba(140,220,240,${0.06 + Math.random() * 0.08})`;
    ctx.fillRect(0, y, w, bh);
  }
  for (let i = 0; i < 10; i++) {
    const x = Math.random() * w,
      y = Math.random() * h;
    const rx = 8 + Math.random() * 30,
      ry = 4 + Math.random() * 10;
    ctx.beginPath();
    ctx.ellipse(x, y, rx, ry, Math.random() * Math.PI, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(160,230,245,${0.04 + Math.random() * 0.06})`;
    ctx.fill();
  }
  addNoise(ctx, w, h, 15);
}

export function texNeptune(ctx, w, h) {
  const g = ctx.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, '#5080d8');
  g.addColorStop(0.25, '#3860c4');
  g.addColorStop(0.5, '#2c50b0');
  g.addColorStop(0.75, '#3860c4');
  g.addColorStop(1, '#4c78d0');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
  for (let i = 0; i < 25; i++) {
    const y = Math.random() * h;
    ctx.beginPath();
    ctx.moveTo(0, y);
    for (let x = 0; x < w; x += 4) {
      ctx.lineTo(x, y + Math.sin(x * 0.025 + Math.random()) * (1 + Math.random() * 2));
    }
    ctx.lineWidth = 1 + Math.random() * 2;
    ctx.strokeStyle = `rgba(50,70,160,${0.06 + Math.random() * 0.1})`;
    ctx.stroke();
  }
  ctx.beginPath();
  ctx.ellipse(w * 0.38, h * 0.42, w * 0.06, h * 0.025, -0.15, 0, Math.PI * 2);
  ctx.fillStyle = '#6090e0';
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(w * 0.38, h * 0.42, w * 0.035, h * 0.014, -0.15, 0, Math.PI * 2);
  ctx.fillStyle = '#78a8f0';
  ctx.fill();
  for (let i = 0; i < 8; i++) {
    const x = Math.random() * w,
      y = Math.random() * h;
    const rx = 5 + Math.random() * 15,
      ry = 2 + Math.random() * 6;
    ctx.beginPath();
    ctx.ellipse(x, y, rx, ry, Math.random(), 0, Math.PI * 2);
    ctx.fillStyle = `rgba(80,110,200,${0.05 + Math.random() * 0.07})`;
    ctx.fill();
  }
  addNoise(ctx, w, h, 18);
}

export function texEarth(ctx, w, h) {
  ctx.fillStyle = '#1a4a7a';
  ctx.fillRect(0, 0, w, h);
}
