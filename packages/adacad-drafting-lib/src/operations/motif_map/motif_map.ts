import {
    getAllDraftsAtInlet,
    Operation,
    OperationInlet,
    OperationParam,
    OpInput,
    OpMeta,
    OpParamVal,
    getOpParamValById,
    NumParam,
} from "..";
import { Cell, Drawdown } from "../../draft";
import { createCell } from "../../draft/cell";
import {
    getDraftName,
    getHeddle,
    initDraftFromDrawdown,
    warps,
    wefts,
} from "../../draft/draft";
import { Sequence } from "../../sequence";
import { computeFilter, printDrawdown } from "../../utils";
import { defaults } from "../../utils/defaults";
import { compoundOp } from "../categories";

const name = "motif_map";

const meta: OpMeta = {
    displayname: "stamp motif",
    advanced: true,
    categories: [compoundOp],
    authors: ["Laura Devendorf", "Etta Sandry", "Deanna Gelosi"],
    desc: "Inspired by Etta's creation of stamps of structures that are arranged and overlapped, this operation uses a motif (a structure) and a map (a draft with black cells indicating the locations for the motif to be placed).",
    // img: 'crackle.png'
};


const xspacing: NumParam = {
    name: "spacing across the width",
    type: "number",
    value: 1,
    dx: "how much space should be inserted between each motif along the width",
    min: 1,
    max: 1000,
};


const yspacing: NumParam = {
    name: "spacing down the height",
    type: "number",
    value: 1,
    dx: "how much space should be inserted between each motif along the width",
    min: 1,
    max: 1000,
};

// const overlap: SelectParam = {
//     name: "overlap",
//     type: "select",
//     value: "overlay",
//     dx: "how should overlap between drafts be handled",
//     selectlist: [
//         { name: "overlay", value: 0 },
//         { name: "additive", value: 1 },
//         { name: "knockout", value: 2 }
//     ],
// };

const params: OperationParam[] = [xspacing, yspacing];

const motif_inlet: OperationInlet = {
    name: "motif",
    type: "static",
    value: null,
    uses: "draft",
    dx: "The motif that you want to place. Defaults to the standard tabby weave motif",
    num_drafts: 1,
};

const map_inlet: OperationInlet = {
    name: "stamp map",
    type: "static",
    value: null,
    uses: "draft",
    dx: "The map dictating where the motif should be stamped.",
    num_drafts: 1,
};

const inlets = [map_inlet, motif_inlet];

const perform = (param_vals: Array<OpParamVal>, op_inputs: Array<OpInput>) => {
    const motifs = getAllDraftsAtInlet(op_inputs, 1);
    const maps = getAllDraftsAtInlet(op_inputs, 0);
    const xspacing = getOpParamValById(0, param_vals) as number;
    const yspacing = getOpParamValById(1, param_vals) as number;

    let motif = null;
    if (motifs.length == 0) {
        const arr = [
            [1, 0],
            [0, 1]
        ]
        motif = initDraftFromDrawdown(new Sequence.TwoD(arr).export());
    } else {
        motif = motifs[0];
    }

    if (maps.length == 0) return Promise.resolve([]);

    const map = maps[0];
    console.log("MAP");
    printDrawdown(map.drawdown);
    console.log("MOTIF");
    printDrawdown(motif.drawdown);
    const map_width = warps(map.drawdown);
    const map_height = wefts(map.drawdown);
    const motif_width = warps(motif.drawdown);
    const motif_height = wefts(motif.drawdown);

    const sized_map: Drawdown = [];
    for (let i = 0; i < (map_height * yspacing); i++) {
        const row: Array<Cell> = [];
        for (let j = 0; j < (map_width * xspacing); j++) {
            if (i % yspacing == 0 && j % xspacing == 0) {
                const cell = getHeddle(map.drawdown, i / yspacing, j / xspacing);
                row.push(createCell(cell));
            } else {
                row.push(createCell(false));
            }
        }

        //pad out room for a stamp placed in the last column
        for (let j = 0; j < motif_width - 1; j++) {
            row.push(createCell(false));
        }
        sized_map.push(row);
    }

    //push the remaining set of rows we might need to fit patterns place in the last row of column
    for (let i = 0; i < motif_height - 1; i++) {
        const row: Array<Cell> = [];
        for (let j = 0; j < sized_map[0].length; j++) {
            row.push(createCell(false));
        }
        sized_map.push(row);
    }

    //create a copy that is empty
    const result: Drawdown = [];
    for (let i = 0; i < sized_map.length; i++) {
        const row: Array<Cell> = [];
        for (let j = 0; j < sized_map[0].length; j++) {
            row.push(createCell(false));
        }
        result.push(row);
    }

    printDrawdown(sized_map);
    printDrawdown(result);
    //iterate through the sized mot
    for (let i = 0; i < wefts(sized_map); i++) {
        for (let j = 0; j < warps(sized_map); j++) {
            const israised = getHeddle(sized_map, i, j);
            if (israised) {
                //initiate stamping process
                for (let mi = 0; mi < motif_height; ++mi) {
                    for (let mj = 0; mj < motif_width; ++mj) {
                        printDrawdown(result);
                        const old_value = getHeddle(result, i + mi, j + mj);
                        const new_value = getHeddle(motif.drawdown, mi, mj);
                        const res = computeFilter('or', old_value, new_value);
                        result[i + mi][j + mj] = createCell(res);
                    }
                }
            }
        }
    }

    return Promise.resolve([{ draft: initDraftFromDrawdown(result) }]);
};

const sizeCheck = (param_vals: Array<OpParamVal>, op_inputs: Array<OpInput>): boolean => {
    const map = getAllDraftsAtInlet(op_inputs, 0);
    if (map.length == 0) return true;
    const xspacing = getOpParamValById(0, param_vals) as number;
    const yspacing = getOpParamValById(1, param_vals) as number;
    const width = warps(map[0].drawdown) * xspacing;
    const height = wefts(map[0].drawdown) * yspacing;
    return width * height <= defaults.max_area ? true : false;
};

const generateName = (param_vals: Array<OpParamVal>, op_inputs: Array<OpInput>): string => {
    const motif = getAllDraftsAtInlet(op_inputs, 1);
    if (motif.length == 0) return "motif_map";
    const motif_name = getDraftName(motif[0]);
    const map = getAllDraftsAtInlet(op_inputs, 0);
    if (map.length == 0) return "motif_map";
    const map_name = getDraftName(map[0]);
    return `${motif_name}_on_${map_name}`;
};

export const motif_map: Operation = {
    name,
    meta,
    params,
    inlets,
    perform,
    generateName,
    sizeCheck,
};
