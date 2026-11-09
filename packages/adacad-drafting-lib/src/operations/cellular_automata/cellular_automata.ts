//TODO: check and resolve unecessary dependencies at the end - for now, just import the ones listed in the sample operation documentation
import { initDraftFromDrawdown, wefts, warps, createCell, Drawdown, getCellValue } from "../../draft";
import { getOpParamValById, getInputDraft, flattenParamVals} from "../../operations";
import { transformationOp } from "../categories";
import { OperationParam, OperationInlet, OpParamVal, OpInput, Operation, OpMeta, NumParam, SelectParam, StringParam } from "../types";


const name = "cellular_automata";

enum wrap_mode {
    wrap,
    live,
    dead
};

const meta: OpMeta = {
  displayname: 'cellular automata', 
  advanced: true, 
  categories: [transformationOp], 
  desc: "Alters a draft by applying a cellular automata rule each time-step.", 
  authors: ['Gabrielle Partch', 'Deanna Gelosi'] 
}

// DEFINE PARAMETERS
const timestep:NumParam = {
    name: 'timestep',
    type: 'number',
    min: 0,
    max: 20, // TODO: test to find a realistic max value later - for now use 20 as a placeholder
    value: 1,
    dx: "the number of times the cellular automata rule is applied. Each iteration is applied to the previous automata state."
}

// TODO: ask about the hardcoded increment step of 1 in parameter.component.html - projects\ui\src\app\mixer\palette\operation\parameter\parameter.component.html
// const increment:NumParam = {
//     name: 'timestep increment',
//     type: 'number',
//     min: 1,
//     max: 100, // TODO: test to find a realistic max value later - for now use 100 as a placeholder
//     value: 1,
//     dx: "the increment that the timestep will increase or decrease by. Alternively, you can enter an exact timestep value."
// }

//TODO: figure out how to do the conditional part for the custom dropdown setting. For now, just use the custom text box and enter a wolfram code directly
// const ruleset:SelectParam = {
//     name: 'ruleset',
//     type: 'select',
//     selectlist: [
//         { name: "Conway's Game of Life", value: 0 }, //B3/S23
//         { name: '34 Life', value: 1 }, //B34/S34
//         { name: 'Amoeba', value: 2 }, //B357/S1358
//         { name: 'Life Without Death', value: 3 }, //B12345678/S3
//         { name: 'custom', value: 4 }
//     ],
//     value: 0,
//     dx: "the rule that determines how the next generation is calculated at each timestep."
// }

const wrapping:SelectParam = {
    name: 'ruleset',
    type: 'select',
    selectlist: [
        { name: 'wrapped', value: 0 },
        { name: 'fixed live', value: 1 }, 
        { name: 'fixed dead', value: 2 }
    ],
    value: 0,
    dx: "determines what value is used for cells that are outside the draft, the edge-cases, when calculating an iteration."
}

const custom_ruleset:StringParam =
{
  name: 'custom',
  type: 'string',
  regex: /^B[0-8]*\/S[0-8]*$/i,
  value: 'B3/S23',
  error: 'rules must be in wolfram code format',
  dx: 'define a custom ruleset' //TODO: come up with better description later
};

const params: Array<OperationParam> = [timestep, wrapping, custom_ruleset];

// DEFINE INLETS
const draft_inlet: OperationInlet = {
  name: 'input draft',  //a name to display on this inlet
  type: 'static',       //pre-defined inlets will always be 'static'.
  value: null,          //if you need to access a value or identifier with this inlet, specify that here, will mostly be null
  uses: "draft",       //describes what element of the draft this operation will use. Some operations only use materials information
  dx: 'the draft you would like to transform', //a description to display on this inlet
  num_drafts: 1 // the maximum number of drafts this inlet can accept. Use -1 for no limit
}

const inlets = [draft_inlet]; //push all the parameters to an array called params.


// Parses the ruleset and returns the corresponding lookup tables to check against when calculating the next generation
const parseRule = (rulestring: string): { born: Uint8Array; survive: Uint8Array } => {
    // Capture the string of born numbers and the string of survive numbers, returning null if there are no born/survive numbers to be found
    const match = /^B([0-8]*)\/S([0-8]*)$/i.exec(rulestring);
    if (!match) throw new Error(`Invalid rulestring: ${rulestring}`);

    // Create a quick lookup table for born/survive cell numbers with 9 values (not 8 to account for zero born/survive numbers as well)
    const born: Uint8Array = new Uint8Array(9)
    const survive: Uint8Array = new Uint8Array(9)

    // Set the corresponding indices of born/survive array values that are listed in the rule to true (using the value 1 for true, slightly more efficient than a bool array supposedly)
    for(const digit of match[1]) {
        born[Number(digit)] = 1;
    }
    for(const digit of match[2]) {
        survive[Number(digit)] = 1;
    }

    return {born, survive};
}

/**
 * Handles drawdown edge-condition checking and resolution for retrieving cell values. 
 * @param current_state the current state of the drawdown
 * @param i_idx the primary index of the cell at the center of the neighborhood
 * @param j_idx the secondary index of the cell at the center of the neighborhood
 * @param mode the wrapping mode for edge-case cells
 * @returns the value of a cell after wrapping rules have been applied
 */
const wrapGetCellValue = (current_state: Drawdown, i_idx: number, j_idx: number, mode: wrap_mode): 0 | 1 => {
    // TODO: consider whether or not to retrieve these once inside nextGeneration and pass them down instead of retrieving once for every cell
    const height = wefts(current_state);
    const width = warps(current_state);
    const isOutside = i_idx < 0 || i_idx >= height || j_idx < 0 || j_idx >= width;

    if (isOutside) {
        switch (mode) {
        case wrap_mode.live:
            // All 'cells' outside the draft are live
            return 1; 
        case wrap_mode.dead:
            // All 'cells' outside the draft are dead
            return 0;
        case wrap_mode.wrap:
            // All 'cells' outside the draft wrap back around to the other side
            if (height === 0 || width === 0) return 0;
            i_idx = (i_idx + height) % height;
            j_idx = (j_idx + width) % width;
            break;
        }
    }

    return getCellValue(current_state[i_idx][j_idx]) === true ? 1 : 0;
};

/**
 * The neighborhood of a cell (here we are using the common Moore-style neighborhood) is the grid 
 * with the cell identified by idx (marked by an X) at the center. This function sums up 
 * the values (0s or 1s) of all the surrounding cells in the neighborhood.
 * 
 * | 0 | 1 | 0 |
 * -------------
 * | 1 | X | 1 |
 * -------------
 * | 1 | 0 | 0 |
 * -------------
 * 
 * @param current_state the current state of the drawdown
 * @param i_idx the primary index of the cell at the center of the neighborhood
 * @param j_idx the secondary index of the cell at the center of the neighborhood
 * @param wrap the wrapping mode for edge-case cells
 * @returns the number of live cells in the surrounding Moore neighborhood of a particular cell
 */
const sumNbrhood = (current_state: Drawdown, i_idx: number, j_idx: number, mode: wrap_mode): number => {
  let sum = 0;

  for (let di = -1; di <= 1; di++) {
    for (let dj = -1; dj <= 1; dj++) {
      if (di === 0 && dj === 0) continue;
      sum += wrapGetCellValue(current_state, i_idx + di, j_idx + dj, mode);
    }
  }

  return sum;
};

/**
 * Calculates the state of a particular cell after the cellular automata rule has been applied
 * @param cell_value the current live/dead stateof the cell
 * @param nbrhood_sum the sum of the surrounding Moore neighborhood
 * @param born a lookup table (array of 0 and 1 values) determining the neighborhood sum required for a cell to be born
 * @param survive a lookup table (array of 0 and 1 values) determining the neighborhood sum required for a cell to survive
 * @returns the live/dead state, 1 or 0, of the cell the rule is being applied to
 */
const applyRule = (cell_value: number, nbrhood_sum: number, born:Uint8Array, survive:Uint8Array): number => {
    let live: number = 0;
    if(cell_value == 0) {
        live = born[nbrhood_sum] == 1 ? 1 : 0;
    } else if (cell_value == 1) {
        live = survive[nbrhood_sum] == 1 ? 1 : 0;
    }
    return live;
}

/**
 * Calculates the next state of the drawdown for a single iteration of the automata.
 * @param current_state the current state of the drawdown
 * @param born a lookup table (array of 0 and 1 values) determining the neighborhood sum required for a cell to be born
 * @param survive a lookup table (array of 0 and 1 values) determining the neighborhood sum required for a cell to survive
 * @returns a drawdown representing the next state after the rule has been applied to the entire grid
 */
const nextGeneration = (current_state: Drawdown, born: Uint8Array, survive: Uint8Array, mode: wrap_mode): Drawdown => {
    const next_state: Drawdown = [];
    const width = warps(current_state);
    const height = wefts(current_state);

    for (var i=0; i<height; i++) {
        next_state[i] = [];
        for (var j=0; j<width; j++) {
            const nbrhood_sum = sumNbrhood(current_state, i, j, mode)
            next_state[i][j] = createCell(applyRule(Number(current_state[i][j].is_up), nbrhood_sum, born, survive) === 1);
        }
    }
    
    return next_state;
}

const perform = (param_vals: Array<OpParamVal>, op_inputs: Array<OpInput>) => {
    // The timestep/ number of iterations that have elapsed
    const tstep: number = <number>getOpParamValById(0, param_vals); 
    // Wrapping mode
    const mode: wrap_mode = <number>getOpParamValById(1, param_vals);
    // The rule that is being applied at each timestep
    const rule: string = <string>getOpParamValById(2, param_vals);

    const draft = getInputDraft(op_inputs);
    // Lookup tables for born/survive values based on the ruleset
    const {born, survive} = parseRule(rule);
    
    let next_state: Drawdown = draft != null ? draft.drawdown : [];
    for (let i=0; i<tstep; i++) {
        next_state = nextGeneration(next_state, born, survive, mode)
    }

    return Promise.resolve([{draft: initDraftFromDrawdown(next_state)}]);
}

const generateName = (param_vals: Array<OpParamVal>, op_inputs: Array<OpInput>) : string => {
    return 'cellular_automata(' + flattenParamVals(param_vals) + ")";
}

const sizeCheck = (param_vals: Array<OpParamVal>): boolean => {
    return true;
}

export const cellular_automata: Operation = { name, meta, params, inlets, perform, generateName, sizeCheck };
