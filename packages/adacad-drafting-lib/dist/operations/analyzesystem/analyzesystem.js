"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.analyzesystem = void 0;
const draft_1 = require("../../draft");
const cell_1 = require("../../draft/cell");
const sequence_1 = require("../../sequence/sequence");
const utils_1 = require("../../utils");
const categories_1 = require("../categories");
const operations_1 = require("../operations");
const name = "analyzesystem";
const meta = {
    displayname: "analyze system",
    img: "analyzesystem.png",
    desc: "Creates a draft from a subset of an input draft. Specifically, allows you to select a specific system or group of systems to isolate into a new draft.",
    categories: [categories_1.dissectOp],
    advanced: true
};
//PARAMS
const pattern = {
    name: 'systems',
    type: 'string',
    value: 'a1',
    regex: /[\S]/i, //Accepts a letter followed by a number, a single letter or a single number
    error: 'invalid entry',
    dx: 'enter the letter or number associated with the weft/warp system to which this draft will be focused upon. For example, "a 1" will show only the cells associated with the combination of warp system 1 with weft system a. The entry "a b" will create a draft of only the cells assigned to a and b across all warp systems'
};
const params = [pattern];
const draft_inlet = {
    name: 'draft',
    type: 'static',
    value: null,
    uses: 'draft',
    dx: "the draft that will be assigned to a given system",
    num_drafts: 1
};
const inlets = [draft_inlet];
const perform = (op_params, op_inputs) => {
    const original_string = (0, operations_1.getOpParamValById)(0, op_params);
    const original_string_split = (0, utils_1.parseRegex)(original_string, pattern.regex);
    if (op_inputs.length == 0)
        return Promise.resolve([]);
    const drafts = (0, operations_1.getAllDraftsAtInlet)(op_inputs, 0);
    if (drafts.length == 0)
        return Promise.resolve([]);
    ;
    const draft = drafts[0];
    const input_systems = original_string_split.reduce((acc, val) => {
        return {
            valid: false,
            wesy: acc.wesy.concat(parseWeftSystem(val)),
            wasy: acc.wasy.concat(parseWarpSystem(val)),
        };
    }, { valid: false, wesy: [], wasy: [] });
    const draft_systems = {
        valid: false,
        wasy: (0, utils_1.filterToUniqueValues)(draft.colSystemMapping),
        wesy: (0, utils_1.filterToUniqueValues)(draft.rowSystemMapping)
    };
    const validated_systems = (0, utils_1.makeValidSystemList)(input_systems, draft_systems);
    if (!validated_systems.valid) {
        const draft = (0, draft_1.initDraftWithParams)({ warps: 1, wefts: 1 });
        return Promise.resolve([{ draft }]);
    }
    const analyzed_draft = new sequence_1.Sequence.TwoD();
    const rowSysMap = [];
    const rowShutMap = [];
    let colSysMap = [];
    let colShutMap = [];
    for (let i = 0; i < (0, draft_1.wefts)(draft.drawdown); i++) {
        const weftsys = draft.rowSystemMapping[i];
        if (validated_systems.wesy.find(el => el == weftsys) !== undefined) {
            colSysMap = [];
            colShutMap = [];
            const row = new sequence_1.Sequence.OneD();
            for (let j = 0; j < (0, draft_1.warps)(draft.drawdown); j++) {
                const warpsys = draft.colSystemMapping[j];
                if (validated_systems.wasy.find(el => el == warpsys) !== undefined) {
                    colSysMap.push(warpsys);
                    colShutMap.push(draft.colShuttleMapping[j]);
                    row.push((0, cell_1.cellToSequenceVal)(draft.drawdown[i][j]));
                }
            }
            if (row.length() > 0) {
                rowSysMap.push(weftsys);
                rowShutMap.push(draft.rowShuttleMapping[i]);
            }
            analyzed_draft.pushWeftSequence(row.val());
        }
    }
    //if you put in a combo to the param that does not exist 
    const d = (0, draft_1.initDraftFromDrawdown)(analyzed_draft.export());
    d.rowShuttleMapping = rowShutMap;
    d.rowSystemMapping = rowSysMap;
    d.colShuttleMapping = colShutMap;
    d.colSystemMapping = colSysMap;
    return Promise.resolve([{ draft: d }]);
};
const generateName = (param_vals, op_inputs) => {
    const param_val = (0, operations_1.getOpParamValById)(0, param_vals);
    const drafts = (0, operations_1.getAllDraftsAtInlet)(op_inputs, 0);
    const name_list = (0, operations_1.parseDraftNames)(drafts);
    return "analyze system(" + param_val + ", " + name_list + ")";
};
//pull out all the numbers from a notation element into warp systems
const parseWarpSystem = (val) => {
    const matches = val.match(/\d+/g);
    if (matches == null || matches.length == 0) {
        console.error("in Analyze Systems, no warp system");
        return [];
    }
    return matches.map(el => parseInt(el) - 1);
};
//pull out all the letters from a notation element into weft systems
const parseWeftSystem = (val) => {
    const matches = val.match(/[a-zA-Z]+/g);
    if (matches == null || matches.length == 0) {
        console.error("in Analyze System, no weft system");
        return [];
    }
    return matches.map(match => match.charCodeAt(0) - 97);
};
const sizeCheck = () => {
    return true;
};
exports.analyzesystem = { name, meta, params, inlets, perform, generateName, sizeCheck };
//# sourceMappingURL=analyzesystem.js.map