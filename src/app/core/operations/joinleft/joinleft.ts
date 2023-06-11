import { BoolParam, Draft, Operation, OperationInlet, OpInput, OpParamVal } from "../../model/datatypes";
import { getHeddle, initDraftFromDrawdown, warps, wefts } from "../../model/drafts";
import { getAllDraftsAtInlet, getOpParamValById, parseDraftNames } from "../../model/operations";
import { Sequence } from "../../model/sequence";
import utilInstance from "../../model/util";

const name = "join left";
const old_names = [];

//PARAMS

const repeats:BoolParam = {name: 'calculate repeats',
type: 'boolean',
falsestate: 'do not repeat inputs to match size',
truestate: 'repeat inputs to match size',
value: 1,
dx: "controls if the inputs are repeated along the height so they repeat in even intervals"}



const params = [repeats];

//INLETS
const draft_inlet: OperationInlet = {
    name: 'draft', 
    type: 'static',
    value: null,
    uses: "draft",
    dx: 'the draft to join horizontally',
    num_drafts: -1
  }

  const weft_data: OperationInlet = {
    name: 'weft pattern', 
    type: 'static',
    value: null,
    uses: "weft-data",
    dx: 'optional, define a custom weft material or system pattern here',
    num_drafts: 1
  }




const inlets = [draft_inlet, weft_data];


const  perform = (op_params: Array<OpParamVal>, op_inputs: Array<OpInput>) : Promise<Array<Draft>> => {


  let drafts = getAllDraftsAtInlet(op_inputs, 0);
  let weftdata = getAllDraftsAtInlet(op_inputs, 1);
  let factor_in_repeats = getOpParamValById(0, op_params);

  if(drafts.length == 0) return Promise.resolve([]);

  let total_wefts: number = 0;
  const all_wefts = drafts.map(el => wefts(el.drawdown)).filter(el => el > 0);
  if(factor_in_repeats === 1) total_wefts = utilInstance.lcm(all_wefts);
  else  total_wefts = utilInstance.getMaxWefts(drafts);

  let pattern = new Sequence.TwoD();

  for(let i = 0; i < total_wefts; i++){

    let seq = new Sequence.OneD();
    drafts.forEach(draft => {
        for(let j = 0; j < warps(draft.drawdown); j++){
            seq.push(getHeddle(draft.drawdown, i%wefts(draft.drawdown), j))
        }
    })
    pattern.pushWeftSequence(seq.val());
  }


  let d: Draft = initDraftFromDrawdown(pattern.export());

  let warp_mats = new Sequence.OneD();
  let warp_sys = new Sequence.OneD();



  drafts.forEach(draft => {
    for(let j = 0; j < warps(draft.drawdown); j++){
        warp_mats.push(draft.colShuttleMapping[j]);
        warp_sys.push(draft.colSystemMapping[j]);
    }
  })

  d.colShuttleMapping = warp_mats.resize(warps(d.drawdown)).val();

  d.colSystemMapping = warp_sys.resize(warps(d.drawdown)).val();

  if(weftdata.length > 0){
    d.rowShuttleMapping = new Sequence.OneD().import(weftdata[0].rowShuttleMapping).resize(wefts(d.drawdown)).val();

    d.rowSystemMapping = new Sequence.OneD().import(weftdata[0].rowSystemMapping).resize(wefts(d.drawdown)).val();

  }else{

    d.rowShuttleMapping = new Sequence.OneD().import(drafts[0].rowShuttleMapping).resize(wefts(d.drawdown)).val();

    d.rowSystemMapping = new Sequence.OneD().import(drafts[0].rowSystemMapping).resize(wefts(d.drawdown)).val();

  }


  return Promise.resolve([d]);
};   


const generateName = (param_vals: Array<OpParamVal>, op_inputs: Array<OpInput>) : string => {

    let drafts = getAllDraftsAtInlet(op_inputs, 0);
    let name_list = parseDraftNames(drafts);
  return "join left("+name_list+")";
}


export const joinleft: Operation = {name, old_names, params, inlets, perform, generateName};