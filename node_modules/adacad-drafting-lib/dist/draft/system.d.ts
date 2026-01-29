import { InitSystemParams, System } from "./types";
export declare const createSystem: (systemDict: InitSystemParams) => System;
export declare const setSystemId: (sys: System, id: number) => System;
export declare const getSystemChar: (sys: System) => string;
export declare const getSystemCharFromId: (id: number) => string;
/**
  * takes system maps and makes them all unique by adding a base value to the n+1th map. This helps when interlacing
  * drafts that have different system mappings, and making sure they are each unique.
  * This function will also return standard sized arrays = to the maximum sized input
 * @param systems a 2D array of systems, each row representing a the systems of a different draft.
 * @returns
 */
export declare const makeSystemsUnique: (systems: Array<Array<number>>) => Array<Array<number>>;
