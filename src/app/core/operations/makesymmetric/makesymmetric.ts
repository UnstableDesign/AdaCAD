import { create } from "domain";
import { createCell } from "../../model/cell";
import { BoolParam, Operation, OperationInlet, OpInput, OpParamVal, SelectParam } from "../../model/datatypes";
import { initDraftFromDrawdown, initDraftWithParams, updateWarpSystemsAndShuttles, updateWeftSystemsAndShuttles, warps, wefts } from "../../model/drafts";
import { getAllDraftsAtInlet, getInputDraft, getOpParamValById, parseDraftNames } from "../../model/operations";
import { Sequence } from "../../model/sequence";


const name = "makesymmetric";
const old_names = [''];

//PARAMS
const corner: SelectParam = {
    name: 'options',
      type: 'select',
      selectlist: [
        {name: '4-way around top left corner', value: 0},
        {name: '4-way around top right corner', value: 1},
        {name: '4-way around bottom right corner', value: 2},
        {name: '4-way around bottom left corner', value: 3},
        {name: '2-way top axis', value: 4},
        {name: '2-way right axis', value: 5},
        {name: '2-way bottom axis', value: 6},
        {name: '2-way left axis', value: 7}
      ],
      value: 0,
      dx: 'select 4-way or 2-way symmetric. If 4-way, select the corner to which this draft is rotated around 0 is top left, 1 top right, 2 bottom right, 3 bottom left. If 2-way, select the access it is mirror around'
      
}

const remove_center: BoolParam = {
    name: 'remove center repeat',
    type: 'boolean',
    falsestate: "center repeat kept",
    truestate: "center repeat removed",
    value: 0,
    dx: 'rotating drafts creates a repeated set of columns or rows extending from the center. Use this toggle to alternative the structure by either keeping or erasing those repeated cells'
    
}



const params = [corner, remove_center];

//INLETS
const draft_inlet: OperationInlet = {
    name: 'input draft', 
    type: 'static',
    value: null,
    dx: 'the draft you would like to modify',
    uses: "draft",
    num_drafts: 1
  }

  const inlets = [draft_inlet];


const  perform = (op_params: Array<OpParamVal>, op_inputs: Array<OpInput>) => {

  let input_draft = getInputDraft(op_inputs);
  let sym_mode = getOpParamValById(0, op_params);
  let remove_center = getOpParamValById(1, op_params);

  if(input_draft == null) return Promise.resolve([]);

    let pattern = new Sequence.TwoD();

        let seq = new Sequence.OneD();
        switch(sym_mode){

            //4-way, top left - 2-way left
            case 0:
            case 7:

                input_draft.drawdown.forEach((row, i) =>{
                    let rev = new Sequence.OneD().import(row).reverse();
                    let orig;

                    if(remove_center == 1){
                        orig = row.slice(1);
                    }else{
                        orig = row;                 
                    }
                      rev.pushRow(orig);
                    

                    if(remove_center == 1 && i == 0){
                        pattern.pushWeftSequence(rev.val())
                    }else{
                        pattern.pushWeftSequence(rev.val())
                        if(sym_mode==0)pattern.unshiftWeftSequence(rev.val())

                    }
            });
            break;

            //4-way top right // 2-way - right
            case 1:
            case 4:
            case 5:
                input_draft.drawdown.forEach((row, i) =>{
                    let rev = new Sequence.OneD().import(row).reverse();
                    let orig;

                    if(remove_center == 1 && (sym_mode == 1 || sym_mode == 5)){
                        orig = row.slice(0, row.length-1);
                    }else{
                        orig = row;                 
                    }

                    let seq = new Sequence.OneD().import(orig);
                    if(sym_mode !== 4)seq.pushRow(rev.val());

                    if(remove_center == 1 && i == 0){
                        pattern.pushWeftSequence(seq.val())
                    }else{
                        pattern.pushWeftSequence(seq.val())
                        if(sym_mode == 1 || sym_mode == 4) pattern.unshiftWeftSequence(seq.val())

                    }
            });
            
            break;
            
            //4-way bottom right, 2-way bottom 
            case 2:
            case 6:
                for(let i = input_draft.drawdown.length-1; i >=0; i--){
                    let row = input_draft.drawdown[i];
                    let rev = new Sequence.OneD().import(row).reverse();
                    let orig;

                    if(remove_center == 1 && sym_mode == 2){
                        orig = row.slice(0, row.length-1);
                    }else{
                        orig = row;                 
                    }

                    let seq = new Sequence.OneD().import(orig);
                    if(sym_mode == 2){
                     seq.pushRow(rev.val());
                    }

                    if(remove_center == 1 && i == input_draft.drawdown.length-1){
                        pattern.pushWeftSequence(seq.val())
                    }else{
                        pattern.pushWeftSequence(seq.val())
                        pattern.unshiftWeftSequence(seq.val())

                    }
                }
          
            break;

            //4-way bottom left
            case 3:
                for(let i = input_draft.drawdown.length-1; i >=0; i--){
                    let row = input_draft.drawdown[i];
                    let rev = new Sequence.OneD().import(row).reverse();
                    let orig;

                    if(remove_center == 1){
                        orig = row.slice(1);
                    }else{
                        orig = row;                 
                    }
                    rev.pushRow(orig);

                    if(remove_center == 1 && i == input_draft.drawdown.length-1){
                        pattern.pushWeftSequence(rev.val())
                    }else{
                        pattern.pushWeftSequence(rev.val())
                        pattern.unshiftWeftSequence(rev.val())

                    }
                }
            


            
            break;              
          }

    


  let d = initDraftFromDrawdown(pattern.export())
  d = updateWeftSystemsAndShuttles(d, input_draft);
  d = updateWarpSystemsAndShuttles(d, input_draft);

  return Promise.resolve([d]);
}   

const generateName = (param_vals: Array<OpParamVal>, op_inputs: Array<OpInput>) : string => {
  let drafts = getAllDraftsAtInlet(op_inputs, 0);
  return 'symmetric('+parseDraftNames(drafts)+")";
}


export const makesymmetric: Operation = {name, old_names, params, inlets, perform, generateName};