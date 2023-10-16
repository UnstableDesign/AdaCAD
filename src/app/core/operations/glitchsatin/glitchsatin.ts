import { createCell } from "../../model/cell";
import { Cell, NumParam, Operation, OpInput, OpParamVal } from "../../model/datatypes";
import { initDraftFromDrawdown } from "../../model/drafts";
import { getOpParamValById } from "../../model/operations";
import { Sequence } from "../../model/sequence";


const name = "glitchsatin";
const old_names = [];




//PARAMS

// ends - 480
// pics - 480
// odds - 




const ends:NumParam =  
    {name: 'ends',
    type: 'number',
    min: 1,
    max: 1000000,
    value: 40,
    dx: ""
};

const pics: NumParam = 
    {name: 'pics',
    type: 'number',
    min: 1,
    max: 100000,
    value: 40,
    dx:""
}

const odds: NumParam = 
    {name: 'average float length',
    type: 'number',
    min: 1,
    max: 100000,
    value: 2,
    dx: 'average float length'
    };


const params = [ends, pics, odds];

//INLETS

const inlets = [];


const  perform = (param_vals: Array<OpParamVal>, op_inputs: Array<OpInput>) => {


      const cols: number = getOpParamValById(0, param_vals);
      const rows: number = getOpParamValById(1, param_vals);;
      const odds: number = getOpParamValById(2, param_vals);
     
      let grid = [];
      for (let i = 0; i < cols; i++) {
        grid[i] = [];
        for (let j = 0; j < rows; j++) {
          grid[i][j] = false;
        }
      }

      grid  = printDraftForVerticalDirection(cols, rows, grid, odds);
      grid =  fillHorizontalGaps(cols, rows, grid, odds);


      let drawdown: Array<Array<Cell>> = [];
      for (let i = 0; i < cols; i++) {
        drawdown[i] = [];
        for (let j = 0; j < rows; j++) {
          drawdown[i][j] = createCell(grid[i][j]);
        }
      }

 
      let draft = initDraftFromDrawdown(drawdown);


      return Promise.resolve([draft]);

  }   


const generateName = (param_vals: Array<OpParamVal>, op_inputs: Array<OpInput>) : string => {
    const floatlength: number = getOpParamValById(2, param_vals);

  return 'gsatin'+floatlength;
}


export const glitchsatin: Operation = {name, old_names, params, inlets, perform, generateName};



function printDraftForVerticalDirection(cols: number, rows: number, grid: Array<Array<boolean>>, odds_denom: number) : Array<Array<boolean>>{

  for (let x = 0; x < cols; x++) {
    let y = 0;
    let currentFilledV = (Math.random() < 0.5);  // Initialize randomly


      let odds = 1/odds_denom;
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


function fillHorizontalGaps(cols: number, rows: number, grid: Array<Array<boolean>>, odds_denom:number) : Array<Array<boolean>> {
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        if (!grid[x][y]) {
          let  fillType = Math.random() < 1/odds_denom;
          grid[x][y] = fillType;
        }
      }
    }

    return grid;
  }