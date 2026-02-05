import { initDraftFromDrawdown } from "../../draft";
import { Sequence } from "../../sequence";
import { getOpParamValById, flattenParamVals } from "../../operations";
import { NumParam, OperationInlet, OpParamVal, Operation, OpMeta } from "../types";
import { structureOp } from "../categories";
import { defaults } from "../../utils";



const name = "glitchsatin";
const meta: OpMeta = {
  displayname: 'glitch satin',
  desc: 'This experimental function was designed to algorithmically generate structures that resemble satins that include non-repeating units.',
  img: 'glitchsatin.png',
  advanced: true,
  authors: ['Deanna Gelosi', 'Kathryn Walters'],
  categories: [structureOp]
}


//PARAMS
const ends: NumParam =
{
  name: 'ends',
  type: 'number',
  min: 1,
  max: 1000000,
  value: 40,
  dx: ""
};

const pics: NumParam =
{
  name: 'pics',
  type: 'number',
  min: 1,
  max: 100000,
  value: 40,
  dx: ""
}

const odds_min: NumParam =
{
  name: 'min float length',
  type: 'number',
  min: 1,
  max: 100000,
  value: 2,
  dx: 'average float length'
};

const odds_max: NumParam =
{
  name: 'max float length',
  type: 'number',
  min: 1,
  max: 100000,
  value: 24,
  dx: 'max float length'
};

const frequency: NumParam =
{
  name: 'float length frequency',
  type: 'number',
  min: 1,
  max: 5000,
  value: 50,
  dx: 'float length frequency'
};

const params = [ends, pics, odds_min, odds_max, frequency];

//INLETS
const inlets: Array<OperationInlet> = [];

const perform = (param_vals: Array<OpParamVal>) => {
  const cols: number = <number>getOpParamValById(0, param_vals);
  const rows: number = <number>getOpParamValById(1, param_vals);
  const odds_min: number = <number>getOpParamValById(2, param_vals);
  const odds_max: number = <number>getOpParamValById(3, param_vals);
  const frequency: number = <number>getOpParamValById(4, param_vals);

  // make the grid
  let grid: boolean[][] = [];
  for (let i = 0; i < cols; i++) {
    grid[i] = [];
    for (let j = 0; j < rows; j++) {
      grid[i][j] = false;
    }
  }

  // glitch satin functions
  grid = printDraftForVerticalDirection(grid, odds_min, odds_max, frequency);
  grid = fillHorizontalGaps(grid, odds_min, odds_max, frequency);

  // make drawdown
  const seq_grid = new Sequence.TwoD();
  for (let i = 0; i < rows; i++) {
    const row_1 = grid[i].map(el => {
      if (el == false)
        return 0
      else
        return 1;
    })

    const seq = new Sequence.OneD().pushRow(row_1);
    seq_grid.pushWeftSequence(seq.val())
  }

  const draft = initDraftFromDrawdown(seq_grid.export());

  return Promise.resolve([{ draft }]);
}

const generateName = (param_vals: Array<OpParamVal>): string => {
  return 'glitchsatin(' + flattenParamVals(param_vals) + ")";
}

const sizeCheck = (param_vals: Array<OpParamVal>): boolean => {
  const cols: number = <number>getOpParamValById(0, param_vals);
  const rows: number = <number>getOpParamValById(1, param_vals);
  return (cols * rows <= defaults.max_area) ? true : false;
}

export const glitchsatin: Operation = { name, meta, params, inlets, perform, generateName, sizeCheck };

function printDraftForVerticalDirection(grid: Array<Array<boolean>>, odds_denom_min: number, odds_denom_max: number, frequency: number): Array<Array<boolean>> {
  const cols = grid.length;
  const rows = grid[0].length;
  const odds_step = (odds_denom_max - odds_denom_min) / cols;
  const new_freq = remap(frequency, cols);

  for (let x = 0; x < cols; x++) {
    let y = 0;
    let currentFilledV = (Math.random() < 0.5);  // Initialize randomly
    const odds = 1 / (odds_denom_min + odds_step * new_freq); // change new_freq to x for gradient 
    const maxStreak = Math.round(1 / odds);

    while (y < rows) {
      const streakV = Math.floor(Math.random() * maxStreak) + 1;
      for (let i = 0; i < streakV && y < rows; i++) {
        grid[x][y] = currentFilledV;
        y++;
      }
      currentFilledV = !currentFilledV;
    }
  }

  return grid;
}

function fillHorizontalGaps(grid: Array<Array<boolean>>, odds_denom_min: number, odds_denom_max: number, frequency: number): Array<Array<boolean>> {
  const cols = grid.length;
  const rows = grid[0].length;
  const odds_step = (odds_denom_max - odds_denom_min) / cols;
  const new_freq = remap(frequency, cols);

  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const odds = 1 / (odds_denom_min + odds_step * new_freq); // change new_freq to x for gradient 
      if (!grid[x][y]) {
        const fillType = Math.random() < odds;
        grid[x][y] = fillType;
      }
    }
  }

  return grid;
}

function remap(num: number, cols: number): number {
  const oldMin = 1;
  const oldMax = 100;
  const newMin = 0;
  const newMax = cols - 1;

  return ((num - oldMin) / (oldMax - oldMin)) * (newMax - newMin) + newMin;
}



//version with single odds
// const  perform = (param_vals: Array<OpParamVal>, op_inputs: Array<OpInput>) => {


//     const cols: number = getOpParamValById(0, param_vals);
//     const rows: number = getOpParamValById(1, param_vals);;
//     const odds: number = getOpParamValById(2, param_vals);

//     let grid_1 = [];
//     let grid_2 = [];

//     for (let i = 0; i < cols; i++) {
//       grid_1[i] = [];
//       grid_2[i] = [];
//       for (let j = 0; j < rows; j++) {
//         grid_1[i][j] = false;
//         grid_2[i][j] = false;
//       }
//     }

//     grid_1  = printDraftForVerticalDirection(cols, rows, grid_1, odds);
//     grid_1 =  fillHorizontalGaps(cols, rows, grid_1, odds);


//     grid_2  = printDraftForVerticalDirection(cols, rows, grid_2, odds/2);
//     grid_2 =  fillHorizontalGaps(cols, rows, grid_2, odds/2);



//     let seq_grid = new Sequence.TwoD();

//     for (let i = 0; i < rows; i++) {

//       let row_1 = grid_1[i].map(el => {
//           if(el == false)
//           return 0
//           else
//           return 1;
//       })

//       let row_2 = grid_2[i].map(el => {
//           if(el == false)
//           return 0
//           else
//           return 1;
//       })

//       let seq = new Sequence.OneD().pushRow(row_1).pushRow(row_2);
//       seq_grid.pushWeftSequence(seq.val())


//     }

//     let draft = initDraftFromDrawdown(seq_grid.export());


//   //   let drawdown: Array<Array<Cell>> = [];
//   //   for (let i = 0; i < cols; i++) {
//   //     drawdown[i] = [];
//   //     for (let j = 0; j < rows; j++) {
//   //       drawdown[i][j] = createCell(grid[i][j]);
//   //     }
//   //   }


//   //   let draft = initDraftFromDrawdown(drawdown);


//     return Promise.resolve([draft]);

// }   

