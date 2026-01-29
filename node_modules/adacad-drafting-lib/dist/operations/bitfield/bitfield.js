"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.bitfield = void 0;
const mathjs_1 = require("mathjs");
const __1 = require("..");
const draft_1 = require("../../draft/draft");
const sequence_1 = require("../../sequence");
const defaults_1 = require("../../utils/defaults");
const categories_1 = require("../categories");
const name = "bitfield";
const meta = {
    displayname: 'bitfield',
    advanced: true,
    categories: [categories_1.structureOp],
    authors: ["Alex McLean"],
    desc: "Creates a structure based on a bitfield function, a mathematical function that uses x/y values to determine which heddles are lifted and lowered. ",
    img: 'bitfield.png'
};
//PARAMS
const warps = {
    name: "ends",
    type: "number",
    min: 1,
    max: 128,
    value: 32,
    dx: "Number of warps",
};
const wefts = {
    name: "pics",
    type: "number",
    min: 1,
    max: 128,
    value: 32,
    dx: "Number of wefts",
};
const f = {
    name: "bitfield function",
    type: "string",
    regex: /.*/,
    error: "Invalid expression",
    value: "(x ^ y) % 3",
    dx: "Maths expression that uses x/y values to return a boolean value for each cell, to make 'bitfield' patterns",
};
const params = [warps, wefts, f];
const inlets = [];
const perform = (param_vals) => {
    const num_warps = (0, __1.getOpParamValById)(0, param_vals);
    const num_wefts = (0, __1.getOpParamValById)(1, param_vals);
    let script = (0, __1.getOpParamValById)(2, param_vals);
    // Mathjs uses ^ for pow, and ^| for bitwise xor
    // This replaces ^ with ^|, so folks don't have to type the |
    script = script.replace(/\^(?!\|)/, "^|");
    // Evaluate as an expression with mathjs. This could just be done with a javascript eval(), but this is more secure.
    const func = (0, mathjs_1.evaluate)("f(x, y) = ".concat(script));
    const pattern = new sequence_1.Sequence.TwoD();
    for (let weft = 0; weft < num_wefts; ++weft) {
        const row = new sequence_1.Sequence.OneD();
        for (let warp = 0; warp < num_warps; ++warp) {
            row.push(!!func(warp, weft));
        }
        pattern.pushWeftSequence(row.val());
    }
    return Promise.resolve([{ draft: (0, draft_1.initDraftFromDrawdown)(pattern.export()) }]);
};
const sizeCheck = (param_vals) => {
    const cols = (0, __1.getOpParamValById)(0, param_vals);
    const rows = (0, __1.getOpParamValById)(1, param_vals);
    return (cols * rows <= defaults_1.defaults.max_area) ? true : false;
};
const generateName = (param_vals) => {
    const num_up = (0, __1.getOpParamValById)(0, param_vals);
    return num_up + "/bitfield";
};
exports.bitfield = {
    name,
    meta,
    params,
    inlets,
    perform,
    generateName,
    sizeCheck,
};
//# sourceMappingURL=bitfield.js.map