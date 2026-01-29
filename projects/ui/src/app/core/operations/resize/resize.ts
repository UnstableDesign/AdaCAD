import { getCellValue } from "../../model/cell";
import { Drawdown, NumParam, Operation, OperationInlet, OpInput, OpParamVal } from "../../model/datatypes";
import { getHeddle, initDraftFromDrawdown, updateWarpSystemsAndShuttles, updateWeftSystemsAndShuttles, warps, wefts } from "../../model/drafts";
import { getAllDraftsAtInlet, getInputDraft, getOpParamValById, parseDraftNames } from "../../model/operations";
import { Sequence } from "../../model/sequence";


const name = "resize";
const old_names = [];

//PARAMS
const ends:NumParam =  
{name: 'ends',
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


const  perform = (op_params: Array<OpParamVal>, op_inputs: Array<OpInput>) => {


  let input = getInputDraft(op_inputs);
   if(input == null) return Promise.resolve([]);


  let ends = getOpParamValById(0, op_params);
  let pics = getOpParamValById(1, op_params);

  const weft_factor = wefts(input.drawdown) / pics ;
  const warp_factor = warps(input.drawdown) / ends;

  let pattern = new Sequence.TwoD();

  let weft_mats = new Sequence.OneD();
  let weft_sys = new Sequence.OneD();
  let warp_mats = new Sequence.OneD();
  let warp_sys = new Sequence.OneD();

   for(let i = 0; i < pics; i++){
    let seq = new Sequence.OneD();
    let adj_i = Math.floor(i*weft_factor);
    weft_mats.push(input.rowShuttleMapping[adj_i]);
    weft_sys.push(input.rowSystemMapping[adj_i]);

    for(let j=0; j < ends; j++){
        let adj_j = Math.floor(j*warp_factor);
        seq.push(getHeddle(input.drawdown, adj_i, adj_j));
    }
    pattern.pushWeftSequence(seq.val());

   }
    
    for(let j=0; j < ends; j++){
        let adj_j = Math.floor(j*warp_factor);
        warp_mats.push(input.colShuttleMapping[adj_j]);
        warp_sys.push(input.colSystemMapping[adj_j]);
    }




  let d = initDraftFromDrawdown(pattern.export());
  d.colShuttleMapping = warp_mats.val();
  d.colSystemMapping = warp_sys.val();
  d.rowShuttleMapping = weft_mats.val();
  d.rowSystemMapping = weft_sys.val();

  return Promise.resolve([d]);
}   

const generateName = (param_vals: Array<OpParamVal>, op_inputs: Array<OpInput>) : string => {

  let drafts = getAllDraftsAtInlet(op_inputs, 0);
  return 'resize('+parseDraftNames(drafts)+")";
}


export const resize: Operation = {name, old_names, params, inlets, perform, generateName};