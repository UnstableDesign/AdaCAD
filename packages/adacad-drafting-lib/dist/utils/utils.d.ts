import { Cell, Draft, Drawdown, SystemList } from "../draft";
import { Loom, LoomSettings } from "../loom";
import { MaterialMap } from "../material";
import { OperationInlet } from "../operations";
/**
 * Checks if two arrays contain the same values. They need not be in the same order, but the arrays must be the same size and
 * contain the same values.
 */
export declare function areEquivalent(array1: Array<number | string>, array2: Array<number | string>): boolean;
/**
 * given a drawdown and a row index, return the row number of the first matching row
 * @param j
 * @param drawdown
 * @returns the row id of the match or -1;
 */
export declare function hasMatchingRow(i: number, drawdown: Array<Array<Cell>>): number;
/**
 * Given an array and a column index, this will return the first column index that shares
 * the sequence of cells as j
 * @param j
 * @param drawdown
 * @returns
 */
export declare function hasMatchingColumn(j: number, drawdown: Array<Array<Cell>>): number;
/**
 * This function looks to see if a draft has any user-supplied information.
 * @param d the draft in question
 * @param loom the loom associated with this draft (or null if there is no loom)
 * @returns true if any part of the draft or loom contains a non-default value
 */
export declare function isDraftDirty(d: Draft, loom: Loom): boolean;
/**
 * given a drawdown and a row index, return if the row is blank.
 * In this context blank means that there are no "heddle up" values on this row.
 * @param i the row index
 * @param drawdown
 * @returns true or false;
 */
export declare function rowIsBlank(i: number, drawdown: Array<Array<Cell>>): boolean;
/**
 * given an list of cells, returns true if there is no "true" cell in the set.
 * @param cells
 * @returns
 */
export declare function hasOnlyUnsetOrDown(cells: Array<Cell>): boolean;
/**
 * given a drawdown and a column index, return if the column is blank.
 * In this context blank means that there are no "heddle up" values on this row.
 * @param j
 * @param drawdown
 * @returns true or false;
 */
export declare function colIsBlank(j: number, drawdown: Array<Array<Cell>>): boolean;
/**
 * A function to count the number of occurances of a give value within an array
 * @param arr the 1D array to search
 * @param val the value we are seeking
 * @returns number of occurances
 */
export declare function countOccurrences(arr: Array<string | number>, val: string | number): number;
/**
 * takes two booleans and returns their result based on the binary operation assigned
 * This doesn't work exactly as binary would because of the null "unset" value. In the case of unset's
 * we just pass through the value that isn't unset.
 * @param op the binary operator
 * @param a the first (top) value
 * @param b the second (under) value
 * @returns boolean result
 */
export declare function computeFilter(op: string, a: boolean | null, b: boolean | null): boolean | null;
/**
 * returns the number of wefts that is greatest out of all the input drafts
 *
 */
export declare function getMaxWefts(inputs: Array<Draft>): number;
/**
 * returns the number of warps that is greatest out of all the input drafts
 */
export declare function getMaxWarps(inputs: Array<Draft>): number;
/**
 * given a list of values, return the value that occurs the most.
 * If there are two values that share the most, it will return the first one encountered in the array.
 * @param vals
 * @returns the most common value found in the array
 */
export declare function getMostCommon(vals: Array<number | string>): number | string;
/**
 * used to update materials lists when we remove a material.
 * Works by taking an array of materials and then mapping their indexes to the one identified in the map
 * If a mapping isn't found for a given number in the material list, it is replaced with the replacement value.
 * @param material_mapping - the mapping of rows of cols to a material
 * @param index_map - a map from old to new material ids
 * @param replacement_ndx - anything not found in the map will be replaced by this value
 */
export declare function updateMaterialIds(material_mapping: Array<number>, index_map: Array<MaterialMap>, replacement_ndx: number): Array<number>;
/**
 * takes an array of numbers and returns the highest number
 * @param arr
 * @returns
 */
export declare function getArrayMax(arr: Array<number>): number;
/**
 * checks two looms settings objects
 * @param ls1
 * @param ls2
 * @returns  true if they have the same value
 */
export declare function areLoomSettingsTheSame(ls1: LoomSettings, ls2: LoomSettings): boolean;
/**
 * checks two loom objects for the exact same values in the looms. This does not
 * consider if they have the same outcome, only if the configurations are identical
 * @param loom1
 * @param loom2
 * @returns  true if they have the same value
 */
export declare function areLoomsTheSame(loom1: Loom, loom2: Loom): boolean;
/**
 * compares the states of two drafts
 * @param d1
 * @param d2
 * @returns true if they are the exact same in terms of the draft data (ignores names and ids)
 */
export declare function areDraftsTheSame(d1: Draft, d2: Draft): boolean;
export declare function hexToRgb(hex: string): {
    r: number;
    g: number;
    b: number;
};
/**
 * in connection with lcm, the gcd (greatest common divisor) determines the largest number that can divide into both inputs
 * I used Eulers algorithm with Euclidan Divison for determining this.
 * assumes non-zero inputs
 * @param timeoutMs - optional timeout in milliseconds. If provided and exceeded, returns -1
 * @param startTime - optional start time for timeout tracking (used internally for recursive calls)
 */
export declare function gcd(a: number, b: number, timeoutMs?: number, startTime?: number): number;
/**
 * this is an algorithm for finding the least common multiple of a give set of input numbers
 * it works based on the formula lcd (a,b) = a*b / gcd(a,b), and then calculates in a pairwise fashion.
 * this has the risk of breaking with very large sets of inputs and/or prime numbers of a large size
 * @param original - array of numbers to find the LCM of
 * @param timeoutMs - optional timeout in milliseconds. If provided and exceeded, returns -1 (gcd will always be positive so we can use -1 aS A FLAG)
 */
export declare function lcm(original: Array<number>, timeoutMs: number): number;
/**
 * take any input array containing all strings or all numbers and returns an array
 * containing only the unique elements of that array in the order in which they were first observed
 * @param arr
 * @returns
 */
export declare function filterToUniqueValues(arr: Array<string | number>): Array<string | number>;
/**
 * takes an input string and a regex and returns each match as an array
 * @param input
 */
export declare function parseRegex(input: string, regex: RegExp): Array<string>;
/**
 * compares two lists of values and returns a list of the elements from newInlets that need to be added to the current list,
 * as well as the elements in currentInlets that no longer need to exist.
 * @param newInlets
 * @returns the list of elements that needed to be added to or removed from current Inlets to make it match the list in newInlets
 */
export declare function getInletsToUpdate(newInlets: Array<OperationInlet>, currentInlets: Array<OperationInlet>): {
    toadd: Array<OperationInlet>;
    toremove: Array<OperationInlet>;
};
/**
 * takes two versions and compares them
 * returns true if versions are same or version a is greater than b, returns false if a older than b
 * @param compare
 */
export declare function sameOrNewerVersion(a: string, b: string): boolean;
/**
 * a stricter variant of the mod operator that will never return a negative number
 * @param n the mod "numerator" (often an array index)
 * @param m the mod "denominator" (often array size)
 * @returns
 */
export declare const modStrict: (n: number, m: number) => number;
/**
 * interpolates a 0-1 range to a broader range.
 * @param n a value between 0 and 1
 * @param range the range we are mapping this value to
 */
export declare const interpolate: (n: number, range: {
    max: number;
    min: number;
}) => number;
export declare function generateId(len: number): number;
export declare function printDrawdown(d: Drawdown): void;
/**
 * this function determines how one can flip the draft between two origin states
 * @param draft
 * @param loom
 * @param from
 * @param to
 */
/**
 * used by operations that parse a string input meant to represent a set of warp and weft systems. This checks if the systems input are valid in terms of the systems that draft will be using,
 * @param input_systems  {wesy: Array<string>, wasy: Array<string>}
 * @param original_systems {wesy: Array<string>, wasy: Array<string>}
 */
export declare function makeValidSystemList(input_systems: SystemList, original_systems: SystemList): SystemList;
/**
 * Parses a string representation of a drawdown into a Drawdown object.
 * The string should contain rows separated by newlines, where each row contains:
 * - '|' for heddle up (true)
 * - '-' for heddle down (false)
 * - ' ' (space) for unset (null)
 * @param drawdownString the string representation of the drawdown
 * @returns a Drawdown object
 */
export declare function parseStringToDrawdown(drawdownString: string): Drawdown;
/**
 * Creates a draft from a string representation of a drawdown.
 * @param drawdownString the string representation of the drawdown
 * @param gen_name optional generated name for the draft
 * @param ud_name optional user-defined name for the draft
 * @returns a Draft object
 */
export declare function createDraftFromString(drawdownString: string, gen_name?: string, ud_name?: string): Draft;
/**
 * Converts a drawdown back to a string representation.
 * This is the reverse of parseStringToDrawdown.
 * @param drawdown the drawdown to convert
 * @returns a string representation where:
 *   - '|' represents heddle up (true)
 *   - '-' represents heddle down (false)
 *   - ' ' (space) represents unset (null)
 */
export declare function printDrawdownAsString(drawdown: Drawdown): string;
