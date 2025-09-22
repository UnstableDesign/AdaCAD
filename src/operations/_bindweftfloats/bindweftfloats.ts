import { wefts, warps, getHeddle, toggleHeddle } from "../../draft";
import { getInputDraft, getOpParamValById, getAllDraftsAtInlet, parseDraftNames } from "../../operations";
import { helperOp } from "../categories";
import { NumParam, OperationInlet, OpParamVal, OpInput, Operation, OpMeta } from "../types";

const name = "bind weft floats";

const meta: OpMeta = {
  displayname: 'bind weft floats',
  desc: 'Adds interlacements to weft floats over the user specified length',
  img: '',
  categories: [helperOp],
  advanced: true,
  draft: true
}



//PARAMS
const max_float: NumParam =
{
  name: 'max float length',
  type: 'number',
  min: 1,
  max: 1000000,
  value: 10,
  dx: 'the maximum length of a weft float'
}

const params = [max_float];

//INLETS
const draft_inlet: OperationInlet = {
  name: 'draft',
  type: 'static',
  value: null,
  dx: 'the draft to bind',
  uses: "draft",
  num_drafts: 1
}

const inlets = [draft_inlet];


const perform = (op_params: Array<OpParamVal>, op_inputs: Array<OpInput>) => {

  const input_draft = getInputDraft(op_inputs);
  const max_float: number = <number>getOpParamValById(0, op_params);


  if (input_draft == null) return Promise.resolve([]);

  let float_len: number = 0;
  let last: boolean | null = false;


  for (let i = 0; i < wefts(input_draft.drawdown); i++) {
    float_len = 1;
    last = null;
    for (let j = 0; j < warps(input_draft.drawdown); j++) {

      if (getHeddle(input_draft.drawdown, i, j) === null) {
        float_len = 1;
        last = null
      } else if (last === null) {
        float_len = 1;
        last = getHeddle(input_draft.drawdown, i, j);
      }
      else if (getHeddle(input_draft.drawdown, i, j) === last) {
        float_len++;

        if (float_len > max_float) {
          input_draft.drawdown[i][j] = toggleHeddle(input_draft.drawdown[i][j]);
          last = getHeddle(input_draft.drawdown, i, j)
          float_len = 1
        }


      } else if (getHeddle(input_draft.drawdown, i, j) !== last) {
        float_len = 1;
        last = getHeddle(input_draft.drawdown, i, j);
      }



    }
  }



  return Promise.resolve([input_draft]);
}

const generateName = (param_vals: Array<OpParamVal>, op_inputs: Array<OpInput>): string => {

  const drafts = getAllDraftsAtInlet(op_inputs, 0);
  return 'bound wefts(' + parseDraftNames(drafts) + ")";
}


export const bindweftfloats: Operation = { name, meta, params, inlets, perform, generateName };