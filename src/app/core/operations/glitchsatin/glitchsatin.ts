import { Cell, NumParam, Operation, OpInput, OpParamVal } from "../../model/datatypes";
import { initDraftFromDrawdown } from "../../model/drafts";
import { getOpParamValById } from "../../model/operations";
import { Sequence } from "../../model/sequence";


const name = "glitchsatin";
const old_names = [];

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
  name: 'average float length',
  type: 'number',
  min: 1,
  max: 100000,
  value: 2,
  dx: 'average float length'
};


const odds_max: NumParam =
{
  name: 'average float length',
  type: 'number',
  min: 1,
  max: 100000,
  value: 24,
  dx: 'average float length'
};

const params = [ends, pics, odds_min, odds_max];

//INLETS
const inlets = [];

const perform = (param_vals: Array<OpParamVal>, op_inputs: Array<OpInput>) => {
  const cols: number = getOpParamValById(0, param_vals);
  const rows: number = getOpParamValById(1, param_vals);;
  const odds_min: number = getOpParamValById(2, param_vals);
  const odds_max: number = getOpParamValById(3, param_vals);

  // make the grid
  let grid = [];
  for (let i = 0; i < cols; i++) {
    grid[i] = [];
    for (let j = 0; j < rows; j++) {
      grid[i][j] = false;
    }
  }

  // glitch satin functions
  grid = printDraftForVerticalDirection(cols, rows, grid, odds_min, odds_max);
  grid = fillHorizontalGaps(cols, rows, grid, odds_min, odds_max);

  // make drawdown
  let seq_grid = new Sequence.TwoD();
  for (let i = 0; i < rows; i++) {
    let row_1 = grid[i].map(el => {
      if (el == false)
        return 0
      else
        return 1;
    })

    let seq = new Sequence.OneD().pushRow(row_1);
    seq_grid.pushWeftSequence(seq.val())
  }

  let draft = initDraftFromDrawdown(seq_grid.export());

  return Promise.resolve([draft]);
}

const generateName = (param_vals: Array<OpParamVal>, op_inputs: Array<OpInput>): string => {
  const floatlength: number = getOpParamValById(2, param_vals);

  return 'gsatin' + floatlength;
}

export const glitchsatin: Operation = { name, old_names, params, inlets, perform, generateName };

function printDraftForVerticalDirection(cols: number, rows: number, grid: Array<Array<boolean>>, odds_denom_min: number, odds_denom_max: number): Array<Array<boolean>> {
  let odds_step = (odds_denom_max - odds_denom_min) / cols;

  for (let x = 0; x < cols; x++) {
    let y = 0;
    let currentFilledV = (Math.random() < 0.5);  // Initialize randomly
    let odds = 1 / (odds_denom_min + odds_step * x);
    let maxStreak = Math.round(1 / odds);

    while (y < rows) {
      let streakV = Math.floor(Math.random() * maxStreak) + 1;
      for (let i = 0; i < streakV && y < rows; i++) {
        grid[x][y] = currentFilledV;
        y++;
      }
      currentFilledV = !currentFilledV;
    }
  }

  return grid;
}

function fillHorizontalGaps(cols: number, rows: number, grid: Array<Array<boolean>>, odds_denom_min: number, odds_denom_max: number): Array<Array<boolean>> {
  let odds_step = (odds_denom_max - odds_denom_min) / cols;

  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      let odds = 1 / (odds_denom_min + odds_step * x);
      if (!grid[x][y]) {
        let fillType = Math.random() < odds;
        grid[x][y] = fillType;
      }
    }
  }

  return grid;
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

