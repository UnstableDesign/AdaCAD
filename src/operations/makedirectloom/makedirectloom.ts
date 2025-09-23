import { Draft, initDraftWithParams, warps, setHeddle, updateWarpSystemsAndShuttles, wefts, updateWeftSystemsAndShuttles } from "../../draft";
import { LoomSettings, getLoomUtilByType, numFrames, numTreadles } from "../../loom";
import { getInputDraft, getOpParamValById } from "../../operations";
import { draftingStylesOp } from "../categories";
import { NumParam, OperationInlet, OpParamVal, OpInput, Operation, OpMeta } from "../types";

const name = "direct_loom";

const meta: OpMeta = {
  displayname: 'generate direct tie loom threading and lift plan',
  desc: 'Uses the input draft as drawdown and generates a threading and lift plan pattern',
  img: 'direct_loom.png',
  categories: [draftingStylesOp],
  advanced: true,
  old_names: ['direct loom']
}



//PARAMS

const frames: NumParam =
{
  name: 'frames',
  min: 2,
  max: 10000,
  value: 8,
  type: 'number',
  dx: 'number of frames to use. If the drawdown requires more, it will generate more'
}


const params = [frames];

//INLETS

const drawdown: OperationInlet = {
  name: 'drawdown',
  type: 'static',
  value: null,
  uses: "draft",
  dx: 'the drawdown from which to create threading and lift plan from',
  num_drafts: 1
}


const inlets = [drawdown];


const perform = (op_params: Array<OpParamVal>, op_inputs: Array<OpInput>) => {

  const draft = getInputDraft(op_inputs);
  const frames = <number>getOpParamValById(0, op_params);


  if (draft == null) return Promise.resolve([]);


  const loom_settings: LoomSettings = {
    type: 'direct',
    epi: 10,
    units: 'in',
    frames: frames,
    treadles: frames
  }

  const utils = getLoomUtilByType(loom_settings.type);
  if (!utils || typeof utils.computeLoomFromDrawdown !== "function") {
    return Promise.resolve([]);
  }
  return utils.computeLoomFromDrawdown(draft.drawdown, loom_settings)
    .then(l => {

      const frames = Math.max(numFrames(l), loom_settings.frames);
      const treadles = Math.max(numTreadles(l), loom_settings.treadles);

      let threading: Draft = initDraftWithParams({ warps: warps(draft.drawdown), wefts: frames });
      l.threading.forEach((frame, j) => {
        if (frame !== -1) setHeddle(threading.drawdown, frame, j, true);
      });

      threading = updateWarpSystemsAndShuttles(threading, draft)


      let treadling: Draft = initDraftWithParams({ warps: treadles, wefts: wefts(draft.drawdown) });
      l.treadling.forEach((treadle_row, i) => {
        treadle_row.forEach(treadle_num => {
          setHeddle(treadling.drawdown, i, treadle_num, true);
        })
      });

      treadling = updateWeftSystemsAndShuttles(treadling, draft)

      return Promise.resolve([threading, treadling]);

    });

}

const generateName = (): string => {

  // const drafts = getAllDraftsAtInlet(op_inputs, 0);

  // switch (ndx ){
  //   case 0: 
  //   return   "threading_"+parseDraftNames(drafts);

  //   case 1: 
  //   return   "lift plan_"+parseDraftNames(drafts);

  // }

  return 'makedirectloom';
}


export const makedirectloom: Operation = { name, meta, params, inlets, perform, generateName };