"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.random = void 0;
const draft_1 = require("../../draft");
const sequence_1 = require("../../sequence");
const operations_1 = require("../../operations");
const categories_1 = require("../categories");
const utils_1 = require("../../utils");
const name = "random";
const meta = {
    displayname: 'random',
    desc: 'Generates a draft of the size specified where the value of each interlacement is generated randomly.',
    img: 'random.png',
    categories: [categories_1.structureOp],
};
//PARAMS
const ends = {
    name: 'ends',
    type: 'number',
    min: 0,
    max: 4000,
    value: 6,
    dx: ""
};
const pics = {
    name: 'pics',
    type: 'number',
    min: 0,
    max: 4000,
    value: 6,
    dx: ""
};
const pcent = {
    name: 'percent warp raised',
    type: 'number',
    min: 1,
    max: 100,
    value: 50,
    dx: 'percentage of warps raised to be used'
};
const params = [ends, pics, pcent];
//INLETS
const inlets = [];
const perform = (param_vals) => {
    const ends = (0, operations_1.getOpParamValById)(0, param_vals);
    const pics = (0, operations_1.getOpParamValById)(1, param_vals);
    const pcent = (0, operations_1.getOpParamValById)(2, param_vals);
    const pattern = new sequence_1.Sequence.TwoD();
    for (let i = 0; i < pics; i++) {
        const row = new sequence_1.Sequence.OneD();
        for (let j = 0; j < ends; j++) {
            const rand = Math.random() * 100;
            if (rand > pcent)
                row.push(0);
            else
                row.push(1);
        }
        pattern.pushWeftSequence(row.val());
    }
    const draft = (0, draft_1.initDraftFromDrawdown)(pattern.export());
    return Promise.resolve([{ draft }]);
};
const generateName = (param_vals) => {
    return 'random(' + (0, operations_1.flattenParamVals)(param_vals) + ")";
};
const sizeCheck = (param_vals) => {
    const ends = (0, operations_1.getOpParamValById)(0, param_vals);
    const pics = (0, operations_1.getOpParamValById)(1, param_vals);
    return (ends * pics <= utils_1.defaults.max_area) ? true : false;
};
exports.random = { name, meta, params, inlets, perform, generateName, sizeCheck };
//# sourceMappingURL=random.js.map