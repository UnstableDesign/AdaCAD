import { convertLiftPlanToTieup, convertTieupToLiftPlan, copyLoomSettings } from "../../loom";
import { assembleDraftsAndLoomsFromOpInput, getAllDraftsAtInlet, getOpParamValById, parseDraftNames } from "../../operations";
import { draftingStylesOp } from "../categories";
import { OperationInlet, OpParamVal, OpInput, Operation, OpMeta, OpOutput, SelectParam } from "../types";

const name = "convert_loom";

const meta: OpMeta = {
    displayname: 'convert loom types',
    desc: 'converts between direct and frame type looms, and vice versa',
    img: 'convert_loom.png',
    advanced: true,
    categories: [draftingStylesOp]
}

//PARAMS

const datasource: SelectParam = {
    name: 'datasource',
    type: 'select',
    value: 0,
    dx: 'convert to',
    selectlist: [{ name: 'frame', value: 0 }, { name: 'direct', value: 1 }]
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

    const dest: number = <number>getOpParamValById(0, op_params);
    const drafts_and_looms = assembleDraftsAndLoomsFromOpInput(op_inputs[0]);

    if (drafts_and_looms.length == 0) return Promise.resolve([]);
    const draft = drafts_and_looms[0].draft;
    if (draft == null) return Promise.resolve([]);
    const loom = drafts_and_looms[0].loom;
    const loom_settings = drafts_and_looms[0].loom_settings;
    if (loom == null || loom_settings == null) return Promise.resolve([]);

    if (loom_settings.type == 'jacquard') {
        return Promise.resolve([]);
    }

    let converted_loom;
    let converted_loom_settings;
    switch (dest) {
        //convert to frame
        case 0:
            converted_loom = convertLiftPlanToTieup(loom, loom_settings);
            converted_loom_settings = copyLoomSettings(loom_settings);
            converted_loom_settings.type = 'frame';
            break;
        case 1:
            converted_loom = convertTieupToLiftPlan(loom, loom_settings);
            converted_loom_settings = copyLoomSettings(loom_settings);
            converted_loom_settings.type = 'direct';
            break;
        default:
            return Promise.resolve([{ draft: draft, loom: converted_loom, loom_settings: converted_loom_settings }]);
    }
    return Promise.resolve([])



}

const generateName = (param_vals: Array<OpParamVal>, op_inputs: Array<OpInput>): string => {
    const drafts = getAllDraftsAtInlet(op_inputs, 0);
    const dest = <number>getOpParamValById(0, param_vals);
    switch (dest) {
        case 0:
            return 'convert_loom(' + parseDraftNames(drafts) + " to frame)";
        case 1:
            return 'convert_loom(' + parseDraftNames(drafts) + " to direct)";
        default:
            return 'convert_loom(' + parseDraftNames(drafts) + ")";
    }
}

const sizeCheck = (): boolean => {

    return true;
}

export const convert_loom: Operation = { name, meta, params, inlets, perform, generateName, sizeCheck };