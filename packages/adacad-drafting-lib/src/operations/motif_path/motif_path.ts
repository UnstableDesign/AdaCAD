import {
  getAllDraftsAtInlet,
  Operation,
  OperationInlet,
  OperationParam,
  OpInput,
  OpMeta,
  OpParamVal,
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
import { compoundOp } from "../categories";

const name = "motif_path";

const meta: OpMeta = {
  displayname: "motif to path",
  advanced: true,
  categories: [compoundOp],
  authors: ["Alex McLean"],
  desc: "Originally inspired by a 'crackle' weave structure. This operation places a motif along a path.",
  // img: 'crackle.png'
};


const incidentals: BoolParam = {
  name: "Add incidentals",
  type: "boolean",
  truestate: "yes",
  falsestate: "no",
  value: 1,
  dx: "When selected, it will ensure that the motif adheres to the rule where each successive warp in the resulting draft can only shift up or down a weft (or shaft) by 1",
};

const params: OperationParam[] = [incidentals];

const motif_inlet: OperationInlet = {
  name: "motif",
  type: "static",
  value: null,
  uses: "draft",
  dx: "The motif that you want to place. Defaults to the standard crackle weave motif (1,2,3,2).",
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

const inlets = [path_inlet, motif_inlet];

const perform = (param_vals: Array<OpParamVal>, op_inputs: Array<OpInput>) => {
  const motifs = getAllDraftsAtInlet(op_inputs, 1);
  const paths = getAllDraftsAtInlet(op_inputs, 0);
  const add_incidentals = getOpParamValById(0, param_vals);

  let motif = null;
  if (motifs.length == 0) {
    //use standard 1,2,3,2, motif. 
    const arr = [
      [1, 0, 0, 0],
      [0, 1, 0, 1],
      [0, 0, 1, 0],
      [0, 0, 0, 0]
    ]
    motif = initDraftFromDrawdown(new Sequence.TwoD(arr).export());
  } else {
    motif = motifs[0];
  }
  const motif_width = warps(motif.drawdown);
  const motif_height = wefts(motif.drawdown);

  if (paths.length == 0) return Promise.resolve([]);
  const path = paths[0];
  const path_width = warps(path.drawdown);
  const path_height = wefts(path.drawdown);

  const pattern = new Sequence.TwoD();


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
          // console.log("incidental? now " + found + " vs " + last_found);
          if (Math.abs(found - last_found) !== 1) {
            const incidentals = [];
            // We need one or more incidental
            if (found === last_found) {
              // they're the same, so add one in between
              // console.log("same, add one");
              incidentals.push((found + 1) % path_height);
            } else if (Math.abs(found - last_found) > 1) {
              // console.log("add multiple, shortest path");
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

            // console.log("incidentals: ", incidentals, add_incidentals);
            if (add_incidentals) {
              for (const incidental of incidentals) {
                const icol = new Sequence.OneD();

                for (let i = 0; i < path_height; ++i) {
                  icol.push(i === incidental);
                }
                pattern.pushWarpSequence(icol.val());

              }
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

const sizeCheck = (param_vals: Array<OpParamVal>, op_inputs: Array<OpInput>): boolean => {
  const path = getAllDraftsAtInlet(op_inputs, 0);
  if (path.length == 0) return true;
  const dd = path[0].drawdown;
  const width = warps(dd);
  const height = wefts(dd);
  return width * height <= defaults.max_area ? true : false;
};

const generateName = (param_vals: Array<OpParamVal>): string => {
  const num_up: number = getOpParamValById(0, param_vals) as number;
  return num_up + "/crackle";
};

export const motif_path: Operation = {
  name,
  meta,
  params,
  inlets,
  perform,
  generateName,
  sizeCheck,
};
