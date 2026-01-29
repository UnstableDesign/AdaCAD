"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sine = void 0;
const draft_1 = require("../../draft");
const sequence_1 = require("../../sequence");
const __1 = require("..");
const categories_1 = require("../categories");
const utils_1 = require("../../utils");
const name = "sine";
const meta = {
    displayname: 'sine wave sample',
    desc: 'A sine wave is a mathematical function that produces values that repeats periodically over a given time window. When visualized, it looks like smooth curves traveling over and under a midpoint. In AdaCAD, a sine way is determines the position of a single interlacement along the ends of a structure.',
    img: 'sine.png',
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
    name: 'amplitude',
    type: 'number',
    min: 1,
    max: 10000,
    value: 20,
    dx: "the total number of pics for the sin wave to move through"
};
const freq = {
    name: 'frequency',
    type: 'number',
    min: 1,
    max: 10000,
    value: 50,
    dx: "controls number of waves to include "
};
const params = [width, amplitude, freq];
//INLETS
const inlets = [];
const perform = (param_vals) => {
    const width = (0, __1.getOpParamValById)(0, param_vals);
    const amp = (0, __1.getOpParamValById)(1, param_vals);
    const freq = (0, __1.getOpParamValById)(2, param_vals);
    const pattern = new sequence_1.Sequence.TwoD();
    for (let j = 0; j < width; j++) {
        const seq = new sequence_1.Sequence.OneD().pushMultiple(0, amp);
        const i = Math.floor((amp / 2) * Math.sin(j * freq) + (amp / 2));
        seq.set(i, 1);
        pattern.pushWarpSequence(seq.val());
    }
    const draft = (0, draft_1.initDraftFromDrawdown)(pattern.export());
    return Promise.resolve([{ draft }]);
};
const generateName = (param_vals) => {
    return 'sine(' + (0, __1.flattenParamVals)(param_vals) + ")";
};
const sizeCheck = (param_vals) => {
    const width = (0, __1.getOpParamValById)(0, param_vals);
    const amp = (0, __1.getOpParamValById)(1, param_vals);
    return (width * amp <= utils_1.defaults.max_area) ? true : false;
};
exports.sine = { name, meta, params, inlets, perform, generateName, sizeCheck };
//# sourceMappingURL=sine.js.map