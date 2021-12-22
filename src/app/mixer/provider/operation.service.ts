import { D, E } from '@angular/cdk/keycodes';
import { Injectable, Input } from '@angular/core';
import { Cell } from '../../core/model/cell';
import { Draft } from "../../core/model/draft";
import { VaeService} from "../../core/provider/vae.service"
import { PatternfinderService} from "../../core/provider/patternfinder.service"
import utilInstance from '../../core/model/util';
import { Loom } from '../../core/model/loom';

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
    perform: (input: Array<Draft>, input_params: Array<number>) => Promise<Array<Draft>>
 }

 export interface OperationClassification{
  category: string,
  dx: string,
  ops: Array<Operation> 
 }
 

@Injectable({
  providedIn: 'root'
})
export class OperationService {

  ops: Array<Operation> = [];
  classification: Array<OperationClassification> = [];

  constructor(private vae: VaeService, private pfs: PatternfinderService) { 

    const rect: Operation = {
      name: 'rectangle',
      dx: "generates a rectangle of the user specified side, if given an input, fills the rectangle with the input",
      params: [
        {name: 'width',
        min: 1,
        max: 500,
        value: 10,
        dx: "width"
        },
        {name: 'height',
        min: 1,
        max: 500,
        value: 10,
        dx: "height"
        }
      ],
      max_inputs: 1,
      perform: (inputs: Array<Draft>, input_params: Array<number>) => {
        const outputs: Array<Draft> = [];
        const d: Draft = new Draft({warps: input_params[0], wefts: input_params[1]});
        
        if(inputs.length == 0){
          d.fill([[new Cell(false)]], 'clear');
        }else{
          d.fill(inputs[0].pattern, 'original');
          d.updateWarpShuttlesFromPattern(inputs[0].colShuttleMapping);
          d.updateWeftShuttlesFromPattern(inputs[0].rowShuttleMapping);
          d.updateWarpSystemsFromPattern(inputs[0].colSystemMapping);
          d.updateWeftSystemsFromPattern(inputs[0].rowSystemMapping);

        }



        outputs.push(d);
        return Promise.resolve(outputs);
      }        
    }

    const clear: Operation = {
      name: 'clear',
      dx: "this sets all heddles to lifted, allowing it to be masked by any pattern",
      params: [],
      max_inputs: 1,
      perform: (inputs: Array<Draft>, input_params: Array<number>) => {
        const outputs: Array<Draft> = inputs.map(draft => {
          const d: Draft = new Draft({warps: draft.warps, wefts:draft.wefts});
          d.fill([[new Cell(false)]], 'clear');
          if(inputs.length > 0){
            d.updateWarpShuttlesFromPattern(inputs[0].colShuttleMapping);
            d.updateWeftShuttlesFromPattern(inputs[0].rowShuttleMapping);
            d.updateWarpSystemsFromPattern(inputs[0].colSystemMapping);
            d.updateWeftSystemsFromPattern(inputs[0].rowSystemMapping);
          }
          return  d;
        });
        return Promise.resolve(outputs);
      }        
    }

    const set: Operation = {
      name: 'set unset to down',
      dx: "this sets all unset heddles in this draft to heddle downs (white squares)",
      params: [],
      max_inputs: 1,
      perform: (inputs: Array<Draft>, input_params: Array<number>)=> {
        const outputs: Array<Draft> = inputs.map(draft => {
          const d: Draft = new Draft({warps: draft.warps, wefts:draft.wefts});
          draft.pattern.forEach((row, i) => {
            row.forEach((cell, j) => {
              if(!cell.isSet()) d.pattern[i][j] = new Cell(false);
              else d.pattern[i][j] = new Cell(cell.isUp());
            });
          });
          if(inputs.length > 0){
            d.updateWarpShuttlesFromPattern(inputs[0].colShuttleMapping);
            d.updateWeftShuttlesFromPattern(inputs[0].rowShuttleMapping);
            d.updateWarpSystemsFromPattern(inputs[0].colSystemMapping);
            d.updateWeftSystemsFromPattern(inputs[0].rowSystemMapping);
          }
          return d;
        });
        return Promise.resolve(outputs);
      }        
    }

    const unset: Operation = {
      name: 'set down to unset',
      dx: "this sets all down heddles in this draft to unset",
      params: [],
      max_inputs: 1,
      perform: (inputs: Array<Draft>, input_params: Array<number>) => {
        const outputs: Array<Draft> = inputs.map(draft => {
          const d: Draft = new Draft({warps: draft.warps, wefts:draft.wefts});
          draft.pattern.forEach((row, i) => {
            row.forEach((cell, j) => {
              if(!cell.isUp() && cell.isSet()) d.pattern[i][j] = new Cell(null);
              else d.pattern[i][j] = new Cell(cell.getHeddle());
            });
          });
          if(inputs.length > 0){
            d.updateWarpShuttlesFromPattern(inputs[0].colShuttleMapping);
            d.updateWeftShuttlesFromPattern(inputs[0].rowShuttleMapping);
            d.updateWarpSystemsFromPattern(inputs[0].colSystemMapping);
            d.updateWeftSystemsFromPattern(inputs[0].rowSystemMapping);
          }
          return d;
        });
        return Promise.resolve(outputs);
      }        
    }

    const rotate: Operation = {
      name: 'rotate',
      dx: "this turns the draft by 90 degrees but leaves materials in same place",
      params: [],
      max_inputs: 1,
      perform: (inputs: Array<Draft>, input_params: Array<number>) => {
        const outputs: Array<Draft> = inputs.map(draft => {
          const d: Draft = new Draft({warps: draft.wefts, wefts:draft.warps});
          //get each column from the input, save it as the ror in the output

          for(var r = 0; r < draft.warps; r++){
            const col: Array<Cell> = draft.pattern.map(row => row[r]);
            col.forEach((cell, i) => {
              d.pattern[r][i].setHeddle(cell.getHeddle());
            });
          }

          if(inputs.length > 0){
            d.updateWarpShuttlesFromPattern(inputs[0].colShuttleMapping);
            d.updateWeftShuttlesFromPattern(inputs[0].rowShuttleMapping);
            d.updateWarpSystemsFromPattern(inputs[0].colSystemMapping);
            d.updateWeftSystemsFromPattern(inputs[0].rowSystemMapping);
          }

          return d;
        });
        return Promise.resolve(outputs);
      }        
    }

    /**TO DO - handle materials */
    const interlace:Operation = {
      name: 'interlace',
      dx: 'interlace the input drafts together in alternating lines',
      params: [],
      max_inputs: 100,
      perform: (inputs: Array<Draft>, input_params: Array<number>) => {
        
        const outputs: Array<Draft> = [];

        const max_wefts:number = utilInstance.getMaxWefts(inputs);
        const max_warps:number = utilInstance.getMaxWarps(inputs);
        const rowSystems: Array<Array<number>> = inputs.map(el => el.rowSystemMapping);
       
        const uniqueSystemRows: Array<Array<number>> = utilInstance.makeSystemsUnique(rowSystems);

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

                d.colShuttleMapping[j] = inputs[select_array].colShuttleMapping[j];
                d.colSystemMapping[j] = inputs[select_array].colSystemMapping[j];

                //this should throw an error if all drafts are using different warp colorings.
            });
            d.rowShuttleMapping[ndx] = inputs[select_array].rowShuttleMapping[select_row];
            d.rowSystemMapping[ndx] = uniqueSystemRows[select_array][select_row];

        });

        outputs.push(d);
        return Promise.resolve(outputs);
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
      perform: (inputs: Array<Draft>, input_params: Array<number>)=> {

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
            if(inputs.length > 0){
              d.updateWarpShuttlesFromPattern(inputs[0].colShuttleMapping);
              d.updateWeftShuttlesFromPattern(inputs[0].rowShuttleMapping);
              d.updateWarpSystemsFromPattern(inputs[0].colSystemMapping);
              d.updateWeftSystemsFromPattern(inputs[0].rowSystemMapping);
            }
            for(let i = 0; i < input.wefts; i++){
              for(let j = 0; j < input.warps; j++){
                d.pattern[i][j+input_params[0]].setHeddle(input.pattern[i][j].getHeddle()) ;
              }
            }

            return d;
          });
        }

        return Promise.resolve(outputs);
      }        
    }

    const overlay: Operation = {
      name: 'overlay, (a,b) => (a OR b)',
      dx: 'keeps any region that is marked as black/true in either draft',
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
      max_inputs: 2,
      perform: (inputs: Array<Draft>, input_params: Array<number>)=> {

        if(inputs.length < 1) return Promise.resolve([]);

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
        return Promise.resolve(outputs);
      }        
    }

    const atop: Operation = {
      name: 'set atop, (a, b) => a',
      dx: 'sets cells of a on top of b, no matter the value of b',
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
      max_inputs: 2,
      perform: (inputs: Array<Draft>, input_params: Array<number>) => {

        if(inputs.length < 1) return Promise.resolve([]);

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
              acc.pattern[adj_i][adj_j].setHeddle(utilInstance.computeFilter('up', cell.getHeddle(), acc.pattern[adj_i][adj_j].getHeddle()));
            });
          });
          return acc;

        }, init_draft);
        outputs.push(d);
        return Promise.resolve(outputs);
      }        
    }

    const knockout: Operation = {
      name: 'knockout, (a, b) => (a XOR b)',
      dx: 'Flips the value of overlapping cells of the same value, effectively knocking out the image of the second draft upon the first',
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
      max_inputs: 2,
      perform: (inputs: Array<Draft>, input_params: Array<number>)=> {

        if(inputs.length < 1) return Promise.resolve([]);

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
              acc.pattern[adj_i][adj_j].setHeddle(utilInstance.computeFilter('neq', cell.getHeddle(), acc.pattern[adj_i][adj_j].getHeddle()));
            });
          });
          return acc;

        }, init_draft);
        outputs.push(d);
        return Promise.resolve(outputs);
      }        
    }

    const mask: Operation = {
      name: 'mask, (a,b) => (a AND b)',
      dx: 'only shows areas of the first draft in regions where the second draft has black/true cells',
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
      max_inputs: 2,
      perform: (inputs: Array<Draft>, input_params: Array<number>) => {

        if(inputs.length < 1) return Promise.resolve([]);

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
              acc.pattern[adj_i][adj_j].setHeddle(utilInstance.computeFilter('and', cell.getHeddle(), acc.pattern[adj_i][adj_j].getHeddle()));
            });
          });
          return acc;

        }, init_draft);
        outputs.push(d);
        return Promise.resolve(outputs);
      }        
    }

    const erase: Operation = {
      name: 'erase,  (a,b) => (NOT a OR b)',
      dx: 'Flips the value of overlapping cells of the same value, effectively knocking out the image of the second draft upon the first',
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
      max_inputs: 2,
      perform: (inputs: Array<Draft>, input_params: Array<number>) => {

        if(inputs.length < 1) return Promise.resolve([]);

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
              acc.pattern[adj_i][adj_j].setHeddle(utilInstance.computeFilter('down', cell.getHeddle(), acc.pattern[adj_i][adj_j].getHeddle()));
            });
          });
          return acc;

        }, init_draft);
        outputs.push(d);
        return Promise.resolve(outputs);
      }        
    }


    const fill: Operation = {
      name: 'fill',
      dx: 'fills black cells of the first input with the pattern specified by the second input, white cells with third input',
      params: [],
      max_inputs: 3,
      perform: (inputs: Array<Draft>, input_params: Array<number>) => {
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

        
          op.perform([d, di], [0, 0])
            .then(out => {
              outputs.push(out[0]);
            });

          // op.perform([d, di], [0, 0]);
          // outputs.push(out[0]);


        }



        return Promise.resolve(outputs);
      }        
    }

    const tabby: Operation = {
      name: 'tabby',
      dx: 'also known as plain weave generates or fills input a draft with tabby structure or derivitae',
      params: [
        {name: 'repeats',
        min: 1,
        max: 100,
        value: 1,
        dx: 'the number or reps to adjust evenly through the structure'
        },
      ],
      max_inputs: 1,
      perform: (inputs: Array<Draft>, input_params: Array<number>) => {


        const width: number = input_params[0]*2;
        const height: number = input_params[0]*2;

        let alt_rows, alt_cols, val: boolean = false;
        const pattern:Array<Array<Cell>> = [];
        for(let i = 0; i < height; i++){
          alt_rows = (i < input_params[0]);
          pattern.push([]);
          for(let j = 0; j < width; j++){
            alt_cols = (j < input_params[0]);
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

        return Promise.resolve(outputs);
      

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
      perform: (inputs: Array<Draft>, input_params: Array<number>) => {


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

        return Promise.resolve(outputs);
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
      perform: (inputs: Array<Draft>, input_params: Array<number>) => {

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

        return Promise.resolve(outputs);
      }
          
    }

    const resize: Operation = {
      name: 'resize',
      dx: 'stretches or squishes the draft to fit the boundary',
      params: [
        {name: 'warps',
        min: 1,
        max: 10000,
        value: 2,
        dx: 'number of warps to resize to'
        },
        {name: 'weft repeats',
        min: 1,
        max: 10000,
        value: 2,
        dx: 'number of wefts to resize to'
        }
      ],
      max_inputs: 1,
      perform: (inputs: Array<Draft>, input_params: Array<number>) => {

        const outputs: Array<Draft> = inputs.map(input => {
          const weft_factor =input_params[1] /input.wefts ;
          const warp_factor = input_params[0] / input.warps;
          const d: Draft = new Draft({warps: input_params[0], wefts: input_params[1]});
            d.pattern.forEach((row, i) => {
                row.forEach((cell, j) => {
                    const mapped_cell: Cell = input.pattern[Math.floor(i/weft_factor)][Math.floor(j/warp_factor)];
                    d.pattern[i][j].setHeddle(mapped_cell.getHeddle());
                
                });
            });

            return d;
        });

        return Promise.resolve(outputs);
      }
          
    }

    const margin: Operation = {
      name: 'margin',
      dx: 'adds padding of unset cells to the top, right, bottom, left of the block',
      params: [
        {name: 'top',
        min: 1,
        max: 10000,
        value: 1,
        dx: 'number of pics of padding to add to the top'
        },
        {name: 'right',
        min: 1,
        max: 10000,
        value: 1,
        dx: 'number of pics of padding to add to the right'
        },
        {name: 'bottom',
        min: 1,
        max: 10000,
        value: 1,
        dx: 'number of pics of padding to add to the bottom'
        },
        {name: 'left',
        min: 1,
        max: 10000,
        value: 1,
        dx: 'number of pics of padding to add to the left'
        }
      ],
      max_inputs: 1,
      perform: (inputs: Array<Draft>, input_params: Array<number>) => {

        const outputs: Array<Draft> = inputs.map(input => {
            const new_warps = input_params[1] + input_params[3] + input.warps;
            const new_wefts = input_params[0] + input_params[2] + input.wefts;

            const d: Draft = new Draft({warps: new_warps, wefts: new_wefts});

            //unset all cells to default
            d.pattern.forEach((row, i) => {
              row.forEach((cell, j) => {
                d.pattern[i][j].unsetHeddle();
              });
            });
            input.pattern.forEach((row, i) => {
                row.forEach((cell, j) => {
                  d.pattern[i+input_params[0]][j+input_params[3]].setHeddle(cell.getHeddle());
                });
            });

            return d;
        });

        return Promise.resolve(outputs);
      }
          
    }

    const crop: Operation = {
      name: 'crop',
      dx: 'crops to a region of the input draft. The crop size and placement is given by the parameters',
      params: [
        {name: 'left',
        min: 0,
        max: 10000,
        value: 0,
        dx: 'number of pics from the left to start the cut'
        },
        {name: 'top',
        min: 0,
        max: 10000,
        value: 0,
        dx: 'number of pics from the top to start the cut'
        },
        {name: 'width',
        min: 1,
        max: 10000,
        value: 10,
        dx: 'total width of cut'
        },
        {name: 'height',
        min: 1,
        max: 10000,
        value: 10,
        dx: 'height of the cutting box'
        }
      ],
      max_inputs: 1,
      perform: (inputs: Array<Draft>, input_params: Array<number>) => {



        const outputs: Array<Draft> = inputs.map(input => {
            const new_warps = input_params[2];
            const new_wefts = input_params[3];

            const d: Draft = new Draft({warps: new_warps, wefts: new_wefts});

            //unset all cells to default
            d.pattern.forEach((row, i) => {
              row.forEach((cell, j) => {

                if((i+input_params[1] >= input.pattern.length) || (j+input_params[0] >= input.pattern[0].length)) cell.setHeddle(null);
                else cell.setHeddle(input.pattern[i+input_params[1]][j+input_params[0]].getHeddle());
               
              });
            });

            return d;
        });

        return Promise.resolve(outputs);
      }
          
    }

    const warp_rep: Operation = {
      name: 'warprep',
      dx: 'specifies an alternating pattern along the warp',
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
        }
      ],
      max_inputs: 1,
      perform: (inputs: Array<Draft>, input_params: Array<number>) => {


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

        return Promise.resolve(outputs);
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
      perform: (inputs: Array<Draft>, input_params: Array<number>) => {


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

        return Promise.resolve(outputs);
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
        },
        {name: 'direction',
        min: 0,
        max: 1,
        value: 0,
        dx: '0 for S twist, 1 for Z twist'
        }
      ],
      max_inputs: 1,
      perform: (inputs: Array<Draft>, input_params: Array<number>) => {

        let sum: number = input_params.reduce( (acc, val) => {
            return val + acc;
        }, 0);

        sum -= input_params[2];

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

        if(input_params[2] === 1){
          return this.getOp('flip horiz').perform(outputs, []);
        }else{
          return Promise.resolve(outputs);
        }
      }        
    }

    

    const satin: Operation = {
      name: 'satin',
      dx: 'generates or fills with a satin structure described by the inputs',
      params: [
        {name: 'repeat',
        min: 5,
        max: 100,
        value: 5,
        dx: 'the width and height of the pattern'
        },
        {name: 'move',
        min: 1,
        max: 100,
        value: 2,
        dx: 'the move number on each row'
        }
      ],
      max_inputs: 1,
      perform: (inputs: Array<Draft>, input_params: Array<number>) => {
       

        const pattern:Array<Array<Cell>> = [];
        for(let i = 0; i < input_params[0]; i++){
          pattern.push([]);
          for(let j = 0; j < input_params[0]; j++){
            pattern[i][j] = (j===(i*input_params[1])%input_params[0]) ? new Cell(true) : new Cell(false);
          }
        }

        let outputs: Array<Draft> = [];
        if(inputs.length === 0){
          const d: Draft = new Draft({warps: input_params[0], wefts: input_params[0], pattern: pattern});
          outputs.push(d);
        }else{
           outputs = inputs.map(input => {
            const d: Draft = new Draft({warps: input.warps, wefts: input.wefts, pattern: input.pattern});
            d.fill(pattern, 'mask');
            return d;
          });
        }
              
      
        return Promise.resolve(outputs);
        // return inputs.map(input => {
        //   return input;
        // })

        // const shift: number = Math.ceil(input_params[1]/2);

        // return this.getOp('twill').perform(inputs, input_params)
        //   .then(d => {
        //     return Promise.resolve(this.getOp('slope').perform(d, [shift, 1]));
        //   })
        
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
      perform: (inputs: Array<Draft>, input_params: Array<number>) => {
       
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

        return Promise.resolve(outputs);
      }        
    }

    const invert: Operation = {
      name: 'invert',
      dx: 'generates an output that is the inverse or backside of the input',
      params: [],
      max_inputs: 1, 
      perform: (inputs: Array<Draft>, input_params: Array<number>) => {
          const outputs:Array<Draft> = inputs.map(input => {
          const d: Draft = new Draft({warps: input.warps, wefts: input.wefts, pattern: input.pattern});
          d.fill(d.pattern, 'invert');
          return d;
        });
        return Promise.resolve(outputs);
      }
    }

    const flipx: Operation = {
      name: 'flip horiz',
      dx: 'generates an output that is the left-right mirror of the input',
      params: [],
      max_inputs: 1, 
      perform: (inputs: Array<Draft>, input_params: Array<number>) => {
          const outputs:Array<Draft> = inputs.map(input => {
          const d: Draft = new Draft({warps: input.warps, wefts: input.wefts, pattern: input.pattern});
          d.fill(d.pattern, 'mirrorY');
          return d;
        });
        return  Promise.resolve(outputs);
      }
    }

    const flipy: Operation = {
      name: 'flip vert',
      dx: 'generates an output that is the top-bottom mirror of the input',
      params: [],
      max_inputs: 1, 
      perform: (inputs: Array<Draft>, input_params: Array<number>)=> {
          const outputs:Array<Draft> = inputs.map(input => {
          const d: Draft = new Draft({warps: input.warps, wefts: input.wefts, pattern: input.pattern});
          d.fill(d.pattern, 'mirrorX');
          return d;
        });
        return  Promise.resolve(outputs);
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
      perform: (inputs: Array<Draft>, input_params: Array<number>)=> {
          
          const outputs:Array<Draft> = inputs.map(input => {
          const d: Draft = new Draft({warps: input.warps, wefts: input.wefts, pattern: input.pattern});
            for(let i = 0; i < input_params[0]; i++){
              d.fill(d.pattern, 'shiftLeft');
            }
          return d;
        });
        return  Promise.resolve(outputs);
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
      perform: (inputs: Array<Draft>, input_params: Array<number>) => {
          
          const outputs:Array<Draft> = inputs.map(input => {
          const d: Draft = new Draft({warps: input.warps, wefts: input.wefts, pattern: input.pattern});
            for(let i = 0; i < input_params[0]; i++){
              d.fill(d.pattern, 'shiftUp');
            }
          return d;
        });
        return  Promise.resolve(outputs);
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
      perform: (inputs: Array<Draft>, input_params: Array<number>) => {
          
          const outputs:Array<Draft> = inputs.map(input => {
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
        return  Promise.resolve(outputs);
      }
    }


    const replicate: Operation = {
      name: 'mirror',
      dx: 'generates an linked copy of the input draft, changes to the input draft will then populate on the replicated draft',
      params: [ {
        name: 'copies',
        min: 1,
        max: 100,
        value: 1,
        dx: 'the number of mirrors to produce'
      }],
      max_inputs: 1, 
      perform: (inputs: Array<Draft>, input_params: Array<number>) => {
        
        

        let outputs:Array<Draft> = [];

        for(let i = 0; i < input_params[0]; i++){
            const ds:Array<Draft> = inputs.map(input => {
              const d: Draft = new Draft({warps: input.warps, wefts: input.wefts, pattern: input.pattern});
              return d;
            });
            outputs = outputs.concat(ds);
        }
        return  Promise.resolve(outputs);
      }
    }

    const variants: Operation = {
      name: 'variants',
      dx: 'for any input draft, create the shifted and flipped values as well',
      params: [],
      max_inputs: 1, 
      perform: (inputs: Array<Draft>, input_params: Array<number>) => {
        
        if(inputs.length == 0)  return  Promise.resolve([]);

        const functions: Array<Promise<Array<Draft>>> = [
        this.getOp('flip horiz').perform(inputs, input_params),
        this.getOp('invert').perform(inputs, input_params)]

        for(let i = 1; i < inputs[0].warps; i+=2){
          functions.push(this.getOp('shift left').perform(inputs, [i]))
        }

        for(let i = 1; i < inputs[0].wefts; i+=2){
          functions.push(this.getOp('shift up').perform(inputs, [i]))
        }
        return Promise.all(functions)
        .then(allDrafts => allDrafts
          .reduce((acc, drafts) => acc.concat(drafts), [])
         )        
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
      perform: (inputs: Array<Draft>, input_params: Array<number>) => {
          
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
        return  Promise.resolve(outputs);
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
      perform: (inputs: Array<Draft>, input_params: Array<number>) => {
          
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
        return  Promise.resolve(outputs);
      }
    }

    const layer: Operation = {
      name: 'layer',
      dx: 'creates a draft in which each input is assigned to a layer in a multilayered structure, assigns 1 to top layer and so on',
      params: [],
      max_inputs: 100, 
      perform: (inputs: Array<Draft>, input_params: Array<number>)=> {
          
          const layers = inputs.length;
          if(layers == 0) return Promise.resolve([]);

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


          return this.getOp('interlace').perform(inputs, [])
            .then(overlay => {
              const d: Draft = new Draft({warps: max_warps*layers, wefts: max_wefts*layers});
              d.fill(pattern, "original");
  
              overlay[0].pattern.forEach((row, ndx) => {
                const layer_id:number = ndx % layers;
                row.forEach((c, j) => {
                  d.pattern[ndx][j*layers+layer_id].setHeddle(c.getHeddle());
                });
              });

              console.log("returning ", d)
              return [d];
            });
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
      perform: (inputs: Array<Draft>, input_params: Array<number>) => {

        const outputs:Array<Draft> = inputs.map(input => {
          const width: number = input_params[0]*input.warps;
          const height: number = input_params[1]*input.wefts;

          const d: Draft = new Draft({warps: width, wefts: height});
          d.fill(input.pattern, 'original');
          return d;
        });

        return Promise.resolve(outputs);
      }
          
    }

    const jointop: Operation = {
      name: 'join top',
      dx: 'attaches inputs toether into one draft in a column orientation',
      params: [],
      max_inputs: 100, 
      perform: (inputs: Array<Draft>, input_params: Array<number>) => {
          
        const total:number = inputs.reduce((acc, draft)=>{
            return acc + draft.wefts;
        }, 0);

        const max_warps:number = utilInstance.getMaxWarps(inputs);
        
        const combined: {d: Draft, n: number} = inputs.reduce((acc, input, ndx) => {

          input.pattern.forEach((row, i) => {
            row.forEach((cell, j) => {
              acc.d.pattern[acc.n + i][j].setHeddle(cell.getHeddle());
            });
          });

          acc.n = input.pattern.length;
          return acc;

        }, {d: new Draft({warps: max_warps, wefts: total}), n: 0});


        return Promise.resolve([combined.d]);
        
      }
    }


    const joinleft: Operation = {
      name: 'join left',
      dx: 'attaches inputs toether into one draft with each iniput side by side',
      params: [],
      max_inputs: 100, 
      perform: (inputs: Array<Draft>, input_params: Array<number>) => {
          
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
            
          
            combined_rows.forEach((cell,j) => {
              d.pattern[i][j].setHeddle(cell.getHeddle());
            });
        }
             
        outputs.push(d);
        return Promise.resolve(outputs);
        ;
      }
    }

    const germanify: Operation = {
      name: 'gemanify',
      dx: 'uses ML to edit the input based on patterns in a german drafts weave set',
      params: [
        {name: 'output selection',
        min: 1,
        max: 10,
        value: 1,
        dx: 'which pattern to select from the variations'
        }
      ],
      max_inputs: 1,
      perform: (inputs: Array<Draft>, input_params: Array<number>) => {
        if(inputs.length === 0) return Promise.resolve([]);
        const inputDraft = inputs[0]

        const loom:Loom = new Loom(inputDraft, 8, 10);
        loom.recomputeLoom(inputDraft);
        let pattern = this.pfs.computePatterns(loom.threading, loom.treadling, inputDraft.pattern);
        const draft_seed =  utilInstance.patternToSize(pattern, 48, 48);

  
        return this.vae.generateFromSeed(draft_seed, 'german')
          .then(suggestions => suggestions.map(suggestion => {
                  const treadlingSuggest = this.pfs.getTreadlingFromArr(suggestion);
                  const threadingSuggest = this.pfs.getThreadingFromArr(suggestion);
                  const pattern = this.pfs.computePatterns(threadingSuggest, treadlingSuggest, suggestion)
                  const draft:Draft = new Draft({warps: pattern[0].length, wefts: pattern.length});
                    for (var i = 0; i < pattern.length; i++) {
                      for (var j = 0; j < pattern[i].length; j++) {
                          draft.pattern[i][j].setHeddle((pattern[i][j] == 1 ? true : false));
                      }
                    }
                  return draft
                
                })
              )
        }
      }  
      const crackleify: Operation = {
        name: 'crackle-ify',
        dx: 'uses ML to edit the input based on patterns in a german drafts weave set',
        params: [
          {name: 'output selection',
          min: 1,
          max: 10,
          value: 1,
          dx: 'which pattern to select from the variations'
          }
        ],
        max_inputs: 1,
        perform: (inputs: Array<Draft>, input_params: Array<number>) => {
          if(inputs.length === 0) return Promise.resolve([]);
          const inputDraft = inputs[0]

          const loom:Loom = new Loom(inputDraft, 8, 10);
          loom.recomputeLoom(inputDraft);
          let pattern = this.pfs.computePatterns(loom.threading, loom.treadling, inputDraft.pattern);
        
          const draft_seed =  utilInstance.patternToSize(pattern, 52, 52);
    
          return this.vae.generateFromSeed(draft_seed, 'crackle_weave')
            .then(suggestions => suggestions.map(suggestion => {
                    const treadlingSuggest = this.pfs.getTreadlingFromArr(suggestion);
                    const threadingSuggest = this.pfs.getThreadingFromArr(suggestion);
                    const pattern = this.pfs.computePatterns(threadingSuggest, treadlingSuggest, suggestion)
                    const draft:Draft = new Draft({warps: pattern[0].length, wefts: pattern.length});
                      for (var i = 0; i < pattern.length; i++) {
                        for (var j = 0; j < pattern[i].length; j++) {
                            draft.pattern[i][j].setHeddle((pattern[i][j] == 1 ? true : false));
                        }
                      }
                    return draft
                  
                  })
                )
          }
        }  
        
        
        const makeloom: Operation = {
          name: 'floor loom',
          dx: 'uses the input draft as drawdown and generates a threading, tieup and treadling pattern',
          params: [

          ],
          max_inputs: 1,
          perform: (inputs: Array<Draft>, input_params: Array<number>) => {
            if(inputs.length === 0) return Promise.resolve([]);
            
            const l:Loom = new Loom(inputs[0], 8, 10);
            l.recomputeLoom(inputs[0]);

            const threading: Draft = new Draft({warps: inputs[0].warps, wefts: l.num_frames});
            threading.name = "threading_"+inputs[0].name;

            l.threading.forEach((frame, j) =>{
              if(frame !== -1) threading.pattern[frame][j].setHeddle(true);
            });

            const treadling: Draft = new Draft({warps:l.num_treadles, wefts: inputs[0].wefts});
            console.log(treadling);
            l.treadling.forEach((treadle_num, i) =>{
              if(treadle_num !== -1) treadling.pattern[i][treadle_num].setHeddle(true);
            });
            treadling.name = "treadling_"+inputs[0].name;

            const tieup: Draft = new Draft({warps: l.num_treadles, wefts: l.num_frames});
            l.tieup.forEach((row, i) => {
              row.forEach((val, j) => {
                tieup.pattern[i][j].setHeddle(val);
              })
            });
            tieup.name = "tieup_"+inputs[0].name;


            return Promise.resolve([threading, tieup, treadling]);

            }


            

          } 
          
          const drawdown: Operation = {
            name: 'drawdown',
            dx: 'create a drawdown from the input drafts (order 1. threading, 2. tieup, 3.treadling)',
            params: [
  
            ],
            max_inputs: 3,
            perform: (inputs: Array<Draft>, input_params: Array<number>) => {
              if(inputs.length < 3) return Promise.resolve([]);

              
              const threading: Array<number> = [];
              for(let j = 0; j < inputs[0].warps; j++){
                const col: Array<Cell> =  inputs[0].pattern.reduce((acc, row, ndx) => {
                  acc[ndx] = row[j];
                  return acc;
                }, []);

                threading[j] = col.findIndex(cell => cell.getHeddle());

              }
            
              const treadling: Array<number> = inputs[2].pattern
              .map(row => row.findIndex(cell => cell.getHeddle()));

              const tieup = inputs[1].pattern.map(row => {
                return row.map(cell => cell.getHeddle());
              });

              const drawdown: Draft = new Draft({warps: inputs[0].warps, wefts: inputs[2].wefts});
              drawdown.recalculateDraft(tieup, treadling, threading);
              return Promise.resolve([drawdown]);
  
              }
  
  
  
            }
    


    //**push operatiinos to the array here */
    this.ops.push(rect);
    this.ops.push(twill);
    this.ops.push(satin);
    this.ops.push(tabby);
    this.ops.push(basket);
    this.ops.push(rib);
    this.ops.push(random);
    this.ops.push(interlace);
    this.ops.push(invert);
   this.ops.push(replicate);
    this.ops.push(flipx);
    this.ops.push(flipy);
    this.ops.push(shiftx);
    this.ops.push(shifty);
    this.ops.push(layer);
    this.ops.push(selvedge);
    this.ops.push(bindweftfloats);
    this.ops.push(bindwarpfloats);
    this.ops.push(joinleft);
    this.ops.push(jointop);
    this.ops.push(slope);
    this.ops.push(tile);
    this.ops.push(stretch);
    this.ops.push(resize);
    this.ops.push(margin);
    this.ops.push(clear);
    this.ops.push(set);
    this.ops.push(unset);
    this.ops.push(rotate);
    this.ops.push(fill);
    this.ops.push(overlay);
    this.ops.push(atop);
    this.ops.push(mask);
    this.ops.push(germanify);
    this.ops.push(crackleify);
    this.ops.push(variants);
    this.ops.push(knockout);
    this.ops.push(crop);
    this.ops.push(makeloom);
    this.ops.push(drawdown);


    //** Give it a classification here */

    this.classification.push(
      {category: 'structure',
      dx: "0-1 inputs, 1 output, algorithmically generates weave structures based on parameters",
      ops: [tabby, twill, satin, basket, rib, random]}
    );

    this.classification.push(
      {category: 'block design',
      dx: "1 input, 1 output, describes the arragements of regions in a weave. Fills region with input draft",
      ops: [rect, crop, margin, tile]
    }
    );
    this.classification.push(
      {category: 'transformations',
      dx: "1 input, 1 output, applies an operation to the input that transforms it in some way",
      ops: [invert, flipx, flipy, shiftx, shifty, rotate, slope, stretch, resize, margin, crop, clear, set, unset]}
      );

    this.classification.push(
        {category: 'combine',
        dx: "2+ inputs, 1 output, operations take more than one input and integrate them into a single draft in some way",
        ops: [interlace, layer, joinleft, jointop]}
  //      ops: [interlace, layer, tile, joinleft, jointop, selvedge, atop, overlay, mask, knockout, bindweftfloats, bindwarpfloats]}
        );
    
     this.classification.push(
          {category: 'binary',
          dx: "2 inputs, 1 output, operations take two inputs and perform binary operations on the interlacements",
          ops: [atop, overlay, mask, knockout]}
          );
    
      this.classification.push(
            {category: 'helper',
            dx: "variable inputs, variable outputs, supports common drafting requirements to ensure good woven structure",
            ops: [selvedge, variants]}
            );


      this.classification.push(
        {category: 'machine learning',
        dx: "1 input, 1 output, experimental functions that attempt to apply a style from one genre of weaving to your draft. Currently, we have trained models on German Weave Drafts and Crackle Weave Drafts ",
        ops: [germanify, crackleify]}
      );


    this.classification.push(
      {category: 'frame loom support',
      dx: "variable inputs, variable outputs, offer specific supports for working with frame looms",
      ops: [makeloom, drawdown]}
    );

  }


  getOp(name: string): Operation{
    const ndx: number = this.ops.findIndex(el => el.name === name);
    return this.ops[ndx];
  }
}
