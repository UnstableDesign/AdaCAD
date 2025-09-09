import { Drawdown, getCellValue, InterlacementVal, wefts, warps } from "../draft"
import { density_units } from "../utils"
import { generateThreading, generateTreadlingforFrameLoom, numFrames, numTreadles, computeDrawdown, pasteDirectAndFrameThreading, calcWidth } from "./loom"
import { LoomUtil, LoomSettings, Loom } from "./types"


export const frame_utils: LoomUtil = {
  type: 'frame',
  displayname: 'shaft/treadle loom',
  dx: "draft from drawdown or threading/tieup/treadling. Assumes you are assigning treadles to specific frame via tieup",
  computeLoomFromDrawdown: (d: Drawdown, loom_settings: LoomSettings): Promise<Loom> => {

    const loom: Loom = {
      threading: [],
      tieup: [],
      treadling: []
    }

    return generateThreading(d)
      .then(threading => {
        loom.threading = threading.threading;
        return generateTreadlingforFrameLoom(d)
      })
      .then(treadling => {
        loom.treadling = treadling.treadling;

        loom.tieup = [];
        const num_frames = Math.max(numFrames(loom), loom_settings.frames);
        const num_treadles = Math.max(numTreadles(loom), loom_settings.treadles);

        for (let frames = 0; frames < num_frames; frames++) {
          loom.tieup.push([]);
          for (let treadles = 0; treadles < num_treadles; treadles++) {
            loom.tieup[frames].push(false);
          }
        }

        for (let i = 0; i < loom.treadling.length; i++) {
          if (loom.treadling[i].length > 0) {
            const active_treadle_id = loom.treadling[i][0];
            const row = d[i];
            row.forEach((cell, j) => {
              if (getCellValue(cell) == true) {
                const active_frame_id = loom.threading[j];
                loom.tieup[active_frame_id][active_treadle_id] = true;
              }
            });
          }
        }

        return loom;
      })



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

    return generateTreadlingforFrameLoom(d)
      .then(treadling => {
        new_loom.treadling = treadling.treadling;

        new_loom.tieup = [];
        const num_frames = Math.max(numFrames(l), loom_settings.frames);
        const num_treadles = Math.max(numTreadles(l), loom_settings.treadles);

        for (let frames = 0; frames < num_frames; frames++) {
          new_loom.tieup.push([]);
          for (let treadles = 0; treadles < num_treadles; treadles++) {
            new_loom.tieup[frames].push(false);
          }
        }

        for (let i = 0; i < new_loom.treadling.length; i++) {
          if (new_loom.treadling[i].length > 0) {
            const active_treadle_id = new_loom.treadling[i][0];
            const row = d[i];
            row.forEach((cell, j) => {
              if (getCellValue(cell) == true) {
                const active_frame_id = new_loom.threading[j];
                new_loom.tieup[active_frame_id][active_treadle_id] = true;
              }
            });
          }
        }

        return Promise.resolve(new_loom);
      })
  },
  updateThreading: (loom: Loom, ndx: InterlacementVal): Loom => {
    if (ndx.val) loom.threading[ndx.j] = ndx.i;
    else loom.threading[ndx.j] = -1;

    //in this case, we need to expand the size of the tieup to include a row for this threading
    // if(ndx.i >= loom.tieup.length){
    //   const treadles = numTreadles(loom);
    //   const difference = ndx.i - loom.tieup.length;
    //   console.log(difference);
    //   for(let x = 0; x <= difference; x++){
    //     let row = [];
    //     for(let j = 0; j < treadles; j++){
    //       row.push(false);
    //     }
    //     loom.tieup.push(row);
    //   }
    // }
    return loom;
  },
  updateTieup: (loom: Loom, ndx: InterlacementVal): Loom => {
    //based on the way that the draft viewer renders based on user specified frames and treadles (and not neccessarily how many frames and treadles are being used, we have to manually resize the tieup to fit the input)

    const frames = loom.tieup.length;
    const treadles = loom.tieup[0].length;
    if (ndx.i > frames) {
      const difference = ndx.i - loom.tieup.length;
      for (let x = 0; x <= difference; x++) {
        const row = [];
        for (let j = 0; j < treadles; j++) {
          row.push(false);
        }
        loom.tieup.push(row);
      }
    }

    if (ndx.j > treadles) {
      const difference = ndx.j - loom.tieup[0].length;
      for (let i = 0; i < loom.tieup.length; i++) {
        for (let x = 0; x <= difference; x++) {
          loom.tieup[i].push(false);
        }
      }
    }


    loom.tieup[ndx.i][ndx.j] = ndx.val;
    return loom;

  },
  updateTreadling: (loom: Loom, ndx: InterlacementVal): Loom => {
    if (ndx.val) {
      if (loom.treadling[ndx.i].length > 0) loom.treadling[ndx.i] = [];
      loom.treadling[ndx.i].push(ndx.j);
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
    //this acknowledges that there can only be one selected treadle per pic so it overwrites whatever is already present with the pasted option 

    for (let i = 0; i < height; i++) {
      const pattern_ndx_i = i % wefts(drawdown);
      const treadle_list = [];
      for (let j = 0; j < width; j++) {
        const pattern_ndx_j = j % warps(drawdown);
        if (getCellValue(drawdown[pattern_ndx_i][pattern_ndx_j]) == true) treadle_list.push(ndx.j + j);
      }
      //ensures every row only has one value
      if (treadle_list.length > 0) loom.treadling[ndx.i + i] = treadle_list.slice(0, 1);
      else loom.treadling[ndx.i + i] = [];
    }

    return loom;

  },

  pasteTieup: (loom: Loom, drawdown: Drawdown, ndx: InterlacementVal, width: number, height: number): Loom => {

    const rows = wefts(drawdown);
    const cols = warps(drawdown);

    //expand the size of tieups to make sure it can hold the new values
    const select_width = width + ndx.i;
    const select_height = height + ndx.j;

    for (let i = loom.tieup.length; i < select_height; i++) {
      loom.tieup.push([]);
      for (let j = loom.tieup[0].length; j < select_width; j++) {
        loom.tieup[i].push(false);
      }
    }

    for (let i = 0; i < height; i++) {
      for (let j = 0; j < width; j++) {
        const val = getCellValue(drawdown[i % rows][j % cols]);
        loom.tieup[ndx.i + i][ndx.j + j] = (val === true) ? true : false;
      }
    }

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

    const base_info =
      [
        { label: 'loom type', value: 'frame loom' },
        { label: 'warp density', value: ls.epi + " " + unit_string_text },
        { label: 'warp ends', value: warps(dd) + " ends" },
        { label: 'width', value: calcWidth(dd, ls) + " " + ls.units },

        { label: 'weft picks', value: wefts(dd) + " picks" },
        { label: 'frames', value: numFrames(loom) + " required, " + ls.frames + " available" },
        { label: 'treadles', value: numTreadles(loom) + " required, " + ls.treadles + " available" },
      ];

    for (let i = 0; i < numFrames(loom); i++) {

      const label = "# ends in frame " + (i + 1);
      const value = loom.threading.filter(el => el == i).length + ""
      base_info.push({ label, value })
    }

    for (let j = 0; j < numTreadles(loom); j++) {

      const label = "frames on treadle " + (j + 1);
      const value = loom.tieup.reduce((acc, el, ndx) => {
        if (el[j] == true)
          return acc + "" + (ndx + 1) + ",";
        else
          return acc;
      }, "")
      base_info.push({ label, value })
    }

    return base_info;
  }


}