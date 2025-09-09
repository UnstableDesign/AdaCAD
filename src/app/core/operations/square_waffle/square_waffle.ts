import { max } from "rxjs/operators";
import { NumParam, Operation, OpInput, OpParamVal } from "../../model/datatypes";
import { initDraftFromDrawdown } from "../../model/drafts";
import { getOpParamValById } from "../../model/operations";
import { Sequence } from "../../model/sequence";


const name = "waffle";
const old_names = [];

//PARAMS
const max_float:NumParam =  
    {name: 'float length',
    type: 'number',
    min: 3,
    max: 100,
    value: 7,
    dx: "the length of the longest float in the waffle structure. This number must be odd. If an even number is entered, the draft will make the longest float one less than the entered value."
};

const bindings: NumParam = 
    {name: 'binding rows',
    type: 'number',
    min: 1,
    max: 100,
    value: 2,
    dx:""
}

const packing_factor: NumParam = 
    {name: 'packing',
    type: 'number',
    min: 1,
    max: 100,
    value: 2,
    dx:"controls how much each waffle will overlap. A higher number will lead to a tighter packing of waffles, where a lower number will lead to more spacing between waffles"
}


const params = [max_float, bindings, packing_factor];

//INLETS

  const inlets = [];


const  perform = (param_vals: Array<OpParamVal>, op_inputs: Array<OpInput>) => {

      let float: number = getOpParamValById(0, param_vals);
      const bindings: number = getOpParamValById(1, param_vals);
      const packing_factor: number = getOpParamValById(2, param_vals);

      //always make it an odd number 
      if(float % 2 == 0) float -= 1;

      let max_binding = 1 + (bindings)*2;
      const size = float + max_binding*2;
      const center_point = Math.floor(size/ 2);

      let pattern = new Sequence.TwoD();

      for(let i = 0; i < center_point; i++){
        let float_len = float - i*2;
        let row = new Sequence.OneD();
        if(float_len >= 0){
        
          let pad = Math.floor((size - float_len) / 2);
          
          //push the float
          row.pushMultiple(1, float_len);

          for(let p = 0; p < pad; p++){
            if(p < max_binding){
              let val = (p%2==0) ? 0 : 1;
              row.unshift(val)
              row.push(val)
            }else{
              row.unshift(0)
              row.push(0)
            }
          }
        }else{
          max_binding -= 1;

          let pad = Math.floor((size - max_binding*2) / 2);
          row.pushMultiple(0, pad);
          for(let b = 0; b < max_binding*2; b++){
            if(b==0) row.push(0)
            if(b%2 == 0) row.push(1)
            else row.push(0);
          }
          row.pushMultiple(0, pad);

        }
          

       
      pattern.pushWeftSequence(row.val());

      //if we're not in the center, push to both size
      if(i > 0){
        pattern.unshiftWeftSequence(row.val());
      }
        
      }

      //now delete the rows that would for duplicates when tiling
      pattern.deleteWarp(0);
      pattern.deleteWarp(0);

      for(let p = 0; p <  packing_factor; p++){
        pattern.deleteWarp(pattern.warps()-1);
        pattern.deleteWeft(pattern.wefts()-1);
        if(p > 0){
          pattern.deleteWeft(0);
          pattern.deleteWarp(0);

        }
      }


      return Promise.resolve([initDraftFromDrawdown(pattern.export())]);

  }   


const generateName = (param_vals: Array<OpParamVal>, op_inputs: Array<OpInput>) : string => {
  return 'waffle';
}


export const square_waffle: Operation = {name, old_names, params, inlets, perform, generateName};



