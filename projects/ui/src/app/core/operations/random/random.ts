import { NumParam, Operation, OpInput, OpParamVal } from "../../model/datatypes";
import { initDraftFromDrawdown } from "../../model/drafts";
import { getOpParamValById } from "../../model/operations";
import { Sequence } from "../../model/sequence";


const name = "random";
const old_names = [];

//PARAMS
const ends:NumParam =  
    {name: 'ends',
    type: 'number',
    min: 0,
    max: 4000,
    value: 6,
    dx: ""
};

const pics: NumParam = 
    {name: 'pics',
    type: 'number',
    min: 0,
    max: 4000,
    value: 6,
    dx:""
}

const pcent: NumParam = 
    {name: 'percent warp raised',
    type: 'number',
    min: 1,
    max: 100,
    value: 50,
    dx: 'percentage of warps raised to be used'
    };


const params = [ends, pics, pcent];

//INLETS

  const inlets = [];


const  perform = (param_vals: Array<OpParamVal>, op_inputs: Array<OpInput>) => {

      const ends: number = getOpParamValById(0, param_vals);
      const pics: number = getOpParamValById(1, param_vals);;
      const pcent: number = getOpParamValById(2, param_vals);
     
      let pattern = new Sequence.TwoD();

      for(let i = 0; i < pics; i++){
        let row = new Sequence.OneD();
        for(let j = 0; j < ends; j++){
            const rand: number = Math.random() * 100;
            if(rand > pcent) row.push(0);
            else row.push(1);
        }
        pattern.pushWeftSequence(row.val());

      }

      return Promise.resolve([initDraftFromDrawdown(pattern.export())]);

  }   


const generateName = (param_vals: Array<OpParamVal>, op_inputs: Array<OpInput>) : string => {
    const pcent: number = getOpParamValById(2, param_vals);

  return 'random'+pcent;
}


export const random: Operation = {name, old_names, params, inlets, perform, generateName};



