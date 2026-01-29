"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.shaded_satin = void 0;
const draft_1 = require("../../draft");
const sequence_1 = require("../../sequence");
const operations_1 = require("../../operations");
const categories_1 = require("../categories");
const utils_1 = require("../../utils");
const name = "shaded_satin";
const meta = {
    displayname: 'shaded satin',
    desc: 'Satin is a family of weave structures that create cloth with weft floats on one face of the fabric and warp floats on the other. The succeeding interlacements of warp and weft threads in each row occur on non-adjacent warp threads, creating a smooth surface of floating threads on each face. The number of ends between succeeding warp interlacements is consistent in each row (i.e. a 2/8 satin will have one raised warp end followed by a weft float over 8 warp ends in each row). Shaded satins typically use more than just one raised warp on each pic to control the visibility of the warp or weft colors proportionally.',
    img: 'shaded_satin.png',
    categories: [categories_1.structureOp],
    advanced: true
};
//PARAMS
const warps_raised = {
    name: 'warps raised',
    type: 'number',
    min: 0,
    max: 5000,
    value: 2,
    dx: 'the number of warps to raise on the first pic'
};
const warps_lowered = {
    name: 'warps lowered',
    type: 'number',
    min: 0,
    max: 5000,
    value: 5,
    dx: "the number of warps to keep lowered on the first pic"
};
const shift = {
    name: 'shift',
    type: 'number',
    min: 1,
    max: 5000,
    value: 2,
    dx: 'amount to offset the interlacements on each row'
};
const facing = {
    name: 'facing',
    type: 'boolean',
    falsestate: "weft facing",
    truestate: "warp facing",
    value: 0,
    dx: ''
};
const params = [warps_raised, warps_lowered, shift, facing];
//INLETS
const inlets = [];
const perform = (param_vals) => {
    const raised = (0, operations_1.getOpParamValById)(0, param_vals);
    const lowered = (0, operations_1.getOpParamValById)(1, param_vals);
    const shift = (0, operations_1.getOpParamValById)(2, param_vals);
    const facing = (0, operations_1.getOpParamValById)(3, param_vals);
    const first_row = new sequence_1.Sequence.OneD();
    first_row.pushMultiple(1, raised).pushMultiple(0, lowered);
    if (facing)
        first_row.invert();
    const pattern = new sequence_1.Sequence.TwoD();
    for (let i = 0; i < raised + lowered; i++) {
        pattern.pushWeftSequence(first_row.shift(shift).val());
    }
    const draft = (0, draft_1.initDraftFromDrawdown)(pattern.export());
    return Promise.resolve([{ draft }]);
};
const generateName = (param_vals) => {
    return 'shaded satin(' + (0, operations_1.flattenParamVals)(param_vals) + ")";
};
const sizeCheck = (param_vals) => {
    const raised = (0, operations_1.getOpParamValById)(0, param_vals);
    const lowered = (0, operations_1.getOpParamValById)(1, param_vals);
    const total = raised + lowered;
    return (total * total <= utils_1.defaults.max_area) ? true : false;
};
exports.shaded_satin = { name, meta, params, inlets, perform, generateName, sizeCheck };
//# sourceMappingURL=shaded_satin.js.map