import { Drawdown, initDraftFromDrawdown, updateWeftSystemsAndShuttles, updateWarpSystemsAndShuttles } from "../../draft";
import { Sequence } from "../../sequence";
import { getInputDraft, getOpParamValById, getAllDraftsAtInlet, parseDraftNames } from "..";
import { NumParam, OperationInlet, OpParamVal, OpInput, Operation, OpMeta } from "../types";
import { clothOp } from "../categories";

const name = "rectangle";

const meta: OpMeta = {
  displayname: 'rectangle',
  desc: 'Generates an unfilled rectangle of the size defined by the parameters. If given an input, the rectangle fills with the input.',
  img: 'rectangle.png',
  categories: [clothOp],
}


//PARAMS
const ends: NumParam =
{
  name: 'ends',
  type: 'number',
  min: 1,
  max: 5000,
  value: 10,
  dx: ""
};

const pics: NumParam =
{
  name: 'pics',
  type: 'number',
  min: 1,
  max: 5000,
  value: 10,
  dx: ""
}

const params = [ends, pics];

//INLETS
const draft_inlet: OperationInlet = {
  name: 'input draft',
  type: 'static',
  value: null,
  uses: "draft",
  dx: 'the draft with which you would like to fill this rectangle',
  num_drafts: 1
}

const inlets = [draft_inlet];


const perform = (op_params: Array<OpParamVal>, op_inputs: Array<OpInput>) => {

  const input_draft = getInputDraft(op_inputs);
  if (input_draft == null) return Promise.resolve([]);

  const w = <number>getOpParamValById(0, op_params);
  const h = <number>getOpParamValById(1, op_params);

  const seq = new Sequence.TwoD();
  if (input_draft !== null) seq.import(input_draft.drawdown);
  else seq.setBlank();

  const dd: Drawdown = seq.fill(w, h).export();
  let d = initDraftFromDrawdown(dd);
  d = updateWeftSystemsAndShuttles(d, input_draft);
  d = updateWarpSystemsAndShuttles(d, input_draft);

  return Promise.resolve([{ draft: d }]);
}

const generateName = (param_vals: Array<OpParamVal>, op_inputs: Array<OpInput>): string => {

  const drafts = getAllDraftsAtInlet(op_inputs, 0);
  return 'rect(' + parseDraftNames(drafts) + ")";
}


export const rectangle: Operation = { name, meta, params, inlets, perform, generateName };