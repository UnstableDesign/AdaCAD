"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.satinish = void 0;
const draft_1 = require("../../draft");
const sequence_1 = require("../../sequence");
const operations_1 = require("../../operations");
const categories_1 = require("../categories");
const utils_1 = require("../../utils");
const name = "satinish";
const meta = {
    displayname: 'satinish',
    desc: 'Generates a structure by shifting the first row (described by the input string), the number of shifts specified on each row. This operation interprets the  term "satin" loosely as a repeating pic that is shifted 1 or more positions on each successive pic. ',
    img: 'satinish.png',
    categories: [categories_1.structureOp],
    advanced: true
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
const shift = {
    name: 'shift',
    type: 'number',
    min: 1,
    max: 5000,
    value: 2,
    dx: 'the move number on each row'
};
const sz = {
    name: 'S/Z',
    type: 'boolean',
    falsestate: 'S',
    truestate: 'Z',
    value: 0,
    dx: ''
};
const params = [string_input, shift, sz];
//INLETS
const inlets = [];
const perform = (param_vals) => {
    const input_string = (0, operations_1.getOpParamValById)(0, param_vals);
    const shift = (0, operations_1.getOpParamValById)(1, param_vals);
    const sz = (0, operations_1.getOpParamValById)(2, param_vals);
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
    const shift_dir = (sz) ? -1 * shift : 1 * shift;
    for (let i = 0; i < size; i++) {
        pattern.pushWeftSequence(first_row.shift(shift_dir).val());
    }
    const draft = (0, draft_1.initDraftFromDrawdown)(pattern.export());
    return Promise.resolve([{ draft }]);
};
const generateName = (param_vals) => {
    return 'satinish(' + (0, operations_1.flattenParamVals)(param_vals) + ")";
};
const sizeCheck = (param_vals) => {
    const input_string = (0, operations_1.getOpParamValById)(0, param_vals);
    const input_array = input_string.split(' ').map(el => parseInt(el));
    const size = input_array.reduce((acc, val) => {
        return val + acc;
    }, 0);
    return (size * size <= utils_1.defaults.max_area) ? true : false;
};
exports.satinish = { name, meta, params, inlets, perform, generateName, sizeCheck };
//# sourceMappingURL=satinish.js.map