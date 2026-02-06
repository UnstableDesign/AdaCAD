"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.makeSystemsUnique = exports.getSystemCharFromId = exports.getSystemChar = exports.setSystemId = exports.createSystem = void 0;
const utils_1 = require("../utils");
const createSystem = (systemDict) => {
    var _a, _b, _c, _d, _e;
    const sys = {
        id: (_a = systemDict.id) !== null && _a !== void 0 ? _a : 0,
        name: (_b = systemDict.name) !== null && _b !== void 0 ? _b : 'system',
        notes: (_c = systemDict.notes) !== null && _c !== void 0 ? _c : '',
        visible: (_d = systemDict.visible) !== null && _d !== void 0 ? _d : true,
        in_use: (_e = systemDict.in_use) !== null && _e !== void 0 ? _e : true
    };
    return sys;
};
exports.createSystem = createSystem;
const setSystemId = (sys, id) => {
    sys.id = id;
    if (!sys.name) {
        sys.name = 'System ' + (id + 1);
    }
    return sys;
};
exports.setSystemId = setSystemId;
const getSystemChar = (sys) => {
    return String.fromCharCode(97 + sys.id);
};
exports.getSystemChar = getSystemChar;
const getSystemCharFromId = (id) => {
    return String.fromCharCode(97 + id);
};
exports.getSystemCharFromId = getSystemCharFromId;
/**
  * takes system maps and makes them all unique by adding a base value to the n+1th map. This helps when interlacing
  * drafts that have different system mappings, and making sure they are each unique.
  * This function will also return standard sized arrays = to the maximum sized input
 * @param systems a 2D array of systems, each row representing a the systems of a different draft.
 * @returns
 */
const makeSystemsUnique = (systems) => {
    if (systems.length === 0)
        return [];
    const max_in_systems = systems.map(el => (0, utils_1.getArrayMax)(el));
    let last_max = 0;
    const unique_systems = systems.map((sys, ndx) => {
        if (ndx > 0) {
            last_max += (max_in_systems[ndx - 1] + 1);
            return sys.map(el => el + last_max);
        }
        else {
            return sys;
        }
    });
    //standardize teh lengths of all the returned arrays 
    const max_length = unique_systems.reduce((acc, el) => {
        const len = el.length;
        if (len > acc)
            return len;
        else
            return acc;
    }, 0);
    unique_systems.forEach((sys) => {
        if (sys.length < max_length) {
            for (let i = sys.length; i < max_length; i++) {
                sys.push(sys[0]);
            }
        }
    });
    return unique_systems;
};
exports.makeSystemsUnique = makeSystemsUnique;
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
//# sourceMappingURL=system.js.map