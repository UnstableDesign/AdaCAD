import { initDraftFromDrawdown } from "../../draft";
import { Sequence } from "../../sequence";
import { getInputDraft, getOpParamValById, getAllDraftsAtInlet, parseDraftNames } from "../../operations";
import { SelectParam, BoolParam, OperationInlet, OpParamVal, OpInput, Operation, OpMeta } from "../types";
import { transformationOp } from "../categories";

const name = "makesymmetric";

const meta: OpMeta = {
    displayname: 'make symmetric',
    desc: "Rotates and 'stamps' the input draft around a corner, creating rotational symmetry around the selected point according to the parameters described below.",
    img: 'makesymmetric.png',
    categories: [transformationOp],
}


//PARAMS
const corner: SelectParam = {
    name: 'options',
    type: 'select',
    selectlist: [
        { name: '4-way around top left corner', value: 0 },
        { name: '4-way around top right corner', value: 1 },
        { name: '4-way around bottom right corner', value: 2 },
        { name: '4-way around bottom left corner', value: 3 },
        { name: '2-way top axis', value: 4 },
        { name: '2-way right axis', value: 5 },
        { name: '2-way bottom axis', value: 6 },
        { name: '2-way left axis', value: 7 }
    ],
    value: 0,
    dx: 'select 4-way or 2-way symmetric. If 4-way, select the corner to which this draft is rotated around 0 is top left, 1 top right, 2 bottom right, 3 bottom left. If 2-way, select the access it is mirror around'

}

const remove_center: BoolParam = {
    name: 'remove center repeat',
    type: 'boolean',
    falsestate: "center repeat kept",
    truestate: "center repeat removed",
    value: 0,
    dx: 'rotating drafts creates a repeated set of columns or rows extending from the center. Use this toggle to alternative the structure by either keeping or erasing those repeated cells'

}



const params = [corner, remove_center];

//INLETS
const draft_inlet: OperationInlet = {
    name: 'draft',
    type: 'static',
    value: null,
    dx: 'the draft you would like to modify',
    uses: "draft",
    num_drafts: 1
}

const inlets = [draft_inlet];

/**TODO - make this support systems as well */
const perform = (op_params: Array<OpParamVal>, op_inputs: Array<OpInput>) => {



    const input_draft = getInputDraft(op_inputs);
    const sym_mode = getOpParamValById(0, op_params);
    const remove_center = getOpParamValById(1, op_params);

    if (input_draft == null) return Promise.resolve([]);

    const pattern = new Sequence.TwoD();
    let warp_systems = new Sequence.OneD();
    let warp_mats = new Sequence.OneD();
    const weft_systems = new Sequence.OneD();
    const weft_materials = new Sequence.OneD();

    switch (sym_mode) {

        //4-way, top left - 2-way left
        case 0:
        case 7:

            input_draft.drawdown.forEach((row, i) => {
                const rev = new Sequence.OneD().import(row).reverse();

                const rev_warp_sys = new Sequence.OneD().import(input_draft.colSystemMapping).reverse();
                const rev_warp_mats = new Sequence.OneD().import(input_draft.colShuttleMapping).reverse();

                if (remove_center == 1) {
                    rev.slice(0, row.length - 1);
                    rev_warp_mats.slice(0, row.length - 1);
                    rev_warp_sys.slice(0, row.length - 1);
                }
                rev.pushRow(row);

                if (i == 0) {
                    warp_mats = rev_warp_mats.pushRow(input_draft.colShuttleMapping);
                    warp_systems = rev_warp_sys.pushRow(input_draft.colSystemMapping);
                }

                if (remove_center == 1 && i == 0) {

                    pattern.pushWeftSequence(rev.val())
                    weft_materials.push(input_draft.rowShuttleMapping[i]);
                    weft_systems.push(input_draft.rowSystemMapping[i]);

                } else {
                    pattern.pushWeftSequence(rev.val())
                    weft_materials.push(input_draft.rowShuttleMapping[i]);
                    weft_systems.push(input_draft.rowSystemMapping[i]);

                    if (sym_mode == 0) {

                        pattern.unshiftWeftSequence(rev.val())
                        weft_materials.unshift(input_draft.rowShuttleMapping[i]);
                        weft_systems.unshift(input_draft.rowSystemMapping[i]);
                    }

                }
            });

            break;

        //4-way top right // 2-way - right
        case 1:
        case 4:
        case 5:
            input_draft.drawdown.forEach((row, i) => {
                const rev = new Sequence.OneD().import(row).reverse();
                const rev_warp_sys = new Sequence.OneD().import(input_draft.colSystemMapping).reverse();
                const rev_warp_mats = new Sequence.OneD().import(input_draft.colShuttleMapping).reverse();

                if (remove_center == 1 && (sym_mode == 1 || sym_mode == 5)) {
                    rev.slice(1, row.length);
                    rev_warp_mats.slice(1, row.length);
                    rev_warp_sys.slice(1, row.length);
                }

                const seq = new Sequence.OneD().import(row);
                if (i == 0) {
                    warp_mats.import(input_draft.colShuttleMapping);
                    warp_systems.import(input_draft.colSystemMapping)
                    if (sym_mode != 4) {
                        warp_mats.pushRow(rev_warp_mats.val());
                        warp_systems.pushRow(rev_warp_sys.val());
                    }
                }


                if (sym_mode !== 4) {

                    seq.pushRow(rev.val());
                    // warp_mats.pushRow(rev_warp_mats.val());
                    // warp_systems.pushRow(rev_warp_sys.val());

                }

                if (remove_center == 1 && i == 0) {
                    pattern.pushWeftSequence(seq.val())
                    weft_materials.push(input_draft.rowShuttleMapping[i]);
                    weft_systems.push(input_draft.rowSystemMapping[i]);
                } else {
                    pattern.pushWeftSequence(seq.val())
                    weft_materials.push(input_draft.rowShuttleMapping[i]);
                    weft_systems.push(input_draft.rowSystemMapping[i]);
                    if (sym_mode == 1 || sym_mode == 4) {
                        pattern.unshiftWeftSequence(seq.val())
                        weft_materials.unshift(input_draft.rowShuttleMapping[i]);
                        weft_systems.unshift(input_draft.rowSystemMapping[i]);
                    }

                }
            });

            break;

        //4-way bottom right, 2-way bottom 
        case 2:
        case 6:


            for (let i = input_draft.drawdown.length - 1; i >= 0; i--) {

                const row = input_draft.drawdown[i];
                const rev = new Sequence.OneD().import(row).reverse();
                const rev_warp_sys = new Sequence.OneD().import(input_draft.colSystemMapping).reverse();
                const rev_warp_mats = new Sequence.OneD().import(input_draft.colShuttleMapping).reverse();

                const seq = new Sequence.OneD().import(row);


                if (remove_center == 1 && sym_mode == 2) {
                    rev.slice(1, row.length);
                    rev_warp_mats.slice(1, row.length);
                    rev_warp_sys.slice(1, row.length);
                }

                if (sym_mode == 2) {
                    seq.pushRow(rev.val())
                }




                if (i == 0) {
                    if (sym_mode == 2) {
                        warp_mats.pushRow(input_draft.colShuttleMapping).pushRow(rev_warp_mats.val());
                        warp_systems.pushRow(input_draft.colSystemMapping).pushRow(rev_warp_sys.val());
                    } else {
                        warp_mats.pushRow(input_draft.colShuttleMapping)
                        warp_systems.pushRow(input_draft.colSystemMapping)
                    }
                }

                if (remove_center == 1 && i == input_draft.drawdown.length - 1) {
                    pattern.pushWeftSequence(seq.val())
                    weft_materials.push(input_draft.rowShuttleMapping[i]);
                    weft_systems.push(input_draft.rowSystemMapping[i]);
                } else {
                    pattern.pushWeftSequence(seq.val())
                    weft_materials.push(input_draft.rowShuttleMapping[i]);
                    weft_systems.push(input_draft.rowSystemMapping[i]);

                    pattern.unshiftWeftSequence(seq.val())
                    weft_materials.unshift(input_draft.rowShuttleMapping[i]);
                    weft_systems.unshift(input_draft.rowSystemMapping[i]);


                }
            }

            break;

        //4-way bottom left
        case 3:
            for (let i = input_draft.drawdown.length - 1; i >= 0; i--) {
                const row = input_draft.drawdown[i];

                const rev = new Sequence.OneD().import(row).reverse();
                const rev_warp_sys = new Sequence.OneD().import(input_draft.colSystemMapping).reverse();
                const rev_warp_mats = new Sequence.OneD().import(input_draft.colShuttleMapping).reverse();

                if (remove_center == 1) {
                    rev.slice(0, rev.length() - 1);
                    rev_warp_mats.slice(0, rev.length() - 1);
                    rev_warp_sys.slice(0, rev.length() - 1);
                }

                rev.pushRow(row);


                if (i == 0) {
                    warp_mats.pushRow(rev_warp_mats.val()).pushRow(input_draft.colShuttleMapping)
                    warp_systems.pushRow(rev_warp_sys.val()).pushRow(input_draft.colSystemMapping)
                }

                if (remove_center == 1 && i == input_draft.drawdown.length - 1) {
                    pattern.pushWeftSequence(rev.val())
                    weft_materials.push(input_draft.rowShuttleMapping[i]);
                    weft_systems.push(input_draft.rowSystemMapping[i]);
                } else {
                    pattern.pushWeftSequence(rev.val())
                    weft_materials.push(input_draft.rowShuttleMapping[i]);
                    weft_systems.push(input_draft.rowSystemMapping[i]);
                    pattern.unshiftWeftSequence(rev.val())
                    weft_materials.unshift(input_draft.rowShuttleMapping[i]);
                    weft_systems.unshift(input_draft.rowSystemMapping[i]);

                }
            }




            break;
    }

    const d = initDraftFromDrawdown(pattern.export())
    d.colShuttleMapping = warp_mats.val();
    d.colSystemMapping = warp_systems.val();
    d.rowShuttleMapping = weft_materials.val();
    d.rowSystemMapping = weft_systems.val();
    return Promise.resolve([d]);
}

const generateName = (param_vals: Array<OpParamVal>, op_inputs: Array<OpInput>): string => {
    const drafts = getAllDraftsAtInlet(op_inputs, 0);
    return 'symmetric(' + parseDraftNames(drafts) + ")";
}


export const makesymmetric: Operation = { name, meta, params, inlets, perform, generateName };