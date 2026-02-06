"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.satin = void 0;
const draft_1 = require("../../draft");
const sequence_1 = require("../../sequence");
const operations_1 = require("../../operations");
const categories_1 = require("../categories");
const utils_1 = require("../../utils");
const name = "satin";
const meta = {
    displayname: 'satin',
    desc: 'Satin is a family of weave structures that create cloth with weft floats on one face of the fabric and warp floats on the other. The succeeding interlacements of warp and weft threads in each row occur on non-adjacent warp threads, creating a smooth surface of floating threads on each face. The number of ends between succeeding warp interlacements is consistent in each row (i.e. a 1/8 satin will have one raised warp end followed by a weft float over 8 warp ends in each row).',
    img: 'satin.png',
    categories: [categories_1.structureOp],
};
//PARAMS
const repeat = {
    name: 'repeat',
    type: 'number',
    min: 5,
    max: 5000,
    value: 5,
    dx: 'the width and height of the pattern'
};
const shift = {
    name: 'shift',
    type: 'number',
    min: 1,
    max: 5000,
    value: 2,
    dx: 'the move number on each row'
};
const facing = {
    name: 'facing',
    type: 'boolean',
    falsestate: "A",
    truestate: "B",
    value: 0,
    dx: ''
};
const params = [repeat, shift, facing];
//INLETS
const inlets = [];
const perform = (param_vals) => {
    const repeat = (0, operations_1.getOpParamValById)(0, param_vals);
    const shift = (0, operations_1.getOpParamValById)(1, param_vals);
    const facing = (0, operations_1.getOpParamValById)(2, param_vals);
    const first_row = new sequence_1.Sequence.OneD();
    first_row.push(1);
    for (let j = 0; j < repeat - 1; j++) {
        first_row.push(0);
    }
    if (facing)
        first_row.invert();
    const pattern = new sequence_1.Sequence.TwoD();
    for (let i = 0; i < repeat; i++) {
        pattern.pushWeftSequence(first_row.shift(shift).val());
    }
    const draft = (0, draft_1.initDraftFromDrawdown)(pattern.export());
    return Promise.resolve([{ draft }]);
};
const generateName = (param_vals) => {
    return 'satin(' + (0, operations_1.flattenParamVals)(param_vals) + ")";
};
const sizeCheck = (param_vals) => {
    const repeat = (0, operations_1.getOpParamValById)(0, param_vals);
    return (repeat * repeat <= utils_1.defaults.max_area) ? true : false;
};
exports.satin = { name, meta, params, inlets, perform, generateName, sizeCheck };
//# sourceMappingURL=satin.js.map