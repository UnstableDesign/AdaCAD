



import type { ExampleSketch } from "./types";

export const waffleRainbow: ExampleSketch = {
    id: "waffle-rainbow",
    title: "Waffle Rainbow",
    description: "waffle with rainbow colors",
    source: `
    // Waffle Rainbow by Laura Devendorf
    const osc1 = Math.round(oscillator(1, 10, .5));
    const osc2 = Math.round(oscillator(1, 20, .5));
    
    const t1 = await waffle(4, 3);
    const t2 = await stretch(t1, 20, 20);
    
    const s1 = await tabby(osc1,osc1,osc1,osc1);
    const s2 = await tabby(osc2,osc2,osc2,osc2);
    
    
    const filled = await fill(t2, s1, s2);
    const color = await addColors(filled, [1,2,3,4,5,6], [7,8,9,10,11,12]);
    display(color, true, false);
    
  `,
};





