import { Injectable } from '@angular/core';
import { Cell } from '../../core/model/cell';
import { Draft } from "../../core/model/draft";

export interface OperationParams {
  name: string,
  min: number,
  max: number,
  value: number
}


export interface Operation {
    name: string,
    params: Array<OperationParams>,
    perform: (input: Array<Draft>, input_params: Array<number>) => Array<Draft>
 }
 

@Injectable({
  providedIn: 'root'
})
export class OperationService {

  ops: Array<Operation> = [];

  constructor() { 


    const splice:Operation = {
      name: 'splice',
      params: [],
      perform: (inputs: Array<Draft>, input_params: []):Array<Draft> => {
        
        const outputs: Array<Draft> = [];

        const max_wefts:number = inputs.reduce((acc, draft)=>{
            if(draft.wefts > acc) return draft.wefts;
            return acc;
        }, 0);

        const max_warps:number = inputs.reduce((acc, draft)=>{
            if(draft.warps > acc) return draft.warps;
            return acc;
        }, 0);

        console.log("size of new draft", max_wefts, max_warps);

        //create a draft to hold the merged values
        const d:Draft = new Draft({warps: max_warps, wefts:(max_wefts * inputs.length)});

        d.pattern.forEach((row, ndx) => {
            const select_array: number = ndx % inputs.length; 
            const select_row: number = Math.floor(ndx / inputs.length);
            row.forEach((cell, j) =>{
                if(inputs[select_array].hasCell(select_row, j)){
                    cell.setHeddle(inputs[select_array].pattern[select_row][j].getHeddle());
                }else{
                    cell.setHeddle(null);
                }
            });
        });

        outputs.push(d);
        return outputs;
      }     
    }

    const twill: Operation = {
      name: 'twill',
      params: [
        {name: 'overs',
        min: 1,
        max: 100,
        value: 3
        },
        {name: 'unders',
        min: 1,
        max: 100,
        value: 1
        }
      ],
      perform: (inputs: Array<Draft>, input_params: Array<number>):Array<Draft> => {

        const sum: number = input_params.reduce( (acc, val) => {
            return val + acc;
        }, 0);
        console.log(sum, input_params);

        const pattern:Array<Array<Cell>> = [];
        for(let i = 0; i < sum; i++){
          pattern.push([]);
          for(let j = 0; j < sum; j++){
            pattern[i][(j+i)%sum] = (j < input_params[0]) ? new Cell(true) : new Cell(false);
          }
        }

        const outputs: Array<Draft> = inputs.map(input => {
          const d: Draft = new Draft({warps: input.warps, wefts: input.wefts, pattern: input.pattern});
          console.log(d, pattern);
          d.fill(pattern, 'mask');
          return d;
        });

        return outputs;
      }        
    }






    //**push operatiinos to the array here */
    this.ops.push(splice);
    this.ops.push(twill);

  }


  getOp(name: string): Operation{
    const ndx: number = this.ops.findIndex(el => el.name === name);
    return this.ops[ndx];
  }
}
