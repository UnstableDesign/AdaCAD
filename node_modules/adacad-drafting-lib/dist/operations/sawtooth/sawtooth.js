"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sawtooth = void 0;
const draft_1 = require("../../draft");
const sequence_1 = require("../../sequence");
const operations_1 = require("../../operations");
const categories_1 = require("../categories");
const utils_1 = require("../../utils");
const name = "sawtooth";
const meta = {
    displayname: 'sawtooth',
    desc: 'Creates a sawtooth pattern (e.g. mountain/valley zigzag) of a user specified width with a user specified number of teeth in the sawtooth as described by the segments parameter',
    img: 'sawtooth.png',
    categories: [categories_1.structureOp],
    advanced: true
};
//PARAMS
const width = {
    name: 'ends',
    type: 'number',
    min: 1,
    max: 10000,
    value: 100,
    dx: "the total ends of the draft"
};
const amplitude = {
    name: 'pics',
    type: 'number',
    min: 1,
    max: 10000,
    value: 20,
    dx: "the total number of pics for the saw path to move through"
};
const segments = {
    name: 'segments',
    type: 'number',
    min: 1,
    max: 10000,
    value: 1,
    dx: "the total number of segments, each segment represents one half of the saw tooth's path "
};
const params = [width, amplitude, segments];
//INLETS
const inlets = [];
const perform = (param_vals) => {
    const warpnum = (0, operations_1.getOpParamValById)(0, param_vals);
    const pics = (0, operations_1.getOpParamValById)(1, param_vals);
    const peaks = (0, operations_1.getOpParamValById)(2, param_vals);
    const run = (warpnum / peaks);
    const slope = pics / run;
    const pattern = new sequence_1.Sequence.TwoD();
    for (let j = 0; j < warpnum; j++) {
        const x = j % Math.floor(run * 2);
        const i = Math.floor(slope * x);
        const seq = new sequence_1.Sequence.OneD().pushMultiple(0, pics);
        if (i < pics)
            seq.set(i, 1);
        else
            seq.set((pics - 1) - (i - pics), 1);
        pattern.pushWarpSequence(seq.val());
    }
    const draft = (0, draft_1.initDraftFromDrawdown)(pattern.export());
    return Promise.resolve([{ draft }]);
};
const generateName = (param_vals) => {
    return 'sawtooth(' + (0, operations_1.flattenParamVals)(param_vals) + ")";
};
const sizeCheck = (param_vals) => {
    const warpnum = (0, operations_1.getOpParamValById)(0, param_vals);
    const pics = (0, operations_1.getOpParamValById)(1, param_vals);
    return (warpnum * pics <= utils_1.defaults.max_area) ? true : false;
};
exports.sawtooth = { name, meta, params, inlets, perform, generateName, sizeCheck };
//# sourceMappingURL=sawtooth.js.map