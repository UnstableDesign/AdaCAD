import {
  getAllDraftsAtInlet,
  NumParam,
  Operation,
  OperationInlet,
  OperationParam,
  OpInput,
  OpMeta,
  OpParamVal,
  StringParam,
  BoolParam,
  getOpParamValById,
} from "..";
import {
  getHeddle,
  initDraftFromDrawdown,
  warps,
  wefts,
} from "../../draft/draft";
import { Sequence } from "../../sequence";
import { defaults } from "../../utils/defaults";
import { structureOp } from "../categories";

const name = "crackle";

const meta: OpMeta = {
  displayname: "crackle",
  advanced: true,
  categories: [structureOp],
  authors: ["Alex McLean"],
  desc: "Creates a 'crackle' weave structure by placing a motif along a path, connected with incidentals.",
  // img: 'crackle.png'
};

//PARAMS
// const warps: NumParam = {
//     name: "ends",
//     type: "number",
//     min: 1,
//     max: 128,
//     value: 32,
//     dx: "Number of warps",
// };

// const wefts: NumParam = {
//     name: "pics",
//     type: "number",
//     min: 1,
//     max: 128,
//     value: 32,
//     dx: "Number of wefts",
// };

const incidentals: BoolParam = {
  name: "Add incidentals",
  type: "boolean",
  truestate: "yes",
  falsestate: "no",
  value: true,
  dx: "When selected, will add intermediary warps to connect discontinous picks",
};

const params: OperationParam[] = [incidentals];

const motif_inlet: OperationInlet = {
  name: "motif",
  type: "static",
  value: null,
  uses: "draft",
  dx: "The motif that you want to place. Defaults to the standard crackle weave motif.",
  num_drafts: 1,
};

const path_inlet: OperationInlet = {
  name: "path",
  type: "static",
  value: null,
  uses: "draft",
  dx: "The path to place the motif along. Should have exactly one black cell per warp.",
  num_drafts: 1,
};

const inlets = [motif_inlet, path_inlet];

const perform = (param_vals: Array<OpParamVal>, op_inputs: Array<OpInput>) => {
  const motifs = getAllDraftsAtInlet(op_inputs, 0);
  const paths = getAllDraftsAtInlet(op_inputs, 1);

  if (motifs.length == 0) return Promise.resolve([]);
  const motif = motifs[0];
  const motif_width = warps(motif.drawdown);
  const motif_height = wefts(motif.drawdown);

  if (paths.length == 0) return Promise.resolve([]);
  const path = paths[0];
  const path_width = warps(path.drawdown);
  const path_height = wefts(path.drawdown);

  const pattern = new Sequence.TwoD();

  let motif_start = 0;
  let motif_end = 0;
  for (let my = 0; my < motif_height; ++my) {
    if (getHeddle(motif.drawdown, my, 0)) {
      motif_start = my;
    }
    if (getHeddle(motif.drawdown, my, motif_width - 1)) {
      motif_end = my;
    }
  }
  const motif_offset = motif_end - motif_start;
  let last_found;
  for (let px = 0; px < path_width; ++px) {
    let path_pos;
    for (let py = 0; py < path_height; ++py) {
      const val = getHeddle(path.drawdown, py, px);
      if (val) {
        path_pos = py;
        break;
      }
    }
    if (path_pos !== undefined) {
      for (let mx = 0; mx < motif_width; ++mx) {
        const col = new Sequence.OneD();
        let found;
        for (let py = 0; py < path_height; ++py) {
          const mpos = (py + (path_height - path_pos)) % path_height;
          let val: boolean | null = false;
          if (mpos < motif_height) {
            val = getHeddle(motif.drawdown, mpos, mx);
            if (val) {
              found = py;
            }
          }
          col.push(val);
        }
        if (mx === 0 && found !== undefined && last_found !== undefined) {
          console.log("incidental? now " + found + " vs " + last_found);
          if (Math.abs(found - last_found) !== 1) {
            const incidentals = [];
            // We need one or more incidental
            if (found === last_found) {
              // they're the same, so add one in between
              console.log("same, add one");
              incidentals.push((found + 1) % path_height);
            } else if (Math.abs(found - last_found) > 1) {
              console.log("add multiple, shortest path");
              const diff = (found - last_found + path_height) % path_height;
              if (diff <= path_height / 2) {
                // take the shortest path, up
                for (let i = 1; i < diff; ++i) {
                  incidentals.push((last_found + i) % path_height);
                }
              } else {
                // or down
                for (let i = 1; i < path_height - diff; ++i) {
                  incidentals.push(
                    (last_found - i + path_height) % path_height
                  );
                }
              }
            }
            for (let incidental of incidentals) {
              const icol = new Sequence.OneD();

              for (let i = 0; i < path_height; ++i) {
                icol.push(i === incidental);
              }
              pattern.pushWarpSequence(icol.val());
            }
          }
        }
        pattern.pushWarpSequence(col.val());
        last_found = found;
      }
    }
  }
  return Promise.resolve([{ draft: initDraftFromDrawdown(pattern.export()) }]);
};

const sizeCheck = (param_vals: Array<OpParamVal>): boolean => {
  const cols: number = <number>getOpParamValById(0, param_vals);
  const rows: number = <number>getOpParamValById(1, param_vals);
  return cols * rows <= defaults.max_area ? true : false;
};

const generateName = (param_vals: Array<OpParamVal>): string => {
  const num_up: number = getOpParamValById(0, param_vals) as number;
  return num_up + "/crackle";
};

export const crackle: Operation = {
  name,
  meta,
  params,
  inlets,
  perform,
  generateName,
  sizeCheck,
};
