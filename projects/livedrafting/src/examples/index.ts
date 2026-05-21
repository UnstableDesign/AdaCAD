import type { ExampleSketch } from "./types";
import { dirtyBits } from "./dirty-bits";
import { publicTransit } from "./public-transit";
import { noSignal } from "./no-signal";
import { waffleRainbow } from "./waffle-rainbow";
import { driftingTwills } from "./drifting_twills";

/**
 * All examples eligible for random load on first visit.
 * Add new entries here after creating a file from ./_template.ts
 */
export const EXAMPLE_SKETCHES: ExampleSketch[] = [
  noSignal,
  dirtyBits,
  publicTransit,
  waffleRainbow,
  driftingTwills,
];

export type { ExampleSketch } from "./types";

const FALLBACK_SKETCH = `const draft = await twill(3, 3, 0, 0);
display(draft);
`;

/** Pick a random example sketch source string. */
export function pickRandomExampleSketch(): string {
  if (EXAMPLE_SKETCHES.length === 0) {
    return FALLBACK_SKETCH;
  }
  const index = Math.floor(Math.random() * EXAMPLE_SKETCHES.length);
  return EXAMPLE_SKETCHES[index].source;
}

/** Look up an example by id. */
export function getExampleById(id: string): ExampleSketch | undefined {
  return EXAMPLE_SKETCHES.find((example) => example.id === id);
}

const URL_EXAMPLE_PARAM = "example";

/** Example id from `?example=<id>` if present. */
export function getExampleIdFromUrl(): string | null {
  const id = new URLSearchParams(window.location.search).get(URL_EXAMPLE_PARAM);
  if (id === null) {
    return null;
  }
  const trimmed = id.trim();
  return trimmed.length > 0 ? trimmed : null;
}

/** Sketch source forced by the URL, or null if param absent / unknown id. */
export function getSketchFromUrlExample(): { source: string } | { error: string } | null {
  const id = getExampleIdFromUrl();
  if (id === null) {
    return null;
  }
  const example = getExampleById(id);
  if (example === undefined) {
    const available = EXAMPLE_SKETCHES.map((e) => e.id).join(", ");
    return { error: `Unknown example "${id}". Available: ${available}` };
  }
  return { source: example.source };
}
