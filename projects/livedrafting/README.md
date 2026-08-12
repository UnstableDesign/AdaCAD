# Live Drafting

A Hydra-style live-coding environment for AdaCAD weaving drafts. Edit TypeScript in an overlay editor, run your sketch, and see the result as a fullscreen draft behind the code.

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

Open the URL Vite prints (typically `http://localhost:5173`).

## Using the app

### Playback

| Control | Behavior |
|---------|----------|
| **Play** | Re-runs the sketch on a timer (animated sketches, `oscillator()`, `renderCount()`, etc.) |
| **Pause** | Stops automatic runs; editor changes do not update the draft until you Play or Step |
| **Step** | Runs one frame while paused |
| **FPS** | Frame rate for Play mode (0.25–60); saved in `localStorage` as `livedrafting-fps` |

Press **Ctrl+Shift+Enter** (**Cmd+Shift+Enter** on Mac) to run immediately while playing.

### Other controls

| Control | Behavior |
|---------|----------|
| **Example** | Loads a random example sketch from `src/examples/` |
| **Download** | Visible when paused — saves a color PNG (current on-screen view) and a 1-bit-per-cell BMP |

### Loading a sketch

On page load, sketch source is chosen in this order:

1. **URL** — `?example=<id>` forces a specific example (overrides saved work)
2. **Saved sketch** — `localStorage` key `livedrafting-sketch`
3. **Random example** — first visit with no saved sketch

Examples:

```
http://localhost:5173/?example=dirty-bits
http://localhost:5173/?example=no-signal
```

Registered example ids: `no-signal`, `dirty-bits`, `public_transit`, `waffle-rainbow`, `drifting-twills`.

See [About](/about.html) for the full **color palette** (indices 0–29 for `addColors()`).

## Example sketches

Examples live in `src/examples/`. Copy `_template.ts`, fill in your sketch, and register it in `index.ts`. See `src/examples/README.md` for details.

| id | title |
|----|-------|
| `no-signal` | No Signal |
| `dirty-bits` | Dirty Bits |
| `public_transit` | Public Transit |
| `waffle-rainbow` | Waffle Rainbow |
| `drifting-twills` | Drifting Twills |

## Sketch API

Sketches are async TypeScript compiled in the browser with `esbuild-wasm` and executed in a sandbox. Use top-level `await`.

Structure builders (`waffle`, `twill`, `tabby`, …) return a **`LiveDraft`** — chain methods or `await` it as a plain `Draft`.

### Chaining

```typescript
const osc1 = Math.round(oscillator(1, 10));
const osc2 = Math.round(oscillator(1, 20));
const s1 = tabby(osc1, osc1, osc1, osc1);
const s2 = tabby(osc2, osc2, osc2, osc2);

await waffle(4, 3)
  .stretch(20, 20)
  .fill(s1, s2)
  .addColors([1, 2, 3, 4, 5, 6], [7, 8, 9, 10, 11, 12])
  .display(true, false);
```

### Core (`adacad-drafting-lib`)

| Symbol | Description |
|--------|-------------|
| `getOp(name)` | Look up an operation by internal name |
| `call(op, params, inlets?)` | Run an operation |
| `initDraft()` / `initDraftWithParams(params)` | Create a draft |
| `draft(existing)` | Wrap a draft for chaining |
| `display(draft, use_color?, floats?)` | Draw a raw `Draft` (functional style) |

### Animation

| Symbol | Description |
|--------|-------------|
| `oscillator(min, max, options?)` | Sine wave (`frequency`, `phase`) |
| `renderCount(multiplier?)` | Count of `display()` calls |

### Structures → `LiveDraft`

`twill`, `satin`, `tabby`, `waffle`, `random`, `interlace`, `join`

### `LiveDraft` methods

`.stretch()`, `.shift()`, `.symmetry()`, `.addColors()`, `.tile()`, `.resize()`, `.fill(black, white)`, `.display(use_color?, floats?)`

### Functional style (still supported)

`stretch(draft, …)`, `fill(pattern, black, white)`, etc. — use `await waffle(4, 3)` to get a `Draft`.

### Starter sketch

```typescript
const raised = Math.round(oscillator(1, 5));
const lowered = Math.round(oscillator(2, 4));
await twill(raised, lowered, 0, 0).display();
```

### Color

```typescript
await twill(3, 3, 0, 0)
  .addColors([2, 5, 8], [10, 14, 18])
  .display(true);
```

## Project layout

```
projects/livedrafting/
  index.html          Main editor
  about.html          About + color palette reference
  src/
    main.ts           App shell, playback, examples button
    examples/         Example sketch registry
    runtime/          Executor, display, addons, download, color palette
    editor/           CodeMirror setup
```

## Limitations

- Code runs via `esbuild-wasm` and `Function()` — fine for local creative use, not a security sandbox.

## Production build

```bash
npm run build:all   # adacad-drafting-lib + vite
npm run preview
```

Build output is `dist/` (`index.html`, `about.html`, assets, `esbuild.wasm`).

## Deploy (Firebase Hosting)

Live Drafting is configured as a **separate Firebase project** from main AdaCAD. See **[FIREBASE.md](./FIREBASE.md)** for one-time setup.

```bash
cd projects/livedrafting
npm install
npm run deploy
```

Default project id: `livedrafting-adacad` (edit `.firebaserc` if yours differs).
