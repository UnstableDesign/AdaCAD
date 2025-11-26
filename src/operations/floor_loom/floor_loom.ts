import { Draft, initDraftWithParams, warps, setHeddle, updateWarpSystemsAndShuttles, wefts, updateWeftSystemsAndShuttles } from "../../draft";
import { LoomSettings, getLoomUtilByType, numFrames, numTreadles } from "../../loom";
import { getInputDraft, getOpParamValById } from "..";
import { draftingStylesOp } from "../categories";
import { NumParam, OperationInlet, OpParamVal, OpInput, Operation, OpMeta } from "../types";
import { defaults } from "../../utils";


const name = "floor_loom";


const meta: OpMeta = {
  displayname: 'generate floor loom threading and treadling',
  desc: 'Uses the input draft as drawdown and generates a threading and lift plan pattern',
  img: 'floor_loom.png',
  categories: [draftingStylesOp],
  advanced: true,
  old_names: ['floor loom']
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

const treadles: NumParam = {
  name: 'treadles',
  min: 1,
  max: 10000,
  value: 12,
  type: 'number',
  dx: 'number of treadles to use. If the drawdown requires more, it will generate more'
}

const params = [frames, treadles];

//INLETS

const drawdown: OperationInlet = {
  name: 'drawdown',
  type: 'static',
  value: null,
  uses: "draft",
  dx: 'the drawdown from which to create threading, tieup and treadling data from',
  num_drafts: 1
}


const inlets = [drawdown];


const perform = (op_params: Array<OpParamVal>, op_inputs: Array<OpInput>) => {

  const draft = getInputDraft(op_inputs);
  const frames = <number>getOpParamValById(0, op_params);
  const treadles = <number>getOpParamValById(1, op_params);


  if (draft == null) return Promise.resolve([]);


  const loom_settings: LoomSettings = {
    type: 'frame',
    epi: defaults.loom_settings.epi,
    ppi: defaults.loom_settings.ppi,
    units: 'in',
    frames: frames,
    treadles: treadles
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


      let tieup: Draft = initDraftWithParams({ warps: treadles, wefts: frames });
      l.tieup.forEach((row, i) => {
        row.forEach((val, j) => {
          setHeddle(tieup.drawdown, i, j, val);
        })
      });
      tieup = updateWeftSystemsAndShuttles(tieup, draft)
      tieup = updateWarpSystemsAndShuttles(tieup, draft)
      return Promise.resolve([{ draft: threading }, { draft: tieup }, { draft: treadling }]);




    });

}

const generateName = (): string => {

  return ''
}

const sizeCheck = (): boolean => {
  return true;
}

export const floor_loom: Operation = { name, meta, params, inlets, perform, generateName, sizeCheck };