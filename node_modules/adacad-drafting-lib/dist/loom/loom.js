"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.convertLiftPlanToTieup = exports.convertTieupToLiftPlan = exports.isFrame = exports.isInUserTieupRange = exports.isInTieupRange = exports.isInUserTreadlingRange = exports.isInTreadlingRange = exports.isInUserThreadingRange = exports.isInThreadingRange = exports.numTreadles = exports.numFrames = exports.getLoomUtilByType = exports.flipTieUp = exports.flipTreadling = exports.flipThreading = exports.flipLoom = exports.generateDirectTieup = exports.generateTreadlingforFrameLoom = exports.generateThreading = exports.computeDrawdown = exports.pasteDirectAndFrameThreading = exports.convertLoom = exports.calcLength = exports.calcWidth = exports.convertEPItoMM = exports.copyLoomSettings = exports.copyLoom = exports.initLoom = void 0;
const shafttreadle_1 = require("./shafttreadle");
const dobby_1 = require("./dobby");
const jacquard_1 = require("./jacquard");
const cell_1 = require("../draft/cell");
const utils_1 = require("../utils/utils");
const draft_1 = require("../draft");
const defaults_1 = require("../utils/defaults");
/*********** GENERIC FUNCTIONS RELATING TO LOOMS AND LOOM UTILS ************/
/**
 * creates an empty loom of the size specified. Mostly used for testing.
 * @param warps
 * @param wefts
 * @param frames
 * @param treadles
 * @returns
 */
const initLoom = (warps, wefts, frames, treadles) => {
    const l = {
        treadling: [],
        tieup: [],
        threading: []
    };
    for (let i = 0; i < wefts; i++) {
        l.treadling.push([]);
    }
    for (let j = 0; j < warps; j++) {
        l.threading.push(-1);
    }
    for (let i = 0; i < frames; i++) {
        l.tieup.push([]);
        for (let j = 0; j < treadles; j++) {
            l.tieup[i].push(false);
        }
    }
    return l;
};
exports.initLoom = initLoom;
const copyLoom = (l) => {
    if (l == null || l == undefined)
        return null;
    const copy_loom = {
        threading: l.threading.slice(),
        treadling: JSON.parse(JSON.stringify(l.treadling)), //hack to deep copy 2D
        tieup: JSON.parse(JSON.stringify(l.tieup)), //hack to deep copy 2D
    };
    return copy_loom;
};
exports.copyLoom = copyLoom;
const copyLoomSettings = (ls) => {
    var _a, _b, _c, _d, _e, _f;
    const copy_loomsettings = {
        type: (_a = ls.type) !== null && _a !== void 0 ? _a : defaults_1.defaults.loom_settings.type,
        epi: (_b = ls.epi) !== null && _b !== void 0 ? _b : defaults_1.defaults.loom_settings.epi,
        ppi: (_c = ls.ppi) !== null && _c !== void 0 ? _c : defaults_1.defaults.loom_settings.ppi,
        units: (_d = ls.units) !== null && _d !== void 0 ? _d : defaults_1.defaults.loom_settings.units,
        frames: (_e = ls.frames) !== null && _e !== void 0 ? _e : defaults_1.defaults.loom_settings.frames,
        treadles: (_f = ls.treadles) !== null && _f !== void 0 ? _f : defaults_1.defaults.loom_settings.treadles
    };
    return copy_loomsettings;
};
exports.copyLoomSettings = copyLoomSettings;
const convertEPItoMM = (ls) => {
    if (ls.units == 'cm') {
        return (100 / ls.epi);
    }
    else {
        return (25.4 / ls.epi);
    }
};
exports.convertEPItoMM = convertEPItoMM;
const calcWidth = (drawdown, loom_settings) => {
    if (loom_settings.units == 'in') {
        return (0, draft_1.warps)(drawdown) / loom_settings.epi;
    }
    else {
        return (0, draft_1.warps)(drawdown) / loom_settings.epi * 10;
    }
};
exports.calcWidth = calcWidth;
const calcLength = (drawdown, loom_settings) => {
    if (loom_settings.units == 'in') {
        return (0, draft_1.wefts)(drawdown) / loom_settings.ppi;
    }
    else {
        return (0, draft_1.wefts)(drawdown) / loom_settings.ppi * 10;
    }
};
exports.calcLength = calcLength;
const convertLoom = (drawdown, l, from_ls, to_ls) => {
    //if the loom is null, force the previous type to jcquard
    if (l == null) {
        from_ls.type = 'jacquard';
    }
    if (from_ls.type == to_ls.type)
        return Promise.resolve(l);
    if (from_ls == null || from_ls == undefined)
        return Promise.reject("no prior loom settings found");
    if (to_ls == null || to_ls == undefined)
        return Promise.reject("no current loom settings found");
    const utils = (0, exports.getLoomUtilByType)(to_ls.type);
    if (from_ls.type === 'jacquard' && to_ls.type === 'direct') {
        const utils = (0, exports.getLoomUtilByType)('direct');
        if (utils && typeof utils.computeLoomFromDrawdown === 'function') {
            return utils.computeLoomFromDrawdown(drawdown, to_ls);
        }
        else {
            return Promise.reject("Loom util for 'direct' is undefined or invalid");
        }
    }
    else if (from_ls.type === 'jacquard' && to_ls.type === 'frame') {
        if (utils && typeof utils.computeLoomFromDrawdown === 'function') {
            return utils.computeLoomFromDrawdown(drawdown, to_ls);
        }
        else {
            return Promise.reject("Loom util for 'frame' is undefined or invalid");
        }
    }
    else if (from_ls.type === 'direct' && to_ls.type === 'jacquard') {
        return Promise.resolve(null);
    }
    else if (from_ls.type == 'direct' && to_ls.type == 'frame') {
        // from direct-tie to floor
        const new_l = (0, exports.convertLiftPlanToTieup)(l, to_ls);
        return Promise.resolve(new_l);
    }
    else if (from_ls.type === 'frame' && to_ls.type === 'jacquard') {
        return Promise.resolve(null);
    }
    else if (from_ls.type == 'frame' && to_ls.type == 'direct') {
        // from floor to direct
        //THIS IS BROKEN
        const converted_loom = (0, exports.convertTieupToLiftPlan)(l, to_ls);
        return Promise.resolve(converted_loom);
    }
    return Promise.reject("Loom type conversion not found");
};
exports.convertLoom = convertLoom;
/*** SHARED FUNCTIONS USED WHEN COMPUTING LOOM STATESs ********/
const pasteDirectAndFrameThreading = (loom, drawdown, ndx, width, height) => {
    //update this function so that it doesn't assume the selection has been the full frame threading
    var _a;
    for (let j = 0; j < width; j++) {
        const pattern_ndx_j = j % (0, draft_1.warps)(drawdown);
        const col = [];
        for (let i = 0; i < height; i++) {
            const pattern_ndx_i = i % (0, draft_1.wefts)(drawdown);
            if ((0, cell_1.getCellValue)(drawdown[pattern_ndx_i][pattern_ndx_j]) == true)
                col.push(ndx.i + i);
        }
        if (col.length == 0)
            loom.threading[ndx.j + j] = -1;
        else {
            loom.threading[ndx.j + j] = (_a = col.shift()) !== null && _a !== void 0 ? _a : -1;
        }
    }
    return loom;
};
exports.pasteDirectAndFrameThreading = pasteDirectAndFrameThreading;
/**
 * computes the drawdown based on a given loom configuration
 * @param loom
 * @returns the resulting drawdown
 */
const computeDrawdown = (loom) => {
    const pattern = (0, draft_1.createBlankDrawdown)(loom.treadling.length, loom.threading.length);
    for (let i = 0; i < loom.treadling.length; i++) {
        const active_treadles = loom.treadling[i].slice();
        if (active_treadles.length > 0) {
            active_treadles.forEach((treadle) => {
                for (let j = 0; j < loom.tieup.length; j++) {
                    if (loom.tieup[j][treadle]) {
                        for (let k = 0; k < loom.threading.length; k++) {
                            if (loom.threading[k] == j) {
                                pattern[i][k] = (0, cell_1.setCellValue)(pattern[i][k], true);
                            }
                        }
                    }
                }
            });
        }
    }
    return Promise.resolve(pattern);
};
exports.computeDrawdown = computeDrawdown;
/**
* generates a threading based on the provided drawdown
 * @param drawdown the drawdown to use
 * @returns an object containing the threading pattern and the number of frames used
 */
const generateThreading = (drawdown) => {
    let frame = -1;
    const threading = [];
    //always assign the origin to one
    //threading[] = -1;
    //progressively add new frames in the order they appear
    for (let j = 0; j < (0, draft_1.warps)(drawdown); j++) {
        const blank = (0, utils_1.colIsBlank)(j, drawdown);
        if (blank)
            threading[j] = -1;
        else {
            const match = (0, utils_1.hasMatchingColumn)(j, drawdown);
            if (match === -1 || match > j) {
                frame++;
                threading[j] = frame;
            }
            else {
                threading[j] = threading[match];
            }
        }
    }
    return Promise.resolve({ threading: threading, num: frame });
};
exports.generateThreading = generateThreading;
/**
 * This function sets the treadling based on a adjusted pattern (e.g. a pattern that has been flipped based on the users selected origin point)
 * @param pattern the drawdown to use to generate the treadling
 * @returns an object containing the treadling and the total number of treadles used
 */
const generateTreadlingforFrameLoom = (pattern) => {
    let treadle = -1;
    const treadling = [];
    //always assign the origin to one
    //progressively add new frames in the order they appear
    for (let i = 0; i < pattern.length; i++) {
        const has_up = pattern[i].find(el => (0, cell_1.getCellValue)(el) == true);
        if (has_up === undefined)
            treadling[i] = [];
        else {
            const match = (0, utils_1.hasMatchingRow)(i, pattern);
            if (match === -1 || match > i) {
                treadle++;
                treadling[i] = [treadle];
            }
            else {
                treadling[i] = treadling[match];
            }
        }
    }
    return Promise.resolve({ treadling: treadling, num: treadle });
};
exports.generateTreadlingforFrameLoom = generateTreadlingforFrameLoom;
/**
 * generates a direct tieup for the give size
 * @param size the number of frames and treadles
 * @returns a tieup pattern of the specified size
 */
const generateDirectTieup = (size) => {
    //add tieup
    const tieup = [];
    for (let i = 0; i < size; i++) {
        tieup.push([]);
        for (let j = 0; j < size; j++) {
            if (i == j)
                tieup[i][j] = true;
            else
                tieup[i][j] = false;
        }
    }
    return tieup.slice();
};
exports.generateDirectTieup = generateDirectTieup;
/**
 * flips the draft horizontally and/or vertically. Used to flip the draft so that (0,0) is in the top left, no matter which origin point is selected
 * @param d the pattern to flip
 * @param horiz do horizontal flip?
 * @param vert do vertical flip?
 * @returns the flipped pattern
 */
// export const flipPattern = (d: Drawdown, horiz: boolean, vert: boolean) : Promise<Drawdown> => {
//   const d_flip = d.slice();
//   // for(let i = 0; i < d.length; i++){
//   //   d_flip.push([]);
//   //   for(let j = 0; j < d[i].length; j++){
//   //     if(horiz && vert) d_flip[i][j] = new Cell(d[d.length -1 - i][d[i].length - 1 - j].getHeddle());
//   //     if(horiz && !vert) d_flip[i][j] = new Cell(d[i][(d[i].length - 1 - j)].getHeddle());
//   //     if(!horiz && vert) d_flip[i][j] = new Cell(d[d.length -1 - i][j].getHeddle());
//   //     if(!horiz && !vert) d_flip[i][j] = new Cell(d[i][j].getHeddle());
//   //   }
//   // }
//   return Promise.resolve(d_flip);
// }
/**
 * calls the series of functions required to flip the looms to common origin based of user selected origin.
 * @param loom the original loom
 * @returns the flipped loom
 */
const flipLoom = (loom) => {
    return Promise.resolve(loom);
    // if(loom === null || loom == undefined) return Promise.resolve(null);
    // const refs = [];
    // const new_loom = {
    //   threading: loom.threading.slice(), 
    //   tieup: loom.tieup.slice(),
    //   treadling: loom.treadling.slice()
    // }
    // const fns = [];
    //   if (vert){
    //     refs.push('treadling')
    //     fns.push(flipTreadling(loom.treadling));
    //   }
    //   if(horiz){
    //     refs.push('threading')
    //     fns.push(flipThreading(loom.threading))
    //   }
    //   return Promise.all(fns).then(res => {
    //     for(let i = 0; i < refs.length; i++){
    //       if(refs[i] === 'treadling') new_loom.treadling = res[i];
    //       if(refs[i] === 'threading') new_loom.threading = res[i];
    //     }
    //     return Promise.resolve(new_loom);
    //   });
};
exports.flipLoom = flipLoom;
/**
 * flips the threading order so that what was leftmost becomes rightmost
 * @param threading
 * @returns the flipped threading order
 */
const flipThreading = (threading) => {
    const t_flip = [];
    for (let i = 0; i < threading.length; i++) {
        t_flip[i] = threading[threading.length - 1 - i];
    }
    return Promise.resolve(t_flip);
};
exports.flipThreading = flipThreading;
/**
* flips the threading order so that what was leftmost becomes rightmost
* @param treadling
* @returns the flipped threading order
*/
const flipTreadling = (treadling) => {
    const t_flip = [];
    for (let i = 0; i < treadling.length; i++) {
        t_flip[i] = treadling[treadling.length - 1 - i].slice();
    }
    return Promise.resolve(t_flip);
};
exports.flipTreadling = flipTreadling;
/**
 * flips the threading order so that what was leftmost becomes rightmost
 * @param treadling
 * @returns the flipped threading order
 */
const flipTieUp = (tieup, horiz, vert) => {
    const t_flip = [];
    for (let i = 0; i < tieup.length; i++) {
        t_flip.push([]);
        for (let j = 0; j < tieup[i].length; j++) {
            if (horiz && vert)
                t_flip[i][j] = tieup[tieup.length - 1 - i][tieup[i].length - 1 - j];
            if (horiz && !vert)
                t_flip[i][j] = tieup[i][(tieup[i].length - 1 - j)];
            if (!horiz && vert)
                t_flip[i][j] = tieup[tieup.length - 1 - i][j];
            if (!horiz && !vert)
                t_flip[i][j] = tieup[i][j];
        }
    }
    return Promise.resolve(t_flip);
};
exports.flipTieUp = flipTieUp;
/**
 * returns the correct loom util object by string
 * @param type the type of loom you are using
 * @returns
 */
const getLoomUtilByType = (type) => {
    switch (type) {
        case 'frame': return shafttreadle_1.frame_utils;
        case 'direct': return dobby_1.direct_utils;
        case 'jacquard': return jacquard_1.jacquard_utils;
        default: return jacquard_1.jacquard_utils;
    }
};
exports.getLoomUtilByType = getLoomUtilByType;
/**
 * calculates the total number of frames used in this loom
 * since its called frequently, keep an eye on this to make sure it isn't hanging page loading
 * and/or call it once per needed function (instead of multiple times in one function)
 * @param loom
 * @returns the highest number found in the array
 */
const numFrames = (loom) => {
    if (loom === null || loom === undefined)
        return 0;
    const max = loom.threading.reduce((acc, el) => {
        if (el > acc) {
            acc = el;
        }
        return acc;
    }, 0);
    return max + 1;
};
exports.numFrames = numFrames;
/**
 * calculates the total number of frames used in this loom
 * since its called frequently, keep an eye on this to make sure it isn't hanging page loading
 * @param loom
 * @returns the highest number found in the array
 */
const numTreadles = (loom) => {
    if (loom == null)
        return 0;
    const max = loom.treadling.reduce((acc, el) => {
        const max_in_list = el.reduce((sub_acc, sub_el) => {
            if (sub_el > acc)
                sub_acc = sub_el;
            return sub_acc;
        }, 0);
        if (max_in_list > acc) {
            acc = max_in_list;
        }
        return acc;
    }, 0);
    return max + 1;
};
exports.numTreadles = numTreadles;
/**
 * checks if a given interlacement is within the range of the threading
 * @param loom the loom to check with
 * @param ndx the interlacement to check
 * @returns true or false to determine if in or out of range
 */
const isInThreadingRange = (loom, ndx) => {
    if (ndx.i < 0)
        return false;
    if (ndx.i > (0, exports.numFrames)(loom))
        return false;
    if (ndx.j < 0)
        return false;
    if (ndx.j >= loom.threading.length)
        return false;
    return true;
};
exports.isInThreadingRange = isInThreadingRange;
/**
 * checks if a given interlacement is within the range of the threading specified by the user
 * @param loom the loom to check with
 * @param ndx the interlacement to check
 * @returns true or false to determine if in or out of range
 */
const isInUserThreadingRange = (loom, loom_settings, ndx) => {
    const frames = Math.max(loom_settings.frames, (0, exports.numFrames)(loom));
    if (ndx.i < 0)
        return false;
    if (ndx.i > frames)
        return false;
    if (ndx.j < 0)
        return false;
    if (ndx.j >= loom.threading.length)
        return false;
    return true;
};
exports.isInUserThreadingRange = isInUserThreadingRange;
/**
 * checks if a given interlacement is within the range of the threading
 * @param loom the loom to check with
 * @param ndx the interlacement to check
 * @returns true or false to determine if in or out of range
 */
const isInTreadlingRange = (loom, ndx) => {
    if (ndx.j < 0)
        return false;
    if (ndx.j > (0, exports.numTreadles)(loom))
        return false;
    if (ndx.i < 0)
        return false;
    if (ndx.i >= loom.treadling.length)
        return false;
    return true;
};
exports.isInTreadlingRange = isInTreadlingRange;
/**
 * checks if a given interlacement is within the range of the threading
 * @param loom the loom to check with
 * @param ndx the interlacement to check
 * @returns true or false to determine if in or out of range
 */
const isInUserTreadlingRange = (loom, loom_settings, ndx) => {
    const treadling = Math.max(loom_settings.treadles, (0, exports.numTreadles)(loom));
    if (ndx.j < 0)
        return false;
    if (ndx.j > treadling)
        return false;
    if (ndx.i < 0)
        return false;
    if (ndx.i >= loom.treadling.length)
        return false;
    return true;
};
exports.isInUserTreadlingRange = isInUserTreadlingRange;
/**
 * checks if a given interlacement is within the range of the threading
 * @param loom the loom to check with
 * @param ndx the interlacement to check
 * @returns true or false to determine if in or out of range
 */
const isInTieupRange = (loom, ndx) => {
    if (ndx.i < 0)
        return false;
    if (ndx.i > loom.tieup.length)
        return false;
    if (ndx.i < 0)
        return false;
    if (ndx.i >= loom.tieup[0].length)
        return false;
    return true;
};
exports.isInTieupRange = isInTieupRange;
/**
 * checks if a given interlacement is within the range of the threading including the user defined settings
 * @param loom the loom to check with
 * @param ndx the interlacement to check
 * @returns true or false to determine if in or out of range
 */
const isInUserTieupRange = (loom, loom_settings, ndx) => {
    const frames = Math.max(loom_settings.frames, (0, exports.numFrames)(loom));
    const treadling = Math.max(loom_settings.treadles, (0, exports.numTreadles)(loom));
    if (ndx.i < 0)
        return false;
    if (ndx.i >= frames)
        return false;
    if (ndx.i < 0)
        return false;
    if (ndx.i >= treadling)
        return false;
    return true;
};
exports.isInUserTieupRange = isInUserTieupRange;
/**
 * returns true if this loom typically requires a view of threading and tieup
 */
const isFrame = (loom_settings) => {
    if (loom_settings.type !== 'jacquard')
        return true;
    return false;
};
exports.isFrame = isFrame;
/**
 * assumes the input to the function is a loom of type that uses a tieup and treadling and converts it to a loom that uses a direct tie and lift plan.
 */
const convertTieupToLiftPlan = (loom, ls) => {
    const max_frames = Math.max((0, exports.numFrames)(loom), ls.frames);
    const max_treadles = Math.max((0, exports.numTreadles)(loom), ls.treadles);
    const size = Math.max(max_frames, max_treadles);
    const converted = {
        threading: loom.threading.slice(),
        tieup: (0, exports.generateDirectTieup)(size),
        treadling: []
    };
    converted.treadling = loom.treadling.map(treadle_vals => {
        if (treadle_vals.length == 0)
            return [];
        const active_treadle = treadle_vals[0];
        const tieupcol = loom.tieup.reduce((acc, el) => {
            return acc.concat(el[active_treadle]);
        }, []);
        return tieupcol.map((el, ndx) => (el === true) ? ndx : -1).filter(el => el !== -1);
    });
    return converted;
};
exports.convertTieupToLiftPlan = convertTieupToLiftPlan;
/**
 * assumes the input to the function is a loom of type that uses a direct tie and lift plan and converts it to a loom that uses a tieup and treadling.
 */
const convertLiftPlanToTieup = (loom, ls) => {
    let tieup_ndx = 0;
    const shafts = ls.frames;
    const max_dim = Math.max(shafts, ls.treadles);
    const converted = {
        threading: loom.threading.slice(),
        tieup: (0, exports.generateDirectTieup)(max_dim),
        treadling: []
    };
    //store the previous tieup
    const tieup_col = [];
    for (let i = 0; i < shafts; i++) {
        tieup_col.push(false);
    }
    const seen = [];
    //look at each pick
    loom.treadling.forEach(pick => {
        let pick_as_string = '';
        if (pick.length != 0) {
            pick_as_string = "";
            for (let i = 0; i < shafts; i++) {
                if (pick.findIndex(el => el == i) !== -1)
                    pick_as_string = pick_as_string + '1';
                else
                    pick_as_string = pick_as_string + '0';
            }
            const ndx = seen.findIndex(el => el == pick_as_string);
            if (ndx !== -1) {
                //this pick will be assigned to an existing tieup column
                converted.treadling.push([ndx]);
            }
            else {
                //make a black tieup column
                const col = tieup_col.slice();
                //assign each selected left to the associated shaft
                pick.forEach(el => col[el] = true);
                converted.treadling.push([tieup_ndx]);
                //push this into the tieup
                for (let i = 0; i < shafts; i++) {
                    converted.tieup[i][tieup_ndx] = col[i];
                }
                seen.push(pick_as_string);
                tieup_ndx++;
            }
        }
        else {
            converted.treadling.push([]);
        }
    });
    return converted;
};
exports.convertLiftPlanToTieup = convertLiftPlanToTieup;
//# sourceMappingURL=loom.js.map