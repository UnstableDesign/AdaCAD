import { createCell } from "../../model/cell";
import { Operation, OperationInlet, OpInput, OpParamVal } from "../../model/datatypes";
import { getHeddle, initDraftFromDrawdown, updateWarpSystemsAndShuttles, updateWeftSystemsAndShuttles, warps, wefts } from "../../model/drafts";
import { getAllDraftsAtInlet, parseDraftNames } from "../../model/operations";
import { Sequence } from "../../model/sequence";


const name = "fill";
const old_names = [];

//PARAMS

const params = [];

//INLETS

const pattern: OperationInlet = {
    name: 'pattern', 
    type: 'static',
    value: null,
    uses: "draft",
    dx: 'a draft you would like to fill',
    num_drafts: 1
  }


const black_cells: OperationInlet = {
    name: 'black cell structure', 
    type: 'static',
    value: null,
    uses: "draft",
    dx: 'the structure you would like to repeat in in the black regions of the base draft',
    num_drafts: 1
  }

  const white_cells: OperationInlet = {
    name: 'white cell structure', 
    type: 'static',
    value: null,
    uses: "draft",
    dx: 'the structure you would like to repeat in in the white regions of the base draft',
    num_drafts: 1
  }

  const inlets = [pattern, black_cells, white_cells];


const  perform = (op_params: Array<OpParamVal>, op_inputs: Array<OpInput>) => {

  let to_fills = getAllDraftsAtInlet(op_inputs, 0);
  let black_cells = getAllDraftsAtInlet(op_inputs, 1);
  let white_cells = getAllDraftsAtInlet(op_inputs, 2);

  
  if(to_fills.length == 0) return Promise.resolve([]);

  let black_cell = (black_cells.length == 0) ? initDraftFromDrawdown([[createCell(true)]]) : black_cells[0];

  let white_cell = (white_cells.length == 0) ? initDraftFromDrawdown([[createCell(false)]]) : white_cells[0];



    let to_fill = to_fills[0];
    let pattern = new Sequence.TwoD();

    to_fill.drawdown.forEach((row, i) =>{
        let seq = new Sequence.OneD();
        row.forEach((cell, j) => {

            if(cell.is_set){
                if(cell.is_up){
                    seq.push(
                        getHeddle(
                            black_cell.drawdown, 
                            i%wefts(black_cell.drawdown), 
                            j%warps(black_cell.drawdown))
                        );
                }else{
                    seq.push(
                        getHeddle(
                            white_cell.drawdown, 
                            i%wefts(white_cell.drawdown), 
                            j%warps(white_cell.drawdown))
                        );
                }
            }else{
                seq.push(2);
            }
        })
        pattern.pushWeftSequence(seq.val());
    })


  let d = initDraftFromDrawdown(pattern.export())
  d = updateWeftSystemsAndShuttles(d, to_fill);
  d = updateWarpSystemsAndShuttles(d, to_fill);

  return Promise.resolve([d]);
}   

const generateName = (param_vals: Array<OpParamVal>, op_inputs: Array<OpInput>) : string => {
  let drafts = getAllDraftsAtInlet(op_inputs, 0);
  return 'fill('+parseDraftNames(drafts)+")";
}


export const fill: Operation = {name, old_names, params, inlets, perform, generateName};