import { first } from "rxjs/operators";
import { createCell, getCellValue } from "../../model/cell";
import { Draft, NumParam, Operation, OpInput, OpParamVal } from "../../model/datatypes";
import { initDraftFromDrawdown, initDraftWithParams, setHeddle, warps, wefts } from "../../model/drafts";
import { getOpParamValById } from "../../model/operations";
import { Sequence } from "../../model/sequence";


const name = "tabbyder";
const old_names = ['tabby'];

//PARAMS
const warps_raised:NumParam =  
    {name: 'warps raised',
    type: 'number',
    min: 0,
    max: 100,
    value: 1,
    dx: ""
};

const warps_lowered: NumParam = 
    {name: 'warps lowered',
    type: 'number',
    min: 0,
    max: 100,
    value: 1,
    dx:""
}

const base_pics: NumParam = 
    {name: 'base pics',
    type: 'number',
    min: 0,
    max: 100,
    value: 1,
    dx: 'the number of pics upon which the first tabby pic will be repeated'
    };

const alt_pics: NumParam = 
    {name: 'alt pics',
    type: 'number',
    min: 0,
    max: 100,
    value: 1,
    dx: 'the number of pics upon which the repeat the alteranting pattern'
    };

const params = [warps_raised, warps_lowered, base_pics, alt_pics];

//INLETS

  const inlets = [];


const  perform = (param_vals: Array<OpParamVal>, op_inputs: Array<OpInput>) => {

      const raised: number = getOpParamValById(0, param_vals);
      const lowered: number = getOpParamValById(1, param_vals);;
      const rep: number = getOpParamValById(2, param_vals);
      const alt_rep: number = getOpParamValById(3, param_vals);


      let first_row = new Sequence.OneD();
      for(let j = 0; j < raised; j++){
        first_row.push(1);
      }

      for(let j = 0; j < lowered; j++){
        first_row.push(0);
      }


      let pattern = new Sequence.TwoD();
      for(let i = 0; i < rep; i++){
        pattern.pushWeftSequence(first_row.val());
      }

      let inverted =first_row.invert().val();

      for(let i = 0; i < alt_rep; i++){
        console.log("first row invert ", first_row, inverted)
        pattern.pushWeftSequence(inverted);
      }

      console.log("pattern ", pattern);
      console.log("DRAFT ", initDraftFromDrawdown(pattern.export()))
      return Promise.resolve([initDraftFromDrawdown(pattern.export())]);

  }   


const generateName = (param_vals: Array<OpParamVal>, op_inputs: Array<OpInput>) : string => {
  return 'tabby';
}


export const tabby_der: Operation = {name, old_names, params, inlets, perform, generateName};



