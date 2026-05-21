/** Metadata + sketch source for a loadable example design. */
export type ExampleSketch = {
  /** Unique slug (filename-friendly), e.g. "twill-oscillator". */
  id: string;
  /** Short label shown in docs or UI later. */
  title: string;
  /** One-line description of what the sketch demonstrates. */
  description: string;
  /**
   * TypeScript sketch body (top-level await allowed).
   * Use helpers from addons: twill, satin, tabby, tile, shift, interlace,
   * addColors, oscillator, renderCount, random, etc.
   */
  source: string;
};
