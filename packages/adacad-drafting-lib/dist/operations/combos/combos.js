"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.combos = void 0;
const draft_1 = require("../../draft");
const __1 = require("..");
const categories_1 = require("../categories");
const name = "combos";
const meta = {
    displayname: 'all possible structures',
    advanced: true,
    categories: [categories_1.structureOp],
    img: 'combos.png',
    desc: "This operation generates a list of every possible valid structure for a draft of a given size and allows the user to iterate through that list. We define valid as having at least one interlacement in every warp end and weft pick. Selecting size 4 creates 22874 valid structures. You can enter any `selection` number between 1-22874 to see the structure associated with that number."
};
//PARAMS
const ends = {
    name: 'size',
    type: 'number',
    min: 2,
    max: 4,
    value: 3,
    dx: 'the size of the structure'
};
const selection = {
    name: 'selection',
    type: 'number',
    min: 1,
    max: 22874,
    value: 1,
    dx: 'the id of the generated structure you would like to view'
};
const params = [ends, selection];
//INLETS
const inlets = [];
const perform = (param_vals) => {
    const size = (0, __1.getOpParamValById)(0, param_vals);
    let selection = (0, __1.getOpParamValById)(1, param_vals);
    //adjust by one to convert user input to the array index of the structure
    selection -= 1;
    //for larger set sizes, you must split up the download into multiple files
    //const divisor = (size - 3 > 0) ? 4: 1;
    return getSet(size, size)
        .then(() => {
        //  if(download){
        //   for(let set_id = 0; set_id < divisor; set_id++){
        //     const per_row = 10;
        //     const cc = 10;
        //     const set_data = getDrafts(set_id, divisor);
        //     let b:HTMLCanvasElement = <HTMLCanvasElement>document.createElement('canvas'); 
        //     let context = b.getContext('2d');
        //     b.width = (cc*(size+5))*per_row;
        //     b.height = Math.ceil(set_data.length  / per_row)*((5+size)*cc);
        //     context.fillStyle = "white";
        //     context.fillRect(0,0,b.width,b.height);
        //     set_data.forEach((set, ndx) => {
        //       const top = Math.floor(ndx / per_row) * (wefts(set.draft.drawdown)+5)*cc + 10;
        //       const left = ndx % per_row * (warps(set.draft.drawdown)+5)*cc + 10; 
        //       context.font = "10px Arial";
        //       context.fillStyle = "#000000"
        //       context.fillText((set.id+1).toString(),left, top-2,size*cc)
        //       context.strokeRect(left,top,size*cc,size*cc);
        //       for (let i = 0; i < wefts(set.draft.drawdown); i++) {
        //         for (let j = 0; j < warps(set.draft.drawdown); j++) {
        //           drawCell(context, set.draft, cc, i, j, top, left);
        //         }
        //       }            
        //     })
        //     // console.log("b", b);
        //     const a = document.createElement('a')
        //     a.href = b.toDataURL("image/jpg")
        //     a.download = "allvalid_"+size+"x"+size+"_drafts_"+set_id+".jpg";
        //     a.click();
        //    }
        // }
        return Promise.resolve([{ draft: getDraft(selection).draft }]);
    });
};
const generateName = (param_vals) => {
    return 'all possible(' + (0, __1.flattenParamVals)(param_vals) + ')';
};
const sizeCheck = () => {
    return true;
};
exports.combos = { name, meta, params, inlets, perform, generateName, sizeCheck };
let cur_set = { warps: 0, wefts: 0 };
let all_possible_drafts = [];
/**
 * prints the tree for verification
 * @param tree
 */
function printTree(tree) {
    console.log("***PRINT TREE***");
    printNodes([tree.top]);
}
function printNodes(nodes) {
    nodes.forEach(node => {
        // console.log("Node: ", this.traceSequenceViaParents(node), node.set);
        printNodes(node.children);
    });
}
/**
 * converts the valid set into a tree, where the root/top node branches between 0, 1 at each child.
 * therefore, every valid set traverses the tree. Each treenode stores the valid sets at its location
 * allowing for each row add to be a lookup operation
 * @param valid the valid set of combinations
 * @returns a Combination Tree accounting for every valid set
 */
function createTreeFromValidSet(valid) {
    const tree = {
        set: valid.slice(),
        top: {
            parent: null,
            value: -1,
            set: valid.slice(),
            children: []
        },
    };
    valid.forEach(valid_set => {
        let node = tree.top;
        valid_set.forEach(val => {
            const found = node.children.filter(el => el.value === val);
            if (found.length == 0) {
                const combo_node = {
                    parent: node,
                    value: val,
                    set: [valid_set],
                    children: []
                };
                node.children.push(combo_node);
                node = combo_node;
            }
            else {
                node = found[0];
                node.set.push(valid_set);
            }
        });
    });
    return Promise.resolve(tree);
}
/**
 * initializes a set of all possible valid drafts of a given dimension
 * Right now must be square and have a minimum of 1 interlacement
 * @param wefts the number of wefts of the structure
 * @param warps the number of warps in the structure
 * @returns a promise containing the array of all drafts generated
 */
function initSet(wefts, warps) {
    cur_set = { warps: 0, wefts: 0 };
    all_possible_drafts = [];
    return getAllPossible(warps - 1)
        .then(possible => {
        return makeValid(possible);
    })
        .then(valid => {
        return createTreeFromValidSet(valid);
    }).then(tree => {
        printTree(tree);
        let drafts = [];
        const opts = getOptions([], tree);
        opts.forEach(opt => {
            const draft = (0, draft_1.initDraftWithParams)({ warps: warps, wefts: wefts });
            for (let i = 0; i < wefts; i++) {
                for (let j = 0; j < warps; j++) {
                    if (i == 0)
                        draft.drawdown[i][j] = (0, draft_1.setCellValue)(draft.drawdown[i][j], ((opt[j] == 0) ? false : true));
                }
            }
            drafts = drafts.concat([draft]);
        });
        //drafts.forEach(el => utilInstance.printDraft(el));
        const its = (wefts * 2) - 1;
        for (let i = 1; i <= its; i++) {
            drafts = expandDrafts(drafts, tree, i, wefts);
            //drafts.forEach(el => utilInstance.printDraft(el));
        }
        //drafts.forEach(el => utilInstance.printDraft(el));
        all_possible_drafts = drafts.map((el, ndx) => { return { draft: el, id: ndx }; });
        cur_set.wefts = wefts;
        cur_set.warps = warps;
        return Promise.resolve(all_possible_drafts);
    });
}
/**
 * gets the set of a defined size. If that set is already in memory, it returns it. If not, it generates it.
 * @param warps the warps to check
 * @param wefts the wefts to check
 * @returns a boolean
 */
function getSet(warps, wefts) {
    if (warps === cur_set.warps && wefts === cur_set.wefts)
        return Promise.resolve(all_possible_drafts);
    else
        return initSet(warps, wefts);
}
/**
 * gets the draft at location NDX from the current set of generated drafts
 * @param ndx the index to return
 * @returns returns the draft at the index, or an empty draft if so
 */
function getDraft(ndx) {
    const found = all_possible_drafts.find(el => el.id == ndx);
    if (found == undefined)
        return { draft: (0, draft_1.initDraftWithParams)({ wefts: 1, warps: 1 }), id: -1 };
    else
        return found;
}
/**
 * gets the draft at location NDX from the current set of generated drafts
 * @param ndx the index to return
 * @returns returns the draft at the index, or an empty draft if so
 */
// function getDrafts(ndx: number, divisor: number) : Array<{draft: Draft, id: number}>{
//   const set_size = Math.floor(all_possible_drafts.length/divisor);
//   const begin = ndx * set_size;
//   const stop = begin + set_size;
//   const drafts = all_possible_drafts.filter(el => (el.id >= begin && el.id <= stop));
//   return drafts;
// }
/**
 * gets a list of possible drafts by adding a single row or column
 * @param vsd an array of drafts and associated valid sets
 * @param ndx the index in the adding of row columns
 * @param wefts the size of the structure
 * @returns an (expanded)array of drafts and associated valid sets
 */
function expandDrafts(drafts, tree, ndx, wefts) {
    let all_drafts = [];
    drafts.forEach(draft => {
        if (ndx % 2 == 0)
            all_drafts = all_drafts.concat(addRow(draft, tree, Math.floor(ndx / 2), wefts));
        if (ndx % 2 == 1)
            all_drafts = all_drafts.concat(addCol(draft, tree, Math.floor(ndx / 2), wefts));
    });
    //console.log("returning from all drafts", all_drafts.length);
    return all_drafts;
}
/**
 * adds a row to the set of drafts added
 * @param vsd
 * @param i
 * @param n
 * @returns
 */
function addRow(draft, tree, i, n) {
    const expanded_drafts = [];
    //console.log("adding rows to ", vsd);
    const set = [];
    for (let j = 0; j < i; j++) {
        set.push((0, draft_1.getCellValue)(draft.drawdown[i][j]) ? 1 : 0);
    }
    //console.log("Generated set ", set, );
    const opts = getOptions(set, tree);
    //console.log("generated options", opts);
    opts.forEach(opt => {
        let pattern = [];
        pattern = draft.drawdown.slice();
        //add to the draft and push
        for (let j = 0; j < n; j++) {
            pattern[i][j] = (opt[j] == 0) ? (0, draft_1.createCell)(false) : (0, draft_1.createCell)(true);
        }
        expanded_drafts.push((0, draft_1.initDraftWithParams)({ warps: n, wefts: n, drawdown: pattern.slice() }));
    });
    return expanded_drafts;
}
function addCol(draft, tree, j, n) {
    //console.log("adding cols to ", vsd);
    const expanded_drafts = [];
    const set = [];
    for (let i = 0; i < (j + 1); i++) {
        set.push((0, draft_1.getCellValue)(draft.drawdown[i][j]) ? 1 : 0);
    }
    const opts = getOptions(set, tree);
    //console.log("generated options for set", set, opts);
    opts.forEach(opt => {
        let pattern = [];
        pattern = draft.drawdown.slice();
        //add to the draft and push
        for (let i = 0; i < n; i++) {
            pattern[i][j] = (opt[i] == 0) ? (0, draft_1.createCell)(false) : (0, draft_1.createCell)(true);
        }
        expanded_drafts.push((0, draft_1.initDraftWithParams)({ warps: n, wefts: n, drawdown: pattern.slice() }));
    });
    //console.log("****returning ****");
    // expanded_drafts.forEach(el => utilInstance.printDraft(el.draft))
    return expanded_drafts;
}
/**
 * uses the input sequence to identify the node of possible children
 * @param seq the input sequence to locate
 * @param tree the tree to search
 * @returns
 */
function getOptions(seq, tree) {
    let children = tree.top.children.slice();
    if (seq.length == 0)
        return tree.set.slice();
    //get to the node we need
    let node = null;
    seq.forEach(val => {
        var _a;
        node = children.find(el => el.value == val);
        if (node === undefined)
            children = [];
        else if (node == null)
            children = [];
        else
            children = (_a = node.children.slice()) !== null && _a !== void 0 ? _a : [];
    });
    if (node === undefined || node === null)
        return [];
    else
        return node.set.slice();
}
/**
 * if there is all zeros or all ones, it adds a contrasting bit at the end, or both bits
 * @param all_possible
 * @returns
 */
function makeValid(all_possible) {
    const all_valid = [];
    for (let i = 0; i < all_possible.length; i++) {
        if (all_possible[i].find(el => el == 0) === undefined) {
            all_valid.push(all_possible[i].concat([0]));
        }
        else if (all_possible[i].find(el => el == 1) === undefined) {
            all_valid.push(all_possible[i].concat([1]));
        }
        else {
            all_valid.push(all_possible[i].concat([0]));
            all_valid.push(all_possible[i].concat([1]));
        }
    }
    return Promise.resolve(all_valid);
}
/**
 * generates a list of all valid sums with n factors that total t.
 * all elements > 0
 * @param n
 */
function getAllPossible(n) {
    let all_combos = [];
    for (let i = 0; i < n; i++) {
        all_combos = addBit(all_combos);
    }
    return Promise.resolve(all_combos);
}
function addBit(set) {
    const expanded_set = [];
    if (set.length == 0) {
        expanded_set.push([0]);
        expanded_set.push([1]);
    }
    else {
        for (let i = 0; i < set.length; i++) {
            expanded_set.push(set[i].concat([0]));
            expanded_set.push(set[i].concat([1]));
        }
    }
    return expanded_set;
}
//# sourceMappingURL=combos.js.map