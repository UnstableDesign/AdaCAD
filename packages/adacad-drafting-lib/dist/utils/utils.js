"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.interpolate = exports.modStrict = void 0;
exports.areEquivalent = areEquivalent;
exports.hasMatchingRow = hasMatchingRow;
exports.hasMatchingColumn = hasMatchingColumn;
exports.isDraftDirty = isDraftDirty;
exports.rowIsBlank = rowIsBlank;
exports.hasOnlyUnsetOrDown = hasOnlyUnsetOrDown;
exports.colIsBlank = colIsBlank;
exports.countOccurrences = countOccurrences;
exports.computeFilter = computeFilter;
exports.getMaxWefts = getMaxWefts;
exports.getMaxWarps = getMaxWarps;
exports.getMostCommon = getMostCommon;
exports.updateMaterialIds = updateMaterialIds;
exports.getArrayMax = getArrayMax;
exports.areLoomSettingsTheSame = areLoomSettingsTheSame;
exports.areLoomsTheSame = areLoomsTheSame;
exports.areDraftsTheSame = areDraftsTheSame;
exports.hexToRgb = hexToRgb;
exports.gcd = gcd;
exports.lcm = lcm;
exports.filterToUniqueValues = filterToUniqueValues;
exports.parseRegex = parseRegex;
exports.getInletsToUpdate = getInletsToUpdate;
exports.sameOrNewerVersion = sameOrNewerVersion;
exports.generateId = generateId;
exports.printDrawdown = printDrawdown;
exports.makeValidSystemList = makeValidSystemList;
exports.parseStringToDrawdown = parseStringToDrawdown;
exports.createDraftFromString = createDraftFromString;
exports.printDrawdownAsString = printDrawdownAsString;
const draft_1 = require("../draft");
const cell_1 = require("../draft/cell");
const draft_2 = require("../draft/draft");
/**
 * Checks if two arrays contain the same values. They need not be in the same order, but the arrays must be the same size and
 * contain the same values.
 */
function areEquivalent(array1, array2) {
    if (array1.length != array2.length) {
        return false;
    }
    for (let i = 0; i < array1.length; i++) {
        if (array2.find(el => el == array1[i]) === undefined)
            return false;
    }
    return true;
}
/**
 * given a drawdown and a row index, return the row number of the first matching row
 * @param j
 * @param drawdown
 * @returns the row id of the match or -1;
 */
function hasMatchingRow(i, drawdown) {
    let unmatch = false;
    for (let i_comp = 0; i_comp < drawdown.length; i_comp++) {
        unmatch = false;
        if (i_comp != i) {
            for (let j = 0; j < drawdown[i_comp].length && !unmatch; j++) {
                if ((0, draft_1.getCellValue)(drawdown[i][j]) !== (0, draft_1.getCellValue)(drawdown[i_comp][j])) {
                    unmatch = true;
                }
            }
            if (!unmatch) {
                return i_comp;
            }
        }
    }
    return -1;
}
/**
 * Given an array and a column index, this will return the first column index that shares
 * the sequence of cells as j
 * @param j
 * @param drawdown
 * @returns
 */
function hasMatchingColumn(j, drawdown) {
    let unmatch = false;
    for (let j_comp = 0; j_comp < drawdown[0].length; j_comp++) {
        unmatch = false;
        if (j_comp != j) {
            for (let i = 0; i < drawdown.length && !unmatch; i++) {
                if ((0, draft_1.getCellValue)(drawdown[i][j]) !== (0, draft_1.getCellValue)(drawdown[i][j_comp])) {
                    unmatch = true;
                }
            }
            if (!unmatch) {
                return j_comp;
            }
        }
    }
    return -1;
}
/**
 * This function looks to see if a draft has any user-supplied information.
 * @param d the draft in question
 * @param loom the loom associated with this draft (or null if there is no loom)
 * @returns true if any part of the draft or loom contains a non-default value
 */
function isDraftDirty(d, loom) {
    let has_value = false;
    d.drawdown.forEach((row) => {
        row.forEach((cell) => {
            if (cell.is_set && cell.is_up)
                has_value = true;
        });
    });
    if (has_value)
        return true;
    const row_shuttle_unique = filterToUniqueValues(d.rowShuttleMapping);
    const col_shuttle_unique = filterToUniqueValues(d.colShuttleMapping);
    const row_system_unique = filterToUniqueValues(d.rowSystemMapping);
    const col_system_unique = filterToUniqueValues(d.colSystemMapping);
    if (row_shuttle_unique.length > 1)
        return true;
    if (col_shuttle_unique.length > 1)
        return true;
    if (row_system_unique.length > 1)
        return true;
    if (col_system_unique.length > 1)
        return true;
    if (loom == null)
        return false;
    for (const frame of loom.threading) {
        if (frame !== -1)
            return true;
    }
    for (const pick of loom.treadling) {
        if (pick.length !== 0)
            return true;
    }
    has_value = false;
    loom.tieup.forEach((row) => {
        row.forEach((cell) => {
            if (cell === true)
                has_value = true;
        });
    });
    return has_value;
}
/**
 * given a drawdown and a row index, return if the row is blank.
 * In this context blank means that there are no "heddle up" values on this row.
 * @param i the row index
 * @param drawdown
 * @returns true or false;
 */
function rowIsBlank(i, drawdown) {
    return hasOnlyUnsetOrDown(drawdown[i]);
}
/**
 * given an list of cells, returns true if there is no "true" cell in the set.
 * @param cells
 * @returns
 */
function hasOnlyUnsetOrDown(cells) {
    const hasValue = cells.find(el => ((0, draft_1.getCellValue)(el) === true));
    if (hasValue === undefined)
        return true;
    else
        return false;
}
/**
 * given a drawdown and a column index, return if the column is blank.
 * In this context blank means that there are no "heddle up" values on this row.
 * @param j
 * @param drawdown
 * @returns true or false;
 */
function colIsBlank(j, drawdown) {
    let blank = true;
    drawdown.forEach((row) => {
        if ((0, draft_1.getCellValue)(row[j]) == true)
            blank = false;
    });
    return blank;
}
/**
 * A function to count the number of occurances of a give value within an array
 * @param arr the 1D array to search
 * @param val the value we are seeking
 * @returns number of occurances
 */
function countOccurrences(arr, val) {
    return arr.reduce((a, v) => (v === val ? a + 1 : a), 0);
}
/**
 * takes two booleans and returns their result based on the binary operation assigned
 * This doesn't work exactly as binary would because of the null "unset" value. In the case of unset's
 * we just pass through the value that isn't unset.
 * @param op the binary operator
 * @param a the first (top) value
 * @param b the second (under) value
 * @returns boolean result
 */
function computeFilter(op, a, b) {
    switch (op) {
        //when both values are in place, return if they are inequal
        case 'neq':
            if (a == null)
                return b;
            if (b == null)
                return a;
            return (a !== b);
            break;
        //in all places where b has a value, replace a's value with b
        case 'atop':
            if (b === null)
                return a;
            return b;
            break;
        //when both values are in place, return if they are the same
        case 'and':
            if (a == null)
                return b;
            if (b == null)
                return a;
            return (a && b);
            break;
        case 'or':
            if (a === null)
                return b;
            if (b === null)
                return a;
            return (a || b);
            break;
        default:
            return a;
    }
}
/**
 * returns the number of wefts that is greatest out of all the input drafts
 *
 */
function getMaxWefts(inputs) {
    const max_wefts = inputs
        .filter(el => el !== null)
        .reduce((acc, draft) => {
        if ((0, draft_1.wefts)(draft.drawdown) > acc)
            return (0, draft_1.wefts)(draft.drawdown);
        return acc;
    }, 0);
    return max_wefts;
}
/**
 * returns the number of warps that is greatest out of all the input drafts
 */
function getMaxWarps(inputs) {
    const max_warps = inputs
        .filter(el => el !== null)
        .reduce((acc, draft) => {
        if ((0, draft_1.warps)(draft.drawdown) > acc)
            return (0, draft_1.warps)(draft.drawdown);
        return acc;
    }, 0);
    return max_warps;
}
/**
 * given a list of values, return the value that occurs the most.
 * If there are two values that share the most, it will return the first one encountered in the array.
 * @param vals
 * @returns the most common value found in the array
 */
function getMostCommon(vals) {
    const freq = vals.reduce((acc, el) => {
        const ndx = acc.findIndex((acc_el) => acc_el.i === el);
        if (ndx === -1) {
            acc.push({ i: el, count: 1 });
        }
        else {
            acc[ndx].count++;
        }
        return acc;
    }, []);
    const common = freq.reduce((acc, el) => {
        if (el.count > acc.count)
            return el;
        else
            return acc;
    }, { i: 0, count: 0 });
    return common.i;
}
/**
 * used to update materials lists when we remove a material.
 * Works by taking an array of materials and then mapping their indexes to the one identified in the map
 * If a mapping isn't found for a given number in the material list, it is replaced with the replacement value.
 * @param material_mapping - the mapping of rows of cols to a material
 * @param index_map - a map from old to new material ids
 * @param replacement_ndx - anything not found in the map will be replaced by this value
 */
function updateMaterialIds(material_mapping, index_map, replacement_ndx) {
    if (material_mapping === undefined)
        material_mapping = [];
    //update the existing drafts given the new ids
    const new_map = material_mapping.map(index => {
        const mapping = index_map.find(el => el.old_id === index);
        if (mapping !== undefined) {
            return mapping.new_id;
        }
        else {
            return replacement_ndx;
        }
    });
    return new_map;
}
/**
 * takes an array of numbers and returns the highest number
 * @param arr
 * @returns
 */
function getArrayMax(arr) {
    const max = arr.reduce((acc, el) => {
        if (el > acc)
            return el;
        else
            return acc;
    }, 0);
    return max;
}
/**
 * checks two looms settings objects
 * @param ls1
 * @param ls2
 * @returns  true if they have the same value
 */
function areLoomSettingsTheSame(ls1, ls2) {
    if (ls1.epi !== ls2.epi)
        return false;
    if (ls1.frames !== ls2.frames)
        return false;
    if (ls1.treadles !== ls2.treadles)
        return false;
    if (ls1.type !== ls2.type)
        return false;
    if (ls1.units !== ls2.units)
        return false;
    return true;
}
/**
 * checks two loom objects for the exact same values in the looms. This does not
 * consider if they have the same outcome, only if the configurations are identical
 * @param loom1
 * @param loom2
 * @returns  true if they have the same value
 */
function areLoomsTheSame(loom1, loom2) {
    if (loom1 === null && loom2 === null)
        return true;
    if (loom1.treadling.length !== loom2.treadling.length)
        return false;
    if (loom1.threading.length !== loom2.threading.length)
        return false;
    for (let ndx = 0; ndx < loom1.threading.length; ndx++) {
        if (loom1.threading[ndx] !== loom2.threading[ndx])
            return false;
    }
    for (let p = 0; p < loom1.treadling.length; p++) {
        if (!areEquivalent(loom1.treadling[p], loom2.treadling[p]))
            return false;
    }
    for (let p = 0; p < loom1.tieup.length; p++) {
        for (let q = 0; q < loom1.tieup[p].length; q++) {
            if (loom1.tieup[p][q] !== loom2.tieup[p][q])
                return false;
        }
    }
    return true;
}
/**
 * compares the states of two drafts
 * @param d1
 * @param d2
 * @returns true if they are the exact same in terms of the draft data (ignores names and ids)
 */
function areDraftsTheSame(d1, d2) {
    if (d1 === null && d2 === null)
        return true;
    for (let ndx = 0; ndx < d1.colShuttleMapping.length; ndx++) {
        if (d1.colShuttleMapping[ndx] !== d2.colShuttleMapping[ndx])
            return false;
    }
    for (let ndx = 0; ndx < d1.colSystemMapping.length; ndx++) {
        if (d1.colSystemMapping[ndx] !== d2.colSystemMapping[ndx])
            return false;
    }
    for (let ndx = 0; ndx < d1.rowShuttleMapping.length; ndx++) {
        if (d1.rowShuttleMapping[ndx] !== d2.rowShuttleMapping[ndx])
            return false;
    }
    for (let ndx = 0; ndx < d1.rowSystemMapping.length; ndx++) {
        if (d1.rowSystemMapping[ndx] !== d2.rowSystemMapping[ndx])
            return false;
    }
    for (let p = 0; p < d1.drawdown.length; p++) {
        for (let q = 0; q < d1.drawdown[p].length; q++) {
            if ((0, draft_1.getCellValue)(d1.drawdown[p][q]) !== (0, draft_1.getCellValue)(d2.drawdown[p][q]))
                return false;
        }
    }
    return true;
}
function hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : {
        r: 0,
        g: 0,
        b: 0
    };
}
/**
 * in connection with lcm, the gcd (greatest common divisor) determines the largest number that can divide into both inputs
 * I used Eulers algorithm with Euclidan Divison for determining this.
 * assumes non-zero inputs
 * @param timeoutMs - optional timeout in milliseconds. If provided and exceeded, returns -1
 * @param startTime - optional start time for timeout tracking (used internally for recursive calls)
 */
function gcd(a, b, timeoutMs, startTime) {
    // Check timeout if provided
    if (timeoutMs !== undefined) {
        const currentTime = startTime !== null && startTime !== void 0 ? startTime : Date.now();
        if (Date.now() - currentTime > timeoutMs) {
            return -1; // Timeout indicator
        }
    }
    if (b === 0)
        return a;
    const max = (a > b) ? a : b;
    const min = (a <= b) ? a : b;
    const result = gcd(min, max % min, timeoutMs, startTime);
    // Propagate timeout indicator
    if (result === -1 && timeoutMs !== undefined) {
        return -1;
    }
    return result;
}
/**
 * this is an algorithm for finding the least common multiple of a give set of input numbers
 * it works based on the formula lcd (a,b) = a*b / gcd(a,b), and then calculates in a pairwise fashion.
 * this has the risk of breaking with very large sets of inputs and/or prime numbers of a large size
 * @param original - array of numbers to find the LCM of
 * @param timeoutMs - optional timeout in milliseconds. If provided and exceeded, returns -1 (gcd will always be positive so we can use -1 aS A FLAG)
 */
function lcm(original, timeoutMs) {
    var _a, _b;
    if (original.length == 0)
        return 0;
    if (original.length == 1)
        return original[0];
    const startTime = timeoutMs !== undefined ? Date.now() : undefined;
    const set = original.slice();
    const a = (_a = set.shift()) !== null && _a !== void 0 ? _a : 0;
    const b = (_b = set.shift()) !== null && _b !== void 0 ? _b : 0;
    let mult = a * b;
    let gcd_val = gcd(a, b, timeoutMs, startTime);
    // Check if gcd timed out
    if (gcd_val === -1)
        return -1;
    let lcd = mult / gcd_val;
    while (set.length > 0) {
        // Check timeout before each iteration
        if (timeoutMs !== undefined && startTime !== undefined) {
            if (Date.now() - startTime > timeoutMs) {
                return -1;
            }
        }
        const c = set.shift();
        if (c === undefined)
            break;
        mult = c * lcd;
        gcd_val = gcd(c, lcd, timeoutMs, startTime);
        // Check if gcd timed out
        if (gcd_val === -1)
            return -1;
        lcd = mult / gcd_val;
    }
    return lcd;
}
/**
 * take any input array containing all strings or all numbers and returns an array
 * containing only the unique elements of that array in the order in which they were first observed
 * @param arr
 * @returns
 */
function filterToUniqueValues(arr) {
    const unique = [];
    arr.forEach(el => {
        const ndx = unique.findIndex(uel => uel === el);
        if (ndx === -1)
            unique.push(el);
    });
    return unique;
}
/**
 * takes an input string and a regex and returns each match as an array
 * @param input
 */
function parseRegex(input, regex) {
    if (input == undefined || regex == undefined)
        return [];
    input = input.toString();
    const global_regex = new RegExp(regex, 'g');
    const matches = input.match(global_regex);
    if (matches === null)
        return [];
    return matches;
}
/**
 * compares two lists of values and returns a list of the elements from newInlets that need to be added to the current list,
 * as well as the elements in currentInlets that no longer need to exist.
 * @param newInlets
 * @returns the list of elements that needed to be added to or removed from current Inlets to make it match the list in newInlets
 */
function getInletsToUpdate(newInlets, currentInlets) {
    const toadd = newInlets.reduce((acc, inlet) => {
        if (currentInlets.find(el => el == inlet) === undefined)
            acc.push(inlet);
        return acc;
    }, []);
    const toremove = currentInlets.reduce((acc, inlet) => {
        if (newInlets.find(el => el == inlet) === undefined)
            acc.push(inlet);
        return acc;
    }, []);
    return { toadd, toremove };
}
/**
 * takes two versions and compares them
 * returns true if versions are same or version a is greater than b, returns false if a older than b
 * @param compare
 */
function sameOrNewerVersion(a, b) {
    if (a === undefined || b === undefined) {
        console.error("checking undefined version", a, b);
        return false;
    }
    const a_spl = a.split('.');
    const b_spl = b.split('.');
    let flag_end = false;
    let return_val = true;
    for (let i = 0; i < a_spl.length && !flag_end; i++) {
        if (i < b_spl.length) {
            if (parseInt(a_spl[i]) < parseInt(b_spl[i])) {
                return_val = false;
                flag_end = true;
            }
            else if (parseInt(a_spl[i]) > parseInt(b_spl[i])) {
                return_val = true;
                flag_end = true;
            }
        }
    }
    if (flag_end)
        return return_val;
    return true;
}
/**
 * a stricter variant of the mod operator that will never return a negative number
 * @param n the mod "numerator" (often an array index)
 * @param m the mod "denominator" (often array size)
 * @returns
 */
const modStrict = (n, m) => {
    return ((n % m) + m) % m;
};
exports.modStrict = modStrict;
/**
 * interpolates a 0-1 range to a broader range.
 * @param n a value between 0 and 1
 * @param range the range we are mapping this value to
 */
const interpolate = (n, range) => {
    return range.min + (range.max - range.min) * n;
};
exports.interpolate = interpolate;
function generateId(len) {
    let basis = 1;
    for (let i = 0; i < len; i++) {
        basis = basis * 10;
    }
    const min = basis / 10;
    const max = basis - 1;
    return Math.floor(Math.random() * (max - min + 1)) + min;
}
//print the draft to console
function printDrawdown(d) {
    let all_rows = "";
    for (let i = 0; i < (0, draft_1.wefts)(d); i++) {
        const row = d[i].reduce((acc, el) => {
            if ((0, draft_1.getCellValue)(el) === true)
                acc = acc.concat('x ');
            else if ((0, draft_1.getCellValue)(el) === false)
                acc = acc.concat('o ');
            else if ((0, draft_1.getCellValue)(el) == null)
                acc = acc.concat('- ');
            return acc;
        }, '');
        all_rows += row + "\n";
    }
    console.log(all_rows);
}
/**
 * this function determines how one can flip the draft between two origin states
 * @param draft
 * @param loom
 * @param from
 * @param to
 */
// export function getFlips(from:number, to: number) : {horiz: boolean, vert: boolean} {
//   // console.log("flipping from/to", from, to);
//   let horiz = false;
//   let vert = false;
//   if(from === to) return {horiz, vert};
//   if((from === 0 && to === 1) || (from === 1 && to === 0)){
//     vert = true;
//   }else if((from === 0 && to === 2) || (from === 2 && to === 0)){
//     vert = true;
//     horiz = true;
//   }else if((from === 0 && to === 3) || (from === 3 && to === 0)){
//     horiz = true;
//   }else if((from === 1 && to == 2) || (from === 2 && to === 1)){
//     horiz = true;
//   }else if((from === 1 && to == 3) || (from === 3 && to === 1)){
//     vert = true;
//     horiz = true;
//   }else if((from === 2 && to == 3) || (from === 3 && to === 2)){
//     vert = true;
//   }else{
//     console.error("to/from origin flip options not found", to, from)
//   }
//   // console.log("horiz/vert", horiz, vert);
//   return {horiz, vert};
// }
/**
 * used by operations that parse a string input meant to represent a set of warp and weft systems. This checks if the systems input are valid in terms of the systems that draft will be using,
 * @param input_systems  {wesy: Array<string>, wasy: Array<string>}
 * @param original_systems {wesy: Array<string>, wasy: Array<string>}
 */
function makeValidSystemList(input_systems, original_systems) {
    const formatted_systems = {
        valid: true,
        wesy: [],
        wasy: []
    };
    if (input_systems.wesy.length != 0) {
        //at least one weft systems needs to be valid; 
        const weft_systems_found = input_systems.wesy.map((weft_sys) => original_systems.wesy.find((el) => el == weft_sys) !== undefined);
        if (weft_systems_found.filter(el => el == true).length == 0) {
            formatted_systems.valid = false;
            return formatted_systems;
        }
        else {
            formatted_systems.wesy = input_systems.wesy;
        }
    }
    else {
        formatted_systems.wesy = original_systems.wesy.slice();
    }
    if (input_systems.wasy.length != 0) {
        const warp_systems_found = input_systems.wasy.map((warp_sys) => original_systems.wasy.find((el) => el == warp_sys) !== undefined);
        if (warp_systems_found.filter(el => el == true).length == 0) {
            formatted_systems.valid = false;
            return formatted_systems;
        }
        else {
            formatted_systems.wasy = input_systems.wasy;
        }
    }
    else {
        formatted_systems.wasy = original_systems.wasy.slice();
    }
    return formatted_systems;
}
/**
 * Parses a string representation of a drawdown into a Drawdown object.
 * The string should contain rows separated by newlines, where each row contains:
 * - '|' for heddle up (true)
 * - '-' for heddle down (false)
 * - ' ' (space) for unset (null)
 * @param drawdownString the string representation of the drawdown
 * @returns a Drawdown object
 */
function parseStringToDrawdown(drawdownString) {
    const lines = drawdownString.split('\n');
    const drawdown = [];
    for (const line of lines) {
        const row = [];
        for (const char of line) {
            switch (char) {
                case '|':
                    row.push((0, cell_1.createCell)(true));
                    break;
                case '-':
                    row.push((0, cell_1.createCell)(false));
                    break;
                case ' ':
                    row.push((0, cell_1.createCell)(null));
                    break;
                default:
                    // Skip unknown characters
                    break;
            }
        }
        // Only add the row if it has at least one cell
        if (row.length > 0) {
            drawdown.push(row);
        }
    }
    return drawdown;
}
/**
 * Creates a draft from a string representation of a drawdown.
 * @param drawdownString the string representation of the drawdown
 * @param gen_name optional generated name for the draft
 * @param ud_name optional user-defined name for the draft
 * @returns a Draft object
 */
function createDraftFromString(drawdownString, gen_name, ud_name) {
    const drawdown = parseStringToDrawdown(drawdownString);
    const draft = (0, draft_2.initDraftFromDrawdown)(drawdown);
    if (gen_name !== undefined) {
        draft.gen_name = gen_name;
    }
    if (ud_name !== undefined) {
        draft.ud_name = ud_name;
    }
    return draft;
}
/**
 * Converts a drawdown back to a string representation.
 * This is the reverse of parseStringToDrawdown.
 * @param drawdown the drawdown to convert
 * @returns a string representation where:
 *   - '|' represents heddle up (true)
 *   - '-' represents heddle down (false)
 *   - ' ' (space) represents unset (null)
 */
function printDrawdownAsString(drawdown) {
    const rows = [];
    for (const row of drawdown) {
        let rowString = '';
        for (const cell of row) {
            const value = (0, draft_1.getCellValue)(cell);
            switch (value) {
                case true:
                    rowString += '|';
                    break;
                case false:
                    rowString += '-';
                    break;
                case null:
                default:
                    rowString += ' ';
                    break;
            }
        }
        rows.push(rowString);
    }
    return rows.join('\n');
}
//# sourceMappingURL=utils.js.map