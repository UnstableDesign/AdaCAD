import { createCell, getCellValue } from "../../model/cell";
import { Draft, NumParam, Operation, OpInput, OpParamVals } from "../../model/datatypes";
import { initDraftWithParams, warps, wefts } from "../../model/drafts";


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


const  perform = (param_vals: OpParamVals, op_inputs: Array<OpInput>) => {

      const raised: number =param_vals.params[0];
      const lowered: number =param_vals.params[1];
      const rep: number =param_vals.params[2];
      const alt_rep: number =param_vals.params[3];

      const d: Draft = initDraftWithParams({warps: raised + lowered, wefts: rep+alt_rep});

      for(let i = 0; i < warps(d.drawdown); i++){
        if(i < raised) d.drawdown[0][i] = createCell(true);
        else d.drawdown[0][i] = createCell(false);
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


const generateName = (param_vals: OpParamVals, op_inputs: Array<OpInput>) : string => {
  return 'tabby';
}


export const tabby_der: Operation = {name, old_names, params, inlets, perform, generateName};



