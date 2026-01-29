"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.direct_utils = void 0;
const draft_1 = require("../draft");
const utils_1 = require("../utils");
const loom_1 = require("./loom");
/**
 * contains the set of functions to be used when working on a direct tieup or dobby loom
 */
exports.direct_utils = {
    type: 'direct',
    displayname: 'direct-tie or dobby loom',
    dx: "draft from drawdown or threading/tieup/treadling. Assumes you are using a direct tie and mutiple treadle assignments",
    computeLoomFromDrawdown: (d, loom_settings) => {
        const l = {
            threading: [],
            tieup: [],
            treadling: []
        };
        //now calculate threading 
        return (0, loom_1.generateThreading)(d)
            .then(obj => {
            l.threading = obj.threading.slice();
            //add treadling
            for (let i = 0; i < (0, draft_1.wefts)(d); i++) {
                const active_ts = [];
                const i_pattern = d[i].slice();
                i_pattern.forEach((cell, j) => {
                    if ((0, draft_1.getCellValue)(cell) == true) {
                        const frame_assignment = obj.threading[j];
                        if (frame_assignment !== -1) {
                            active_ts.push(frame_assignment);
                        }
                    }
                });
                l.treadling[i] = (0, utils_1.filterToUniqueValues)(active_ts);
            }
            const num_frames = Math.max((0, loom_1.numFrames)(l), loom_settings.frames);
            const num_treadles = Math.max((0, loom_1.numTreadles)(l), loom_settings.treadles);
            const dim = Math.max(num_frames, num_treadles);
            l.tieup = (0, loom_1.generateDirectTieup)(dim);
            return l;
        });
    },
    computeDrawdownFromLoom: (l) => {
        return (0, loom_1.computeDrawdown)(l);
    },
    recomputeLoomFromThreadingAndDrawdown: (l, loom_settings, d) => {
        const new_loom = {
            threading: l.threading.slice(),
            tieup: [],
            treadling: []
        };
        //add treadling
        for (let i = 0; i < (0, draft_1.wefts)(d); i++) {
            const active_ts = [];
            const i_pattern = d[i].slice();
            i_pattern.forEach((cell, j) => {
                if ((0, draft_1.getCellValue)(cell) == true) {
                    const frame_assignment = new_loom.threading[j];
                    if (frame_assignment !== -1) {
                        active_ts.push(frame_assignment);
                    }
                }
            });
            new_loom.treadling[i] = (0, utils_1.filterToUniqueValues)(active_ts);
        }
        const num_frames = Math.max((0, loom_1.numFrames)(l), loom_settings.frames);
        const num_treadles = Math.max((0, loom_1.numTreadles)(l), loom_settings.treadles);
        const dim = Math.max(num_frames, num_treadles);
        new_loom.tieup = (0, loom_1.generateDirectTieup)(dim);
        return Promise.resolve(new_loom);
    },
    updateThreading: (loom, ndx) => {
        if (ndx.val)
            loom.threading[ndx.j] = ndx.i;
        else
            loom.threading[ndx.j] = -1;
        return loom;
    },
    updateTieup: (loom) => {
        return loom;
    },
    updateTreadling: (loom, ndx) => {
        if (ndx.val) {
            if (loom.treadling[ndx.i].find(el => el === ndx.j) === undefined)
                loom.treadling[ndx.i].push(ndx.j);
        }
        else {
            loom.treadling[ndx.i] = loom.treadling[ndx.i].filter(el => el !== ndx.j);
        }
        return loom;
    },
    insertIntoThreading: (loom, j, val) => {
        loom.threading.splice(j, 0, val);
        return loom;
    },
    insertIntoTreadling: (loom, i, val) => {
        loom.treadling.splice(i, 0, val);
        return loom;
    },
    pasteThreading: (loom, drawdown, ndx, width, height) => {
        return (0, loom_1.pasteDirectAndFrameThreading)(loom, drawdown, ndx, width, height);
    },
    pasteTreadling: (loom, drawdown, ndx, width, height) => {
        //a direct loom can have multiple values per pic and can accept selections that do not span the full width of the treadling list. Therefore, we have to splice in the selected pattern into treadling rows. 
        for (let i = 0; i < height; i++) {
            const pattern_ndx_i = i % (0, draft_1.wefts)(drawdown);
            //clears out treadles within the paste region
            const treadle_list = loom.treadling[ndx.i + i].filter(el => el < ndx.j || el > ndx.j + width - 1);
            for (let j = 0; j < width; j++) {
                const pattern_ndx_j = j % (0, draft_1.warps)(drawdown);
                if ((0, draft_1.getCellValue)(drawdown[pattern_ndx_i][pattern_ndx_j]) == true)
                    treadle_list.push(j + ndx.j);
            }
            //
            loom.treadling[ndx.i + i] = treadle_list.slice(); //this will overwrite whatever was there 
        }
        return loom;
    },
    pasteTieup: (loom) => {
        return loom;
    },
    deleteFromThreading: (loom, j) => {
        loom.threading.splice(j, 1);
        return loom;
    },
    deleteFromTreadling: (loom, i) => {
        loom.treadling.splice(i, 1);
        return loom;
    },
    getDressingInfo: (dd, loom, ls) => {
        const unit_string = utils_1.density_units.find(el => el.value == ls.units);
        const unit_string_text = (unit_string !== undefined) ? unit_string.viewValue : 'undefined';
        //start with the base info
        const base_info = [
            { label: 'loom type', value: 'direct tie/dobby' },
            { label: 'warp density', value: ls.epi + " " + unit_string_text },
            { label: 'warp ends', value: (0, draft_1.warps)(dd) + " ends" },
            { label: 'width', value: (0, loom_1.calcWidth)(dd, ls) + " " + ls.units },
            { label: 'weft picks', value: (0, draft_1.wefts)(dd) + " picks" },
            { label: 'frames', value: (0, loom_1.numFrames)(loom) + " required, " + ls.frames + " available" },
        ];
        for (let i = 0; i < (0, loom_1.numFrames)(loom); i++) {
            const label = "# ends in frame " + (i + 1);
            const value = loom.threading.filter(el => el == i).length + "";
            base_info.push({ label, value });
        }
        return base_info;
    }
};
//# sourceMappingURL=dobby.js.map