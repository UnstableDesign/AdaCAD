"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.threading_treadling_sequence = void 0;
const draft_1 = require("../../draft");
const __1 = require("..");
const utils_1 = require("../../utils");
const categories_1 = require("../categories");
const sequence_1 = require("../../sequence");
const name = "threading_treadling_sequence";
const meta = {
    displayname: 'treading/threading sequence',
    desc: 'use a list of numbers to create a sequence threading or treadling assignments',
    img: 'draft_sequence.png',
    categories: [categories_1.draftingStylesOp],
    advanced: true
};
//PARAMS
const sequence_pattern = {
    name: 'sequence',
    type: 'string',
    regex: /\d+|\D+/i,
    value: '1 1 1 2 2 3',
    error: '',
    dx: 'creates a threading or treadling assignments specified by the number sequence'
};
const role = {
    name: 'role',
    type: 'select',
    selectlist: [
        { name: 'threading', value: 0 },
        { name: 'treadling', value: 1 },
        { name: 'both', value: 2 },
    ],
    value: 0,
    dx: 'the role of the sequence'
};
const params = [sequence_pattern, role];
const inlets = [];
const perform = (param_vals) => {
    const sequence_string = (0, __1.getOpParamValById)(0, param_vals);
    const role = (0, __1.getOpParamValById)(1, param_vals);
    const regex_matches = (0, utils_1.parseRegex)(sequence_string, sequence_pattern.regex);
    const sequence_array = regex_matches
        .filter(el => el !== ' ')
        .map(el => parseInt(el));
    //get the max value in the sequence
    const max = sequence_array.reduce((acc, curr) => {
        acc = Math.max(acc, curr);
        return acc;
    }, 0);
    const base = [];
    for (let i = 0; i < max; i++) {
        base.push(0);
    }
    const treadling_seq = new sequence_1.Sequence.TwoD();
    const threading_seq = new sequence_1.Sequence.TwoD();
    sequence_array.forEach((el) => {
        const row = new sequence_1.Sequence.OneD(base);
        if (el - 1 >= 0) {
            row.set(el - 1, 1);
        }
        treadling_seq.pushWeftSequence(row.val());
        threading_seq.pushWarpSequence(row.val());
    });
    const treadling_draft = (0, draft_1.initDraftFromDrawdown)(treadling_seq.export());
    const threading_draft = (0, draft_1.initDraftFromDrawdown)(threading_seq.export());
    const return_drafts = [];
    if (role == 0 || role == 2) {
        return_drafts.push(threading_draft);
    }
    if (role == 1 || role == 2) {
        return_drafts.push(treadling_draft);
    }
    return Promise.resolve(return_drafts.map(el => { return { draft: el }; }));
};
const generateName = (param_vals) => {
    return 'threading/treadling sequence(' + param_vals[0].val + ')';
};
const sizeCheck = (param_vals) => {
    const sequence_string = (0, __1.getOpParamValById)(0, param_vals);
    const regex_matches = (0, utils_1.parseRegex)(sequence_string, sequence_pattern.regex);
    const sequence_array = regex_matches
        .filter(el => el !== ' ')
        .map(el => parseInt(el));
    //get the max value in the sequence
    const height = sequence_array.reduce((acc, curr) => {
        acc = Math.max(acc, curr);
        return acc;
    }, 0);
    const width = sequence_array.length;
    return (width * height <= utils_1.defaults.max_area) ? true : false;
};
exports.threading_treadling_sequence = { name, meta, params, inlets, perform, generateName, sizeCheck };
//# sourceMappingURL=threading_treadling_sequence.js.map