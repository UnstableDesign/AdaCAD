


import type { ExampleSketch } from "./types";

export const driftingTwills: ExampleSketch = {
  id: "drifting-twills",
  title: "Drifting Twills",
  description: "twills that drift over time",
  source: `
    // Drifting Twills by Laura Devendorf

  const timer = renderCount(1);

  const base_twill = await twill(6,6,timer,0);
  const shifted_twill = await shift(base_twill, timer, 1);
  const down_symmetric_twill = await symmetry(shifted_twill, 7, 0);
  const side_symmetric_twill = await symmetry(shifted_twill, 6, 0);
  const joined = await join([down_symmetric_twill, side_symmetric_twill], 1);
  
  
  const sized = await resize(joined, 400, 200);
  
  
  display(sized, false, false);
    `,
};




