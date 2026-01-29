"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.rand_tree = void 0;
const draft_1 = require("../../draft");
const sequence_1 = require("../../sequence");
const categories_1 = require("../categories");
const operations_1 = require("../operations");
const utils_1 = require("../../utils");
const name = "rand_tree";
const meta = {
    displayname: 'random tree',
    desc: 'Created by Trey DuBose at the 2023 Textiles Jam, this operation creates a structure resembling a tree. Each time the operation runs, it will create a slightly different tree. The general shape of the tree is shaped by the parameters',
    img: 'rand_tree.png',
    categories: [categories_1.structureOp],
    advanced: true,
    authors: ['Trey DuBose']
};
//PARAMS
const width = {
    name: 'ends',
    type: 'number',
    min: 1,
    max: 5000,
    value: 20,
    dx: ""
};
const depth = {
    name: 'picks',
    type: 'number',
    min: 1,
    max: 5000,
    value: 20,
    dx: ""
};
const pcentBranch = {
    name: 'prob of new branch',
    type: 'number',
    min: 1,
    max: 100,
    value: 50,
    dx: 'probability that a branch happens'
};
const pcentGrow = {
    name: 'prob of grow out',
    type: 'number',
    min: 1,
    max: 100,
    value: 50,
    dx: 'probability that a branch will grow out '
};
const params = [width, depth, pcentBranch, pcentGrow];
//INLETS
const inlets = [];
const perform = (param_vals) => {
    const width = (0, operations_1.getOpParamValById)(0, param_vals);
    const depth = (0, operations_1.getOpParamValById)(1, param_vals);
    const pcentBranch = (0, operations_1.getOpParamValById)(2, param_vals);
    const pcentGrow = (0, operations_1.getOpParamValById)(3, param_vals);
    const pattern = new sequence_1.Sequence.TwoD();
    pattern.setBlank();
    //initialize the 0 row
    pattern.fill(width, 1);
    const middle = Math.floor(width / 2);
    pattern.set(0, middle, 1, true);
    pattern.setUnsetOnWeft(0, 0);
    const emptyWeft = new sequence_1.Sequence.OneD();
    for (let i = 0; i < width; i++) {
        emptyWeft.push(0);
    }
    //main loop
    for (let i = 1; i < depth - 1; i += 2) {
        const prevRow = pattern.getWeft(i - 1);
        const row = emptyWeft.val();
        const nextRow = emptyWeft.val();
        for (let j = 0; j < width - 1; j++) {
            if (prevRow[j] == 1) {
                row[j] = 1;
                const rand = Math.random() * 100;
                //split
                if (rand < pcentBranch) {
                    //Go left
                    let left = 1;
                    let stop = false;
                    while (stop == false) {
                        if (j - left >= 0 && row[j - left] == 0) {
                            row[j - left] = 1;
                            const lRand = Math.random() * 100;
                            //do we stop here
                            if (lRand > pcentGrow) {
                                nextRow[j - left] = 1;
                                stop = true;
                            }
                            else {
                                left++;
                            }
                        }
                        else {
                            stop = true;
                        }
                    }
                    //Go right
                    let right = 1;
                    stop = false;
                    while (stop == false) {
                        if (j + right < width && row[j + right] == 0) {
                            row[j + right] = 1;
                            const rRand = Math.random() * 100;
                            if (rRand > pcentGrow) {
                                nextRow[j + right] = 1;
                                stop = true;
                            }
                            else {
                                right++;
                            }
                        }
                        else {
                            stop = true;
                        }
                    }
                }
                else {
                    nextRow[j] = 1;
                }
            }
        }
        pattern.pushWeftSequence(row);
        pattern.pushWeftSequence(nextRow);
    }
    //check if odd depth
    if (depth % 2 == 0) {
        pattern.pushWeftSequence(pattern.getWeft(depth - 2));
    }
    const draft = (0, draft_1.initDraftFromDrawdown)(pattern.export());
    return Promise.resolve([{ draft }]);
};
const generateName = (param_vals) => {
    const pcent = (0, operations_1.getOpParamValById)(2, param_vals);
    return 'tree' + pcent;
};
const sizeCheck = (param_vals) => {
    const width = (0, operations_1.getOpParamValById)(0, param_vals);
    const depth = (0, operations_1.getOpParamValById)(1, param_vals);
    return (width * depth <= utils_1.defaults.max_area) ? true : false;
};
exports.rand_tree = { name, params, inlets, meta, perform, generateName, sizeCheck };
//# sourceMappingURL=rand_tree.js.map