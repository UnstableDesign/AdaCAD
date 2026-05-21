

import type { ExampleSketch } from "./types";

export const noSignal: ExampleSketch = {
    id: "no-signal",
    title: "No Signal",
    description: "black and white TV static",
    source: `
// Laura Devendorf
const rc = renderCount(1);
const osc1 = Math.round(oscillator(10, 20, .5));
const osc2 = Math.round(oscillator(4, 8));
const t1 = await tabby(osc1, osc2, rc, 1);
const t2 = await twill(osc1, 8-osc2+1);
const r1 = await resize(t1, 60, 50);
const r2 = await resize(t2, 30, 25)
const t3 = await shift(r2, 1, rc);
const t4 = await shift(r1, rc, 3);
const base = await interlace([t4, t3], true);
const d = await tile(base, 2,3,1, 50);
display(d, false, false);
  `,
};







