import { D } from '@angular/cdk/keycodes';
import { Injectable } from '@angular/core';
import { FORMERR } from 'dns';
import { Cell } from '../../core/model/cell';
import { Draft } from "../../core/model/draft";
import utilInstance from '../../core/model/util';

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
      dx: "generates a rectangle of the user specified side, if given an input, fills the rectangle with the input",
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
      max_inputs: 1,
      perform: (inputs: Array<Draft>, input_params: Array<number>):Array<Draft> => {
        const outputs: Array<Draft> = [];
        const d: Draft = new Draft({warps: input_params[0], wefts: input_params[1]});
        
        if(inputs.length == 0){
          d.fill([[new Cell(false)]], 'clear');
        }else{
          d.fill(inputs[0].pattern, 'original');
        }



        outputs.push(d);
        return outputs;
      }        
    }

    const clear: Operation = {
      name: 'clear',
      dx: "this sets all heddles to lifted, allowing it to be masked by any pattern",
      params: [],
      max_inputs: 1,
      perform: (inputs: Array<Draft>, input_params: Array<number>):Array<Draft> => {
        const outputs: Array<Draft> = inputs.map(draft => {
          const d: Draft = new Draft({warps: draft.warps, wefts:draft.wefts});
          d.fill([[new Cell(false)]], 'clear');
          return d;
        });
        return outputs;
      }        
    }

    const set: Operation = {
      name: 'set',
      dx: "this sets all unset heddles in this draft to heddle downs (white squares)",
      params: [],
      max_inputs: 1,
      perform: (inputs: Array<Draft>, input_params: Array<number>):Array<Draft> => {
        const outputs: Array<Draft> = inputs.map(draft => {
          const d: Draft = new Draft({warps: draft.warps, wefts:draft.wefts});
          draft.pattern.forEach((row, i) => {
            row.forEach((cell, j) => {
              if(!cell.isSet()) d.pattern[i][j] = new Cell(false);
              else d.pattern[i][j] = new Cell(cell.isUp());
            });
          });
          return d;
        });
        return outputs;
      }        
    }

    const rotate: Operation = {
      name: 'rotate',
      dx: "this turns the draft by 90 degrees",
      params: [],
      max_inputs: 1,
      perform: (inputs: Array<Draft>, input_params: Array<number>):Array<Draft> => {
        const outputs: Array<Draft> = inputs.map(draft => {
          const d: Draft = new Draft({warps: draft.wefts, wefts:draft.warps});
          //get each column from the input, save it as the ror in the output

          for(var r = 0; r < draft.warps; r++){
            const col: Array<Cell> = draft.pattern.map(row => row[r]);
            col.forEach((cell, i) => {
              d.pattern[r][i].setHeddle(cell.getHeddle());
            });
          }


          return d;
        });
        return outputs;
      }        
    }

    const interlace:Operation = {
      name: 'interlace',
      dx: 'interlace the input drafts together in alternating lines',
      params: [],
      max_inputs: 100,
      perform: (inputs: Array<Draft>, input_params: Array<number>):Array<Draft> => {
        
        const outputs: Array<Draft> = [];

        const max_wefts:number = utilInstance.getMaxWefts(inputs);
        const max_warps:number = utilInstance.getMaxWarps(inputs);

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

    const selvedge: Operation = {
      name: 'selvedge',
      dx: 'adds a selvedge of a user defined with both sides of the input draft. User can specify the number of row repeats in the selvedge',
      params: [
        {name: 'width',
        min: 1,
        max: 100,
        value: 12,
        dx: "the width in warps of the selvedge"
        },
        {name: 'repeats',
        min: 1,
        max: 100,
        value: 1,
        dx: "the number of pics to repeat each selvedge structure, usually equal to the number of shuttles thrown"
        }
      ],
      max_inputs: 1,
      perform: (inputs: Array<Draft>, input_params: Array<number>):Array<Draft> => {

        const height = 2*input_params[1];

        const pattern:Array<Array<Cell>> = [];
        for(let i = 0; i < height; i++){
          pattern.push([]);
          let alt: boolean =  i < input_params[1];
          for(let j = 0; j < 2; j++){
            pattern[i][j] = ((alt && j%2 ==0) || (!alt && j%2 ==1)) ? new Cell(true) : new Cell(false);
          }
        }

        let outputs: Array<Draft> = [];
        if(inputs.length == 0){
          const d: Draft = new Draft({warps: input_params[0]*2, wefts: height});
          d.fill(pattern, 'original');
          outputs.push(d);
        }else{
           outputs = inputs.map(input => {
            const d: Draft = new Draft({warps: input.warps + input_params[0]*2, wefts: input.wefts});
            d.fill(pattern, 'original');
            for(let i = 0; i < input.wefts; i++){
              for(let j = 0; j < input.warps; j++){
                d.pattern[i][j+input_params[0]].setHeddle(input.pattern[i][j].getHeddle()) ;
              }
            }

            return d;
          });
        }

        return outputs;
      }        
    }

    const overlay: Operation = {
      name: 'overlay',
      dx: 'overlays the two drafts together. offsets the second (and further drafts) by the input values',
      params: [
        {name: 'left offset',
        min: 0,
        max: 10000,
        value: 0,
        dx: "the amount to offset the added inputs from the left"
        },
        {name: 'top offset',
        min: 0,
        max: 10000,
        value: 0,
        dx: "the amount to offset the overlaying inputs from the top"
        }
      ],
      max_inputs: 100,
      perform: (inputs: Array<Draft>, input_params: Array<number>):Array<Draft> => {

        if(inputs.length < 1) return [];

        const first: Draft = inputs.shift();

        const outputs: Array<Draft> = [];


        let width: number = utilInstance.getMaxWarps(inputs) + input_params[0];
        let height: number = utilInstance.getMaxWefts(inputs) + input_params[1];
        if(first.warps > width) width = first.warps;
        if(first.wefts > height) height = first.wefts;

        //initialize the base container with the first draft at 0,0, unset for anythign wider
        const init_draft: Draft = new Draft({wefts: height, warps: width});
          
        first.pattern.forEach((row, i) => {
            row.forEach((cell, j) => {
              init_draft.pattern[i][j].setHeddle(cell.getHeddle());
            });
          });

        //now merge in all of the additional inputs offset by the inputs
        const d: Draft = inputs.reduce((acc, input) => {
          input.pattern.forEach((row, i) => {
            row.forEach((cell, j) => {
              //if i or j is less than input params 
              const adj_i: number = i+input_params[1];
              const adj_j: number = j+input_params[0];
              acc.pattern[adj_i][adj_j].setHeddle(utilInstance.computeFilter('or', cell.getHeddle(), acc.pattern[adj_i][adj_j].getHeddle()));
            });
          });
          return acc;

        }, init_draft);
        outputs.push(d);
        return outputs;
      }        
    }


    const fill: Operation = {
      name: 'fill',
      dx: 'fills black cells of the first input with the pattern specified by the second input, white cells with third input',
      params: [],
      max_inputs: 3,
      perform: (inputs: Array<Draft>, input_params: Array<number>):Array<Draft> => {
        let outputs: Array<Draft> = [];

        if(inputs.length == 0){
          outputs.push(new Draft({warps:0, wefts: 0}));
        }

        if(inputs.length == 1){
          outputs.push(new Draft({warps:inputs[0].warps, wefts: inputs[0].wefts, pattern:inputs[0].pattern}));
        }

        if(inputs.length == 2){
          let d = new Draft({warps:inputs[0].warps, wefts: inputs[0].wefts, pattern:inputs[0].pattern});
          d.fill(inputs[1].pattern, 'mask');
          outputs.push(d);
        }

        if(inputs.length == 3){
          let d = new Draft({warps:inputs[0].warps, wefts: inputs[0].wefts, pattern:inputs[0].pattern});
          let di = new Draft({warps:inputs[0].warps, wefts: inputs[0].wefts, pattern:inputs[0].pattern});
          di.fill(inputs[0].pattern, 'invert');
          di.fill(inputs[2].pattern, 'mask');
          d.fill(inputs[1].pattern, 'mask');

          const op: Operation = this.getOp('overlay');
          const out: Array<Draft> = op.perform([d, di], [0, 0]);
          outputs.push(out[0]);

        }



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
            return val + acc;
        }, 0);

        let alt_rows, alt_cols, val: boolean = false;
        const pattern:Array<Array<Cell>> = [];
        for(let i = 0; i < sum; i++){
          alt_rows = (i % sum < input_params[0]);
          pattern.push([]);
          for(let j = 0; j < sum; j++){
            alt_cols = (j % sum < input_params[0]);
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


    const stretch: Operation = {
      name: 'stretch',
      dx: 'repeats each warp and/or weft by the inputs',
      params: [
        {name: 'warp repeats',
        min: 1,
        max: 100,
        value: 2,
        dx: 'number of times to repeat each warp'
        },
        {name: 'weft repeats',
        min: 1,
        max: 100,
        value: 2,
        dx: 'number of weft overs in a pic'
        }
      ],
      max_inputs: 1,
      perform: (inputs: Array<Draft>, input_params: Array<number>):Array<Draft> => {

        const outputs: Array<Draft> = inputs.map(input => {
            const d: Draft = new Draft({warps: input_params[0]*input.warps, wefts: input_params[1]*input.wefts});
            input.pattern.forEach((row, i) => {
              for(let p = 0; p < input_params[1]; p++){
                let i_ndx = input_params[1] * i + p;
                row.forEach((cell, j) => {
                  for(let r = 0; r < input_params[0]; r++){
                    let j_ndx = input_params[0] * j + r;
                    d.pattern[i_ndx][j_ndx].setHeddle(cell.getHeddle());
                  }
                });

              }
            });

            return d;
        });

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
        const width: number = sum;
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
        value: 1,
        dx: 'number of weft unders'
        },
        {name: 'overs',
        min: 1,
        max: 100,
        value: 3,
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
          d.fill(d.pattern, 'mirrorY');
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
          d.fill(d.pattern, 'mirrorX');
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

    const slope: Operation = {
      name: 'slope',
      dx: 'offsets every nth row by the vaule given in col',
      params: [
        {name: 'col shift',
        min: -100,
        max: 100,
        value: 1,
        dx: 'the amount to shift rows by'
        },
        {name: 'row shift (n)',
        min: 0,
        max: 100,
        value: 1,
        dx: 'describes how many rows we should apply the shift to'
        }
      ],
      max_inputs: 1, 
      perform: (inputs: Array<Draft>, input_params: Array<number>):Array<Draft> => {
          
          const outputs:Array<Draft> = inputs.map(input => {
            console.log(input_params);
          const d: Draft = new Draft({warps: input.warps, wefts: input.wefts});
          for(let i = 0; i < d.wefts; i++){
            
              let i_shift: number = (input_params[1] === 0) ? 0 : Math.floor(i/input_params[1]);
              for(let j = 0; j <d.warps; j++){
                let j_shift: number = input_params[0]*-1;
                let shift_total = (i_shift * j_shift)%d.warps;
                if(shift_total < 0) shift_total += d.warps;
                
                d.pattern[i][j].setHeddle(input.pattern[i][(j+shift_total)%d.warps].getHeddle());
              }
            }
          return d;
        });
        return outputs;
      }
    }


    const mirror: Operation = {
      name: 'mirror',
      dx: 'generates an linked copy of the input draft, changes to the input draft will then populate on the mirrored draft',
      params: [ {
        name: 'copies',
        min: 1,
        max: 100,
        value: 1,
        dx: 'the number of mirrors to produce'
      }],
      max_inputs: 1, 
      perform: (inputs: Array<Draft>, input_params: Array<number>):Array<Draft> => {
        
        

        let outputs:Array<Draft> = [];

        for(let i = 0; i < input_params[0]; i++){
            const ds:Array<Draft> = inputs.map(input => {
              const d: Draft = new Draft({warps: input.warps, wefts: input.wefts, pattern: input.pattern});
              return d;
            });
            outputs = outputs.concat(ds);
        }
        return outputs;
      }
    }

    const bindweftfloats: Operation = {
      name: 'bind weft floats',
      dx: 'adds interlacements to weft floats over the user specified length',
      params: [
        {name: 'length',
        min: 1,
        max: 100,
        value: 10,
        dx: 'the maximum length of a weft float'
        }
      ],
      max_inputs: 1, 
      perform: (inputs: Array<Draft>, input_params: Array<number>):Array<Draft> => {
          
          const outputs:Array<Draft> = inputs.map(input => {
          const d: Draft = new Draft({warps: input.warps, wefts: input.wefts, pattern: input.pattern});
          let float: number = 0;
          let last:boolean = false;
          d.pattern.forEach(row => {
            float = 0;
            last = null;
            row.forEach(c => {

              if(c.getHeddle == null) float = 0;
              if(last != null && c.getHeddle() == last) float++;

              if(float >= input_params[0]){
                c.toggleHeddle();
                float = 0;
              }
              last = c.getHeddle();
            });
          });

          return d;
        });
        return outputs;
      }
    }

    const bindwarpfloats: Operation = {
      name: 'bind warp floats',
      dx: 'adds interlacements to warp floats over the user specified length',
      params: [
        {name: 'length',
        min: 1,
        max: 100,
        value: 10,
        dx: 'the maximum length of a warp float'
        }
      ],
      max_inputs: 1, 
      perform: (inputs: Array<Draft>, input_params: Array<number>):Array<Draft> => {
          
          const outputs:Array<Draft> = inputs.map(input => {
          const d: Draft = new Draft({warps: input.warps, wefts: input.wefts, pattern: input.pattern});
          let float: number = 0;
          let last:boolean = false;

          for(let j = 0; j < d.warps; j++){
            const col: Array<Cell> = d.pattern.map(row => row[j]);
            float = 0;
            last = null;
            col.forEach(c => {

              if(c.getHeddle == null) float = 0;
              if(last != null && c.getHeddle() == last) float++;

              if(float >= input_params[0]){
                c.toggleHeddle();
                float = 0;
              }
              last = c.getHeddle();
            });
          }

          return d;
        });
        return outputs;
      }
    }

    const layer: Operation = {
      name: 'layer',
      dx: 'creates a draft in which each input is assigned to a layer in a multilayered structure, assigns 1 to top layer and so on',
      params: [],
      max_inputs: 100, 
      perform: (inputs: Array<Draft>, input_params: Array<number>):Array<Draft> => {
          
          const layers = inputs.length;

          const max_wefts:number = utilInstance.getMaxWefts(inputs);
          const max_warps:number = utilInstance.getMaxWarps(inputs);

          //set's base pattern that assigns warp 1...n to layers 1...n 
          const pattern: Array<Array<Cell>> = [];
          for(let i = 0; i < layers; i++){
            pattern.push([]);
            for(let j = 0; j < layers; j++){
              let val: boolean = (j < i) ? true : false; 
              pattern[i].push(new Cell(val));
            }
          }

          const overlay: Array<Draft> = this.getOp('interlace').perform(inputs, []);
          
          const outputs: Array<Draft> = inputs.map((input, ndx) => {
            const d: Draft = new Draft({warps: max_warps*layers, wefts: max_wefts*layers});
            d.fill(pattern, "original");

            console.log(overlay[ndx].warps, d.warps, overlay[ndx].wefts, d.wefts);

            overlay[ndx].pattern.forEach((row, ndx) => {
              const layer_id:number = ndx % layers;
              row.forEach((c, j) => {
                d.pattern[ndx][j*layers+layer_id].setHeddle(c.getHeddle());
              });
            });
            return d;
        });


          return outputs;
      }
    }

    const tile: Operation = {
      name: 'tile',
      dx: 'repeats this block along the warp and weft',
      params: [
        {name: 'warp-repeats',
        min: 1,
        max: 100,
        value: 2,
        dx: 'the number of times to repeat this time across the width'
        },
        {name: 'weft-repeats',
        min: 1,
        max: 100,
        value: 2,
        dx: 'the number of times to repeat this time across the length'
        }
      ],
      max_inputs: 1,
      perform: (inputs: Array<Draft>, input_params: Array<number>):Array<Draft> => {

        const outputs:Array<Draft> = inputs.map(input => {
          const width: number = input_params[0]*input.warps;
          const height: number = input_params[1]*input.wefts;

          const d: Draft = new Draft({warps: width, wefts: height});
          d.fill(input.pattern, 'original');
          return d;
        });


        return outputs;
      }
          
    }

    const joinleft: Operation = {
      name: 'join left',
      dx: 'attaches inputs toether into one draft with each iniput side by side',
      params: [],
      max_inputs: 100, 
      perform: (inputs: Array<Draft>, input_params: Array<number>):Array<Draft> => {
          
        const outputs: Array<Draft> = [];
        const total:number = inputs.reduce((acc, draft)=>{
            return acc + draft.warps;
        }, 0);

        const max_wefts:number = utilInstance.getMaxWefts(inputs);
        
        const d: Draft = new Draft({warps: total, wefts: max_wefts});
        for(let i = 0; i < max_wefts; i++){
            const combined_rows: Array<Cell> = inputs.reduce((acc, draft) => {
             
              let  r: Array<Cell> = [];
              //if the draft doesn't have this row, just make a blank one
              if(i >= draft.wefts){
                const nd = new Draft({warps: draft.warps, wefts: 1});
                r = nd.pattern[0];
              }
              else r =  draft.pattern[i];
              return acc.concat(r);
            }, []);
            
            console.log('comobinied length', combined_rows.length, total);
          
            combined_rows.forEach((cell,j) => {
              d.pattern[i][j].setHeddle(cell.getHeddle());
            });
        }
             
        outputs.push(d);
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
    this.ops.push(interlace);
    this.ops.push(invert);
    this.ops.push(mirror); //this doesn't really work unless we have multiple outputs allowed on a subdraft
    this.ops.push(mirrorx);
    this.ops.push(mirrory);
    this.ops.push(shiftx);
    this.ops.push(shifty);
    this.ops.push(layer);
    this.ops.push(selvedge);
    this.ops.push(bindweftfloats);
    this.ops.push(bindwarpfloats);
    this.ops.push(joinleft);
    this.ops.push(slope);
    this.ops.push(tile);
    this.ops.push(stretch);
    this.ops.push(clear);
    this.ops.push(set);
    this.ops.push(rotate);
    this.ops.push(fill);
    this.ops.push(overlay);


    //** Give it a classification here */
    this.classification.push(
      {category: 'block design',
      ops: [fill, rect, clear, set]
    }
    );

    this.classification.push(
      {category: 'structures',
      ops: [tabby, twill, basket, rib, random]}
    );

    this.classification.push(
      {category: 'transformations',
      ops: [invert, mirrorx, mirrory, shiftx, shifty, rotate, slope, stretch]}
    );

    this.classification.push(
      {category: 'compose',
      ops: [overlay, interlace, layer, tile, joinleft, mirror, selvedge, bindweftfloats, bindwarpfloats]}
    );

  }


  getOp(name: string): Operation{
    const ndx: number = this.ops.findIndex(el => el.name === name);
    return this.ops[ndx];
  }
}
