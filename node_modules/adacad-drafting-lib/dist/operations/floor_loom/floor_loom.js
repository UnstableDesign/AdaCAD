"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.floor_loom = void 0;
const draft_1 = require("../../draft");
const loom_1 = require("../../loom");
const __1 = require("..");
const categories_1 = require("../categories");
const utils_1 = require("../../utils");
const name = "floor_loom";
const meta = {
    displayname: 'generate floor loom threading and treadling',
    desc: 'Uses the input draft as drawdown and generates a threading and lift plan pattern',
    img: 'floor_loom.png',
    categories: [categories_1.draftingStylesOp],
    advanced: true,
    old_names: ['floor loom']
};
//PARAMS
const frames = {
    name: 'frames',
    min: 2,
    max: 10000,
    value: 8,
    type: 'number',
    dx: 'number of frames to use. If the drawdown requires more, it will generate more'
};
const treadles = {
    name: 'treadles',
    min: 1,
    max: 10000,
    value: 12,
    type: 'number',
    dx: 'number of treadles to use. If the drawdown requires more, it will generate more'
};
const params = [frames, treadles];
//INLETS
const drawdown = {
    name: 'drawdown',
    type: 'static',
    value: null,
    uses: "draft",
    dx: 'the drawdown from which to create threading, tieup and treadling data from',
    num_drafts: 1
};
const inlets = [drawdown];
const perform = (op_params, op_inputs) => {
    const draft = (0, __1.getInputDraft)(op_inputs);
    const frames = (0, __1.getOpParamValById)(0, op_params);
    const treadles = (0, __1.getOpParamValById)(1, op_params);
    if (draft == null)
        return Promise.resolve([]);
    const loom_settings = {
        type: 'frame',
        epi: utils_1.defaults.loom_settings.epi,
        ppi: utils_1.defaults.loom_settings.ppi,
        units: 'in',
        frames: frames,
        treadles: treadles
    };
    const utils = (0, loom_1.getLoomUtilByType)(loom_settings.type);
    if (!utils || typeof utils.computeLoomFromDrawdown !== "function") {
        return Promise.resolve([]);
    }
    return utils.computeLoomFromDrawdown(draft.drawdown, loom_settings)
        .then(l => {
        const frames = Math.max((0, loom_1.numFrames)(l), loom_settings.frames);
        const treadles = Math.max((0, loom_1.numTreadles)(l), loom_settings.treadles);
        let threading = (0, draft_1.initDraftWithParams)({ warps: (0, draft_1.warps)(draft.drawdown), wefts: frames });
        l.threading.forEach((frame, j) => {
            if (frame !== -1)
                (0, draft_1.setHeddle)(threading.drawdown, frame, j, true);
        });
        threading = (0, draft_1.updateWarpSystemsAndShuttles)(threading, draft);
        let treadling = (0, draft_1.initDraftWithParams)({ warps: treadles, wefts: (0, draft_1.wefts)(draft.drawdown) });
        l.treadling.forEach((treadle_row, i) => {
            treadle_row.forEach(treadle_num => {
                (0, draft_1.setHeddle)(treadling.drawdown, i, treadle_num, true);
            });
        });
        treadling = (0, draft_1.updateWeftSystemsAndShuttles)(treadling, draft);
        let tieup = (0, draft_1.initDraftWithParams)({ warps: treadles, wefts: frames });
        l.tieup.forEach((row, i) => {
            row.forEach((val, j) => {
                (0, draft_1.setHeddle)(tieup.drawdown, i, j, val);
            });
        });
        tieup = (0, draft_1.updateWeftSystemsAndShuttles)(tieup, draft);
        tieup = (0, draft_1.updateWarpSystemsAndShuttles)(tieup, draft);
        return Promise.resolve([{ draft: threading }, { draft: tieup }, { draft: treadling }]);
    });
};
const generateName = () => {
    return '';
};
const sizeCheck = () => {
    return true;
};
exports.floor_loom = { name, meta, params, inlets, perform, generateName, sizeCheck };
//# sourceMappingURL=floor_loom.js.map