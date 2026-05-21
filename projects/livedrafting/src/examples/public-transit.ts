import type { ExampleSketch } from "./types";

export const publicTransit: ExampleSketch = {
    id: "public_transit",
    title: "Public Transit",
    description: "reminds me of upholstery used on busses and trains",
    source: `// Laura Devendorf
    const rc = renderCount(1);
  const raised = Math.round(oscillator(10, 20, .5));
  const lowered = Math.round(oscillator(8, 4));
  const t1 = await waffle(10-raised, Math.floor(raised/2));
  const t2 = await twill(raised, 20-raised, 1, 0);
  const t3 = await shift(t2, 1, rc);
  const t4 = await shift(t1, rc, 3);
  const base = await interlace([t4, t3], false);
  const color = await addColors(base, [2,3], [10]);
  const d = await tile(color, 15,5,1, 50);
  display(d, true, false);
  `
}
