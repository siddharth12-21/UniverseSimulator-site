# Verification Guide

## Quick Checks

### 1. Main App (current entry point)
The main app uses `src/main.js` (standalone, no module imports). It should work when served.

```bash
cd UniverseSimulator
npx serve .   # or: python3 -m http.server 8000
# Open http://localhost:3000 (or 8000)
```

**Expected:** 3D universe loads, you can orbit, zoom, click planets.

### 2. Module Test Page
Open `test-modular.html` in a browser (must be served, not file://):

```bash
npx serve .
# Open http://localhost:3000/test-modular.html
```

**Expected:** Green checkmarks for all 8 modules (config, scene, lighting, textures, state, starfield, earth, solar).

### 3. Static File Check
All key files return 200 when requested:
- `/` and `/index.html`
- `/src/main.js`
- `/src/config.js`
- `/src/core/scene.js`, `/src/core/lighting.js`
- `/src/textures/planetTextures.js`
- `/src/objects/starfield.js`, `/src/objects/earth.js`
- `/src/solar/solarSystem.js`
- `/src/state/navigation.js`

## Module Dependency Graph

```
config.js (no deps)
    ↓
core/scene.js (no deps) ← core/lighting.js
    ↓
textures/planetTextures.js (no deps)
    ↓
objects/starfield.js ← scene
objects/earth.js ← scene, textures, config
    ↓
solar/solarSystem.js ← scene, earth, textures
state/navigation.js (no deps)
```

## Known Limitations

- **main.js** does not yet import from the modules; it runs standalone.
- Modules require a browser (use `document`, `THREE` from CDN).
- Node.js cannot run the modules directly (no DOM, ESM from URLs).
