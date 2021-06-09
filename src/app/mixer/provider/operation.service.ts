import { Injectable } from '@angular/core';
import { Cell } from '../../core/model/cell';
import { Draft } from "../../core/model/draft";

export interface OperationParams {
  name: string,
  min: number,
  max: number,
  value: number,
  dx: string
}

export interface Operation {
    name: string,
    dx: string,
    max_inputs: number,
    params: Array<OperationParams>,
    perform: (input: Array<Draft>, input_params: Array<number>) => Array<Draft>
 }

 export interface OperationClassification{
  category: string,
  ops: Array<Operation> 
 }
 

@Injectable({
  providedIn: 'root'
})
export class OperationService {

  ops: Array<Operation> = [];
  classification: Array<OperationClassification> = [];

  constructor() { 

    const rect: Operation = {
      name: 'rectangle',
      dx: "generate a rectangle",
      params: [
        {name: 'width',
        min: 1,
        max: 100,
        value: 10,
        dx: "width"
        },
        {name: 'height',
        min: 1,
        max: 100,
        value: 10,
        dx: "height"
        }
      ],
      max_inputs: 0,
      perform: (inputs: Array<Draft>, input_params: Array<number>):Array<Draft> => {
        const outputs: Array<Draft> = [];
        const d: Draft = new Draft({warps: input_params[0], wefts: input_params[1]});
        d.fill([[new Cell(false)]], 'clear');
        outputs.push(d);
        return outputs;
      }        
    }

    const splice:Operation = {
      name: 'splice',
      dx: 'splices the input drafts together in alternating lines',
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

    const tabby: Operation = {
      name: 'tabby',
      dx: 'generates or fills input a draft with tabby structure',
      params: [],
      max_inputs: 1,
      perform: (inputs: Array<Draft>, input_params: Array<number>):Array<Draft> => {


        const pattern:Array<Array<Cell>> = [];
        for(let i = 0; i < 2; i++){
          pattern.push([]);
          for(let j = 0; j < 2; j++){
            pattern[i][j] = (i == j) ? new Cell(true) : new Cell(false);
          }
        }

        let outputs: Array<Draft> = [];
        if(inputs.length == 0){
          const d: Draft = new Draft({warps: 2, wefts: 2, pattern: pattern});
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

    const basket: Operation = {
      name: 'basket',
      dx: 'generates a basket structure defined by the inputs',
      params: [
        {name: 'unders',
        min: 1,
        max: 100,
        value: 2,
        dx: 'number of weft unders'
        },
        {name: 'overs',
        min: 1,
        max: 100,
        value: 2,
        dx: 'number of weft overs'
        }
      ],
      max_inputs: 1,
      perform: (inputs: Array<Draft>, input_params: Array<number>):Array<Draft> => {


        const sum: number = input_params.reduce( (acc, val) => {
            return val*2 + acc;
        }, 0);
        console.log(sum);

        let alt_rows, alt_cols, val: boolean = false;
        const pattern:Array<Array<Cell>> = [];
        for(let i = 0; i < sum; i++){
          alt_rows = (i % sum/2 < input_params[0]);
          pattern.push([]);
          for(let j = 0; j < sum; j++){
            alt_cols = (j % sum/2 < input_params[0]);
            val = (alt_cols && alt_rows) || (!alt_cols && !alt_rows);
            pattern[i][j] =  new Cell(val);
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
    
    const rib: Operation = {
      name: 'rib',
      dx: 'generates a rib/cord/half-basket structure defined by the inputs',
      params: [
        {name: 'unders',
        min: 1,
        max: 100,
        value: 2,
        dx: 'number of weft unders in a pic'
        },
        {name: 'overs',
        min: 1,
        max: 100,
        value: 2,
        dx: 'number of weft overs in a pic'
        },
        {name: 'repeats',
        min: 1,
        max: 100,
        value: 1,
        dx: 'number of weft pics to repeat within the structure'
        }
      ],
      max_inputs: 1,
      perform: (inputs: Array<Draft>, input_params: Array<number>):Array<Draft> => {


        const sum: number = input_params[0] + input_params[1];
        const repeats: number = input_params[2];
        const width: number = sum * 2;
        const height: number = repeats * 2;

        let alt_rows, alt_cols, val: boolean = false;
        const pattern:Array<Array<Cell>> = [];
        for(let i = 0; i < height; i++){
          alt_rows = (i < repeats);
          pattern.push([]);
          for(let j = 0; j < width; j++){
            alt_cols = (j % sum < input_params[0]);
            val = (alt_cols && alt_rows) || (!alt_cols && !alt_rows);
            pattern[i][j] =  new Cell(val);
          }
        }

        let outputs: Array<Draft> = [];
        if(inputs.length == 0){
          const d: Draft = new Draft({warps: width, wefts: height, pattern: pattern});
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

    const twill: Operation = {
      name: 'twill',
      dx: 'generates or fills with a twill structure described by the inputs',
      params: [
        {name: 'unders',
        min: 1,
        max: 100,
        value: 3,
        dx: 'number of weft unders'
        },
        {name: 'overs',
        min: 1,
        max: 100,
        value: 1,
        dx: 'number of weft overs'
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
      dx: 'generates a random draft with width, height, and percetage of weft unders defined by inputs',
      params: [
        {name: 'width',
        min: 1,
        max: 100,
        value: 6,
        dx: 'the width of this structure'
        },
        {name: 'height',
        min: 1,
        max: 100,
        value: 6,
        dx: 'the height of this structure'
        },
        {name: 'percent weft unders',
        min: 1,
        max: 100,
        value: 50,
        dx: 'percentage of weft unders to be used'
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
      dx: 'generates an output that is the inverse or backside of the input',
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
      dx: 'generates an output that is the left-right mirror of the input',
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
      dx: 'generates an output that is the top-bottom mirror of the input',
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
      dx: 'generates an output that is shifted left by the number of warps specified in the inputs',
      params: [
        {name: 'amount',
        min: 1,
        max: 100,
        value: 1,
        dx: 'the amount of warps to shift by'
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
      dx: 'generates an output that is shifted up by the number of wefts specified in the inputs',
      params: [
        {name: 'amount',
        min: 1,
        max: 100,
        value: 1,
        dx: 'the number of wefts to shift by'
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
      dx: 'generates an linked copy of the input draft, changes to the input draft will then populate on the mirrored draft',
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
    this.ops.push(rect);
    this.ops.push(twill);
    this.ops.push(tabby);
    this.ops.push(basket);
    this.ops.push(rib);
    this.ops.push(random);
    this.ops.push(splice);
    this.ops.push(invert);
    this.ops.push(mirror); //this doesn't really work unless we have multiple outputs allowed on a subdraft
    this.ops.push(mirrorx);
    this.ops.push(mirrory);
    this.ops.push(shiftx);
    this.ops.push(shifty);


    //** Give it a classification here */
    this.classification.push(
      {category: 'block design',
      ops: [rect]
    }
    );

    this.classification.push(
      {category: 'structures',
      ops: [tabby, twill, basket, rib, random]}
    );

    this.classification.push(
      {category: 'transformations',
      ops: [invert, mirrorx, mirrory, shiftx, shifty]}
    );

    this.classification.push(
      {category: 'compose',
      ops: [splice, mirror]}
    );

  }


  getOp(name: string): Operation{
    const ndx: number = this.ops.findIndex(el => el.name === name);
    return this.ops[ndx];
  }
}
