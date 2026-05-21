# Example sketches

Starter designs for Live Drafting. On first load (no saved sketch in `localStorage`), one example is chosen at random from `EXAMPLE_SKETCHES` in `index.ts`. Use the **Example** button in the top bar anytime to load another random design.

### Force a specific example via URL

Add `?example=<id>` to the page URL (overrides saved sketches):

```
http://localhost:5173/?example=dirty-bits
```

The `id` must match an entry in `EXAMPLE_SKETCHES` (e.g. `no-signal`, `dirty-bits`, `public-transit`). Unknown ids show an error and fall back to a random example.

## Add a new example

1. Copy `_template.ts` to a new file, e.g. `satin-wave.ts`.
2. Fill in `id`, `title`, `description`, and `source` (the sketch code).
3. Import and append your export in `index.ts`:

```ts
import { satinWave } from "./satin-wave";

export const EXAMPLE_SKETCHES: ExampleSketch[] = [
  twillOscillator,
  plainTwill,
  satinWave, // add here
];
```

## Sketch rules

- Code runs in the sandbox documented on the About page (`twill`, `display`, `oscillator`, etc.).
- Use top-level `await` as needed.
- Call `display(draft)` (or `display(draft, true)` for color) so something appears on the canvas.

## Files

| File | Purpose |
|------|---------|
| `types.ts` | `ExampleSketch` type |
| `_template.ts` | Copy-paste starter (not loaded automatically) |
| `index.ts` | Registry + `pickRandomExampleSketch()` |
| `*.ts` | One file per example design |
