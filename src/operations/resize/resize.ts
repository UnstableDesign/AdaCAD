import { wefts, warps, getHeddle, initDraftFromDrawdown } from "../../draft";
import { Sequence } from "../../sequence";
import { getInputDraft, getOpParamValById, getAllDraftsAtInlet, parseDraftNames } from "../../operations";
import { NumParam, OperationInlet, OpParamVal, OpInput, Operation } from "../types";

const name = "resize";
const old_names: Array<string> = [];


//PARAMS
const ends: NumParam =
{
  name: 'ends',
  type: 'number',
  min: 1,
  max: 10000,
  value: 100,
  dx: ''
};

const pics: NumParam = {
  name: 'pics',
  type: 'number',
  min: 1,
  max: 10000,
  value: 100,
  dx: 'number of wefts to resize to'
}


const params = [ends, pics];

//INLETS
const draft_inlet: OperationInlet = {
  name: 'draft',
  type: 'static',
  value: null,
  dx: 'the draft to resize',
  uses: "draft",
  num_drafts: 1
}

const inlets = [draft_inlet];


const perform = (op_params: Array<OpParamVal>, op_inputs: Array<OpInput>) => {


  const input = getInputDraft(op_inputs);
  if (input == null) return Promise.resolve([]);


  const ends = <number>getOpParamValById(0, op_params);
  const pics = <number>getOpParamValById(1, op_params);

  const weft_factor = wefts(input.drawdown) / pics;
  const warp_factor = warps(input.drawdown) / ends;

  const pattern = new Sequence.TwoD();

  const weft_mats = new Sequence.OneD();
  const weft_sys = new Sequence.OneD();
  const warp_mats = new Sequence.OneD();
  const warp_sys = new Sequence.OneD();

  for (let i = 0; i < pics; i++) {
    const seq = new Sequence.OneD();
    const adj_i = Math.floor(i * weft_factor);
    weft_mats.push(input.rowShuttleMapping[adj_i]);
    weft_sys.push(input.rowSystemMapping[adj_i]);

    for (let j = 0; j < ends; j++) {
      const adj_j = Math.floor(j * warp_factor);
      seq.push(getHeddle(input.drawdown, adj_i, adj_j));
    }
    pattern.pushWeftSequence(seq.val());

  }

  for (let j = 0; j < ends; j++) {
    const adj_j = Math.floor(j * warp_factor);
    warp_mats.push(input.colShuttleMapping[adj_j]);
    warp_sys.push(input.colSystemMapping[adj_j]);
  }




  const d = initDraftFromDrawdown(pattern.export());
  d.colShuttleMapping = warp_mats.val();
  d.colSystemMapping = warp_sys.val();
  d.rowShuttleMapping = weft_mats.val();
  d.rowSystemMapping = weft_sys.val();

  return Promise.resolve([d]);
}

const generateName = (param_vals: Array<OpParamVal>, op_inputs: Array<OpInput>): string => {

  const drafts = getAllDraftsAtInlet(op_inputs, 0);
  return 'resize(' + parseDraftNames(drafts) + ")";
}


export const resize: Operation = { name, old_names, params, inlets, perform, generateName };