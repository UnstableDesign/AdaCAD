import { Draft, NumParam, Operation, OperationInlet, OpInput, OpParamVal } from "../../model/datatypes";
import { getHeddle, initDraftFromDrawdown, initDraftWithParams, updateWeftSystemsAndShuttles, warps, wefts } from "../../model/drafts";
import { getAllDraftsAtInlet, getInputDraft, getOpParamValById, parseDraftNames } from "../../model/operations";
import { Sequence } from "../../model/sequence";

const name = "margin";
const old_names = [];

//PARAMS
const starting_pics:NumParam =  
{name: 'starting pics',
min: 0,
max: 10000,
value: 12,
type: 'number',
dx: 'number of pics to add to the bottom of the draft'
}

const ending_pics:NumParam = {
    name: 'ending pics',
      min: 0,
      max: 10000,
      value: 12,
      type: 'number',
      dx: 'number of pics to add to the end of the draft'
}

const starting_ends:NumParam =  
{name: 'starting ends',
min: 0,
max: 10000,
value: 12,
type: 'number',
dx: 'number of ends to add to the start of the draft'
}

const ending_ends:NumParam = {
    name: 'ending ends',
      min: 0,
      max: 10000,
      value: 12,
      type: 'number',
      dx: 'number of ends to add to the end of the draft'
}





const params = [starting_pics, ending_pics, starting_ends, ending_ends];

//INLETS
const draft: OperationInlet = {
    name: 'draft', 
    type: 'static',
    value: null,
    uses: "draft",
    dx: 'the draft to add margins to',
    num_drafts: 1
}

  const selvedge_draft: OperationInlet = {
    name: 'margin', 
    type: 'static',
    value: null,
    uses: "draft",
    dx: 'the draft to repeat within the margins',
    num_drafts: 1
  }


  const inlets = [draft, selvedge_draft];


const  perform = (op_params: Array<OpParamVal>, op_inputs: Array<OpInput>) : Promise<Array<Draft>> => {

    const base_drafts = getAllDraftsAtInlet(op_inputs, 0);
    const margin_drafts = getAllDraftsAtInlet(op_inputs, 1);
    const starting_pics = getOpParamValById(0, op_params);
    const ending_pics = getOpParamValById(1, op_params);
    const starting_ends = getOpParamValById(2, op_params);
    const ending_ends = getOpParamValById(3, op_params);


    if(base_drafts.length == 0 && margin_drafts.length == 0) return Promise.resolve([]);


    let complete = new Sequence.TwoD();

    let active_draft = (base_drafts.length > 0) ?base_drafts[0] : initDraftWithParams({warps: 1, wefts: 1});

    let margin_draft = (margin_drafts.length > 0) ?margin_drafts[0] : initDraftWithParams({warps: 1, wefts: 1});
    
   

    let width = warps(active_draft.drawdown) + starting_ends + ending_ends;

    let height = wefts(active_draft.drawdown) + ending_pics + starting_pics;

    let warp_systems = new Sequence.OneD(active_draft.colSystemMapping).resize(width).shift(starting_ends);

    let warp_mats = new Sequence.OneD(active_draft.colShuttleMapping).resize(width).shift(starting_ends);

    let weft_systems = new Sequence.OneD(active_draft.rowSystemMapping).resize(height).shift(starting_pics);

    let weft_materials = new Sequence.OneD(active_draft.rowShuttleMapping).resize(height).shift(starting_pics);

    let pattern = new Sequence.TwoD();

    //start with starting pics
    for(let i = 0; i < height; i++){

        let seq = new Sequence.OneD();

        if(i < starting_pics){

            seq.import(margin_draft.drawdown[i%wefts(margin_draft.drawdown)])
            .resize(width);
        }else if(i < starting_pics + wefts(active_draft.drawdown)){

            //adjust the start of the margin draft so it starts at the same index as the original
            let adj_i = i - starting_pics;

            const left_margin = new Sequence.OneD().pushRow(margin_draft.drawdown[i%wefts(margin_draft.drawdown)])
            .resize(starting_ends);

            const center = new Sequence.OneD().pushRow(active_draft.drawdown[adj_i%wefts(active_draft.drawdown)])

            //shift this so it sequences at the same rate as the other margin rows
            let shift_i = (starting_ends + warps(active_draft.drawdown)) % warps(margin_draft.drawdown);

            shift_i = warps(margin_draft.drawdown) - shift_i;

            const right_margin = new Sequence.OneD().pushRow(margin_draft.drawdown[i%wefts(margin_draft.drawdown)])
            .resize(ending_ends).shift(shift_i);
            

            seq
            .pushRow(left_margin.val())
            .pushRow(center.val())
            .pushRow(right_margin.val());

        }else{
            seq.import(margin_draft.drawdown[i%wefts(margin_draft.drawdown)])
            .resize(width);
        }


        pattern.pushWeftSequence(seq.val())

    }



    let d = initDraftFromDrawdown(pattern.export());
    d.colShuttleMapping = warp_mats.val();
    d.colSystemMapping = warp_systems.val();
    d.rowShuttleMapping = weft_materials.val();
    d.rowSystemMapping = weft_systems.val();



    return Promise.resolve([d]);

};   


const generateName = (param_vals: Array<OpParamVal>, op_inputs: Array<OpInput>) : string => {

    let r = getAllDraftsAtInlet(op_inputs, 0);
    let name_list = parseDraftNames(r);
  return name_list+"+margin";
}


export const margin: Operation = {name, old_names, params, inlets, perform, generateName};

