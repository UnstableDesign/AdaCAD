import { warps, Cell, getCellValue, Draft, initDraftWithParams, wefts, updateWarpSystemsAndShuttles, updateWeftSystemsAndShuttles } from "../../draft";
import { getLoomUtilByType } from "../../loom";
import { getAllDraftsAtInlet, parseDraftNames } from "../../operations";
import { generateId } from "../../utils";
import { draftingStylesOp } from "../categories";
import { OperationParam, OperationInlet, OpParamVal, OpInput, Operation, OpMeta } from "../types";

const name = "directdrawdown";


const meta: OpMeta = {
  displayname: 'make drawdown from threading and lift plan',
  desc: 'Create a drawdown from the input drafts (order 1. threading, 2.lift plan)',
  img: 'directdrawdown.png',
  advanced: true,
  categories: [draftingStylesOp]
}

//PARAMS

const params: Array<OperationParam> = [];

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


const perform = (op_params: Array<OpParamVal>, op_inputs: Array<OpInput>) => {

  const threading = getAllDraftsAtInlet(op_inputs, 0);
  const lift_plan = getAllDraftsAtInlet(op_inputs, 1);


  if (threading.length == 0 || lift_plan.length == 0) return Promise.resolve([]);

  const threading_draft = threading[0];
  const lift_draft = lift_plan[0];

  const threading_list: Array<number> = [];
  for (let j = 0; j < warps(threading_draft.drawdown); j++) {
    const col: Array<Cell> = threading_draft.drawdown.reduce((acc, row, ndx) => {
      acc[ndx] = row[j];
      return acc;
    }, []);

    threading_list[j] = col.findIndex(cell => getCellValue(cell));

  }

  const treadling_list: Array<Array<number>> =
    lift_draft.drawdown.map(row => {
      const edited_row = row.reduce((acc: Array<number>, cell, ndx) => {
        if (getCellValue(cell) === true) acc.push(ndx);
        return acc;
      }, [])
      return edited_row;
    }
    );

  const tieup: Array<Array<boolean>> = [];
  for (let i = 0; i < 100; i++) {
    tieup.push([])
    for (let j = 0; j < 100; j++) {
      if (i == j) tieup[i].push(true)
      else tieup[i].push(false)
    }
  }


  let draft: Draft = initDraftWithParams({ warps: warps(threading_draft.drawdown), wefts: wefts(lift_draft.drawdown) });


  const utils = getLoomUtilByType('direct');
  const loom = {
    id: generateId(8),
    threading: threading_list,
    tieup: tieup,
    treadling: treadling_list
  }


  if (utils && typeof utils.computeDrawdownFromLoom === "function") {
    return utils.computeDrawdownFromLoom(loom).then(drawdown => {
      draft.drawdown = drawdown;
      draft = updateWarpSystemsAndShuttles(draft, threading_draft)
      draft = updateWeftSystemsAndShuttles(draft, lift_draft)
      return Promise.resolve([draft]);
    });
  } else {
    return Promise.resolve([]);
  }
}

const generateName = (param_vals: Array<OpParamVal>, op_inputs: Array<OpInput>): string => {
  const drafts = getAllDraftsAtInlet(op_inputs, 0);
  return 'drawdown(' + parseDraftNames(drafts) + ")";
}


export const directdrawdown: Operation = { name, meta, params, inlets, perform, generateName };