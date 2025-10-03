import { initDraftFromDrawdown } from "../../draft";
import { Sequence } from "../../sequence";
import { structureOp } from "../categories";
import { getOpParamValById } from "../operations";
import { NumParam, OpMeta, OpParamVal, Operation, OperationInlet } from "../types";



const name = "rand_tree";

const meta: OpMeta = {
    displayname: 'random tree',
    desc: 'Created by Trey DuBose at the 2023 Textiles Jam, this operation creates a structure resembling a tree. Each time the operation runs, it will create a slightly different tree. The general shape of the tree is shaped by the parameters',
    img: 'rand_tree.png',
    categories: [structureOp],
    advanced: true,
    authors: ['Trey DuBose']
}



//PARAMS
const width: NumParam =
{
    name: 'width',
    type: 'number',
    min: 1,
    max: 5000,
    value: 20,
    dx: ""
};

const depth: NumParam =
{
    name: 'picks',
    type: 'number',
    min: 1,
    max: 5000,
    value: 20,
    dx: ""
}

const pcentBranch: NumParam =
{
    name: 'prob of new branch',
    type: 'number',
    min: 1,
    max: 100,
    value: 50,
    dx: 'probability that a branch happens'
};

const pcentGrow: NumParam =
{
    name: 'prob of grow out',
    type: 'number',
    min: 1,
    max: 100,
    value: 50,
    dx: 'probability that a branch will grow out '
};


const params = [width, depth, pcentBranch, pcentGrow];

//INLETS

const inlets: Array<OperationInlet> = [];


const perform = (param_vals: Array<OpParamVal>) => {

    const width: number = <number>getOpParamValById(0, param_vals);
    const depth: number = <number>getOpParamValById(1, param_vals);
    const pcentBranch: number = <number>getOpParamValById(2, param_vals);
    const pcentGrow: number = <number>getOpParamValById(3, param_vals);

    const pattern = new Sequence.TwoD();
    pattern.setBlank();
    //initialize the 0 row
    pattern.fill(width, 1);
    const middle = Math.floor(width / 2);
    pattern.set(0, middle, 1, true);
    pattern.setUnsetOnWeft(0, 0)
    const emptyWeft = new Sequence.OneD();
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
                const rand: number = Math.random() * 100;
                //split
                if (rand < pcentBranch) {
                    //Go left
                    let left = 1;
                    let stop = false;
                    while (stop == false) {
                        if (j - left >= 0 && row[j - left] == 0) {
                            row[j - left] = 1;
                            const lRand: number = Math.random() * 100;
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

    const draft = initDraftFromDrawdown(pattern.export());
    return Promise.resolve([{ draft }]);

}


const generateName = (param_vals: Array<OpParamVal>): string => {
    const pcent: number = <number>getOpParamValById(2, param_vals);

    return 'tree' + pcent;
}


export const rand_tree: Operation = { name, params, inlets, meta, perform, generateName };