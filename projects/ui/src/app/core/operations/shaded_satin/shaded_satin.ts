import { BoolParam, NumParam, Operation, OpInput, OpParamVal } from "../../model/datatypes";
import { initDraftFromDrawdown} from "../../model/drafts";
import { getOpParamValById } from "../../model/operations";
import { Sequence } from "../../model/sequence";


const name = "shaded_satin";
const old_names = [];

//PARAMS
const warps_raised:NumParam =  {
    name: 'warps raised',
    type: 'number',
    min: 0,
    max: 100,
    value: 2,
    dx: 'the number of warps to raise on the first pic'
}

const warps_lowered: NumParam = 
  {name: 'warps lowered',
  type: 'number',
  min: 0,
  max: 100,
  value: 5,
  dx:"the number of warps to keep lowered on the first pic"
  }

const shift: NumParam = {
name: 'shift',
type: 'number',
min: 1,
max: 100,
value: 2,
dx: 'amount to offset the interlacements on each row'
}

const facing: BoolParam = 
    {name: 'facing',
    type: 'boolean',
    falsestate: "weft facing",
    truestate: "warp facing",
    value: 0,
    dx: ''
    }



const params = [warps_raised, warps_lowered, shift, facing];

//INLETS

  const inlets = [];


const  perform = (param_vals: Array<OpParamVal>, op_inputs: Array<OpInput>) => {

      const raised: number = getOpParamValById(0, param_vals);
      const lowered: number = getOpParamValById(1, param_vals);
      const shift: number = getOpParamValById(2, param_vals);
      const facing: number = getOpParamValById(3, param_vals);


      let first_row = new Sequence.OneD();
      first_row.pushMultiple(1, raised).pushMultiple(0, lowered);


      if(facing) first_row.invert();


      let pattern = new Sequence.TwoD();
      for(let i = 0; i < raised+lowered; i++){
        pattern.pushWeftSequence(first_row.shift(shift).val());
      }


      return Promise.resolve([initDraftFromDrawdown(pattern.export())]);

  }   


const generateName = (param_vals: Array<OpParamVal>, op_inputs: Array<OpInput>) : string => {
    const raised: number = getOpParamValById(0, param_vals);
    const lowered: number = getOpParamValById(1,param_vals); 
  return raised+"/"+lowered+' Satin';
}


export const shaded_satin: Operation = {name, old_names, params, inlets, perform, generateName};



