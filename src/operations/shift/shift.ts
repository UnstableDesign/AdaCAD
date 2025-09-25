import { warps, initDraftFromDrawdown } from "../../draft";
import { Sequence } from "../../sequence";
import { getInputDraft, getOpParamValById, getAllDraftsAtInlet, parseDraftNames } from "../../operations";
import { NumParam, OperationInlet, OpParamVal, OpInput, Operation, OpMeta } from "../types";
import { transformationOp } from "../categories";


const name = "shift";

const meta: OpMeta = {
  displayname: 'shift',
  desc: 'Generates an output that is shifted to the left and top by the number of warp ends and weft pics specified in the parameters.',
  img: 'shift.png',
  categories: [transformationOp]
}


//PARAMS

const amt_x: NumParam =
{
  name: 'warps',
  type: 'number',
  min: -100,
  max: 100,
  value: 1,
  dx: 'the amount of warps to shift by'
}

const amt_y: NumParam =
{
  name: 'wefts',
  type: 'number',
  min: -100,
  max: 100,
  value: 1,
  dx: 'the amount of wefts to shift by'
}


const params = [amt_x, amt_y];

//INLETS
const draft_inlet: OperationInlet = {
  name: 'draft',
  type: 'static',
  value: null,
  dx: 'the draft to shift',
  uses: "draft",
  num_drafts: 1
}

const inlets = [draft_inlet];


const perform = (op_params: Array<OpParamVal>, op_inputs: Array<OpInput>) => {

  const input_draft = getInputDraft(op_inputs);
  const amt_x = <number>getOpParamValById(0, op_params);
  const amt_y = <number>getOpParamValById(1, op_params);

  if (input_draft == null) return Promise.resolve([]);

  const warp_systems = new Sequence.OneD(input_draft.colSystemMapping).shift(-amt_x);

  const warp_mats = new Sequence.OneD(input_draft.colShuttleMapping).shift(-amt_x);

  const weft_systems = new Sequence.OneD(input_draft.rowSystemMapping).shift(-amt_y);

  const weft_materials = new Sequence.OneD(input_draft.rowShuttleMapping).shift(-amt_y);


  const pattern = new Sequence.TwoD();

  input_draft.drawdown.forEach(row => {
    const seq = new Sequence.OneD().import(row).shift(-amt_x).val();
    pattern.pushWeftSequence(seq);
  })

  const next_pattern = new Sequence.TwoD();

  for (let j = 0; j < warps(input_draft.drawdown); j++) {
    const col = pattern.getWarp(j);
    const seq = new Sequence.OneD().import(col).shift(-amt_y);
    next_pattern.pushWarpSequence(seq.val());
  }

  const d = initDraftFromDrawdown(next_pattern.export());
  d.colShuttleMapping = warp_mats.val();
  d.colSystemMapping = warp_systems.val();
  d.rowShuttleMapping = weft_materials.val();
  d.rowSystemMapping = weft_systems.val();



  return Promise.resolve([{ draft: d }]);
}

const generateName = (param_vals: Array<OpParamVal>, op_inputs: Array<OpInput>): string => {
  const amt_x = getOpParamValById(0, param_vals);
  const amt_y = getOpParamValById(1, param_vals);
  const drafts = getAllDraftsAtInlet(op_inputs, 0);
  return 'shift' + amt_x + '/' + amt_y + '(' + parseDraftNames(drafts) + ")";
}


export const shift: Operation = { name, meta, params, inlets, perform, generateName };