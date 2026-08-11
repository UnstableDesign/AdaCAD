



import type { ExampleSketch } from "./types";

export const waves: ExampleSketch = {
    id: "waves",
    title: "Waves",
    description: "",
    source: `


    const rc = renderCount(1);
    const osc1 = Math.round(oscillator(10, 20, .5));
    const osc2 = Math.round(oscillator(8, 4));
    const t1 = await waffle(osc1+10, 4);
    const t2 = await waffle(osc2+15, 4);
    const t3 = await shift(t2, rc, rc);
    const base = await interlace([t1, t3], false);
    const color = await addColors(base, [3,8], [10]);
    const d = await tile(color, 15,5, 0, 0);
    display(d, true, false);
    
    
  `,
};






