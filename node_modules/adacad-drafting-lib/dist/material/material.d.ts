import { MaterialImport, Material, MaterialsList } from "./types";
export declare const createMaterial: (matDict: MaterialImport) => Material;
export declare const setMaterialID: (m: Material, id: number) => Material;
export declare const getMaterialStretch: (m: Material) => number;
export declare const setMaterialStretch: (m: Material, stretch: number) => Material;
/**
 * given a list of material mappings, returns a list where they are all the same size,
 * @param systems the material mappings to compare
 */
export declare const standardizeMaterialLists: (shuttles: Array<Array<number>>) => Array<Array<number>>;
export declare const getDiameter: (id: number, ms: MaterialsList) => number;
export declare const getColorForSim: (id: number, ms: MaterialsList) => number | "0x000000";
