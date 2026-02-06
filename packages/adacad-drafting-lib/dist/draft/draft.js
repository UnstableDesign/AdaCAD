"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.flipDraft = exports.getDraftName = exports.getCol = exports.deleteMappingCol = exports.deleteDrawdownCol = exports.insertMappingCol = exports.insertDrawdownCol = exports.deleteMappingRow = exports.deleteDrawdownRow = exports.insertMappingRow = exports.insertDrawdownRow = exports.updateWarpSystemsAndShuttles = exports.updateWeftSystemsAndShuttles = exports.generateMappingFromPattern = exports.flipDrawdown = exports.shiftDrawdown = exports.invertDrawdown = exports.applyMask = exports.createBlankDrawdown = exports.unpackDrawdownFromArray = exports.exportDrawdownToArray = exports.unpackDrawdownFromBitArray = exports.exportDrawdownToBitArray = exports.compressDraft = exports.cropDraft = exports.drawDraftViewCell = exports.getDraftAsImage = exports.pasteIntoDrawdown = exports.getHeddle = exports.setHeddle = exports.isSet = exports.isUp = exports.hasCell = exports.warps = exports.wefts = exports.createDraft = exports.initDraftFromDrawdown = exports.initDraftWithParams = exports.copyDraft = exports.initDraft = void 0;
const utils_1 = require("../utils/utils");
const cell_1 = require("./cell");
const defaults_1 = require("../utils/defaults");
/**
 * generates an empty draft with a unique id
 * @returns
 */
const initDraft = () => {
    const d = {
        id: (0, utils_1.generateId)(8),
        gen_name: defaults_1.defaults.draft_name,
        ud_name: "",
        drawdown: [],
        rowShuttleMapping: [],
        rowSystemMapping: [],
        colShuttleMapping: [],
        colSystemMapping: []
    };
    return d;
};
exports.initDraft = initDraft;
/**
 * generates a deep copy of the input draft
 * @returns
 */
const copyDraft = (d) => {
    const copy_draft = (0, exports.initDraftWithParams)({
        id: d.id,
        ud_name: d.ud_name,
        gen_name: d.gen_name,
        warps: (0, exports.warps)(d.drawdown),
        wefts: (0, exports.wefts)(d.drawdown),
        drawdown: d.drawdown,
        rowShuttleMapping: d.rowShuttleMapping,
        rowSystemMapping: d.rowSystemMapping,
        colShuttleMapping: d.colShuttleMapping,
        colSystemMapping: d.colSystemMapping
    });
    return copy_draft;
};
exports.copyDraft = copyDraft;
/**
 * initializes a draft with the parameters provided. If the draft is too large to render, an error will be returned.
 * @param params
 * @returns
 */
const initDraftWithParams = (params) => {
    //we need to do a check here to make sure a 
    const d = {
        id: (0, utils_1.generateId)(8),
        gen_name: defaults_1.defaults.draft_name,
        ud_name: "",
        drawdown: [],
        rowShuttleMapping: [],
        rowSystemMapping: [],
        colShuttleMapping: [],
        colSystemMapping: []
    };
    if (params.id !== undefined)
        d.id = params.id;
    if (params.gen_name !== undefined)
        d.gen_name = params.gen_name;
    if (params.ud_name !== undefined)
        d.ud_name = params.ud_name;
    //handle common error
    if (params.pattern !== undefined) {
        const area = params.pattern.length * params.pattern[0].length;
        if (area > defaults_1.defaults.max_area)
            console.error(`Draft area is too large to render. Maximum area is ${defaults_1.defaults.max_area} cells.`);
        params.drawdown = params.pattern.map(row => row.map(cell => (0, cell_1.createCell)(cell)));
    }
    //start with empty draft 
    if (params.wefts === undefined) {
        if (params.drawdown == undefined)
            params.wefts = 1;
        else
            params.wefts = (0, exports.wefts)(params.drawdown);
        if (params.wefts > defaults_1.defaults.max_area)
            console.error(`Draft area is too large to render. Maximum area is ${defaults_1.defaults.max_area} cells.`);
    }
    if (params.warps === undefined) {
        if (params.drawdown == undefined)
            params.warps = 1;
        else
            params.warps = (0, exports.warps)(params.drawdown);
        if (params.warps > defaults_1.defaults.max_area)
            console.error(`Draft area is too large to render. Maximum area is ${defaults_1.defaults.max_area} cells.`);
    }
    if (params.wefts * params.warps > defaults_1.defaults.max_area)
        console.error(`Draft area is too large to render. Maximum area is ${defaults_1.defaults.max_area} cells.`);
    for (let i = 0; i < params.wefts; i++) {
        d.drawdown.push([]);
        d.rowSystemMapping.push(defaults_1.defaults.row_system);
        d.rowShuttleMapping.push(defaults_1.defaults.row_shuttle);
        for (let j = 0; j < params.warps; j++) {
            d.drawdown[i][j] = (0, cell_1.createCell)(false);
        }
    }
    for (let j = 0; j < params.warps; j++) {
        d.colSystemMapping.push(defaults_1.defaults.col_system);
        d.colShuttleMapping.push(defaults_1.defaults.col_shuttle);
    }
    if (params.drawdown !== undefined) {
        const total_wefts = (0, exports.wefts)(params.drawdown);
        const total_warps = (0, exports.warps)(params.drawdown);
        if (total_wefts * total_warps > defaults_1.defaults.max_area)
            console.error(`Draft area is too large to render. Maximum area is ${defaults_1.defaults.max_area} cells.`);
        d.drawdown.forEach((row, i) => {
            row.forEach((cell, j) => {
                const val = (params.drawdown ? params.drawdown[i % total_wefts][j % total_warps] : undefined);
                if (val !== undefined)
                    cell = (0, cell_1.setCellValue)(cell, (0, cell_1.getCellValue)(val));
            });
        });
    }
    if (params.rowShuttleMapping !== undefined) {
        for (let i = 0; i < (0, exports.wefts)(d.drawdown); i++) {
            d.rowShuttleMapping[i] = params.rowShuttleMapping[i % params.rowShuttleMapping.length];
        }
    }
    if (params.rowSystemMapping !== undefined) {
        for (let i = 0; i < (0, exports.wefts)(d.drawdown); i++) {
            d.rowSystemMapping[i] = params.rowSystemMapping[i % params.rowSystemMapping.length];
        }
    }
    if (params.colShuttleMapping !== undefined) {
        for (let i = 0; i < (0, exports.warps)(d.drawdown); i++) {
            d.colShuttleMapping[i] = params.colShuttleMapping[i % params.colShuttleMapping.length];
        }
    }
    if (params.colSystemMapping !== undefined) {
        for (let i = 0; i < (0, exports.warps)(d.drawdown); i++) {
            d.colSystemMapping[i] = params.colSystemMapping[i % params.colSystemMapping.length];
        }
    }
    return d;
};
exports.initDraftWithParams = initDraftWithParams;
/**
 * creates a draft using only information from a drawdown (no system or column information)
 * @returns
 */
const initDraftFromDrawdown = (drawdown) => {
    const area = drawdown.length * drawdown[0].length;
    if (area > defaults_1.defaults.max_area)
        console.error(`Draft area is too large to render. Maximum area is ${defaults_1.defaults.max_area} cells.`);
    const d = {
        id: (0, utils_1.generateId)(8),
        gen_name: defaults_1.defaults.draft_name,
        ud_name: "",
        drawdown: [],
        rowShuttleMapping: [],
        rowSystemMapping: [],
        colShuttleMapping: [],
        colSystemMapping: []
    };
    drawdown.forEach((row, i) => {
        d.drawdown.push([]);
        row.forEach((cell, j) => {
            d.drawdown[i][j] = (0, cell_1.setCellValue)(cell, (0, cell_1.getCellValue)(drawdown[i][j]));
        });
    });
    for (let i = 0; i < (0, exports.wefts)(d.drawdown); i++) {
        d.rowShuttleMapping[i] = defaults_1.defaults.row_shuttle;
        d.rowSystemMapping[i] = defaults_1.defaults.row_system;
    }
    for (let j = 0; j < (0, exports.warps)(d.drawdown); j++) {
        d.colShuttleMapping[j] = defaults_1.defaults.col_shuttle;
        d.colSystemMapping[j] = defaults_1.defaults.col_system;
    }
    return d;
};
exports.initDraftFromDrawdown = initDraftFromDrawdown;
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
const createDraft = (pattern, gen_name, ud_name, rowShuttleMapping, rowSystemMapping, colShuttleMapping, colSystemMapping) => {
    const area = pattern.length * pattern[0].length;
    if (area > defaults_1.defaults.max_area)
        console.error(`Draft area is too large to render. Maximum area is ${defaults_1.defaults.max_area} cells.`);
    const d = {
        id: (0, utils_1.generateId)(8),
        drawdown: pattern.slice(),
        gen_name: gen_name,
        ud_name: ud_name,
        rowShuttleMapping: rowShuttleMapping.slice(),
        rowSystemMapping: rowSystemMapping.slice(),
        colShuttleMapping: colShuttleMapping.slice(),
        colSystemMapping: colSystemMapping.slice(),
    };
    return d;
};
exports.createDraft = createDraft;
/**
 * calcualte the number of wefts (rows) in a pattern
 * @param d a drawdown or any 2D array
 * @returns the number of rows of 0 if undefined
 */
const wefts = (d) => {
    if (d === null || d == undefined)
        return 0;
    return d.length;
};
exports.wefts = wefts;
/**
 * calcualte the number of warps (cols) in a pattern
 * @param d a drawdown or any 2D array
 * @returns the number of cols of 0 if undefined
 */
const warps = (d) => {
    if (d === null || d == undefined)
        return 0;
    if (d[0] === undefined)
        return 0;
    return d[0].length;
};
exports.warps = warps;
/**
 * check if the giver interlacement within the size of the draft
 * @param i the selected weft
 * @param j the selected warp
 * @returns true/false
 */
const hasCell = (d, i, j) => {
    if (i < 0 || i >= (0, exports.wefts)(d))
        return false;
    if (j < 0 || j >= (0, exports.warps)(d))
        return false;
    return true;
};
exports.hasCell = hasCell;
/**
 * checks if the cells in the provided drawdown is up
 * @param d the drawdown
 * @param i weft
 * @param j warp
 * @returns true if set and up, false if set and down or unset
 */
const isUp = (d, i, j) => {
    //console.log("is up", i, j, wefts(d), warps(d), d[i][j]);
    if (i > -1 && i < (0, exports.wefts)(d) && j > -1 && j < (0, exports.warps)(d)) {
        return d[i][j].is_set && d[i][j].is_up;
    }
    else {
        return false;
    }
};
exports.isUp = isUp;
/**
 * checks if the cells in the provided drawdown is set or unset
 * @param d the drawdown
 * @param i weft
 * @param j warp
 * @returns true if set and up or down, false if unset
 */
const isSet = (d, i, j) => {
    if (i > -1 && i < (0, exports.wefts)(d) && j > -1 && j < (0, exports.warps)(d)) {
        return d[i][j].is_set;
    }
    else {
        return false;
    }
};
exports.isSet = isSet;
/**
 * sets the heddle at the specified location to the value provided
 * @param d drawdown
 * @param i weft
 * @param j warp
 * @param bool the value (true for up, false for down, null for unset)
 * @returns
 */
const setHeddle = (d, i, j, bool) => {
    d[i][j] = (0, cell_1.setCellValue)(d[i][j], bool);
    return d;
};
exports.setHeddle = setHeddle;
/**
 * get the value of the heddle at a given location
 * @param d the drawdown
 * @param i the weft row
 * @param j the warp col
 * @returns the heddle value (true, false or null for unset)
 */
const getHeddle = (d, i, j) => {
    if (i > (0, exports.wefts)(d) || j > (0, exports.warps)(d))
        return null;
    return (0, cell_1.getCellValue)(d[i][j]);
};
exports.getHeddle = getHeddle;
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
const pasteIntoDrawdown = (drawdown, fill_pattern, start_i, start_j, width, height) => {
    const rows = (0, exports.wefts)(fill_pattern);
    const cols = (0, exports.warps)(fill_pattern);
    // console.log("***PASTE INTO DRAWDOWN ", fill_pattern, rows, cols, width, height)
    //cycle through each visible row/column of the selection
    for (let i = 0; i < height; i++) {
        for (let j = 0; j < width; j++) {
            try {
                drawdown[start_i + i][start_j + j] = (0, cell_1.createCell)((0, cell_1.getCellValue)(fill_pattern[i % rows][j % cols]));
            }
            catch (e) {
                console.error(e);
            }
        }
    }
    return drawdown;
};
exports.pasteIntoDrawdown = pasteIntoDrawdown;
/**
 * when drafts are rendered to the screen they are drawn pixel by pixel to an Image element and rendered on the canvas. This is a much faster process than drawing as lines and shapes on a canvas.
 * @param draft the draft we will convert to an image
 * @param pix_per_cell the maximum cell size for each interlacement, calculated based on draft size and maximum canvas dimensions
 * @param floats boolean to render cells of the same value as floats (rather than bounded cells)
 * @param use_color boolean to render the color of the yarn
 * @param mats an array of the materials currently in use in the workspace
 * @returns
 */
const getDraftAsImage = (draft, pix_per_cell, floats, use_color, mats) => {
    pix_per_cell = Math.floor(pix_per_cell);
    const warp_num = (0, exports.warps)(draft.drawdown);
    const length = (0, exports.wefts)(draft.drawdown) * (0, exports.warps)(draft.drawdown) * Math.pow(pix_per_cell, 2) * 4;
    let uint8c = new Uint8ClampedArray(length);
    for (let i = 0; i < (0, exports.wefts)(draft.drawdown); i++) {
        for (let j = 0; j < (0, exports.warps)(draft.drawdown); j++) {
            const cell_val = (0, cell_1.getCellValue)(draft.drawdown[i][j]);
            // let is_weftwise_edge = 
            // (i % pix_per_cell == 0) || 
            // (i ==  wefts(draft.drawdown) * pix_per_cell -1);
            // let is_warpwise_edge = 
            // (j % pix_per_cell == 0) ||
            // (j ==  warps(draft.drawdown) * pix_per_cell -1);
            const weft_mat = mats.find(el => el.id == draft.rowShuttleMapping[i]);
            const warp_mat = mats.find(el => el.id == draft.colShuttleMapping[j]);
            let warp_col;
            let weft_col;
            if (warp_mat !== undefined) {
                warp_col = {
                    id: 'warp',
                    r: warp_mat.rgb.r,
                    g: warp_mat.rgb.g,
                    b: warp_mat.rgb.b,
                    a: 255
                };
            }
            else {
                warp_col = defaults_1.rendering_color_defaults[0];
            }
            if (weft_mat !== undefined) {
                weft_col = {
                    id: 'weft',
                    r: weft_mat.rgb.r,
                    g: weft_mat.rgb.g,
                    b: weft_mat.rgb.b,
                    a: 255
                };
            }
            else {
                weft_col = defaults_1.rendering_color_defaults[0];
            }
            if (!floats && !use_color) {
                uint8c = (0, exports.drawDraftViewCell)(uint8c, i, j, cell_val, pix_per_cell, warp_num, use_color, warp_col, weft_col);
            }
            else {
                uint8c = drawFloatViewCell(uint8c, i, j, cell_val, pix_per_cell, warp_num, use_color, warp_col, weft_col);
            }
        }
    }
    const image = new ImageData(uint8c, (0, exports.warps)(draft.drawdown) * pix_per_cell);
    return image;
};
exports.getDraftAsImage = getDraftAsImage;
const drawDraftViewCell = (arr, i, j, val, dim, warp_num, use_color, warp, weft) => {
    let color_id = 0;
    const cols = defaults_1.rendering_color_defaults.concat([warp, weft]);
    for (let y = 0; y < dim; y++) {
        for (let x = 0; x < dim; x++) {
            const row_factor = (i * Math.pow(dim, 2) * 4 * warp_num) + (y * dim * 4 * warp_num);
            const col_factor = (j * 4 * dim) + (x * 4);
            const ndx = row_factor + col_factor;
            //make anything on an edge grey
            if (dim >= 4 && (y == 0 || y == dim - 1 || x == 0 || x == dim - 1)) {
                color_id = 3;
            }
            else {
                switch (val) {
                    case true:
                        if (use_color)
                            color_id = 4;
                        else
                            color_id = 1;
                        break;
                    case false:
                        if (use_color)
                            color_id = 5;
                        else
                            color_id = 0;
                        break;
                    case null:
                        if (Math.abs(y - x) < 2)
                            color_id = 3;
                        else
                            color_id = 0;
                        break;
                }
            }
            arr[ndx] = cols[color_id].r;
            arr[ndx + 1] = cols[color_id].g;
            arr[ndx + 2] = cols[color_id].b;
            arr[ndx + 3] = cols[color_id].a;
        }
    }
    return arr;
};
exports.drawDraftViewCell = drawDraftViewCell;
const drawFloatViewCell = (arr, i, j, val, dim, warp_num, use_color, warp, weft) => {
    let color_id = 0;
    const bg = {
        id: 'background',
        r: 245,
        g: 245,
        b: 245,
        a: 0
    };
    const cols = defaults_1.rendering_color_defaults.concat([warp, weft, bg]);
    //split the space into 3x3 and do nothing in the corners. 
    const margin_tl = Math.floor(dim / 8);
    const margin_bl = Math.floor(7 * dim / 8);
    const use_margins = (dim >= 5);
    for (let y = 0; y < dim; y++) {
        for (let x = 0; x < dim; x++) {
            const row_factor = (i * Math.pow(dim, 2) * 4 * warp_num) + (y * dim * 4 * warp_num);
            const col_factor = (j * 4 * dim) + (x * 4);
            const ndx = row_factor + col_factor;
            if (!use_margins) {
                if (val || null) {
                    if (use_color)
                        color_id = 4;
                    else
                        color_id = 0;
                }
                else {
                    if (use_color)
                        color_id = 5;
                    else
                        color_id = 1;
                }
            }
            else {
                //top left (bg)
                if (y < margin_tl && x >= 0 && x < margin_tl) {
                    color_id = 6;
                }
                //top center (warp)
                else if (y < margin_tl && x >= margin_tl && x < margin_bl) {
                    if (x == margin_tl)
                        color_id = 3;
                    else if (use_color)
                        color_id = 4;
                    else
                        color_id = 0;
                }
                //top right (bg)
                else if (y < margin_tl && x >= margin_bl && x < dim) {
                    if (x == margin_bl)
                        color_id = 3;
                    else
                        color_id = 6;
                }
                /*******/
                //center left (weft or bg)
                else if (y >= margin_tl && y < margin_bl && x >= 0 && x < margin_tl) {
                    if (val == null)
                        color_id = 6;
                    else if (y == margin_tl)
                        color_id = 3;
                    else if (use_color) {
                        color_id = 5;
                    }
                    else
                        color_id = 0;
                }
                //center center (shift based on val)
                else if (y >= margin_tl && y < margin_bl && x >= margin_tl && x < margin_bl) {
                    if (val == true || val == null) {
                        if (x == margin_tl)
                            color_id = 3;
                        else if (use_color)
                            color_id = 4;
                        else
                            color_id = 0;
                    }
                    else {
                        if (y == margin_tl)
                            color_id = 3;
                        else if (use_color)
                            color_id = 5;
                        else
                            color_id = 0;
                    }
                }
                //center right (weft or bg)
                else if (y >= margin_tl && y < margin_bl && x >= margin_bl && x < dim) {
                    if (y == margin_tl && val != null)
                        color_id = 3;
                    else if ((val == true || val == null) && x == margin_bl)
                        color_id = 3;
                    else if (val == null)
                        color_id = 6;
                    else if (use_color)
                        color_id = 5;
                    else
                        color_id = 0;
                }
                // /*******/
                //bottom left
                else if (y >= margin_bl && x >= 0 && x < margin_tl) {
                    if (y == margin_bl && val != null)
                        color_id = 3;
                    else
                        color_id = 6;
                }
                //bottom center
                else if (y >= margin_bl && x >= margin_tl && x < margin_bl) {
                    if ((val == false) && y == margin_bl)
                        color_id = 3;
                    else if (x == margin_tl)
                        color_id = 3;
                    else if (use_color)
                        color_id = 4;
                    else
                        color_id = 0;
                }
                //bottom right
                else if (y >= margin_bl && x >= margin_bl && x < dim) {
                    if (x == margin_bl)
                        color_id = 3;
                    else if (y == margin_bl && val != null)
                        color_id = 3;
                    else
                        color_id = 6;
                }
                else {
                    if (y == margin_bl)
                        color_id = 3;
                    else
                        color_id = 6;
                }
            }
            arr[ndx] = cols[color_id].r;
            arr[ndx + 1] = cols[color_id].g;
            arr[ndx + 2] = cols[color_id].b;
            arr[ndx + 3] = cols[color_id].a;
        }
    }
    return arr;
};
/**
 * given a draft and a region, this function returns a new draft that only represents a segment of the original
 * @param draft
 * @param top
 * @param left
 * @param width
 * @param height
 * @returns
 */
const cropDraft = (draft, top, left, width, height) => {
    const cropped = (0, exports.copyDraft)(draft); //this can never have a size error since a draft cannot be made too large
    if ((width * height) > defaults_1.defaults.max_area) {
        width = (0, exports.warps)(draft.drawdown);
        height = (0, exports.wefts)(draft.drawdown);
    }
    cropped.drawdown = (0, exports.createBlankDrawdown)(height, width);
    for (let i = top; i < top + height && i < (0, exports.wefts)(draft.drawdown); i++) {
        cropped.rowShuttleMapping[i - top] = draft.rowShuttleMapping[i];
        cropped.rowSystemMapping[i - top] = draft.rowSystemMapping[i];
        for (let j = left; j < left + width && j < (0, exports.warps)(draft.drawdown); j++) {
            cropped.drawdown[i - top][j - left] = (0, cell_1.createCell)((0, cell_1.getCellValue)(draft.drawdown[i][j]));
        }
    }
    for (let j = left; j < left + width && j < (0, exports.warps)(draft.drawdown); j++) {
        cropped.rowShuttleMapping[j - left] = draft.rowShuttleMapping[j];
        cropped.rowSystemMapping[j - left] = draft.rowSystemMapping[j];
    }
    return cropped;
};
exports.cropDraft = cropDraft;
const compressDraft = (draft) => {
    const comp = {
        id: draft.id,
        ud_name: draft.ud_name,
        gen_name: draft.gen_name,
        warps: (0, exports.warps)(draft.drawdown),
        wefts: (0, exports.wefts)(draft.drawdown),
        compressed_drawdown: (0, exports.exportDrawdownToArray)(draft.drawdown),
        rowSystemMapping: draft.rowSystemMapping.slice(),
        rowShuttleMapping: draft.rowShuttleMapping.slice(),
        colSystemMapping: draft.colSystemMapping.slice(),
        colShuttleMapping: draft.colShuttleMapping.slice(),
    };
    return comp;
};
exports.compressDraft = compressDraft;
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
const exportDrawdownToBitArray = (drawdown) => {
    const arr = [];
    let curval = 0;
    let ticker = 0;
    for (let i = 0; i < (0, exports.wefts)(drawdown) * (0, exports.warps)(drawdown); i++) {
        ticker++;
        curval = curval << 2; //push two 0 in from the left
        const ndx_i = Math.floor(i / (0, exports.warps)(drawdown));
        const ndx_j = i % (0, exports.warps)(drawdown);
        switch ((0, cell_1.getCellValue)(drawdown[ndx_i][ndx_j])) {
            case null:
                curval = curval | 0;
                break;
            case true:
                curval = curval | 3;
                break;
            case false:
                curval = curval | 2;
                break;
        }
        if (ticker % 4 == 0) {
            arr.push(curval);
            curval = 0;
        }
    }
    if (ticker % 4 != 0) {
        while (ticker % 4 != 0) {
            curval = curval << 2;
            ticker++;
        }
        arr.push(curval);
    }
    return new Uint8ClampedArray(arr);
};
exports.exportDrawdownToBitArray = exportDrawdownToBitArray;
const unpackDrawdownFromBitArray = (arr, warps, wefts) => {
    const drawdown = (0, exports.createBlankDrawdown)(wefts, warps);
    const selector = [192, 48, 12, 3]; //11000000, 00110000, 00001100, 00000011
    for (let i = 0; i < arr.length; i++) {
        const ddi = i * 4;
        for (let j = 0; j < 4; j++) {
            const ndx_i = Math.floor((ddi + j) / warps);
            const ndx_j = (ddi + j) % warps;
            if (ndx_i < wefts && ndx_j < warps) {
                const val = (arr[i] & selector[j]) >> (6 - (j * 2)); // & to isolate the region, >> to make it only read as a 2 bit value
                switch (val) {
                    case 0:
                        drawdown[ndx_i][ndx_j] = (0, cell_1.createCell)(null);
                        break;
                    case 1:
                        drawdown[ndx_i][ndx_j] = (0, cell_1.createCell)(null);
                        break;
                    case 2:
                        drawdown[ndx_i][ndx_j] = (0, cell_1.createCell)(false);
                        break;
                    default:
                        drawdown[ndx_i][ndx_j] = (0, cell_1.createCell)(true);
                        break;
                }
            }
        }
    }
    return drawdown;
};
exports.unpackDrawdownFromBitArray = unpackDrawdownFromBitArray;
/**
 * used ot create compressed draft format for saving. Switched back to explore as flat array of numbers
 * because exporting as unclamped array was not loading correctly when saved to file
 * @param drawdown
 * @returns
 */
const exportDrawdownToArray = (drawdown) => {
    const arr = [];
    for (let i = 0; i < (0, exports.wefts)(drawdown); i++) {
        for (let j = 0; j < (0, exports.warps)(drawdown); j++) {
            const val = (0, cell_1.getCellValue)(drawdown[i][j]);
            switch (val) {
                case null:
                    arr.push(2);
                    break;
                case true:
                    arr.push(1);
                    break;
                case false:
                    arr.push(0);
                    break;
            }
        }
    }
    return arr;
    //return new Uint8ClampedArray(arr);
};
exports.exportDrawdownToArray = exportDrawdownToArray;
const unpackDrawdownFromArray = (compressed, warps, wefts) => {
    if (wefts * warps > defaults_1.defaults.max_area)
        console.error(`Draft area is too large to render. Maximum area is ${defaults_1.defaults.max_area} cells.`);
    const dd = (0, exports.createBlankDrawdown)(wefts, warps);
    for (let n = 0; n < compressed.length; n++) {
        const i = Math.floor(n / warps);
        const j = n % warps;
        let cell;
        switch (compressed[n]) {
            case 0:
                cell = (0, cell_1.createCell)(false);
                break;
            case 1:
                cell = (0, cell_1.createCell)(true);
                break;
            case 2:
                cell = (0, cell_1.createCell)(null);
                break;
            default:
                cell = (0, cell_1.createCell)(null);
                break;
        }
        dd[i][j] = cell;
    }
    return dd;
};
exports.unpackDrawdownFromArray = unpackDrawdownFromArray;
/**
 * creates an empty drawdown of a given size
 * @param wefts
 * @param warps
 * @returns a Drawdown object
 */
const createBlankDrawdown = (wefts, warps) => {
    if (wefts * warps > defaults_1.defaults.max_area)
        console.error(`Draft area is too large to render. Maximum area is ${defaults_1.defaults.max_area} cells.`);
    const drawdown = [];
    for (let i = 0; i < wefts; i++) {
        drawdown.push([]);
        for (let j = 0; j < warps; j++) {
            drawdown[i].push((0, cell_1.createCell)(false));
        }
    }
    return drawdown;
};
exports.createBlankDrawdown = createBlankDrawdown;
/**
 * applys a pattern only to regions where the input draft has true heddles
 * @param mask the pattern to use as a mask
 * @param pattern the pattern to fill with
 * @returns the result
 */
const applyMask = (mask, pattern) => {
    const res = (0, exports.createBlankDrawdown)((0, exports.wefts)(mask), (0, exports.warps)(mask));
    for (let i = 0; i < (0, exports.wefts)(mask); i++) {
        for (let j = 0; j < (0, exports.warps)(mask); j++) {
            if ((0, cell_1.getCellValue)(mask[i][j])) {
                const set_to = (0, cell_1.getCellValue)(pattern[i % (0, exports.wefts)(pattern)][j % (0, exports.warps)(pattern)]);
                res[i][j] = (0, cell_1.createCell)(set_to);
            }
        }
    }
    return res;
};
exports.applyMask = applyMask;
/**
 * inverts the drawdown (e.g. sets true cells to false and vice versa)
 * @param drawdown the drawdown to invert
 * @returns the inverted drawdown
 */
const invertDrawdown = (drawdown) => {
    const inverted = drawdown.slice();
    for (let i = 0; i < (0, exports.wefts)(drawdown); i++) {
        for (let j = 0; j < (0, exports.warps)(drawdown); j++) {
            if (drawdown[i][j].is_set) {
                const set_to = !(0, cell_1.getCellValue)(drawdown[i][j]);
                inverted[i][j] = (0, cell_1.createCell)(set_to);
            }
        }
    }
    return inverted;
};
exports.invertDrawdown = invertDrawdown;
/**
 * shifts the drawdown up or left by the amount specified.
 * @param drawdown the drawdown to shift
 * @param up shift up = true, left = false
 * @param inc the amount to shift by
 * @returns the shfited drawdown
 */
const shiftDrawdown = (drawdown, up, inc) => {
    const shifted = (0, exports.createBlankDrawdown)((0, exports.wefts)(drawdown), (0, exports.warps)(drawdown));
    for (let i = 0; i < (0, exports.wefts)(drawdown); i++) {
        for (let j = 0; j < (0, exports.warps)(drawdown); j++) {
            let set_to = false;
            if (up)
                set_to = (0, cell_1.getCellValue)(drawdown[(i + inc) % (0, exports.wefts)(drawdown)][j]);
            else
                set_to = (0, cell_1.getCellValue)(drawdown[i][(j + inc) % (0, exports.warps)(drawdown)]);
            shifted[i][j] = (0, cell_1.createCell)(set_to);
        }
    }
    return shifted;
};
exports.shiftDrawdown = shiftDrawdown;
/**
* flips the drawdown horizontally or vertically. This is different than flip draft because it only
* flippes teh drawdown, not any other associated information
* @param drawdown the drawdown to shift
* @param horiz true for horizontal flip, false for vertical
* @returns the flipped drawdown
*/
const flipDrawdown = (drawdown, horiz) => {
    const flip = (0, exports.createBlankDrawdown)((0, exports.wefts)(drawdown), (0, exports.warps)(drawdown));
    for (let i = 0; i < (0, exports.wefts)(drawdown); i++) {
        for (let j = 0; j < (0, exports.warps)(drawdown); j++) {
            let set_to = false;
            if (horiz)
                set_to = (0, cell_1.getCellValue)(drawdown[i][(0, exports.warps)(drawdown) - 1 - j]);
            else
                set_to = (0, cell_1.getCellValue)(drawdown[(0, exports.wefts)(drawdown) - 1 - i][j]);
            flip[i][j] = (0, cell_1.createCell)(set_to);
        }
    }
    return flip;
};
exports.flipDrawdown = flipDrawdown;
/**
 * generates a system or shuttle mapping from an input pattern based on the input draft
 * @param drawdown the drawdown for which we are creating this mapping
 * @param pattern the repeating pattern to use when creating the mapping
 * @param type specify if this is a 'row'/weft or 'col'/warp mapping
 * @returns the mapping to use
 */
const generateMappingFromPattern = (drawdown, pattern, type) => {
    const mapping = [];
    if (type == 'row') {
        for (let i = 0; i < (0, exports.wefts)(drawdown); i++) {
            mapping.push(pattern[i % pattern.length]);
        }
    }
    else {
        for (let j = 0; j < (0, exports.warps)(drawdown); j++) {
            mapping.push(pattern[j % pattern.length]);
        }
    }
    return mapping.slice();
};
exports.generateMappingFromPattern = generateMappingFromPattern;
/**
 * take the system and shuttle and
 * @param to
 * @param from
 */
const updateWeftSystemsAndShuttles = (to, from) => {
    if (from == null || from == undefined)
        from = (0, exports.initDraftWithParams)({ wefts: 1, warps: 1, drawdown: [[(0, cell_1.createCell)(false)]] });
    to.rowShuttleMapping = (0, exports.generateMappingFromPattern)(to.drawdown, from.rowShuttleMapping, 'row');
    to.rowSystemMapping = (0, exports.generateMappingFromPattern)(to.drawdown, from.rowSystemMapping, 'row');
    return to;
};
exports.updateWeftSystemsAndShuttles = updateWeftSystemsAndShuttles;
const updateWarpSystemsAndShuttles = (to, from) => {
    if (from == null || from == undefined)
        from = (0, exports.initDraftWithParams)({ wefts: 1, warps: 1, drawdown: [[(0, cell_1.createCell)(false)]] });
    to.colShuttleMapping = (0, exports.generateMappingFromPattern)(to.drawdown, from.colShuttleMapping, 'col');
    to.colSystemMapping = (0, exports.generateMappingFromPattern)(to.drawdown, from.colSystemMapping, 'col');
    return to;
};
exports.updateWarpSystemsAndShuttles = updateWarpSystemsAndShuttles;
/**
 * I DON"T THINK THIS FUNCTION WORKS OR IS BEING USED
 * removes any boundary rows from the input draft that are unset
 * @return returns the resulting draft
 */
// export const trimUnsetRows = (d: Drawdown) : Drawdown => {
//   const rowmap: Array<number> = [];
//   const to_delete: Array<number> = [];
//   //make a list of rows that contains the number of set cells
//   d.forEach(row => {
//     const active_cells: Array<Cell> = row.filter(cell => (cell.isSet()));
//     rowmap.push(active_cells.length);
//   });
//   let delete_top: number = 0;
//   let top_hasvalue: boolean = false;
//   //scan from top and bottom to see how many rows we shoudl delete
//   for(let ndx = 0; ndx < rowmap.length; ndx++){
//       if(rowmap[ndx] == 0 && !top_hasvalue){
//         delete_top++;
//       }else{
//         top_hasvalue = true;
//       }
//   }
//   if(delete_top == rowmap.length) return []; //this is empty now
//   let delete_bottom: number = 0;
//   let bottom_hasvalue:boolean = false;
//   for(let ndx = rowmap.length -1; ndx >= 0; ndx--){
//     if(rowmap[ndx] == 0 && !bottom_hasvalue){
//       delete_bottom++;
//     }else{
//       bottom_hasvalue = true;
//     }
//   }
//   return d;
// }
/**
 * insert a row into the drawdown at a given location
 * @param d the drawdown
 * @param i the weft location
 * @param row the row to insert, or null if row should be blank.
 * @returns
 */
const insertDrawdownRow = (d, i, row) => {
    i = i + 1;
    if (row === null) {
        row = [];
        for (let j = 0; j < (0, exports.warps)(d); j++) {
            row.push((0, cell_1.createCell)(false));
        }
    }
    if (row.length !== (0, exports.warps)(d))
        console.error("inserting row of incorrect length into drawdown");
    try {
        d.splice(i, 0, row);
    }
    catch (e) {
        console.error(e);
    }
    return d;
};
exports.insertDrawdownRow = insertDrawdownRow;
/**
 * inserts a new value into the row system/shuttle map
 * @param m the map to modify
 * @param i the place at which to add the row
 * @param val the value to insert
 * @returns
 */
const insertMappingRow = (m, i, val) => {
    i = i + 1;
    try {
        m.splice(i, 0, val);
    }
    catch (e) {
        console.error(e);
    }
    return m;
};
exports.insertMappingRow = insertMappingRow;
/**
 * deletes a row from the drawdown at the specified weft location
 * @param d drawdown
 * @param i weft location
 * @returns the modified drawdown
 */
const deleteDrawdownRow = (d, i) => {
    try {
        d.splice(i, 1);
    }
    catch (e) {
        console.error(e);
    }
    return d;
};
exports.deleteDrawdownRow = deleteDrawdownRow;
/**
 * deletes a row from a row system/shuttle mapping at the specified weft location
 * @param m the mapping
 * @param i the weft location
 * @returns the modified
 */
const deleteMappingRow = (m, i) => {
    try {
        m.splice(i, 1);
    }
    catch (e) {
        console.error(e);
    }
    return m;
};
exports.deleteMappingRow = deleteMappingRow;
/**
 * inserts a column into the drawdown
 * @param d the drawdown
 * @param j the warp location at which to insert
 * @param col - the column to insert or null if it should be a blank column
 * @returns the modified drawdown
 */
const insertDrawdownCol = (d, j, col) => {
    if (j === null)
        j = 0;
    if (col == null) {
        col = [];
        for (let i = 0; i < (0, exports.wefts)(d); i++) {
            col.push((0, cell_1.createCell)(false));
        }
    }
    for (let ndx = 0; ndx < (0, exports.wefts)(d); ndx++) {
        d[ndx].splice(j, 0, (0, cell_1.createCell)((0, cell_1.getCellValue)(col[ndx])));
    }
    return d;
};
exports.insertDrawdownCol = insertDrawdownCol;
/**
 * inserts a value into the col system/shuttle mapping at a particular location
 * @param m the map to modify
 * @param j the location at which to add
 * @param col the value to add
 * @returns
 */
const insertMappingCol = (m, j, col) => {
    m.splice(j, 0, col);
    return m;
};
exports.insertMappingCol = insertMappingCol;
/**
 * delete a column from the drawdown at a given location
 * @param d the drawdown
 * @param j the warp location
 * @returns the modified drawdown
 */
const deleteDrawdownCol = (d, j) => {
    for (let ndx = 0; ndx < (0, exports.wefts)(d); ndx++) {
        d[ndx].splice(j, 1);
    }
    return d;
};
exports.deleteDrawdownCol = deleteDrawdownCol;
/**
* deletes a value into the col system/shuttle mapping at a particular location
* @param m the mapping to modify
* @param j the warp location
* @returns the modified mapping
*/
const deleteMappingCol = (m, j) => {
    m.splice(j, 1);
    return m;
};
exports.deleteMappingCol = deleteMappingCol;
const getCol = (d, j) => {
    const col = d.reduce((acc, val, i) => {
        const cell = (0, cell_1.createCell)((0, cell_1.getCellValue)(d[i][j]));
        acc.push(cell);
        return acc;
    }, []);
    return col;
};
exports.getCol = getCol;
/**
 * gets the name of the draft. If it has a user defined name, it returns that, otherwise, it returns the generated name
 * @param draft
 * @returns
 */
const getDraftName = (draft) => {
    if (draft === null || draft === undefined)
        return "";
    if (draft.ud_name == undefined) {
        if (draft.gen_name == undefined)
            return '';
        else
            return draft.gen_name;
    }
    if (draft.gen_name == undefined) {
        if (draft.ud_name == undefined)
            return '';
        else
            return draft.ud_name;
    }
    return (draft.ud_name === "") ? draft.gen_name : draft.ud_name;
};
exports.getDraftName = getDraftName;
// /**
// * takes a draft as input, and flips the order of the rows
// * @param draft 
// */ 
const flipDraft = (d, horiz, vert) => {
    const draft = (0, exports.initDraftWithParams)({
        id: d.id,
        wefts: (0, exports.wefts)(d.drawdown),
        warps: (0, exports.warps)(d.drawdown),
        gen_name: d.gen_name,
        ud_name: d.ud_name,
        colShuttleMapping: d.colShuttleMapping,
        colSystemMapping: d.colSystemMapping
    });
    draft.drawdown = (0, exports.createBlankDrawdown)((0, exports.wefts)(d.drawdown), (0, exports.warps)(d.drawdown));
    for (let i = 0; i < (0, exports.wefts)(d.drawdown); i++) {
        let flipped_i = i;
        if (vert)
            flipped_i = (0, exports.wefts)(d.drawdown) - 1 - i;
        for (let j = 0; j < (0, exports.warps)(d.drawdown); j++) {
            let flipped_j = j;
            if (horiz)
                flipped_j = (0, exports.warps)(d.drawdown) - 1 - j;
            draft.drawdown[i][j] = (0, cell_1.createCell)((0, cell_1.getCellValue)(d.drawdown[flipped_i][flipped_j]));
        }
        draft.rowShuttleMapping[i] = d.rowShuttleMapping[flipped_i];
        draft.rowSystemMapping[i] = d.rowSystemMapping[flipped_i];
    }
    if (horiz) {
        for (let j = 0; j < (0, exports.warps)(d.drawdown); j++) {
            const flipped_j = (0, exports.warps)(d.drawdown) - 1 - j;
            draft.colShuttleMapping[j] = d.colShuttleMapping[flipped_j];
            draft.colSystemMapping[j] = d.colSystemMapping[flipped_j];
        }
    }
    return Promise.resolve(draft);
};
exports.flipDraft = flipDraft;
/**
 * this function generates a list of floats as well as a map of each cell in the draft to its associated float. This is used to compute layers within the draft
 * @param drawdown
 * @returns
 */
// export const createWeftFloatMap = (drawdown: Drawdown) : {float_list: Array<{id: number, float: YarnFloat}>, float_map: Array<Array<number>>} => {
//   const float_list: Array<{id: number, float: YarnFloat}> = [] ;
//   const float_map:Array<Array<number>> = [];
//   drawdown.forEach((row, i) => {
//     let j = 0;
//     while(j < warps(drawdown)){
//       let f:YarnFloat = getFloatLength(row, j, getCellValue(row[j]));
//       let f_id = float_list.length;
//       float_list.push({id: f_id, float: f })
//       for(let x = j; x < j+f.total_length; x++){
//         float_map[i][x] = f_id;
//       }
//       j += f.total_length;
//     }
//   });
//   return {float_list, float_map};
// }
//# sourceMappingURL=draft.js.map