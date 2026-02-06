import { Cell } from "./types";
export declare const createCell: (setting: boolean | null) => Cell;
export declare const toggleHeddle: (c: Cell) => Cell;
export declare const createCellFromSequenceVal: (val: number) => Cell;
export declare const setCellValue: (c: Cell, value: boolean | null) => Cell;
export declare const getCellValue: (c: Cell) => boolean | null;
export declare const cellToSequenceVal: (c: Cell) => number;
