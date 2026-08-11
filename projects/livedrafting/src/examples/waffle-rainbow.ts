



import type { ExampleSketch } from "./types";

export const waffleRainbow: ExampleSketch = {
    id: "waffle-rainbow",
    title: "Waffle Rainbow",
    description: "waffle with rainbow colors",
    source: `// Waffle Rainbow by Laura Devendorf
const osc1 = Math.round(oscillator(1, 10, { frequency: 0.5 }));
const osc2 = Math.round(oscillator(1, 20, { frequency: 0.5 }));

const s1 = tabby(osc1, osc1, osc1, osc1);
const s2 = tabby(osc2, osc2, osc2, osc2);

await waffle(4, 3)
  .stretch(20, 20)
  .fill(s1, s2)
  .addColors([1, 2, 3, 4, 5, 6], [7, 8, 9, 10, 11, 12])
  .display(true, false);
`,
};





