import { Drawdown, wefts, getCellValue, InterlacementVal, warps } from "../draft";
import { filterToUniqueValues, density_units } from "../utils";
import { generateThreading, numFrames, numTreadles, generateDirectTieup, computeDrawdown, pasteDirectAndFrameThreading, calcWidth } from "./loom";
import { LoomUtil, LoomSettings, Loom } from "./types";

/**
 * contains the set of functions to be used when working on a direct tieup or dobby loom
 */
export const direct_utils: LoomUtil = {
  type: 'direct',
  displayname: 'direct-tie or dobby loom',
  dx: "draft from drawdown or threading/tieup/treadling. Assumes you are using a direct tie and mutiple treadle assignments",
  computeLoomFromDrawdown: (d: Drawdown, loom_settings: LoomSettings): Promise<Loom> => {

    const l: Loom = {
      threading: [],
      tieup: [],
      treadling: []
    }

    //now calculate threading 
    return generateThreading(d)
      .then(obj => {

        l.threading = obj.threading.slice();

        //add treadling
        for (let i = 0; i < wefts(d); i++) {
          const active_ts: Array<number> = [];
          const i_pattern = d[i].slice();
          i_pattern.forEach((cell, j) => {
            if (getCellValue(cell) == true) {
              const frame_assignment = obj.threading[j];
              if (frame_assignment !== -1) {
                active_ts.push(frame_assignment);
              }
            }
          });
          l.treadling[i] = <Array<number>>filterToUniqueValues(active_ts);
        }

        const num_frames = Math.max(numFrames(l), loom_settings.frames);
        const num_treadles = Math.max(numTreadles(l), loom_settings.treadles);
        const dim = Math.max(num_frames, num_treadles)


        l.tieup = generateDirectTieup(dim);

        return l;

      });

  },
  computeDrawdownFromLoom: (l: Loom): Promise<Drawdown> => {
    return computeDrawdown(l);
  },
  recomputeLoomFromThreadingAndDrawdown: (l: Loom, loom_settings: LoomSettings, d: Drawdown): Promise<Loom> => {
    const new_loom: Loom = {
      threading: l.threading.slice(),
      tieup: [],
      treadling: []
    }


    //add treadling
    for (let i = 0; i < wefts(d); i++) {
      const active_ts: Array<number> = [];
      const i_pattern = d[i].slice();
      i_pattern.forEach((cell, j) => {
        if (getCellValue(cell) == true) {
          const frame_assignment = new_loom.threading[j];
          if (frame_assignment !== -1) {
            active_ts.push(frame_assignment);
          }
        }
      });
      new_loom.treadling[i] = <Array<number>>filterToUniqueValues(active_ts);
    }

    const num_frames = Math.max(numFrames(l), loom_settings.frames);
    const num_treadles = Math.max(numTreadles(l), loom_settings.treadles);
    const dim = Math.max(num_frames, num_treadles)


    new_loom.tieup = generateDirectTieup(dim);
    return Promise.resolve(new_loom)

  },
  updateThreading: (loom: Loom, ndx: InterlacementVal) => {


    if (ndx.val) loom.threading[ndx.j] = ndx.i;
    else loom.threading[ndx.j] = -1;



    return loom;
  },
  updateTieup: (loom: Loom) => {
    return loom;
  },
  updateTreadling: (loom: Loom, ndx: InterlacementVal) => {
    if (ndx.val) {
      if (loom.treadling[ndx.i].find(el => el === ndx.j) === undefined) loom.treadling[ndx.i].push(ndx.j);
    } else {
      loom.treadling[ndx.i] = loom.treadling[ndx.i].filter(el => el !== ndx.j);
    }
    return loom;
  },
  insertIntoThreading: (loom: Loom, j: number, val: number): Loom => {
    loom.threading.splice(j, 0, val);
    return loom;
  },
  insertIntoTreadling: (loom: Loom, i: number, val: Array<number>): Loom => {
    loom.treadling.splice(i, 0, val);
    return loom;
  },
  pasteThreading: (loom: Loom, drawdown: Drawdown, ndx: InterlacementVal, width: number, height: number): Loom => {

    return pasteDirectAndFrameThreading(loom, drawdown, ndx, width, height);
  },
  pasteTreadling: (loom: Loom, drawdown: Drawdown, ndx: InterlacementVal, width: number, height: number): Loom => {

    //a direct loom can have multiple values per pic and can accept selections that do not span the full width of the treadling list. Therefore, we have to splice in the selected pattern into treadling rows. 
    for (let i = 0; i < height; i++) {
      const pattern_ndx_i = i % wefts(drawdown);
      //clears out treadles within the paste region
      const treadle_list = loom.treadling[ndx.i + i].filter(el => el < ndx.j || el > ndx.j + width - 1);


      for (let j = 0; j < width; j++) {
        const pattern_ndx_j = j % warps(drawdown);
        if (getCellValue(drawdown[pattern_ndx_i][pattern_ndx_j]) == true) treadle_list.push(j + ndx.j);
      }
      //
      loom.treadling[ndx.i + i] = treadle_list.slice(); //this will overwrite whatever was there 
    }
    return loom;

  },
  pasteTieup: (loom: Loom): Loom => {
    return loom;
  },
  deleteFromThreading: (loom: Loom, j: number): Loom => {
    loom.threading.splice(j, 1);
    return loom;
  },
  deleteFromTreadling: (loom: Loom, i: number): Loom => {
    loom.treadling.splice(i, 1);
    return loom;
  },
  getDressingInfo: (dd: Drawdown, loom: Loom, ls: LoomSettings): Array<{ label: string, value: string }> => {

    const unit_string = density_units.find(el => el.value == ls.units)
    const unit_string_text = (unit_string !== undefined) ? unit_string.viewValue : 'undefined';

    //start with the base info

    const base_info = [
      { label: 'loom type', value: 'direct tie/dobby' },
      { label: 'warp density', value: ls.epi + " " + unit_string_text },
      { label: 'warp ends', value: warps(dd) + " ends" },
      { label: 'width', value: calcWidth(dd, ls) + " " + ls.units },

      { label: 'weft picks', value: wefts(dd) + " picks" },
      { label: 'frames', value: numFrames(loom) + " required, " + ls.frames + " available" },

    ];

    for (let i = 0; i < numFrames(loom); i++) {

      const label = "# ends in frame " + (i + 1);
      const value = loom.threading.filter(el => el == i).length + ""
      base_info.push({ label, value })
    }
    return base_info;
  }
}