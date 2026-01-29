"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.undulating_twill = void 0;
const draft_1 = require("../../draft");
const sequence_1 = require("../../sequence");
const operations_1 = require("../../operations");
const utils_1 = require("../../utils");
const categories_1 = require("../categories");
const name = "undulating_twill";
const meta = {
    displayname: 'undulating twill',
    desc: 'Twill is a family of weave structures in which weft picks pass over or under one or more warp threads in a repeating pattern. In this context, and undulating twill means tha the structure can shift by a non-repeating series of values, instead of by the same value on each pic (as is typically the case in twills)',
    img: 'undulatingtwill.png',
    categories: [categories_1.structureOp],
    advanced: true,
    old_names: ['undulatingtwill']
};
//PARAMS
const string_input = {
    name: 'first pic pattern',
    type: 'string',
    regex: /\d+|\D+/i,
    value: '1 3 1 3',
    error: '',
    dx: 'the under over pattern of this twill'
};
const shift_pattern = {
    name: 'shift pattern',
    type: 'string',
    regex: /\d+|\D+/i,
    value: '1 1 1 2 2 3',
    error: '',
    dx: 'shifts the starting row by the amount specified on each subsequent pic to create undulating patterns'
};
const sz = {
    name: 'S/Z',
    type: 'boolean',
    falsestate: 'S',
    truestate: 'Z',
    value: 0,
    dx: ''
};
const params = [string_input, shift_pattern, sz];
//INLETS
const inlets = [];
const perform = (param_vals) => {
    const input_string = (0, operations_1.getOpParamValById)(0, param_vals);
    const undulating_string = (0, operations_1.getOpParamValById)(1, param_vals);
    const sz = (0, operations_1.getOpParamValById)(2, param_vals);
    let regex_matches = (0, utils_1.parseRegex)(input_string, shift_pattern.regex);
    const input_array = regex_matches.filter(el => el !== " ").map(el => parseInt(el));
    regex_matches = (0, utils_1.parseRegex)(undulating_string, shift_pattern.regex);
    const undulating_array = regex_matches.filter(el => el !== " ").map(el => parseInt(el));
    const first_row = new sequence_1.Sequence.OneD();
    let under = true;
    input_array.forEach(input => {
        first_row.pushMultiple(under, input);
        under = !under;
    });
    const pattern = new sequence_1.Sequence.TwoD();
    undulating_array.forEach(shiftval => {
        const shift_dir = (sz) ? -1 * shiftval : 1 * shiftval;
        pattern.pushWeftSequence(new sequence_1.Sequence.OneD(first_row.val()).shift(shift_dir).val());
    });
    const draft = (0, draft_1.initDraftFromDrawdown)(pattern.export());
    return Promise.resolve([{ draft }]);
};
const generateName = () => {
    return 'shifty';
};
const sizeCheck = (param_vals) => {
    const input_string = (0, operations_1.getOpParamValById)(0, param_vals);
    const regex_matches = (0, utils_1.parseRegex)(input_string, shift_pattern.regex);
    const input_array = regex_matches.filter(el => el !== " ").map(el => parseInt(el));
    const size = input_array.reduce((acc, val) => {
        return val + acc;
    }, 0);
    return (size * size <= utils_1.defaults.max_area) ? true : false;
};
exports.undulating_twill = { name, meta, params, inlets, perform, generateName, sizeCheck };
//# sourceMappingURL=undulating_twill.js.map