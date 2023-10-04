---
sidebar_position: 1
---
# How to Make an Operation

:::info

Coming soon.

<!-- Src/app/core/operation

mkdir <yourname>
make file <yourname>.ts

That file needs to follow this template
<Create Template>
	--types of data can be found in DataTypes
	-name – must be unique

Param name is what will show on screen

Add to params array in the order you would like them displays on screen

Add inlets in the order you would like them to appear across the width. 

Push to ops.service.ts

Src/assets/json/op_classifications.json
	Insert the name in the “name” field


Src/assets/json/op_descriptions.json
Name: (same as the name assigned in your ts. 
Displayname: “what will be shown 
 -->
<!-- 

```js title="twill.ts"
import { first } from "rxjs/operators";
import { createCell, getCellValue } from "../../model/cell";
import { BoolParam, Draft, NumParam, Operation, OpInput, OpParamVal } from "../../model/datatypes";
import { initDraftFromDrawdown, initDraftWithParams, setHeddle, warps, wefts } from "../../model/drafts";
import { getOpParamValById } from "../../model/operations";
import { Sequence } from "../../model/sequence";


const name = "twill";
const old_names = [];

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
    value: 3,
    dx:""
}

const sz: BoolParam = 
        {name: 'S/Z',
        type: 'boolean',
        falsestate: 'S',
        truestate: 'Z',
        value: 0,
        dx: ''
        }

const facing: BoolParam = 
    {name: 'facing',
    type: 'boolean',
    falsestate: "weft facing",
    truestate: "warp facing",
    value: 0,
    dx: ''
    }



const params = [warps_raised, warps_lowered, sz, facing];

//INLETS

  const inlets = [];


const  perform = (param_vals: Array<OpParamVal>, op_inputs: Array<OpInput>) => {

      const raised: number = getOpParamValById(0, param_vals);
      const lowered: number = getOpParamValById(1, param_vals);
      const sz: number = getOpParamValById(2, param_vals);
      const facing: number = getOpParamValById(3, param_vals);


      let first_row = new Sequence.OneD();
      first_row.pushMultiple(1, raised).pushMultiple(0, lowered);

      if(facing) first_row.invert();


      let pattern = new Sequence.TwoD();
      let shift_dir = (sz) ? -1 : 1;
      for(let i = 0; i < (raised+lowered); i++){
        pattern.pushWeftSequence(first_row.shift(shift_dir).val());
      }


      return Promise.resolve([initDraftFromDrawdown(pattern.export())]);

  }   


const generateName = (param_vals: Array<OpParamVal>, op_inputs: Array<OpInput>) : string => {
    const raised: number = getOpParamValById(0, param_vals);
    const lowered: number = getOpParamValById(1, param_vals);
    const sz: number = getOpParamValById(2, param_vals);
    const dir: string = (sz) ? "S" : "Z";
  return raised+"/"+lowered+dir+'twill';
}


export const twill: Operation = {name, old_names, params, inlets, perform, generateName};
``` -->
