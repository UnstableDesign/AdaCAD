"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.complex_twill = void 0;
const draft_1 = require("../../draft");
const sequence_1 = require("../../sequence");
const operations_1 = require("../../operations");
const categories_1 = require("../categories");
const utils_1 = require("../../utils");
const name = "complex_twill";
const meta = {
    displayname: "complex twill",
    desc: "In this context, a complex twill is a straight twill with multiple ratios of interlacement in a single structure unit so that a 2 2 3 3 pattern describes a structure with two raised warp ends, two lowered ends, three raised ends, and three lowered ends. Each successive pic begins the same pattern of interlacement on an adjacent warp end, creating a diagonal pattern.",
    advanced: true,
    categories: [categories_1.structureOp],
    img: 'complex_twill.png',
    old_names: ['complextwill']
};
//PARAMS
const string_input = {
    name: 'pattern',
    type: 'string',
    regex: /^(\d+\s)*\d+\s*$/i,
    value: '2 2 3 3',
    error: '',
    dx: 'the under over pattern of this twill'
};
const sz = {
    name: 'S/Z',
    type: 'boolean',
    falsestate: 'S',
    truestate: 'Z',
    value: 0,
    dx: ''
};
const params = [string_input, sz];
//INLETS
const inlets = [];
const perform = (param_vals) => {
    const input_string = (0, operations_1.getOpParamValById)(0, param_vals);
    const sz = (0, operations_1.getOpParamValById)(1, param_vals);
    const input_array = input_string.split(' ').map(el => parseInt(el));
    const size = input_array.reduce((acc, val) => {
        return val + acc;
    }, 0);
    const first_row = new sequence_1.Sequence.OneD();
    let under = true;
    input_array.forEach(input => {
        first_row.pushMultiple(under, input);
        under = !under;
    });
    const pattern = new sequence_1.Sequence.TwoD();
    const shift_dir = (sz) ? -1 : 1;
    for (let i = 0; i < size; i++) {
        pattern.pushWeftSequence(first_row.shift(shift_dir).val());
    }
    const draft = (0, draft_1.initDraftFromDrawdown)(pattern.export());
    return Promise.resolve([{ draft: draft }]);
};
const generateName = (param_vals) => {
    return 'complex twill(' + (0, operations_1.flattenParamVals)(param_vals) + ")";
};
const sizeCheck = (param_vals) => {
    const input_string = (0, operations_1.getOpParamValById)(0, param_vals);
    const input_array = input_string.split(' ').map(el => parseInt(el));
    const size = input_array.reduce((acc, val) => {
        return val + acc;
    }, 0);
    return (size * size <= utils_1.defaults.max_area) ? true : false;
};
exports.complex_twill = { name, meta, params, inlets, perform, generateName, sizeCheck };
//# sourceMappingURL=complex_twill.js.map