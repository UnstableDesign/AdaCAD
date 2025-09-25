import { initDraftWithParams, wefts, warps, createCell, updateWeftSystemsAndShuttles, updateWarpSystemsAndShuttles } from "../../draft";
import { getInputDraft, getAllDraftsAtInlet, parseDraftNames } from "../../operations";
import { transformationOp } from "../categories";
import { OperationParam, OperationInlet, OpParamVal, OpInput, Operation, OpMeta } from "../types";

const name = "clear";
const old_names: Array<string> = [];

const meta: OpMeta = {
  displayname: 'clear',
  advanced: true,
  categories: [transformationOp],
  desc: "Converts all the interlacements in the input draft to be raised.",
  img: 'clear.png'
}

//PARAMS



const params: Array<OperationParam> = [];

//INLETS
const draft_inlet: OperationInlet = {
  name: 'input draft',
  type: 'static',
  value: null,
  uses: "draft",
  dx: 'the draft you would like to clear',
  num_drafts: 1
}

const inlets = [draft_inlet];


const perform = (op_params: Array<OpParamVal>, op_inputs: Array<OpInput>) => {

  const input_draft = getInputDraft(op_inputs);
  if (input_draft == null) return Promise.resolve([]);

  let d = initDraftWithParams({
    wefts: wefts(input_draft.drawdown),
    warps: warps(input_draft.drawdown),
    drawdown: [[createCell(true)]]
  });

  d = updateWeftSystemsAndShuttles(d, input_draft);
  d = updateWarpSystemsAndShuttles(d, input_draft);

  return Promise.resolve([{ draft: d }]);
}

const generateName = (param_vals: Array<OpParamVal>, op_inputs: Array<OpInput>): string => {
  const drafts = getAllDraftsAtInlet(op_inputs, 0);
  return 'clear(' + parseDraftNames(drafts) + ")";
}


export const clear: Operation = { name, meta, params, inlets, perform, generateName };