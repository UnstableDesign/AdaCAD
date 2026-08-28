import { warps, Draft, initDraftWithParams, wefts, setCellValue, createCell } from "../../draft";
import { numFrames, numTreadles } from "../../loom";
import { assembleDraftsAndLoomsFromOpInput, getAllDraftsAtInlet, getOpParamValById, parseDraftNames } from "../../operations";
import { defaults } from "../../utils";
import { draftingStylesOp } from "../categories";
import { OperationInlet, OpParamVal, OpInput, Operation, OpMeta, OpOutput, SelectParam } from "../types";

const name = "extract";

const meta: OpMeta = {
    displayname: 'extract data from a draft',
    desc: 'creates a new drawdown based on the threading, treadlings, tieup or lift plan of an input draft',
    img: 'extract.png',
    advanced: true,
    categories: [draftingStylesOp]
}

//PARAMS

const datasource: SelectParam = {
    name: 'datasource',
    type: 'select',
    value: 'threading',
    dx: 'the data source to extract',
    selectlist: [{ name: 'threading', value: 0 }, { name: 'treadling/lift plan', value: 1 }, { name: 'tieup', value: 2 }]
}

const params = [datasource];

//INLETS

const draft_inlet: OperationInlet = {
    name: 'draft',
    type: 'static',
    value: null,
    uses: "draft",
    dx: 'the draft from which to extract data',
    num_drafts: 1
}


const inlets = [draft_inlet];


const perform = (op_params: Array<OpParamVal>, op_inputs: Array<OpInput>): Promise<Array<OpOutput>> => {

    const source: number = <number>getOpParamValById(0, op_params);
    const drafts_and_looms = assembleDraftsAndLoomsFromOpInput(op_inputs[0]);

    if (drafts_and_looms.length == 0) return Promise.resolve([]);
    const loom = drafts_and_looms[0].loom;
    const loom_settings = drafts_and_looms[0].loom_settings;
    if (loom == null || loom_settings == null) return Promise.resolve([]);

    let d: Draft;
    switch (source) {
        //threading
        case 0:
            d = initDraftWithParams({ warps: loom.threading.length, wefts: numFrames(loom), drawdown: [[createCell(false)]] });

            loom.threading.forEach((frame_num, ndx) => {
                if (frame_num >= 0) {
                    setCellValue(d.drawdown[frame_num][ndx], true);
                }
            });

            return Promise.resolve([{ draft: d }]);

        //treadling/lift plan
        case 1:

            d = initDraftWithParams({ warps: numTreadles(loom), wefts: loom.treadling.length, drawdown: [[createCell(false)]] });
            loom.treadling.forEach((treadling_row, weft_ndx) => {
                treadling_row.forEach((threading_cell, warp_ndx) => {
                    if (threading_cell >= 0) {
                        setCellValue(d.drawdown[weft_ndx][warp_ndx], true);
                    }
                });
            });
            return Promise.resolve([{ draft: d }]);

        //tieup
        case 2:
            d = initDraftWithParams({ warps: numTreadles(loom), wefts: numFrames(loom), drawdown: [[createCell(false)]] });
            loom.tieup.forEach((tieup_row, weft_ndx) => {
                tieup_row.forEach((tieup_cell, warp_ndx) => {
                    if (tieup_cell == true) {
                        setCellValue(d.drawdown[weft_ndx][warp_ndx], true);
                    }
                });
            });
            return Promise.resolve([{ draft: d }]);

        default:
            return Promise.resolve([]);
    }


}

const generateName = (param_vals: Array<OpParamVal>, op_inputs: Array<OpInput>): string => {
    const drafts = getAllDraftsAtInlet(op_inputs, 0);
    const source = <number>getOpParamValById(0, param_vals);
    switch (source) {
        case 0:
            return 'extract(threading from ' + parseDraftNames(drafts) + ")";
        case 1:
            return 'extract(treadling/lift plan from ' + parseDraftNames(drafts) + ")";
        case 2:
            return 'extract(tieup from ' + parseDraftNames(drafts) + ")";
    }
    return 'extract(' + parseDraftNames(drafts) + ")";
}

const sizeCheck = (op_settings: Array<OpParamVal>, op_inputs: Array<OpInput>): boolean => {
    const drafts_and_looms = assembleDraftsAndLoomsFromOpInput(op_inputs[0]);
    const source = <number>getOpParamValById(0, op_settings);

    if (drafts_and_looms.length == 0) return true;
    const loom = drafts_and_looms[0].loom;
    if (loom == null) return true;

    switch (source) {
        case 0:
            return warps(drafts_and_looms[0].draft.drawdown) * wefts(drafts_and_looms[0].draft.drawdown) < defaults.max_area;
        case 1:
            return warps(drafts_and_looms[0].draft.drawdown) * wefts(drafts_and_looms[0].draft.drawdown) < defaults.max_area;
        case 2:
            return warps(drafts_and_looms[0].draft.drawdown) * wefts(drafts_and_looms[0].draft.drawdown) < defaults.max_area;
    }

    return true;
}

export const extract: Operation = { name, meta, params, inlets, perform, generateName, sizeCheck };