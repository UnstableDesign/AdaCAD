import { Cell, CompressedDraft, Draft, Drawdown, InitDraftParams } from "./types";
import { Material } from "../material/types";
import { DraftCellColor } from "../media/types";
/**
 * generates an empty draft with a unique id
 * @returns
 */
export declare const initDraft: () => Draft;
/**
 * generates a deep copy of the input draft
 * @returns
 */
export declare const copyDraft: (d: Draft) => Draft;
/**
 * initializes a draft with the parameters provided. If the draft is too large to render, an error will be returned.
 * @param params
 * @returns
 */
export declare const initDraftWithParams: (params: InitDraftParams) => Draft;
/**
 * creates a draft using only information from a drawdown (no system or column information)
 * @returns
 */
export declare const initDraftFromDrawdown: (drawdown: Drawdown) => Draft;
/**
 * generates a new draft from the paramters specified.
 * @param pattern
 * @param gen_name
 * @param ud_name
 * @param rowShuttleMapping
 * @param rowSystemMapping
 * @param colShuttleMapping
 * @param colSystemMapping
 * @returns
 */
export declare const createDraft: (pattern: Drawdown, gen_name: string, ud_name: string, rowShuttleMapping: Array<number>, rowSystemMapping: Array<number>, colShuttleMapping: Array<number>, colSystemMapping: Array<number>) => Draft;
/**
 * calcualte the number of wefts (rows) in a pattern
 * @param d a drawdown or any 2D array
 * @returns the number of rows of 0 if undefined
 */
export declare const wefts: (d: Drawdown | Array<Array<boolean>>) => number;
/**
 * calcualte the number of warps (cols) in a pattern
 * @param d a drawdown or any 2D array
 * @returns the number of cols of 0 if undefined
 */
export declare const warps: (d: Drawdown | Array<Array<boolean>>) => number;
/**
 * check if the giver interlacement within the size of the draft
 * @param i the selected weft
 * @param j the selected warp
 * @returns true/false
 */
export declare const hasCell: (d: Drawdown, i: number, j: number) => boolean;
/**
 * checks if the cells in the provided drawdown is up
 * @param d the drawdown
 * @param i weft
 * @param j warp
 * @returns true if set and up, false if set and down or unset
 */
export declare const isUp: (d: Drawdown, i: number, j: number) => boolean;
/**
 * checks if the cells in the provided drawdown is set or unset
 * @param d the drawdown
 * @param i weft
 * @param j warp
 * @returns true if set and up or down, false if unset
 */
export declare const isSet: (d: Drawdown, i: number, j: number) => boolean;
/**
 * sets the heddle at the specified location to the value provided
 * @param d drawdown
 * @param i weft
 * @param j warp
 * @param bool the value (true for up, false for down, null for unset)
 * @returns
 */
export declare const setHeddle: (d: Drawdown, i: number, j: number, bool: boolean) => Drawdown;
/**
 * get the value of the heddle at a given location
 * @param d the drawdown
 * @param i the weft row
 * @param j the warp col
 * @returns the heddle value (true, false or null for unset)
 */
export declare const getHeddle: (d: Drawdown, i: number, j: number) => boolean | null;
/**
 * pasts a second drawdown representing a pattern at the specified location and size
 * @param drawdown
 * @param fill_pattern
 * @param start_i
 * @param start_j
 * @param width
 * @param height
 * @returns
 */
export declare const pasteIntoDrawdown: (drawdown: Drawdown, fill_pattern: Drawdown, start_i: number, start_j: number, width: number, height: number) => Drawdown;
/**
 * when drafts are rendered to the screen they are drawn pixel by pixel to an Image element and rendered on the canvas. This is a much faster process than drawing as lines and shapes on a canvas.
 * @param draft the draft we will convert to an image
 * @param pix_per_cell the maximum cell size for each interlacement, calculated based on draft size and maximum canvas dimensions
 * @param floats boolean to render cells of the same value as floats (rather than bounded cells)
 * @param use_color boolean to render the color of the yarn
 * @param mats an array of the materials currently in use in the workspace
 * @returns
 */
export declare const getDraftAsImage: (draft: Draft, pix_per_cell: number, floats: boolean, use_color: boolean, mats: Array<Material>) => ImageData;
export declare const drawDraftViewCell: (arr: Uint8ClampedArray, i: number, j: number, val: boolean | null, dim: number, warp_num: number, use_color: boolean, warp: DraftCellColor, weft: DraftCellColor) => Uint8ClampedArray;
/**
 * given a draft and a region, this function returns a new draft that only represents a segment of the original
 * @param draft
 * @param top
 * @param left
 * @param width
 * @param height
 * @returns
 */
export declare const cropDraft: (draft: Draft, top: number, left: number, width: number, height: number) => Draft;
export declare const compressDraft: (draft: Draft) => CompressedDraft;
/**
 * testing more compressed formats for storing the draft data.
 * each cell can be stored in two bits
 *  0 0 - unset - 0
 *  0 1 - unset - 1
 *  1 0 - false - 2
 *  1 1 - true - 3
 *
 * An ClampedUInt has date of 1 byte each. So we can store 4 cells per byte.
 * @param drawdown
 * @returns
 */
export declare const exportDrawdownToBitArray: (drawdown: Drawdown) => Uint8ClampedArray;
export declare const unpackDrawdownFromBitArray: (arr: Uint8ClampedArray, warps: number, wefts: number) => Drawdown;
/**
 * used ot create compressed draft format for saving. Switched back to explore as flat array of numbers
 * because exporting as unclamped array was not loading correctly when saved to file
 * @param drawdown
 * @returns
 */
export declare const exportDrawdownToArray: (drawdown: Drawdown) => Array<number>;
export declare const unpackDrawdownFromArray: (compressed: Array<number>, warps: number, wefts: number) => Drawdown;
/**
 * creates an empty drawdown of a given size
 * @param wefts
 * @param warps
 * @returns a Drawdown object
 */
export declare const createBlankDrawdown: (wefts: number, warps: number) => Drawdown;
/**
 * applys a pattern only to regions where the input draft has true heddles
 * @param mask the pattern to use as a mask
 * @param pattern the pattern to fill with
 * @returns the result
 */
export declare const applyMask: (mask: Drawdown, pattern: Drawdown) => Drawdown;
/**
 * inverts the drawdown (e.g. sets true cells to false and vice versa)
 * @param drawdown the drawdown to invert
 * @returns the inverted drawdown
 */
export declare const invertDrawdown: (drawdown: Drawdown) => Drawdown;
/**
 * shifts the drawdown up or left by the amount specified.
 * @param drawdown the drawdown to shift
 * @param up shift up = true, left = false
 * @param inc the amount to shift by
 * @returns the shfited drawdown
 */
export declare const shiftDrawdown: (drawdown: Drawdown, up: boolean, inc: number) => Drawdown;
/**
* flips the drawdown horizontally or vertically. This is different than flip draft because it only
* flippes teh drawdown, not any other associated information
* @param drawdown the drawdown to shift
* @param horiz true for horizontal flip, false for vertical
* @returns the flipped drawdown
*/
export declare const flipDrawdown: (drawdown: Drawdown, horiz: boolean) => Drawdown;
/**
 * generates a system or shuttle mapping from an input pattern based on the input draft
 * @param drawdown the drawdown for which we are creating this mapping
 * @param pattern the repeating pattern to use when creating the mapping
 * @param type specify if this is a 'row'/weft or 'col'/warp mapping
 * @returns the mapping to use
 */
export declare const generateMappingFromPattern: (drawdown: Drawdown, pattern: Array<number>, type: string) => Array<number>;
/**
 * take the system and shuttle and
 * @param to
 * @param from
 */
export declare const updateWeftSystemsAndShuttles: (to: Draft, from: Draft) => Draft;
export declare const updateWarpSystemsAndShuttles: (to: Draft, from: Draft) => Draft;
/**
 * I DON"T THINK THIS FUNCTION WORKS OR IS BEING USED
 * removes any boundary rows from the input draft that are unset
 * @return returns the resulting draft
 */
/**
 * insert a row into the drawdown at a given location
 * @param d the drawdown
 * @param i the weft location
 * @param row the row to insert, or null if row should be blank.
 * @returns
 */
export declare const insertDrawdownRow: (d: Drawdown, i: number, row: Array<Cell>) => Drawdown;
/**
 * inserts a new value into the row system/shuttle map
 * @param m the map to modify
 * @param i the place at which to add the row
 * @param val the value to insert
 * @returns
 */
export declare const insertMappingRow: (m: Array<number>, i: number, val: number) => Array<number>;
/**
 * deletes a row from the drawdown at the specified weft location
 * @param d drawdown
 * @param i weft location
 * @returns the modified drawdown
 */
export declare const deleteDrawdownRow: (d: Drawdown, i: number) => Drawdown;
/**
 * deletes a row from a row system/shuttle mapping at the specified weft location
 * @param m the mapping
 * @param i the weft location
 * @returns the modified
 */
export declare const deleteMappingRow: (m: Array<number>, i: number) => Array<number>;
/**
 * inserts a column into the drawdown
 * @param d the drawdown
 * @param j the warp location at which to insert
 * @param col - the column to insert or null if it should be a blank column
 * @returns the modified drawdown
 */
export declare const insertDrawdownCol: (d: Drawdown, j: number, col: Array<Cell>) => Drawdown;
/**
 * inserts a value into the col system/shuttle mapping at a particular location
 * @param m the map to modify
 * @param j the location at which to add
 * @param col the value to add
 * @returns
 */
export declare const insertMappingCol: (m: Array<number>, j: number, col: number) => Array<number>;
/**
 * delete a column from the drawdown at a given location
 * @param d the drawdown
 * @param j the warp location
 * @returns the modified drawdown
 */
export declare const deleteDrawdownCol: (d: Drawdown, j: number) => Drawdown;
/**
* deletes a value into the col system/shuttle mapping at a particular location
* @param m the mapping to modify
* @param j the warp location
* @returns the modified mapping
*/
export declare const deleteMappingCol: (m: Array<number>, j: number) => Array<number>;
export declare const getCol: (d: Drawdown, j: number) => Array<Cell>;
/**
 * gets the name of the draft. If it has a user defined name, it returns that, otherwise, it returns the generated name
 * @param draft
 * @returns
 */
export declare const getDraftName: (draft: Draft) => string;
export declare const flipDraft: (d: Draft, horiz: boolean, vert: boolean) => Promise<Draft>;
/**
 * this function generates a list of floats as well as a map of each cell in the draft to its associated float. This is used to compute layers within the draft
 * @param drawdown
 * @returns
 */
