import type { ExampleSketch } from "./types";

/**
 * Copy this file, rename it (e.g. my-design.ts), fill in the fields, then register
 * the export in ./index.ts inside EXAMPLE_SKETCHES.
 *
 * Do not import this file in index.ts — it is documentation only.
 */
export const templateExample: ExampleSketch = {
  id: "so_basic",
  title: "My design title",
  description: "What this example shows",
  source: `// Your sketch here (chain style)
await twill(3, 3, 0, 0).display();

// Or functional style:
// display(await twill(3, 3, 0, 0));
`
};
