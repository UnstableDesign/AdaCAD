"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.crop = void 0;
const draft_1 = require("../../draft");
const sequence_1 = require("../../sequence");
const operations_1 = require("../../operations");
const categories_1 = require("../categories");
const utils_1 = require("../../utils");
const name = "crop";
const meta = {
    displayname: 'crop',
    desc: 'Crops the structure or pattern to a region of the input draft. The crop size and placement are defined by the parameters. This operation follows a model similar to graphics editing software where one specifies the x,y coordinates of the top left of the crop and then the width and height to "cut out".',
    img: 'crop.png',
    categories: [categories_1.transformationOp]
};
//PARAMS
const starting_ends = {
    name: 'ends from start',
    type: 'number',
    min: 0,
    max: 10000,
    value: 0,
    dx: 'number of pics from the origin to start the cut'
};
const staring_pics = {
    name: 'pics from start',
    min: 0,
    max: 10000,
    value: 0,
    type: 'number',
    dx: 'number of ends from the origin to start the cut'
};
const width = {
    name: 'width',
    type: 'number',
    min: 1,
    max: 10000,
    value: 10,
    dx: 'total width of cutting box'
};
const height = {
    name: 'height',
    type: 'number',
    min: 1,
    max: 10000,
    value: 10,
    dx: 'height of the cutting box'
};
const params = [starting_ends, staring_pics, width, height];
//INLETS
const draft = {
    name: 'draft',
    type: 'static',
    value: null,
    dx: 'the draft to crop',
    uses: "draft",
    num_drafts: 1
};
const inlets = [draft];
const perform = (op_params, op_inputs) => {
    const draft = (0, operations_1.getInputDraft)(op_inputs);
    const left = (0, operations_1.getOpParamValById)(0, op_params);
    const top = (0, operations_1.getOpParamValById)(1, op_params);
    const width = (0, operations_1.getOpParamValById)(2, op_params);
    const height = (0, operations_1.getOpParamValById)(3, op_params);
    if (draft == null)
        return Promise.resolve([]);
    const warp_systems = new sequence_1.Sequence.OneD(draft.colSystemMapping).shift(left).resize(width);
    const warp_mats = new sequence_1.Sequence.OneD(draft.colShuttleMapping).shift(left).resize(width);
    const weft_systems = new sequence_1.Sequence.OneD(draft.rowSystemMapping).shift(top).resize(height);
    const weft_materials = new sequence_1.Sequence.OneD(draft.rowShuttleMapping).shift(top).resize(height);
    const pattern = new sequence_1.Sequence.TwoD();
    //start with starting pics
    for (let i = 0; i < height; i++) {
        const seq = new sequence_1.Sequence.OneD();
        const adj_i = i + top;
        if (adj_i >= (0, draft_1.wefts)(draft.drawdown)) {
            seq.pushMultiple(2, width);
        }
        else {
            const row = (draft.drawdown[adj_i].length > left) ? draft.drawdown[adj_i].slice(left) : [];
            seq.pushRow(row);
            const diff = width - row.length;
            if (diff > 0)
                seq.pushMultiple(2, diff);
            if (diff < 0) {
                seq.resize(width);
            }
        }
        pattern.pushWeftSequence(seq.val());
    }
    const d = (0, draft_1.initDraftFromDrawdown)(pattern.export());
    d.colShuttleMapping = warp_mats.val();
    d.colSystemMapping = warp_systems.val();
    d.rowShuttleMapping = weft_materials.val();
    d.rowSystemMapping = weft_systems.val();
    return Promise.resolve([{ draft: d }]);
};
const generateName = (param_vals, op_inputs) => {
    const r = (0, operations_1.getAllDraftsAtInlet)(op_inputs, 0);
    const name_list = (0, operations_1.parseDraftNames)(r);
    return 'crop(' + name_list + ")";
};
const sizeCheck = (op_params) => {
    const width = (0, operations_1.getOpParamValById)(2, op_params);
    const height = (0, operations_1.getOpParamValById)(3, op_params);
    return (width * height <= utils_1.defaults.max_area) ? true : false;
};
exports.crop = { name, meta, params, inlets, perform, generateName, sizeCheck };
//# sourceMappingURL=crop.js.map