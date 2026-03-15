# UniverseSimulator

A 3D interactive universe simulator built with Three.js. Explore from Earth to the cosmic web—zoom from our solar system to nearby stars, the Milky Way galaxy, local group, superclusters, and the observable universe.

## Features

- **Solar System**: Earth at center, Sun and planets with procedural textures, moons, asteroid belt, Kuiper belt, dwarf planets, and comets
- **Stellar Neighborhood**: Nearby stars (Alpha Centauri, Sirius, Betelgeuse, etc.)
- **Milky Way Galaxy**: Spiral arms, Sagittarius A* black hole, nebulae (Orion, Eagle, Crab, etc.)
- **Local Group**: Andromeda, Triangulum, Magellanic Clouds, and dwarf galaxies
- **Superclusters**: Laniakea and Pisces-Cetus
- **Cosmic Web**: Filaments and CMB boundary

## Verification

To verify all modules load correctly, serve the project and open `test-modular.html` in a browser. See `VERIFICATION.md` for details.

## Getting Started

1. Serve the project with a local server (required for ES modules):
   ```bash
   npx serve .
   ```
   Or use any static file server.

2. Open `http://localhost:3000` (or your server's URL)

## Controls

- **Orbit**: Click and drag to rotate the view
- **Zoom**: Scroll to zoom in/out
- **Click objects**: Focus on planets, stars, nebulae, or galaxies
- **Return to Earth**: Button to reset view
- **Overarching Map**: 2D zoomable map of the universe
- **Center**: Aerial view of the solar system

## Project Structure

```
UniverseSimulator/
├── index.html
├── styles.css
├── README.md
├── .gitignore
└── src/
    ├── main.js              # Entry point (orchestrates all modules)
    ├── config.js            # Configuration constants
    ├── core/
    │   ├── scene.js         # Three.js scene, camera, renderer, circleTex
    │   └── lighting.js      # Ambient/camera lights, brightness control
    ├── textures/
    │   └── planetTextures.js  # Procedural planet textures & height maps
    ├── objects/
    │   ├── starfield.js     # Starfield and cosmic dust
    │   └── earth.js         # Earth globe with clouds
    ├── solar/
    │   └── solarSystem.js   # Sun, planets, moons, belts, comets
    └── state/
        └── navigation.js    # Shared focus/camera state
```

**Note:** Extracted modules (`core/`, `textures/`, `objects/`, `solar/`, `state/`) provide a clean separation of concerns. `main.js` is the working entry point; the modules serve as reference implementations and can be wired in for a fully modular build.

## Tech Stack

- [Three.js](https://threejs.org/) - 3D rendering
- Vanilla JavaScript (ES modules)
- No build step required
