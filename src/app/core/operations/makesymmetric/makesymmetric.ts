import { create } from "domain";
import { row } from "mathjs";
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

/**TODO - make this support systems as well */
const  perform = (op_params: Array<OpParamVal>, op_inputs: Array<OpInput>) => {

  let input_draft = getInputDraft(op_inputs);
  let sym_mode = getOpParamValById(0, op_params);
  let remove_center = getOpParamValById(1, op_params);

  if(input_draft == null) return Promise.resolve([]);

    let pattern = new Sequence.TwoD();
    let warp_systems = new Sequence.OneD();
    let warp_mats = new Sequence.OneD();
    let weft_systems = new Sequence.OneD();
    let weft_materials = new Sequence.OneD();

        switch(sym_mode){

            //4-way, top left - 2-way left
            case 0:
            case 7:

                input_draft.drawdown.forEach((row, i) =>{
                    let rev = new Sequence.OneD().import(row).reverse();
                  
                    let rev_warp_sys = new Sequence.OneD().import(input_draft.colSystemMapping).reverse();
                    let rev_warp_mats = new Sequence.OneD().import(input_draft.colShuttleMapping).reverse();

                    if(remove_center == 1){
                        rev.slice(0, row.length-1);
                        rev_warp_mats.slice(0, row.length-1);
                        rev_warp_sys.slice(0, row.length-1);
                    }
                    rev.pushRow(row);

                    if(i == 0){
                        warp_mats = rev_warp_mats.pushRow(input_draft.colShuttleMapping);
                        warp_systems = rev_warp_sys.pushRow(input_draft.colSystemMapping);
                    }                    

                    if(remove_center == 1 && i == 0){
                        
                        pattern.pushWeftSequence(rev.val())
                        weft_materials.push(input_draft.rowShuttleMapping[i]);
                        weft_systems.push(input_draft.rowSystemMapping[i]);

                    }else{
                        pattern.pushWeftSequence(rev.val())
                        weft_materials.push(input_draft.rowShuttleMapping[i]);
                        weft_systems.push(input_draft.rowSystemMapping[i]);

                        if(sym_mode==0){

                            pattern.unshiftWeftSequence(rev.val())
                            weft_materials.unshift(input_draft.rowShuttleMapping[i]);
                            weft_systems.unshift(input_draft.rowSystemMapping[i]);
                        }

                    }
            });

            break;

            //4-way top right // 2-way - right
            case 1:
            case 4:
            case 5:
                input_draft.drawdown.forEach((row, i) =>{
                    let rev = new Sequence.OneD().import(row).reverse();
                    let rev_warp_sys = new Sequence.OneD().import(input_draft.colSystemMapping).reverse();
                    let rev_warp_mats = new Sequence.OneD().import(input_draft.colShuttleMapping).reverse();

                    if(remove_center == 1 && (sym_mode == 1 || sym_mode == 5)){
                        rev.slice(1,row.length);
                        rev_warp_mats.slice(1, row.length);
                        rev_warp_sys.slice(1, row.length);
                    }

                    let seq = new Sequence.OneD().import(row);
                    if(i == 0){
                        warp_mats.import(input_draft.colShuttleMapping).pushRow(rev_warp_mats.val());
                        warp_systems.import(input_draft.colSystemMapping).pushRow(rev_warp_sys.val());
                    }   


                    if(sym_mode !== 4){
                    
                        seq.pushRow(rev.val());
                        warp_mats.pushRow(rev_warp_mats.val());
                        warp_systems.pushRow(rev_warp_sys.val());
                    
                    }

                    if(remove_center == 1 && i == 0){
                        pattern.pushWeftSequence(seq.val())
                        weft_materials.push(input_draft.rowShuttleMapping[i]);
                        weft_systems.push(input_draft.rowSystemMapping[i]);
                    }else{
                        pattern.pushWeftSequence(seq.val())
                        weft_materials.push(input_draft.rowShuttleMapping[i]);
                        weft_systems.push(input_draft.rowSystemMapping[i]);
                        if(sym_mode == 1 || sym_mode == 4){
                            pattern.unshiftWeftSequence(seq.val())
                            weft_materials.unshift(input_draft.rowShuttleMapping[i]);
                            weft_systems.unshift(input_draft.rowSystemMapping[i]);
                        }

                    }
            });
            
            break;
            
            //4-way bottom right, 2-way bottom 
            case 2:
            case 6:

            
                for(let i = input_draft.drawdown.length-1; i >=0; i--){
                    let row = input_draft.drawdown[i];
                    let rev = new Sequence.OneD().import(row).reverse();
                    let rev_warp_sys = new Sequence.OneD().import(input_draft.colSystemMapping).reverse();
                    let rev_warp_mats = new Sequence.OneD().import(input_draft.colShuttleMapping).reverse();
                    
                    let seq = new Sequence.OneD().import(row);


                    if(remove_center == 1 && sym_mode == 2){
                        rev.slice(1, row.length);
                        rev_warp_mats.slice(1, row.length);
                        rev_warp_sys.slice(1, row.length);
                    }


                    if(sym_mode == 2){
                     warp_mats.import(input_draft.colShuttleMapping).pushRow(rev_warp_mats.val());
                     warp_systems.import(input_draft.colSystemMapping).pushRow(rev_warp_sys.val());
                    }else if(i==0){
                        warp_mats.import(input_draft.colShuttleMapping)
                        warp_systems.import(input_draft.colSystemMapping)
                    }

                    if(remove_center == 1 && i == input_draft.drawdown.length-1){
                        pattern.pushWeftSequence(seq.val())
                        weft_materials.push(input_draft.rowShuttleMapping[i]);
                        weft_systems.push(input_draft.rowSystemMapping[i]);
                    }else{
                        pattern.pushWeftSequence(seq.val())
                        weft_materials.push(input_draft.rowShuttleMapping[i]);
                        weft_systems.push(input_draft.rowSystemMapping[i]);
                        pattern.unshiftWeftSequence(seq.val())
                        weft_materials.unshift(input_draft.rowShuttleMapping[i]);
                        weft_systems.unshift(input_draft.rowSystemMapping[i]);
                    }
                }
          
            break;

            //4-way bottom left
            case 3:
                for(let i = input_draft.drawdown.length-1; i >=0; i--){
                    let row = input_draft.drawdown[i];
                    let rev = new Sequence.OneD().import(row).reverse();
                    let rev_warp_sys = new Sequence.OneD().import(input_draft.colSystemMapping).reverse();
                    let rev_warp_mats = new Sequence.OneD().import(input_draft.colShuttleMapping).reverse();

                    if(remove_center == 1){
                        rev.slice(0, rev.length()-1);
                        rev_warp_mats.slice(0, rev.length()-1);
                        rev_warp_sys.slice(0, rev.length()-1);
                    }

                    console.log("IN MS", row);
                    rev.pushRow(row);
                    if(i == 0){
                      rev_warp_mats.pushRow(input_draft.colShuttleMapping)
                      rev_warp_sys.pushRow(input_draft.colSystemMapping)
                    }

                    if(remove_center == 1 && i == input_draft.drawdown.length-1){
                        pattern.pushWeftSequence(rev.val())
                        weft_materials.push(input_draft.rowShuttleMapping[i]);
                        weft_systems.push(input_draft.rowSystemMapping[i]);
                    }else{
                        pattern.pushWeftSequence(rev.val())
                        weft_materials.push(input_draft.rowShuttleMapping[i]);
                        weft_systems.push(input_draft.rowSystemMapping[i]);
                        pattern.unshiftWeftSequence(rev.val())
                        weft_materials.unshift(input_draft.rowShuttleMapping[i]);
                        weft_systems.unshift(input_draft.rowSystemMapping[i]);

                    }
                }
            


            
            break;              
          }

    


  let d = initDraftFromDrawdown(pattern.export())
    d.colShuttleMapping = warp_mats.val();
    d.colSystemMapping = warp_systems.val();
    d.rowShuttleMapping = weft_materials.val();
    d.rowSystemMapping = weft_systems.val();
  return Promise.resolve([d]);
}   

const generateName = (param_vals: Array<OpParamVal>, op_inputs: Array<OpInput>) : string => {
  let drafts = getAllDraftsAtInlet(op_inputs, 0);
  return 'symmetric('+parseDraftNames(drafts)+")";
}


export const makesymmetric: Operation = {name, old_names, params, inlets, perform, generateName};