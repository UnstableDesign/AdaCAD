import { NumParam, Operation, OpInput, OpParamVal } from "../../model/datatypes";
import { initDraftFromDrawdown } from "../../model/drafts";
import { getOpParamValById } from "../../model/operations";
import { Sequence } from "../../model/sequence";


const name = "sine";
const old_names = [];

//PARAMS
const width:NumParam =  
    {name: 'ends',
    type: 'number',
    min: 1,
    max: 10000,
    value: 100,
    dx: "the total ends of the draft"
};


const amplitude: NumParam = 
    {name: 'amplitude',
    type: 'number',
    min: 1,
    max: 10000,
    value: 20,
    dx: "the total number of pics for the sin wave to move through"
}

const freq: NumParam = 
        {name: 'frequency',
        type: 'number',
        min: 1,
        max: 10000,
        value: 50,
        dx: "controls number of waves to include "
        }





const params = [width, amplitude, freq];

//INLETS

  const inlets = [];


const  perform = (param_vals: Array<OpParamVal>, op_inputs: Array<OpInput>) => {

      const width: number = getOpParamValById(0, param_vals);
      const amp: number = getOpParamValById(1, param_vals);
      const freq: number = getOpParamValById(2, param_vals);


    let pattern = new Sequence.TwoD();
      for(let j = 0; j < width; j++){
        let seq = new Sequence.OneD().pushMultiple(0, amp);
        let i = Math.floor((amp/2)*Math.sin(j * freq) + (amp/2));
        seq.set(i, 1);  
        pattern.pushWarpSequence(seq.val())
      }

      return Promise.resolve([initDraftFromDrawdown(pattern.export())]);

  }   


const generateName = (param_vals: Array<OpParamVal>, op_inputs: Array<OpInput>) : string => {
    const amp: number = getOpParamValById(1, param_vals);
    const freq: number = getOpParamValById(2, param_vals);
  return amp+"/"+freq+'sin';
}


export const sinewave: Operation = {name, old_names, params, inlets, perform, generateName};



