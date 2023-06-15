import { createCell, getCellValue } from "../../model/cell";
import { Cell, Draft, Operation, OperationInlet, OpInput, OpParamVal } from "../../model/datatypes";
import { getHeddle, initDraftFromDrawdown, initDraftWithParams, updateWarpSystemsAndShuttles, updateWeftSystemsAndShuttles, warps, wefts } from "../../model/drafts";
import { getLoomUtilByType } from "../../model/looms";
import { getAllDraftsAtInlet, parseDraftNames } from "../../model/operations";


const name = "directdrawdown";
const old_names = [];

//PARAMS

const params = [];

//INLETS

const threading: OperationInlet = {
    name: 'threading', 
    type: 'static',
    value: null,
    uses: "draft",
    dx: 'the draft to use as threading',
    num_drafts: 1
  }


const liftplan: OperationInlet = {
    name: 'lift plan', 
    type: 'static',
    value: null,
    uses: "draft",
    dx: 'the draft to use as tieup',
    num_drafts: 1
  }

  

  const inlets = [threading, liftplan];


const  perform = (op_params: Array<OpParamVal>, op_inputs: Array<OpInput>) => {

  let threading = getAllDraftsAtInlet(op_inputs, 0);
  let lift_plan = getAllDraftsAtInlet(op_inputs, 1);

  
  if(threading.length == 0 || lift_plan.length == 0) return Promise.resolve([]);

  const threading_draft = threading[0];
  const lift_draft = lift_plan[0];

  const threading_list: Array<number> = [];
  for(let j = 0; j < warps(threading_draft.drawdown); j++){
    const col: Array<Cell> = threading_draft.drawdown.reduce((acc, row, ndx) => {
      acc[ndx] = row[j];
      return acc;
    }, []);

    threading_list[j] = col.findIndex(cell => getCellValue(cell));

  }

  const treadling_list: Array<Array<number>> =
  lift_draft.drawdown.map(row => {
    let edited_row = row.reduce((acc, cell, ndx) =>{
        if(getCellValue(cell) === true) acc.push(ndx);
        return acc;
    }, [])
    return edited_row;
    }
  );

  let tieup = [];
   for(let i = 0; i < 100; i++){
    tieup.push([])
     for(let j = 0; j < 100; j++){
        if(i==j) tieup[i].push(true)
        else tieup[i].push(false)
     }
   }


  let draft: Draft = initDraftWithParams({warps:warps(threading_draft.drawdown), wefts:wefts(lift_draft.drawdown)});


  const utils = getLoomUtilByType('direct');
  const loom = {
    threading: threading_list,
    tieup: tieup,
    treadling:treadling_list
  }



  return utils.computeDrawdownFromLoom(loom, 0).then(drawdown => {
    draft.drawdown = drawdown;
    draft = updateWarpSystemsAndShuttles(draft, threading_draft)
    draft = updateWeftSystemsAndShuttles(draft, lift_draft )
    return Promise.resolve([draft]);

  })
}   

const generateName = (param_vals: Array<OpParamVal>, op_inputs: Array<OpInput>) : string => {
  let drafts = getAllDraftsAtInlet(op_inputs, 0);
  return 'drawdown('+parseDraftNames(drafts)+")";
}


export const directdrawdown: Operation = {name, old_names, params, inlets, perform, generateName};