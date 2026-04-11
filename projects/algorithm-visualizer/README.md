# Algorithm Visualizer

Standalone Vite + raw Three.js playground for visualizing `adacad-drafting-lib` algorithm output as 3D geometry.

## Prerequisites

- Node.js and npm
- Local AdaCAD repo checked out with `packages/adacad-drafting-lib`

## Run Order

1. Build the local drafting library:

```bash
npm run --prefix "/Users/lade1037/Dev/AdaCAD/packages/adacad-drafting-lib" build
```

2. Install visualizer dependencies:

```bash
npm install --prefix "/Users/lade1037/Dev/AdaCAD/projects/algorithm-visualizer"
```

3. Start the visualizer in dev mode:

```bash
npm run --prefix "/Users/lade1037/Dev/AdaCAD/projects/algorithm-visualizer" dev
```

4. (Optional) Production build:

```bash
npm run --prefix "/Users/lade1037/Dev/AdaCAD/projects/algorithm-visualizer" build
```

## What Is Implemented

- Three.js scene bootstrap with camera, lights, orbit controls, and animation loop.
- `sampleDraft` generator using `adacad-drafting-lib`.
- `draftAdapter` conversion from draft drawdown cells to instanced Three.js box meshes.
- Basic visual differentiation of `is_up`, `is_down`, and `unset` cells.

## Next Iteration

Add a `currentStep` state and recompute geometry on step changes to scrub algorithm stages.
