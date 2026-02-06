"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.material_sequence = void 0;
const draft_1 = require("../../draft");
const operations_1 = require("../../operations");
const utils_1 = require("../../utils");
const categories_1 = require("../categories");
const name = "material_sequence";
const meta = {
    displayname: 'create material sequence',
    desc: 'use a list of numbers to create a sequence of materials',
    img: 'material_sequence.png',
    categories: [categories_1.colorEffectsOp],
    advanced: true
};
//PARAMS
const sequence_pattern = {
    name: 'sequence',
    type: 'string',
    regex: /\d+|\D+/i,
    value: '1 1 1 2 2 3',
    error: '',
    dx: 'creates a draft with weft materials specified by the number sequence'
};
const orientation = {
    name: 'orientation',
    type: 'select',
    selectlist: [
        { name: 'warps', value: 0 },
        { name: 'wefts', value: 1 },
        { name: 'both', value: 2 },
    ],
    value: 0,
    dx: 'the orientation of the sequence'
};
const params = [sequence_pattern, orientation];
const inlets = [];
const perform = (param_vals) => {
    const sequence_string = (0, operations_1.getOpParamValById)(0, param_vals);
    const orientation = (0, operations_1.getOpParamValById)(1, param_vals);
    const regex_matches = (0, utils_1.parseRegex)(sequence_string, sequence_pattern.regex);
    const sequence_array = regex_matches
        .filter(el => el !== ' ')
        .map(el => parseInt(el));
    const draft = (0, draft_1.initDraftWithParams)({
        wefts: (orientation === 0) ? 1 : sequence_array.length,
        warps: (orientation === 1) ? 1 : sequence_array.length,
        drawdown: [[(0, draft_1.createCell)(false)]],
        colShuttleMapping: (orientation === 0 || orientation === 2) ? sequence_array : [],
        rowShuttleMapping: (orientation === 1 || orientation === 2) ? sequence_array : [],
    });
    return Promise.resolve([{ draft }]);
};
const generateName = (param_vals) => {
    return 'material sequence(' + param_vals[0].val + ')';
};
const sizeCheck = (op_params) => {
    const sequence_string = (0, operations_1.getOpParamValById)(0, op_params);
    const orientation = (0, operations_1.getOpParamValById)(1, op_params);
    const regex_matches = (0, utils_1.parseRegex)(sequence_string, sequence_pattern.regex);
    const sequence_array = regex_matches
        .filter(el => el !== ' ')
        .map(el => parseInt(el));
    if (orientation === 0 || orientation === 1) {
        return sequence_array.length <= utils_1.defaults.max_area ? true : false;
    }
    else {
        return sequence_array.length * sequence_array.length <= utils_1.defaults.max_area ? true : false;
    }
};
exports.material_sequence = { name, meta, params, inlets, perform, generateName, sizeCheck };
//# sourceMappingURL=material_sequence.js.map