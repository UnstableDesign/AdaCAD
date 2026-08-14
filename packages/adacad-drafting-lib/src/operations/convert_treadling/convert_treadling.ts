// import { Draft, initDraftWithParams, warps, setHeddle, updateWarpSystemsAndShuttles, wefts, updateWeftSystemsAndShuttles, InitDraftParams } from "../../draft";
// import { LoomSettings, convertLoom, getLoomUtilByType, numFrames, numTreadles } from "../../loom";
// import { getInputDraft, getOpParamValById } from "..";
// import { dissectOp } from "../categories";
// import { OperationInlet, OpParamVal, OpInput, Operation, OpMeta, SelectParam } from "../types";
// import { defaults } from "../../utils";


// const name = "extract";


// const meta: OpMeta = {
//     displayname: 'convert treadling',
//     desc: 'creates a direct tie lift plan from a tieup and treadling'
//     img: 'convert_treadling.png',
//     categories: [draftingStylesOp],
//     advanced: true
// }


// //PARAMS


// const params = [];

// //INLETS

// const treadling: OperationInlet = {
//     name: 'treadling',
//     type: 'static',
//     value: null,
//     uses: "draft",
//     dx: 'the treadling to convert',
//     num_drafts: 1
// }

// const tieup: OperationInlet = {
//     name: 'tieup',
//     type: 'static',
//     value: null,
//     uses: "draft",
//     dx: 'the tie up to use during the conversion',
//     num_drafts: 1
// }


// const inlets = [treadling, tieup];


// const perform = (op_params: Array<OpParamVal>, op_inputs: Array<OpInput>) => {

//     const draft = getInputDraft(op_inputs);
//     const treadling = getInputDraft(op_inputs, 0);
//     const tieup = getInputDraft(op_inputs, 1);


    



//     if (treadling == null || tieup == null) return Promise.resolve([]);


//     const  dd = [];
//     const from_ls: LoomSettings = {
//         type: 'treadling',
//         epi: defaults.epi,
//         shafts: numFrames(treadling),
//         threads: numTreadles(treadling)
//     }
// const new_loom = convertLoom(treadling, tieup);









// }

// const generateName = (): string => {

//     return ''
// }

// const sizeCheck = (): boolean => {
//     return true;
// }

// export const floor_loom: Operation = { name, meta, params, inlets, perform, generateName, sizeCheck };