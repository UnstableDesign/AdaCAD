import { Draft, wefts, initDraftFromDrawdown, updateWarpSystemsAndShuttles, getDraftName } from "../../draft";
import { Sequence } from "../../sequence";
import { getInputDraft, getOpParamValById } from "../../operations";
import { NumParam, OperationInlet, OpParamVal, OpInput, Operation } from "../types";

const name = "deinterlace";
const old_names: Array<string> = [];


//PARAMS

const split_by: NumParam =
{
  name: 'factor',
  type: 'number',
  min: 2,
  max: 500,
  value: 2,
  dx: "this number determines how many times the input draft will be divided"
};



const params = [split_by];

//INLETS
const draft_inlet: OperationInlet = {
  name: 'drafts',
  type: 'static',
  value: null,
  uses: "draft",
  dx: 'the draft you would like to split apart',
  num_drafts: 1
}


const inlets = [draft_inlet];


const perform = (op_params: Array<OpParamVal>, op_inputs: Array<OpInput>): Promise<Array<Draft>> => {


  const input_draft = getInputDraft(op_inputs);
  const factor: number = <number>getOpParamValById(0, op_params);

  if (input_draft == null) return Promise.resolve([]);

  const patterns: Array<Sequence.TwoD> = [];
  const drafts: Array<Draft> = [];
  const row_shuttle: Array<Array<number>> = [];
  const row_system: Array<Array<number>> = [];

  for (let i = 0; i < factor; i++) {
    patterns.push(new Sequence.TwoD());
    row_shuttle.push([]);
    row_system.push([]);
  }


  for (let i = 0; i < wefts(input_draft.drawdown); i++) {

    const selected_draft_id = i % factor;
    const row = new Sequence.OneD([]).import(input_draft.drawdown[i]);
    patterns[selected_draft_id].pushWeftSequence(row.val());
    row_shuttle[selected_draft_id].push(input_draft.rowShuttleMapping[i])
    row_system[selected_draft_id].push(input_draft.rowSystemMapping[i])
  }

  for (let i = 0; i < factor; i++) {

    let d = initDraftFromDrawdown(patterns[i].export());
    d.rowShuttleMapping = row_shuttle[i].slice();
    d.rowSystemMapping = row_system[i].slice();
    d = updateWarpSystemsAndShuttles(d, input_draft);
    drafts.push(d);
  }



  return Promise.resolve(drafts);
};


const generateName = (param_vals: Array<OpParamVal>, op_inputs: Array<OpInput>): string => {
  const input_draft = getInputDraft(op_inputs);
  if (input_draft == null) return "deinterlaced(null)";
  return "deinterlaced(" + getDraftName(input_draft) + ")";
}


export const deinterlace: Operation = { name, old_names, params, inlets, perform, generateName };