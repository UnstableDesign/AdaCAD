import { NumParam, Operation, OpInput, OpParamVal } from "../../model/datatypes";
import { initDraftFromDrawdown } from "../../model/drafts";
import { getOpParamValById } from "../../model/operations";
import { Sequence } from "../../model/sequence";


const name = "sawtooth";
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
    {name: 'pics',
    type: 'number',
    min: 1,
    max: 10000,
    value: 20,
    dx: "the total number of pics for the saw path to move through"
}

const segments: NumParam = 
        {name: 'segments',
        type: 'number',
        min: 1,
        max: 10000,
        value: 1,
        dx: "the total number of segments, each segment represents one half of the saw tooth's path "
        }





const params = [width, amplitude, segments];

//INLETS

  const inlets = [];


const  perform = (param_vals: Array<OpParamVal>, op_inputs: Array<OpInput>) => {

      const warpnum: number = getOpParamValById(0, param_vals);
      const pics: number = getOpParamValById(1, param_vals);
      const peaks: number = getOpParamValById(2, param_vals);
    
    
      const run = (warpnum/peaks);
      const slope = pics /run;

    let pattern = new Sequence.TwoD();
      for(let j = 0; j < warpnum; j++){
        let x = j % Math.floor(run*2);
        let i = Math.floor(slope * x);
        let seq = new Sequence.OneD().pushMultiple(0, pics);

        if(i < pics)  seq.set(i, 1);
        else seq.set((pics-1)-(i-pics), 1); 
        pattern.pushWarpSequence(seq.val())
      }

      return Promise.resolve([initDraftFromDrawdown(pattern.export())]);

  }   


const generateName = (param_vals: Array<OpParamVal>, op_inputs: Array<OpInput>) : string => {
  return 'sawtooth';
}


export const sawtooth: Operation = {name, old_names, params, inlets, perform, generateName};



