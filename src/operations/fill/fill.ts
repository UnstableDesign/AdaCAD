import { initDraftFromDrawdown, createCell, getHeddle, wefts, warps, updateWeftSystemsAndShuttles, updateWarpSystemsAndShuttles } from "../../draft";
import { Sequence } from "../../sequence";
import { getAllDraftsAtInlet, parseDraftNames } from "../../operations";
import { OperationParam, OperationInlet, OpParamVal, OpInput, Operation, OpMeta } from "../types";
import { clothOp } from "../categories";

const name = "fill";

const meta: OpMeta = {
  displayname: 'fill',
  desc: 'Fills black cells of the first input, “pattern,” with the draft specified by the second input, and the white cells with draft specified by the third input.',
  img: 'fill.png',
  categories: [clothOp],
  advanced: true
}


//PARAMS

const params: Array<OperationParam> = [];

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


const perform = (op_params: Array<OpParamVal>, op_inputs: Array<OpInput>) => {

  const to_fills = getAllDraftsAtInlet(op_inputs, 0);
  const black_cells = getAllDraftsAtInlet(op_inputs, 1);
  const white_cells = getAllDraftsAtInlet(op_inputs, 2);


  if (to_fills.length == 0) return Promise.resolve([]);

  const black_cell = (black_cells.length == 0) ? initDraftFromDrawdown([[createCell(true)]]) : black_cells[0];

  const white_cell = (white_cells.length == 0) ? initDraftFromDrawdown([[createCell(false)]]) : white_cells[0];



  const to_fill = to_fills[0];
  const pattern = new Sequence.TwoD();

  to_fill.drawdown.forEach((row, i) => {
    const seq = new Sequence.OneD();
    row.forEach((cell, j) => {

      if (cell.is_set) {
        if (cell.is_up) {
          seq.push(
            getHeddle(
              black_cell.drawdown,
              i % wefts(black_cell.drawdown),
              j % warps(black_cell.drawdown))
          );
        } else {
          seq.push(
            getHeddle(
              white_cell.drawdown,
              i % wefts(white_cell.drawdown),
              j % warps(white_cell.drawdown))
          );
        }
      } else {
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

const generateName = (param_vals: Array<OpParamVal>, op_inputs: Array<OpInput>): string => {
  const drafts = getAllDraftsAtInlet(op_inputs, 0);
  return 'fill(' + parseDraftNames(drafts) + ")";
}


export const fill: Operation = { name, meta, params, inlets, perform, generateName };