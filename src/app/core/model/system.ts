import { System } from "adacad-drafting-lib";
import utilInstance from "./util";



export const createSystem = (systemDict = null): System => {

  const sys = {
    id: 0,
    name: 'system',
    notes: '',
    visible: true,
    in_use: true
  }

  if (systemDict) {
    sys.id = systemDict.id;
    sys.id = systemDict.name;
    sys.id = systemDict.notes;
    sys.id = systemDict.visible;
  }

  return sys;
}

export const setSystemId = (sys: System, id: number): System => {
  sys.id = id;
  if (!sys.name) {
    sys.name = 'System ' + (id + 1);
  }
  return sys;
}

export const getSystemChar = (sys: System): string => {
  return String.fromCharCode(97 + sys.id)
}


export const getSystemCharFromId = (id: number): string => {
  return String.fromCharCode(97 + id)
}
/**
  * takes system maps and makes them all unique by adding a base value to the n+1th map. This helps when interlacing 
  * drafts that have different system mappings, and making sure they are each unique. 
  * This function will also return standard sized arrays = to the maximum sized input
 * @param systems a 2D array of systems, each row representing a the systems of a different draft. 
 * @returns 
 */

export const makeSystemsUnique = (systems: Array<Array<number>>): Array<Array<number>> => {


  if (systems.length === 0) return [];


  const max_in_systems: Array<number> = systems.map(el => utilInstance.getArrayMax(el));

  let last_max = 0;
  const unique_systems = systems.map((sys, ndx) => {
    if (ndx > 0) {
      last_max += (max_in_systems[ndx - 1] + 1)
      return sys.map(el => el + last_max);
    } else {
      return sys;
    }
  });

  //standardize teh lengths of all the returned arrays 
  const max_length: number = unique_systems.reduce((acc, el) => {
    const len = el.length;
    if (len > acc) return len;
    else return acc;
  }, 0);


  unique_systems.forEach((sys, ndx) => {
    if (sys.length < max_length) {
      for (let i = sys.length; i < max_length; i++) {
        sys.push(sys[0]);
      }
    }
  });

  return unique_systems;
}


// export const  makeWeftSystemsUnique = (systems: Array<Array<number>>) : Array<Array<number>> => {

//  const unique = makeSystemsUnique(systems);

//  return unique;
// }

// export const makeWarpSystemsUnique = (systems: Array<Array<number>>) : Array<Array<number>> => {

//  const unique = makeSystemsUnique(systems);

// //  unique.forEach(system => {
// //    system.forEach(el => {
// //      if(this.getWarpSystem(el) === undefined) this.addWarpSystemFromId(el);
// //    })
// //  })

//  return unique;
// }


