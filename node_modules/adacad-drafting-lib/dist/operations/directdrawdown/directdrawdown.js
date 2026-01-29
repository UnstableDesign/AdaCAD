"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.directdrawdown = void 0;
const draft_1 = require("../../draft");
const loom_1 = require("../../loom");
const operations_1 = require("../../operations");
const utils_1 = require("../../utils");
const categories_1 = require("../categories");
const name = "directdrawdown";
const meta = {
    displayname: 'make drawdown from threading and lift plan',
    desc: 'Create a drawdown from the input drafts (order 1. threading, 2.lift plan)',
    img: 'directdrawdown.png',
    advanced: true,
    categories: [categories_1.draftingStylesOp]
};
//PARAMS
const params = [];
//INLETS
const threading = {
    name: 'threading',
    type: 'static',
    value: null,
    uses: "draft",
    dx: 'the draft to use as threading',
    num_drafts: 1
};
const liftplan = {
    name: 'lift plan',
    type: 'static',
    value: null,
    uses: "draft",
    dx: 'the draft to use as tieup',
    num_drafts: 1
};
const inlets = [threading, liftplan];
const perform = (op_params, op_inputs) => {
    const threading = (0, operations_1.getAllDraftsAtInlet)(op_inputs, 0);
    const lift_plan = (0, operations_1.getAllDraftsAtInlet)(op_inputs, 1);
    if (threading.length == 0 || lift_plan.length == 0)
        return Promise.resolve([]);
    const threading_draft = threading[0];
    const lift_draft = lift_plan[0];
    const threading_list = [];
    for (let j = 0; j < (0, draft_1.warps)(threading_draft.drawdown); j++) {
        const col = threading_draft.drawdown.reduce((acc, row, ndx) => {
            acc[ndx] = row[j];
            return acc;
        }, []);
        threading_list[j] = col.findIndex(cell => (0, draft_1.getCellValue)(cell));
    }
    const treadling_list = lift_draft.drawdown.map(row => {
        const edited_row = row.reduce((acc, cell, ndx) => {
            if ((0, draft_1.getCellValue)(cell) === true)
                acc.push(ndx);
            return acc;
        }, []);
        return edited_row;
    });
    const tieup = [];
    for (let i = 0; i < (0, draft_1.wefts)(threading_draft.drawdown); i++) {
        tieup.push([]);
        for (let j = 0; j < (0, draft_1.warps)(lift_draft.drawdown); j++) {
            if (i == j)
                tieup[i].push(true);
            else
                tieup[i].push(false);
        }
    }
    let draft = (0, draft_1.initDraftWithParams)({ warps: (0, draft_1.warps)(threading_draft.drawdown), wefts: (0, draft_1.wefts)(lift_draft.drawdown) });
    const utils = (0, loom_1.getLoomUtilByType)('direct');
    const loom = {
        id: (0, utils_1.generateId)(8),
        threading: threading_list,
        tieup: tieup,
        treadling: treadling_list
    };
    const loom_settings = {
        type: 'direct',
        frames: (0, draft_1.wefts)(threading_draft.drawdown),
        treadles: (0, draft_1.warps)(lift_draft.drawdown),
        units: 'in',
        epi: utils_1.defaults.loom_settings.epi,
        ppi: utils_1.defaults.loom_settings.ppi
    };
    if (utils && typeof utils.computeDrawdownFromLoom === "function") {
        return utils.computeDrawdownFromLoom(loom).then(drawdown => {
            draft.drawdown = drawdown;
            draft = (0, draft_1.updateWarpSystemsAndShuttles)(draft, threading_draft);
            draft = (0, draft_1.updateWeftSystemsAndShuttles)(draft, lift_draft);
            return Promise.resolve([{ draft, loom, loom_settings }]);
        });
    }
    else {
        return Promise.resolve([]);
    }
};
const generateName = (param_vals, op_inputs) => {
    const drafts = (0, operations_1.getAllDraftsAtInlet)(op_inputs, 0);
    return 'drawdown(' + (0, operations_1.parseDraftNames)(drafts) + ")";
};
const sizeCheck = (op_settings, op_inputs) => {
    const threading = (0, operations_1.getAllDraftsAtInlet)(op_inputs, 0);
    const lift_plan = (0, operations_1.getAllDraftsAtInlet)(op_inputs, 1);
    if (threading.length == 0 || lift_plan.length == 0)
        return true;
    const threading_draft = threading[0];
    const lift_draft = lift_plan[0];
    if ((0, draft_1.warps)(threading_draft.drawdown) * (0, draft_1.wefts)(lift_draft.drawdown) < utils_1.defaults.max_area)
        return true;
    return false;
};
exports.directdrawdown = { name, meta, params, inlets, perform, generateName, sizeCheck };
//# sourceMappingURL=directdrawdown.js.map