import { warps, Cell, getCellValue, Draft, initDraftWithParams, wefts, updateWarpSystemsAndShuttles, updateWeftSystemsAndShuttles } from "../../draft";
import { getLoomUtilByType, Loom } from "../../loom";
import { getAllDraftsAtInlet, parseDraftNames } from "../../operations";
import { draftingStylesOp } from "../categories";
import { OperationParam, OperationInlet, OpParamVal, OpInput, Operation, OpMeta, OpOutput } from "../types";

const name = "drawdown";

const meta: OpMeta = {
  displayname: 'make drawdown from threading, tieup, and treadling',
  desc: 'Create a drawdown from the input drafts (order 1. threading, 2. tieup, 3.treadling)',
  img: 'drawdown.png',
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


const tieup: OperationInlet = {
  name: 'tieup',
  type: 'static',
  value: null,
  uses: "draft",
  dx: 'the draft to use as tieup',
  num_drafts: 1
}

const treadling: OperationInlet = {
  name: 'treadling',
  type: 'static',
  value: null,
  uses: "draft",
  dx: 'the draft to use as treadling',
  num_drafts: 1
}

const inlets = [threading, tieup, treadling];


const perform = (op_params: Array<OpParamVal>, op_inputs: Array<OpInput>): Promise<Array<OpOutput>> => {

  const threading = getAllDraftsAtInlet(op_inputs, 0);
  const tieup = getAllDraftsAtInlet(op_inputs, 1);
  const treadling = getAllDraftsAtInlet(op_inputs, 2);


  if (threading.length == 0 || tieup.length == 0 || treadling.length == 0) return Promise.resolve([]);

  const threading_draft = threading[0];
  const tieup_draft = tieup[0];
  const treadling_draft = treadling[0];

  const threading_list: Array<number> = [];
  for (let j = 0; j < warps(threading_draft.drawdown); j++) {
    const col: Array<Cell> = threading_draft.drawdown.reduce((acc, row, ndx) => {
      acc[ndx] = row[j];
      return acc;
    }, []);

    threading_list[j] = col.findIndex(cell => getCellValue(cell));

  }

  const treadling_list: Array<Array<number>> = treadling_draft.drawdown
    .map(row => [row.findIndex(cell => getCellValue(cell))]);

  const tieup_list: Array<Array<boolean>> = tieup_draft.drawdown.map(row => {
    return row.map(cell => getCellValue(cell) == true ? true : false);
  });

  let draft: Draft = initDraftWithParams({ warps: warps(threading_draft.drawdown), wefts: wefts(treadling_draft.drawdown) });
  const utils = getLoomUtilByType('frame');
  const loom: Loom = {
    threading: threading_list,
    tieup: tieup_list,
    treadling: treadling_list
  }

  if (utils && typeof utils.computeDrawdownFromLoom === 'function') {
    return utils.computeDrawdownFromLoom(loom).then(drawdown => {
      draft.drawdown = drawdown;
      draft = updateWarpSystemsAndShuttles(draft, threading_draft)
      draft = updateWeftSystemsAndShuttles(draft, treadling_draft)
      return Promise.resolve([{ draft, loom }]);
    });
  } else {
    return Promise.resolve([]);
  }
}

const generateName = (param_vals: Array<OpParamVal>, op_inputs: Array<OpInput>): string => {
  const drafts = getAllDraftsAtInlet(op_inputs, 0);
  return 'drawdown(' + parseDraftNames(drafts) + ")";
}


export const drawdown: Operation = { name, meta, params, inlets, perform, generateName };