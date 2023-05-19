import { createCell, getCellValue } from "../../model/cell";
import { Draft, NumParam, Operation, OpInput, OpParamVal } from "../../model/datatypes";
import { initDraftWithParams, setHeddle, warps, wefts } from "../../model/drafts";
import { getOpParamValById } from "../../model/operations";


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

      const d: Draft = initDraftWithParams({warps: raised + lowered, wefts: rep+alt_rep});

      for(let i = 0; i < warps(d.drawdown); i++){
        if(i < raised) d.drawdown = setHeddle(d.drawdown, 0, i, true);
        else d.drawdown = setHeddle(d.drawdown, 0, i, false);
      }

      for(let i = 1; i < wefts(d.drawdown); i++){
        if(i < rep) d.drawdown[i] = d.drawdown[0].slice();
        else{
          for(let j = 0; j < warps(d.drawdown); j++){
            d.drawdown[i][j] = createCell(!getCellValue(d.drawdown[0][j]));
          }
        } 
      }

      return Promise.resolve([d]);

   
  }   


const generateName = (param_vals: Array<OpParamVal>, op_inputs: Array<OpInput>) : string => {
  return 'tabby';
}


export const tabby_der: Operation = {name, old_names, params, inlets, perform, generateName};



