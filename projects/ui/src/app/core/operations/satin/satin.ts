import { BoolParam, NumParam, Operation, OpInput, OpParamVal } from "../../model/datatypes";
import { initDraftFromDrawdown} from "../../model/drafts";
import { getOpParamValById } from "../../model/operations";
import { Sequence } from "../../model/sequence";


const name = "satin";
const old_names = [];

//PARAMS
const repeat:NumParam =  
    {
    name: 'repeat',
    type: 'number',
    min: 5,
    max: 100,
    value: 5,
    dx: 'the width and height of the pattern'
    }

const shift: NumParam = 
  {name: 'shift',
  type: 'number',
  min: 1,
  max: 100,
  value: 2,
  dx: 'the move number on each row'
  }

const facing: BoolParam = 
    {name: 'facing',
    type: 'boolean',
    falsestate: "A",
    truestate: "B",
    value: 0,
    dx: ''
    }



const params = [repeat, shift, facing];

//INLETS

  const inlets = [];


const  perform = (param_vals: Array<OpParamVal>, op_inputs: Array<OpInput>) => {

      const repeat: number = getOpParamValById(0, param_vals);
      const shift: number = getOpParamValById(1, param_vals);
      const facing: number = getOpParamValById(2, param_vals);


      let first_row = new Sequence.OneD();
      first_row.push(1);

      for(let j = 0; j < repeat-1; j++){
        first_row.push(0);
      }

      if(facing) first_row.invert();


      let pattern = new Sequence.TwoD();
      for(let i = 0; i < repeat; i++){
        pattern.pushWeftSequence(first_row.shift(shift).val());
      }


      return Promise.resolve([initDraftFromDrawdown(pattern.export())]);

  }   


const generateName = (param_vals: Array<OpParamVal>, op_inputs: Array<OpInput>) : string => {
    const repeat: number = getOpParamValById(0, param_vals);
    const shift: number = getOpParamValById(1, param_vals);
    return repeat+"/"+shift+' Satin';
}


export const satin: Operation = {name, old_names, params, inlets, perform, generateName};



