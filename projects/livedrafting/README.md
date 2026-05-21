# LiveDrafting

A Hydra-style live-coding environment for AdaCAD weaving drafts. Edit TypeScript in the overlay editor, press **Ctrl+Shift+Enter** (Cmd+Shift+Enter on Mac) to run, and see the result as a fullscreen draft image.

## Prerequisites

Build `adacad-drafting-lib` first (the app imports compiled `dist/`):

```bash
cd packages/adacad-drafting-lib
npm install
npm run build
```

## Development

```bash
cd projects/livedrafting
npm install
npm run dev
```

Open the URL Vite prints (typically `http://localhost:5173`). The sketch re-runs automatically every second so values like `oscillator()` animate; press **Ctrl+Shift+Enter** to run immediately after editing.

## Starter sketch

The default sketch runs the `twill` operation (no inlets required):

```typescript
const twill = getOp('twill');
const outputs = await call(twill, [3, 3, 0, 0]);
display(outputs[0].draft);
```

## API available in sketches

| Symbol | Description |
|--------|-------------|
| `getOp(name)` | Look up an operation by internal name |
| `call(op, params, inlets?)` | Run an operation |
| `display(draft)` | Draw a draft as the fullscreen background |
| `initDraft()` | Create an empty draft |
| `initDraftWithParams(params)` | Create a draft with options |
| `oscillator(min, max, options?)` | LiveDrafting-only sine oscillator in `[min, max]` (see below) |

### `oscillator(min, max, options?)`

Local to LiveDrafting (not in `adacad-drafting-lib`). Returns a value between `min` and `max` using a sine wave over time, so re-running the sketch (Ctrl+Shift+Enter) samples a new point along the cycle.

```typescript
const raised = Math.round(oscillator(1, 6));
const lowered = Math.round(oscillator(2, 5, { frequency: 0.1 }));
const twill = getOp('twill');
const outputs = await call(twill, [raised, lowered, 0, 0]);
display(outputs[0].draft);
```

Optional `options`: `frequency` (cycles per second, default `0.25`), `phase` (radians, default `0`).

Sketches are saved in `localStorage` under `livedrafting-sketch`.

## Limitations

- Imports the full operations bundle (large, same as the mixer).
- Operations that need p5, file inputs, or complex dynamic inlets may not work.
- `display()` uses black/white draft view only (no yarn colors in v1).
- Code runs in the browser via `esbuild-wasm` and `Function()` — suitable for local creative use, not a security sandbox.

## Production build

```bash
npm run build
npm run preview
```
