import {
  getSketchFromUrlExample,
  pickRandomExampleSketch,
} from "./examples";

export const STORAGE_KEY = "livedrafting-sketch";

/**
 * Sketch for first editor load.
 * Priority: URL `?example=<id>` → saved localStorage → random example.
 */
export function resolveInitialSketch(): {
  source: string;
  url_error: string | null;
} {
  const from_url = getSketchFromUrlExample();
  if (from_url !== null) {
    if ("error" in from_url) {
      return { source: pickRandomExampleSketch(), url_error: from_url.error };
    }
    return { source: from_url.source, url_error: null };
  }

  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved !== null) {
    return { source: saved, url_error: null };
  }

  return { source: pickRandomExampleSketch(), url_error: null };
}
