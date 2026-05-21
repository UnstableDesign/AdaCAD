
import type { ExampleSketch } from "./types";

export const dirtyBits: ExampleSketch = {
  id: "dirty-bits",
  title: "Dirty Bits",
  description: "random function makes it crunchy",
  source: `
  // Laura Devendorf
const rc = renderCount(1);
const raised = Math.round(oscillator(10, 20, .5));
const lowered = Math.round(oscillator(4, 8));
const t1 = await tabby(raised, lowered, 1,1);
const t2 = await random(raised, 20-raised+1);
const r1 = await resize(t1, 60, 50);
const t3 = await shift(t2, 1, rc);
const t4 = await shift(r1, rc, 3);
const base = await interlace([t4, t3], false);
const color = await addColors(base, [2,3], [10]);
const d = await tile(color, 15,5,1, 50);
display(d, true, false);
  `,
};



