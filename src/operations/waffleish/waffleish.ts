import { Draft, Cell, createCell, getCellValue, setCellValue, initDraftWithParams } from "../../draft";
import { getOpParamValById } from "../../operations";
import { structureOp } from "../categories";
import { NumParam, OperationInlet, OpParamVal, Operation, OpMeta } from "../types";


const name = "waffleish";

const meta: OpMeta = {
  displayname: 'waffle-ish',
  desc: 'Waffle weave is a twill-based structure in which warp and weft floats of increasing and then decreasing lengths are bound by a border of tabby interlacements to create a grid of cells. Waffle-ish was a first attempt at making waffles that failed, but in the process, made some interesting results. Use waffle if you would like the correct version. This attempts to fit a diamond shape within the ends/pics specified and to knock out values within the central diamond to create binding rows. ',
  img: 'waffleish.png',
  categories: [structureOp],
  advanced: true
}



//PARAMS
const ends: NumParam =
{
  name: 'ends',
  type: 'number',
  min: 1,
  max: 100,
  value: 8,
  dx: ""
}

const pics: NumParam =
{
  name: 'pics',
  type: 'number',
  min: 1,
  max: 100,
  value: 8,
  dx: ''
}

const border: NumParam =
{
  name: 'interlacement borders',
  type: 'number',
  min: 0,
  max: 100,
  value: 1,
  dx: 'builds tabby around the edges of the central diamond, creating some strange patterns'
}


const params = [ends, pics, border];

//INLETS

const inlets: Array<OperationInlet> = [];


const perform = (param_vals: Array<OpParamVal>) => {

  const width: number = <number>getOpParamValById(0, param_vals);
  const height: number = <number>getOpParamValById(1, param_vals);
  const bindings: number = <number>getOpParamValById(2, param_vals);

  const outputs: Array<Draft> = [];

  const pattern: Array<Array<Cell>> = [];
  const mid_warp: number = Math.floor(width / 2);  //for 5 this is 2
  const mid_weft: number = Math.floor(height / 2); //for 5 this is 2
  const warps_to_wefts_ratio = mid_warp / mid_weft;

  //first create the diamond
  for (let i = 0; i < height; i++) {
    pattern.push([]);
    const row_offset = (i > mid_weft) ? height - i : i;
    for (let j = 0; j < width; j++) {
      if (j >= mid_warp - row_offset * warps_to_wefts_ratio && j <= mid_warp + row_offset * warps_to_wefts_ratio) pattern[i][j] = createCell(true);
      else pattern[i][j] = createCell(false);
    }
  }

  //carve out the tabby
  if (bindings > 0) {
    const tabby_range_size = bindings * 2 + 1;
    for (let i = 0; i < height; i++) {
      const row_offset = (i > mid_weft) ? height - i : i;
      const range_size = Math.floor((mid_warp + row_offset * warps_to_wefts_ratio) - (mid_warp - row_offset * warps_to_wefts_ratio)) + 1;

      //figure out how many bindings we're dealing with here - alterlate to the inside and outside of the diamong
      for (let b = 1; b <= bindings; b++) {
        const inside = (b % 2 == 1) ? true : false;
        if (inside) {
          const increment = Math.floor(b + 1 / 2)
          const diff = Math.ceil((range_size - tabby_range_size) / 2);
          const left_j = mid_warp - (diff * increment);
          const right_j = mid_warp + (diff * increment);
          if (left_j > 0 && left_j < width) pattern[i][left_j].is_set = false;
          if (right_j > 0 && right_j < width) pattern[i][right_j].is_set = (false);
        } else {
          const increment = Math.floor(b / 2);
          const left_j = (mid_warp - Math.floor((range_size - 1) / 2)) - (increment * 2);
          const right_j = (mid_warp + Math.floor((range_size - 1) / 2)) + (increment * 2);
          if (left_j > 0 && left_j < width) pattern[i][left_j].is_set = (true);
          if (right_j > 0 && right_j < width) pattern[i][right_j].is_set = (true);
        }

      }

    }
  }

  pattern.forEach(row => {
    row.forEach(cell => {
      if (getCellValue(cell) == null) cell = setCellValue(cell, false);
    })
  })

  const draft = initDraftWithParams({ warps: width, wefts: height, drawdown: pattern })
  return Promise.resolve([{ draft }]);

}


const generateName = (): string => {
  return 'waffleish';
}


export const waffleish: Operation = { name, meta, params, inlets, perform, generateName };



