
import { frame_utils } from "./shafttreadle";
import { direct_utils } from "./dobby";
import { jacquard_utils } from "./jacquard";
import { getCellValue, setCellValue } from "../draft/cell";
import { colIsBlank, hasMatchingColumn, hasMatchingRow } from "../utils/utils";
import { Drawdown, warps, InterlacementVal, wefts, createBlankDrawdown, Interlacement } from "../draft";
import { Loom, LoomSettings, LoomUtil } from "./types";
import { defaults } from "../utils/defaults";

/*********** GENERIC FUNCTIONS RELATING TO LOOMS AND LOOM UTILS ************/


/**
 * creates an empty loom of the size specified. Mostly used for testing. 
 * @param warps 
 * @param wefts 
 * @param frames 
 * @param treadles 
 * @returns 
 */
export const initLoom = (warps: number, wefts: number, frames: number, treadles: number): Loom => {

  const l: Loom = {
    treadling: [],
    tieup: [],
    threading: []
  };

  for (let i = 0; i < wefts; i++) {
    l.treadling.push([]);
  }


  for (let j = 0; j < warps; j++) {
    l.threading.push(-1);
  }

  for (let i = 0; i < frames; i++) {
    l.tieup.push([]);
    for (let j = 0; j < treadles; j++) {
      l.tieup[i].push(false);
    }
  }

  return l;

}


export const copyLoom = (l: Loom): Loom => {
  const copy_loom = {
    threading: l.threading.slice(),
    treadling: JSON.parse(JSON.stringify(l.treadling)),//hack to deep copy 2D
    tieup: JSON.parse(JSON.stringify(l.tieup)),//hack to deep copy 2D
  }
  return copy_loom;
}

export const copyLoomSettings = (ls: LoomSettings): LoomSettings => {
  const copy_loomsettings = {
    type: ls.type ?? defaults.loom_settings.type,
    epi: ls.epi ?? defaults.loom_settings.epi,
    ppi: ls.ppi ?? defaults.loom_settings.ppi,
    units: ls.units ?? defaults.loom_settings.units,
    frames: ls.frames ?? defaults.loom_settings.frames,
    treadles: ls.treadles ?? defaults.loom_settings.treadles
  };
  return copy_loomsettings;
}


export const convertEPItoMM = (ls: LoomSettings): number => {


  if (ls.units == 'cm') {

    return (100 / ls.epi);
  } else {

    return (25.4 / ls.epi);
  }

}

export const calcWidth = (drawdown: Drawdown, loom_settings: LoomSettings): number => {

  if (loom_settings.units == 'in') {
    return warps(drawdown) / loom_settings.epi;
  } else {
    return warps(drawdown) / loom_settings.epi * 10;
  }

}

export const calcLength = (drawdown: Drawdown, loom_settings: LoomSettings): number => {

  if (loom_settings.units == 'in') {
    return wefts(drawdown) / loom_settings.ppi;
  } else {
    return wefts(drawdown) / loom_settings.ppi * 10;
  }

}


export const convertLoom = (drawdown: Drawdown, l: Loom, from_ls: LoomSettings, to_ls: LoomSettings): Promise<Loom | null> => {

  //if the loom is null, force the previous type to jcquard
  if (l == null) {
    from_ls.type = 'jacquard'
  }


  if (from_ls.type == to_ls.type) return Promise.resolve(l);
  if (from_ls == null || from_ls == undefined) return Promise.reject("no prior loom settings found");
  if (to_ls == null || to_ls == undefined) return Promise.reject("no current loom settings found");

  const utils = getLoomUtilByType(to_ls.type);

  if (from_ls.type === 'jacquard' && to_ls.type === 'direct') {
    const utils = getLoomUtilByType('direct');
    if (utils && typeof utils.computeLoomFromDrawdown === 'function') {
      return utils.computeLoomFromDrawdown(drawdown, to_ls);
    } else {
      return Promise.reject("Loom util for 'direct' is undefined or invalid");
    }
  } else if (from_ls.type === 'jacquard' && to_ls.type === 'frame') {
    if (utils && typeof utils.computeLoomFromDrawdown === 'function') {
      return utils.computeLoomFromDrawdown(drawdown, to_ls);
    } else {
      return Promise.reject("Loom util for 'frame' is undefined or invalid");
    }
  } else if (from_ls.type === 'direct' && to_ls.type === 'jacquard') {
    return Promise.resolve(null);
  } else if (from_ls.type == 'direct' && to_ls.type == 'frame') {
    // from direct-tie to floor
    const new_l = convertLiftPlanToTieup(l, to_ls);
    return Promise.resolve(new_l);
  } else if (from_ls.type === 'frame' && to_ls.type === 'jacquard') {
    return Promise.resolve(null);
  } else if (from_ls.type == 'frame' && to_ls.type == 'direct') {
    // from floor to direct
    //THIS IS BROKEN
    const converted_loom = convertTieupToLiftPlan(l, to_ls);
    return Promise.resolve(converted_loom);
  }

  return Promise.reject("Loom type conversion not found");

}





/*** SHARED FUNCTIONS USED WHEN COMPUTING LOOM STATESs ********/


export const pasteDirectAndFrameThreading = (loom: Loom, drawdown: Drawdown, ndx: InterlacementVal, width: number, height: number): Loom => {

  //update this function so that it doesn't assume the selection has been the full frame threading

  for (let j = 0; j < width; j++) {
    const pattern_ndx_j = j % warps(drawdown);
    const col: Array<number> = [];
    for (let i = 0; i < height; i++) {
      const pattern_ndx_i = i % wefts(drawdown);
      if (getCellValue(drawdown[pattern_ndx_i][pattern_ndx_j]) == true) col.push(ndx.i + i);
    }

    if (col.length == 0) loom.threading[ndx.j + j] = -1;
    else {
      loom.threading[ndx.j + j] = col.shift() ?? -1;
    }
  }

  return loom;

}


/**
 * computes the drawdown based on a given loom configuration
 * @param loom 
 * @returns the resulting drawdown
 */
export const computeDrawdown = (loom: Loom): Promise<Drawdown> => {

  const pattern = createBlankDrawdown(loom.treadling.length, loom.threading.length);
  for (let i = 0; i < loom.treadling.length; i++) {
    const active_treadles: Array<number> = loom.treadling[i].slice();
    if (active_treadles.length > 0) {
      active_treadles.forEach((treadle) => {


        for (let j = 0; j < loom.tieup.length; j++) {
          if (loom.tieup[j][treadle]) {
            for (let k = 0; k < loom.threading.length; k++) {
              if (loom.threading[k] == j) {
                pattern[i][k] = setCellValue(pattern[i][k], true);
              }
            }
          }
        }
      });
    }
  }

  return Promise.resolve(pattern);

}


/**
* generates a threading based on the provided drawdown
 * @param drawdown the drawdown to use 
 * @returns an object containing the threading pattern and the number of frames used
 */
export const generateThreading = (drawdown: Drawdown): Promise<{ threading: Array<number>, num: number }> => {
  let frame = -1;
  const threading: Array<number> = [];
  //always assign the origin to one
  //threading[] = -1;

  //progressively add new frames in the order they appear
  for (let j = 0; j < warps(drawdown); j++) {
    const blank = colIsBlank(j, drawdown);
    if (blank) threading[j] = -1;
    else {
      const match = hasMatchingColumn(j, drawdown);
      if (match === -1 || match > j) {
        frame++;
        threading[j] = frame;
      } else {
        threading[j] = threading[match];
      }
    }
  }

  return Promise.resolve({ threading: threading, num: frame });

}


/**
 * This function sets the treadling based on a adjusted pattern (e.g. a pattern that has been flipped based on the users selected origin point)
 * @param pattern the drawdown to use to generate the treadling
 * @returns an object containing the treadling and the total number of treadles used
 */
export const generateTreadlingforFrameLoom = (pattern: Drawdown): Promise<{ treadling: Array<Array<number>>, num: number }> => {
  let treadle = -1;
  const treadling: Array<Array<number>> = [];
  //always assign the origin to one

  //progressively add new frames in the order they appear
  for (let i = 0; i < pattern.length; i++) {

    const has_up = pattern[i].find(el => getCellValue(el) == true);
    if (has_up === undefined) treadling[i] = [];
    else {
      const match = hasMatchingRow(i, pattern);
      if (match === -1 || match > i) {
        treadle++;
        treadling[i] = [treadle];
      } else {
        treadling[i] = treadling[match];
      }
    }
  }
  return Promise.resolve({ treadling: treadling, num: treadle });

}


/**
 * generates a direct tieup for the give size
 * @param size the number of frames and treadles
 * @returns a tieup pattern of the specified size
 */
export const generateDirectTieup = (size: number): Array<Array<boolean>> => {
  //add tieup
  const tieup: Array<Array<boolean>> = [];
  for (let i = 0; i < size; i++) {
    tieup.push([]);
    for (let j = 0; j < size; j++) {
      if (i == j) tieup[i][j] = true;
      else tieup[i][j] = false;
    }
  }
  return tieup.slice();
}

/**
 * flips the draft horizontally and/or vertically. Used to flip the draft so that (0,0) is in the top left, no matter which origin point is selected
 * @param d the pattern to flip
 * @param horiz do horizontal flip?
 * @param vert do vertical flip?
 * @returns the flipped pattern
 */
// export const flipPattern = (d: Drawdown, horiz: boolean, vert: boolean) : Promise<Drawdown> => {


//   const d_flip = d.slice();
//   // for(let i = 0; i < d.length; i++){
//   //   d_flip.push([]);
//   //   for(let j = 0; j < d[i].length; j++){
//   //     if(horiz && vert) d_flip[i][j] = new Cell(d[d.length -1 - i][d[i].length - 1 - j].getHeddle());
//   //     if(horiz && !vert) d_flip[i][j] = new Cell(d[i][(d[i].length - 1 - j)].getHeddle());
//   //     if(!horiz && vert) d_flip[i][j] = new Cell(d[d.length -1 - i][j].getHeddle());
//   //     if(!horiz && !vert) d_flip[i][j] = new Cell(d[i][j].getHeddle());
//   //   }
//   // }

//   return Promise.resolve(d_flip);

// }

/**
 * calls the series of functions required to flip the looms to common origin based of user selected origin.
 * @param loom the original loom
 * @returns the flipped loom
 */
export const flipLoom = (loom: Loom): Promise<Loom> => {

  return Promise.resolve(loom);
  // if(loom === null || loom == undefined) return Promise.resolve(null);

  // const refs = [];
  // const new_loom = {
  //   threading: loom.threading.slice(), 
  //   tieup: loom.tieup.slice(),
  //   treadling: loom.treadling.slice()
  // }


  // const fns = [];
  //   if (vert){
  //     refs.push('treadling')
  //     fns.push(flipTreadling(loom.treadling));
  //   }
  //   if(horiz){
  //     refs.push('threading')
  //     fns.push(flipThreading(loom.threading))
  //   }

  //   return Promise.all(fns).then(res => {
  //     for(let i = 0; i < refs.length; i++){
  //       if(refs[i] === 'treadling') new_loom.treadling = res[i];
  //       if(refs[i] === 'threading') new_loom.threading = res[i];
  //     }

  //     return Promise.resolve(new_loom);

  //   });
}


/**
 * flips the threading order so that what was leftmost becomes rightmost
 * @param threading 
 * @returns the flipped threading order
 */
export const flipThreading = (threading: Array<number>): Promise<Array<number>> => {


  const t_flip = [];
  for (let i = 0; i < threading.length; i++) {
    t_flip[i] = threading[threading.length - 1 - i];
  }
  return Promise.resolve(t_flip);
}

/**
* flips the threading order so that what was leftmost becomes rightmost
* @param treadling 
* @returns the flipped threading order
*/
export const flipTreadling = (treadling: Array<Array<number>>): Promise<Array<Array<number>>> => {

  const t_flip = [];
  for (let i = 0; i < treadling.length; i++) {
    t_flip[i] = treadling[treadling.length - 1 - i].slice();
  }
  return Promise.resolve(t_flip);
}

/**
 * flips the threading order so that what was leftmost becomes rightmost
 * @param treadling 
 * @returns the flipped threading order
 */
export const flipTieUp = (tieup: Array<Array<boolean>>, horiz: boolean, vert: boolean): Promise<Array<Array<boolean>>> => {

  const t_flip: Array<Array<boolean>> = [];
  for (let i = 0; i < tieup.length; i++) {
    t_flip.push([]);
    for (let j = 0; j < tieup[i].length; j++) {
      if (horiz && vert) t_flip[i][j] = tieup[tieup.length - 1 - i][tieup[i].length - 1 - j];
      if (horiz && !vert) t_flip[i][j] = tieup[i][(tieup[i].length - 1 - j)];
      if (!horiz && vert) t_flip[i][j] = tieup[tieup.length - 1 - i][j];
      if (!horiz && !vert) t_flip[i][j] = tieup[i][j];
    }
  }

  return Promise.resolve(t_flip);
}

/**
 * returns the correct loom util object by string
 * @param type the type of loom you are using
 * @returns 
 */
export const getLoomUtilByType = (type: 'frame' | 'direct' | 'jacquard' | string): LoomUtil => {

  switch (type) {
    case 'frame': return frame_utils;
    case 'direct': return direct_utils;
    case 'jacquard': return jacquard_utils;
    default: return jacquard_utils;
  }

}

/**
 * calculates the total number of frames used in this loom
 * since its called frequently, keep an eye on this to make sure it isn't hanging page loading 
 * and/or call it once per needed function (instead of multiple times in one function)
 * @param loom 
 * @returns the highest number found in the array
 */
export const numFrames = (loom: Loom): number => {

  if (loom === null || loom === undefined) return 0;

  const max = loom.threading.reduce((acc, el) => {
    if (el > acc) {
      acc = el;
    }
    return acc;
  }, 0);
  return max + 1;
}

/**
 * calculates the total number of frames used in this loom
 * since its called frequently, keep an eye on this to make sure it isn't hanging page loading 
 * @param loom 
 * @returns the highest number found in the array
 */
export const numTreadles = (loom: Loom): number => {

  if (loom == null) return 0;

  const max = loom.treadling.reduce((acc, el) => {

    const max_in_list = el.reduce((sub_acc, sub_el) => {
      if (sub_el > acc) sub_acc = sub_el;
      return sub_acc;
    }, 0);

    if (max_in_list > acc) {
      acc = max_in_list;
    }
    return acc;
  }, 0);

  return max + 1;
}

/**
 * checks if a given interlacement is within the range of the threading
 * @param loom the loom to check with
 * @param ndx the interlacement to check
 * @returns true or false to determine if in or out of range
 */
export const isInThreadingRange = (loom: Loom, ndx: Interlacement): boolean => {
  if (ndx.i < 0) return false;
  if (ndx.i > numFrames(loom)) return false;
  if (ndx.j < 0) return false;
  if (ndx.j >= loom.threading.length) return false;
  return true;
}


/**
 * checks if a given interlacement is within the range of the threading specified by the user
 * @param loom the loom to check with
 * @param ndx the interlacement to check
 * @returns true or false to determine if in or out of range
 */
export const isInUserThreadingRange = (loom: Loom, loom_settings: LoomSettings, ndx: Interlacement): boolean => {

  const frames = Math.max(loom_settings.frames, numFrames(loom));

  if (ndx.i < 0) return false;
  if (ndx.i > frames) return false;
  if (ndx.j < 0) return false;
  if (ndx.j >= loom.threading.length) return false;
  return true;
}



/**
 * checks if a given interlacement is within the range of the threading
 * @param loom the loom to check with
 * @param ndx the interlacement to check
 * @returns true or false to determine if in or out of range
 */
export const isInTreadlingRange = (loom: Loom, ndx: Interlacement): boolean => {
  if (ndx.j < 0) return false;
  if (ndx.j > numTreadles(loom)) return false;
  if (ndx.i < 0) return false;
  if (ndx.i >= loom.treadling.length) return false;
  return true;
}

/**
 * checks if a given interlacement is within the range of the threading
 * @param loom the loom to check with
 * @param ndx the interlacement to check
 * @returns true or false to determine if in or out of range
 */
export const isInUserTreadlingRange = (loom: Loom, loom_settings: LoomSettings, ndx: Interlacement): boolean => {

  const treadling = Math.max(loom_settings.treadles, numTreadles(loom));

  if (ndx.j < 0) return false;
  if (ndx.j > treadling) return false;
  if (ndx.i < 0) return false;
  if (ndx.i >= loom.treadling.length) return false;
  return true;
}



/**
 * checks if a given interlacement is within the range of the threading
 * @param loom the loom to check with
 * @param ndx the interlacement to check
 * @returns true or false to determine if in or out of range
 */
export const isInTieupRange = (loom: Loom, ndx: Interlacement): boolean => {
  if (ndx.i < 0) return false;
  if (ndx.i > loom.tieup.length) return false;
  if (ndx.i < 0) return false;
  if (ndx.i >= loom.tieup[0].length) return false;
  return true;
}

/**
 * checks if a given interlacement is within the range of the threading including the user defined settings
 * @param loom the loom to check with
 * @param ndx the interlacement to check
 * @returns true or false to determine if in or out of range
 */
export const isInUserTieupRange = (loom: Loom, loom_settings: LoomSettings, ndx: Interlacement): boolean => {
  const frames = Math.max(loom_settings.frames, numFrames(loom));
  const treadling = Math.max(loom_settings.treadles, numTreadles(loom));

  if (ndx.i < 0) return false;
  if (ndx.i >= frames) return false;
  if (ndx.i < 0) return false;
  if (ndx.i >= treadling) return false;
  return true;
}


/** 
 * returns true if this loom typically requires a view of threading and tieup
 */

export const isFrame = (loom_settings: LoomSettings): boolean => {
  if (loom_settings.type !== 'jacquard') return true;
  return false;
}




/**
 * assumes the input to the function is a loom of type that uses a tieup and treadling and converts it to a loom that uses a direct tie and lift plan. 
 */
export const convertTieupToLiftPlan = (loom: Loom, ls: LoomSettings): Loom => {

  const max_frames = Math.max(numFrames(loom), ls.frames);
  const max_treadles = Math.max(numTreadles(loom), ls.treadles);
  const size = Math.max(max_frames, max_treadles);
  console.log("SIZE IS ", size, ls, loom)

  const converted: Loom = {
    threading: loom.threading.slice(),
    tieup: generateDirectTieup(size),
    treadling: []
  }

  converted.treadling = loom.treadling.map(treadle_vals => {

    if (treadle_vals.length == 0) return [];

    const active_treadle = treadle_vals[0];

    const tieupcol: Array<boolean> = loom.tieup.reduce((acc, el) => {
      return acc.concat(el[active_treadle])
    }, []);
    return tieupcol.map((el, ndx) => (el === true) ? ndx : -1).filter(el => el !== -1);
  });


  return converted;
}

/**
 * assumes the input to the function is a loom of type that uses a direct tie and lift plan and converts it to a loom that uses a tieup and treadling. 
 */
export const convertLiftPlanToTieup = (loom: Loom, ls: LoomSettings): Loom => {

  let tieup_ndx = 0;
  const shafts = ls.frames;
  const max_dim = Math.max(shafts, ls.treadles);
  const converted: Loom = {
    threading: loom.threading.slice(),
    tieup: generateDirectTieup(max_dim),
    treadling: []
  }

  //store the previous tieup
  const tieup_col: Array<boolean> = [];
  for (let i = 0; i < shafts; i++) {
    tieup_col.push(false);
  }

  const seen: string[] = [];

  //look at each pick
  loom.treadling.forEach(pick => {
    let pick_as_string: string = '';

    if (pick.length != 0) {

      pick_as_string = "";
      for (let i = 0; i < shafts; i++) {
        if (pick.findIndex(el => el == i) !== -1)
          pick_as_string = pick_as_string + '1';
        else
          pick_as_string = pick_as_string + '0';
      }

      const ndx = seen.findIndex(el => el == pick_as_string);
      if (ndx !== -1) {
        //this pick will be assigned to an existing tieup column
        converted.treadling.push([ndx]);
      } else {
        //make a black tieup column
        const col = tieup_col.slice();
        //assign each selected left to the associated shaft
        pick.forEach(el => col[el] = true);

        converted.treadling.push([tieup_ndx]);
        //push this into the tieup
        for (let i = 0; i < shafts; i++) {
          converted.tieup[i][tieup_ndx] = col[i];
        }
        seen.push(pick_as_string)
        tieup_ndx++;
      }
    } else {
      converted.treadling.push([]);
    }

  })



  return converted;
}
