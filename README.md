# UniverseSimulator

A 3D interactive universe simulator built with Three.js. Explore from Earth to the cosmic web—zoom from our solar system to nearby stars, the Milky Way galaxy, local group, superclusters, and the observable universe.

## Download

- [Download for Mac (.dmg)](https://github.com/siddharth12-21/UniverseSimulator/releases/latest)

## Live Site

- [UniverseSimulator Live](https://siddharth12-21.github.io/UniverseSimulator-site/)

## Features

- **Solar System**: Earth at center, Sun and planets with procedural textures, moons, asteroid belt, Kuiper belt, dwarf planets, and comets
- **Stellar Neighborhood**: Nearby stars (Alpha Centauri, Sirius, Betelgeuse, etc.)
- **Milky Way Galaxy**: Spiral arms, Sagittarius A* black hole, nebulae (Orion, Eagle, Crab, etc.)
- **Local Group**: Andromeda, Triangulum, Magellanic Clouds, and dwarf galaxies
- **Superclusters**: Laniakea and 28 superclusters with streamlines and filament bridges
- **Galaxy Walls**: 6 distinct large-scale structures (CfA2, Sloan, Hercules-Corona Borealis, Southern, Boss, Pisces-Cetus) with 290+ light clusters, batched bridge particles, and permanent purple labels
- **Hero Filament**: Transitional filament from Milky Way to superclusters that progressively thins to match streamline thickness before revealing the cosmic web
- **Cosmic Web**: Filaments, CMB boundary, zoom range up to 100M units

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
    ├── main.js              # Entry point, animation loop, scale layers, map
    ├── config.js            # Configuration constants (zoom limits, distances)
    ├── core/
    │   ├── scene.js         # Three.js scene, camera, renderer, bloom, textures
    │   └── lighting.js      # Ambient/camera lights, brightness control
    ├── textures/
    │   └── planetTextures.js  # Procedural planet textures & height maps
    ├── objects/
    │   ├── starfield.js     # Starfield and cosmic dust
    │   └── earth.js         # Earth globe with clouds
    ├── solar/
    │   └── solarSystem.js   # Sun, planets, moons, belts, comets
    ├── galaxy/
    │   └── galaxy.js       # Milky Way, Local Group, stellar neighborhood, gold haze
    ├── cosmic/
    │   └── cosmic.js       # Superclusters, galaxy walls, filaments, cosmic web, CMB
    ├── data/
    │   └── facts.js        # Planet/cosmic facts, object stats, travel times
    ├── state/
    │   └── navigation.js   # Focus target, flying state
    └── ui/
        └── ui.js           # Info panel, search, tour, time controls, scale indicator
```

## Tech Stack

- [Three.js](https://threejs.org/) - 3D rendering
- Vanilla JavaScript (ES modules)
- No build step required
