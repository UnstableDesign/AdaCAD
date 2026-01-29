"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.twill = void 0;
const draft_1 = require("../../draft");
const sequence_1 = require("../../sequence");
const operations_1 = require("../../operations");
const categories_1 = require("../categories");
const utils_1 = require("../../utils");
const name = "twill";
const meta = {
    displayname: 'twill',
    desc: 'Twill is a family of weave structures in which weft picks pass over or under one or more warp threads in a repeating pattern. The same interlacement sequence begins on an adjacent warp end, either to the left or right, in the next weft row, creating a diagonal pattern of interlacement.',
    img: 'twill.png',
    categories: [categories_1.structureOp]
};
//PARAMS
const warps_raised = {
    name: 'warps raised',
    type: 'number',
    min: 0,
    max: 5000,
    value: 1,
    dx: ""
};
const warps_lowered = {
    name: 'warps lowered',
    type: 'number',
    min: 0,
    max: 5000,
    value: 3,
    dx: ""
};
const sz = {
    name: 'S/Z',
    type: 'boolean',
    falsestate: 'S',
    truestate: 'Z',
    value: 0,
    dx: ''
};
const facing = {
    name: 'facing',
    type: 'boolean',
    falsestate: "A",
    truestate: "B",
    value: 0,
    dx: ''
};
const params = [warps_raised, warps_lowered, sz, facing];
//INLETS
const inlets = [];
const perform = (param_vals) => {
    const raised = (0, operations_1.getOpParamValById)(0, param_vals);
    const lowered = (0, operations_1.getOpParamValById)(1, param_vals);
    const sz = (0, operations_1.getOpParamValById)(2, param_vals);
    const facing = (0, operations_1.getOpParamValById)(3, param_vals);
    const first_row = new sequence_1.Sequence.OneD();
    first_row.pushMultiple(1, raised).pushMultiple(0, lowered);
    if (facing)
        first_row.invert();
    const pattern = new sequence_1.Sequence.TwoD();
    const shift_dir = (sz) ? -1 : 1;
    for (let i = 0; i < (raised + lowered); i++) {
        pattern.pushWeftSequence(first_row.shift(shift_dir).val());
    }
    const draft = (0, draft_1.initDraftFromDrawdown)(pattern.export());
    return Promise.resolve([{ draft }]);
};
const generateName = (param_vals) => {
    const raised = (0, operations_1.getOpParamValById)(0, param_vals);
    const lowered = (0, operations_1.getOpParamValById)(1, param_vals);
    const sz = (0, operations_1.getOpParamValById)(2, param_vals);
    const dir = (sz) ? "S" : "Z";
    return 'twill(' + raised + "," + lowered + "," + dir + ')';
};
const sizeCheck = (param_vals) => {
    const raised = (0, operations_1.getOpParamValById)(0, param_vals);
    const lowered = (0, operations_1.getOpParamValById)(1, param_vals);
    const size = raised + lowered;
    return (size * size <= utils_1.defaults.max_area) ? true : false;
};
exports.twill = { name, meta, params, inlets, perform, generateName, sizeCheck };
//# sourceMappingURL=twill.js.map