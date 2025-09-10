import { getHeddle, warps, wefts } from "adacad-drafting-lib/draft";
import { toggleHeddle } from "../../model/cell";
import { NumParam, Operation, OperationInlet, OpInput, OpParamVal } from "../../model/datatypes";
import { getAllDraftsAtInlet, getInputDraft, getOpParamValById, parseDraftNames } from "../../model/operations";
import { Sequence } from "../../model/sequence";


const name = "bind warp floats";
const old_names = [];

//PARAMS
const max_float: NumParam =
{
  name: 'length',
  type: 'number',
  min: 1,
  max: 100,
  value: 10,
  dx: 'the maximum length of a warp float'
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

  let input_draft = getInputDraft(op_inputs);
  let max_float = getOpParamValById(0, op_params);

  let seq = new Sequence.TwoD();


  if (input_draft == null) return Promise.resolve([]);

  let float_len: number = 0;
  let last: boolean = false;


  for (let j = 0; j < warps(input_draft.drawdown); j++) {
    float_len = 1;
    last = null;
    for (let i = 0; i < wefts(input_draft.drawdown); i++) {

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

  let drafts = getAllDraftsAtInlet(op_inputs, 0);
  return 'bound warps(' + parseDraftNames(drafts) + ")";
}


export const bindwarpfloats: Operation = { name, old_names, params, inlets, perform, generateName };