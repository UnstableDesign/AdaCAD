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
    max_inputs: number,
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
      max_inputs: 100,
      perform: (inputs: Array<Draft>, input_params: Array<number>):Array<Draft> => {
        
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
      max_inputs: 1,
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

        let outputs: Array<Draft> = [];
        if(inputs.length == 0){
          const d: Draft = new Draft({warps: sum, wefts: sum, pattern: pattern});
          outputs.push(d);
        }else{
           outputs = inputs.map(input => {
            const d: Draft = new Draft({warps: input.warps, wefts: input.wefts, pattern: input.pattern});
            d.fill(pattern, 'mask');
            return d;
          });
        }

        return outputs;
      }        
    }


    const random: Operation = {
      name: 'random',
      params: [
        {name: 'width',
        min: 1,
        max: 100,
        value: 6
        },
        {name: 'height',
        min: 1,
        max: 100,
        value: 6
        },
        {name: 'percent overs',
        min: 1,
        max: 100,
        value: 50
        }
      ],
      max_inputs: 1,
      perform: (inputs: Array<Draft>, input_params: Array<number>):Array<Draft> => {
       
        const pattern:Array<Array<Cell>> = [];
        for(let i = 0; i < input_params[1]; i++){
          pattern.push([]);
          for(let j = 0; j < input_params[0]; j++){
            const rand: number = Math.random() * 100;
            pattern[i][j] = (rand > input_params[2]) ? new Cell(false) : new Cell(true);
          }
        }

        let outputs: Array<Draft> = [];
        if(inputs.length == 0){
          const d: Draft = new Draft({warps: input_params[0], wefts: input_params[1], pattern: pattern});
          outputs.push(d);
        }else{
           outputs = inputs.map(input => {
            const d: Draft = new Draft({warps: input.warps, wefts: input.wefts, pattern: input.pattern});
            d.fill(pattern, 'mask');
            return d;
          });
        }

        return outputs;
      }        
    }


    const invert: Operation = {
      name: 'invert',
      params: [],
      max_inputs: 1, 
      perform: (inputs: Array<Draft>, input_params: Array<number>):Array<Draft> => {
          const outputs:Array<Draft> = inputs.map(input => {
          const d: Draft = new Draft({warps: input.warps, wefts: input.wefts, pattern: input.pattern});
          d.fill(d.pattern, 'invert');
          return d;
        });
        return outputs;
      }
    }

    const mirrorx: Operation = {
      name: 'flip horiz',
      params: [],
      max_inputs: 1, 
      perform: (inputs: Array<Draft>, input_params: Array<number>):Array<Draft> => {
          const outputs:Array<Draft> = inputs.map(input => {
          const d: Draft = new Draft({warps: input.warps, wefts: input.wefts, pattern: input.pattern});
          d.fill(d.pattern, 'mirrorX');
          return d;
        });
        return outputs;
      }
    }

    const mirrory: Operation = {
      name: 'flip vert',
      params: [],
      max_inputs: 1, 
      perform: (inputs: Array<Draft>, input_params: Array<number>):Array<Draft> => {
          const outputs:Array<Draft> = inputs.map(input => {
          const d: Draft = new Draft({warps: input.warps, wefts: input.wefts, pattern: input.pattern});
          d.fill(d.pattern, 'mirrorY');
          return d;
        });
        return outputs;
      }
    }

    const shiftx: Operation = {
      name: 'shift left',
      params: [
        {name: 'amount',
        min: 1,
        max: 100,
        value: 1
        }
      ],
      max_inputs: 1, 
      perform: (inputs: Array<Draft>, input_params: Array<number>):Array<Draft> => {
          
          const outputs:Array<Draft> = inputs.map(input => {
          const d: Draft = new Draft({warps: input.warps, wefts: input.wefts, pattern: input.pattern});
            for(let i = 0; i < input_params[0]; i++){
              d.fill(d.pattern, 'shiftLeft');
            }
          return d;
        });
        return outputs;
      }
    }

    const shifty: Operation = {
      name: 'shift up',
      params: [
        {name: 'amount',
        min: 1,
        max: 100,
        value: 1
        }
      ],
      max_inputs: 1, 
      perform: (inputs: Array<Draft>, input_params: Array<number>):Array<Draft> => {
          
          const outputs:Array<Draft> = inputs.map(input => {
          const d: Draft = new Draft({warps: input.warps, wefts: input.wefts, pattern: input.pattern});
            for(let i = 0; i < input_params[0]; i++){
              d.fill(d.pattern, 'shiftUp');
            }
          return d;
        });
        return outputs;
      }
    }


    const mirror: Operation = {
      name: 'mirror',
      params: [],
      max_inputs: 1, 
      perform: (inputs: Array<Draft>, input_params: Array<number>):Array<Draft> => {
          
          const outputs:Array<Draft> = inputs.map(input => {
          const d: Draft = new Draft({warps: input.warps, wefts: input.wefts, pattern: input.pattern});
          return d;
        });
        return outputs;
      }
    }





    //**push operatiinos to the array here */
    this.ops.push(twill);
    this.ops.push(random);
    this.ops.push(splice);
    this.ops.push(invert);
    this.ops.push(mirror);
    this.ops.push(mirrorx);
    this.ops.push(mirrory);
    this.ops.push(shiftx);
    this.ops.push(shifty);
  }


  getOp(name: string): Operation{
    const ndx: number = this.ops.findIndex(el => el.name === name);
    return this.ops[ndx];
  }
}
