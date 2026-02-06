"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.frame_utils = void 0;
const draft_1 = require("../draft");
const utils_1 = require("../utils");
const loom_1 = require("./loom");
exports.frame_utils = {
    type: 'frame',
    displayname: 'shaft/treadle loom',
    dx: "draft from drawdown or threading/tieup/treadling. Assumes you are assigning treadles to specific frame via tieup",
    computeLoomFromDrawdown: (d, loom_settings) => {
        const loom = {
            threading: [],
            tieup: [],
            treadling: []
        };
        return (0, loom_1.generateThreading)(d)
            .then(threading => {
            loom.threading = threading.threading;
            return (0, loom_1.generateTreadlingforFrameLoom)(d);
        })
            .then(treadling => {
            loom.treadling = treadling.treadling;
            loom.tieup = [];
            const num_frames = Math.max((0, loom_1.numFrames)(loom), loom_settings.frames);
            const num_treadles = Math.max((0, loom_1.numTreadles)(loom), loom_settings.treadles);
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
                        if ((0, draft_1.getCellValue)(cell) == true) {
                            const active_frame_id = loom.threading[j];
                            loom.tieup[active_frame_id][active_treadle_id] = true;
                        }
                    });
                }
            }
            return loom;
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
        return (0, loom_1.generateTreadlingforFrameLoom)(d)
            .then(treadling => {
            new_loom.treadling = treadling.treadling;
            new_loom.tieup = [];
            const num_frames = Math.max((0, loom_1.numFrames)(l), loom_settings.frames);
            const num_treadles = Math.max((0, loom_1.numTreadles)(l), loom_settings.treadles);
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
                        if ((0, draft_1.getCellValue)(cell) == true) {
                            const active_frame_id = new_loom.threading[j];
                            new_loom.tieup[active_frame_id][active_treadle_id] = true;
                        }
                    });
                }
            }
            return Promise.resolve(new_loom);
        });
    },
    updateThreading: (loom, ndx) => {
        if (ndx.val)
            loom.threading[ndx.j] = ndx.i;
        else
            loom.threading[ndx.j] = -1;
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
    updateTieup: (loom, ndx) => {
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
    updateTreadling: (loom, ndx) => {
        if (ndx.val) {
            if (loom.treadling[ndx.i].length > 0)
                loom.treadling[ndx.i] = [];
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
        //this acknowledges that there can only be one selected treadle per pic so it overwrites whatever is already present with the pasted option 
        for (let i = 0; i < height; i++) {
            const pattern_ndx_i = i % (0, draft_1.wefts)(drawdown);
            const treadle_list = [];
            for (let j = 0; j < width; j++) {
                const pattern_ndx_j = j % (0, draft_1.warps)(drawdown);
                if ((0, draft_1.getCellValue)(drawdown[pattern_ndx_i][pattern_ndx_j]) == true)
                    treadle_list.push(ndx.j + j);
            }
            //ensures every row only has one value
            if (treadle_list.length > 0)
                loom.treadling[ndx.i + i] = treadle_list.slice(0, 1);
            else
                loom.treadling[ndx.i + i] = [];
        }
        return loom;
    },
    pasteTieup: (loom, drawdown, ndx, width, height) => {
        const rows = (0, draft_1.wefts)(drawdown);
        const cols = (0, draft_1.warps)(drawdown);
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
                const val = (0, draft_1.getCellValue)(drawdown[i % rows][j % cols]);
                loom.tieup[ndx.i + i][ndx.j + j] = (val === true) ? true : false;
            }
        }
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
        const base_info = [
            { label: 'loom type', value: 'frame loom' },
            { label: 'warp density', value: ls.epi + " " + unit_string_text },
            { label: 'warp ends', value: (0, draft_1.warps)(dd) + " ends" },
            { label: 'width', value: (0, loom_1.calcWidth)(dd, ls) + " " + ls.units },
            { label: 'weft picks', value: (0, draft_1.wefts)(dd) + " picks" },
            { label: 'frames', value: (0, loom_1.numFrames)(loom) + " required, " + ls.frames + " available" },
            { label: 'treadles', value: (0, loom_1.numTreadles)(loom) + " required, " + ls.treadles + " available" },
        ];
        for (let i = 0; i < (0, loom_1.numFrames)(loom); i++) {
            const label = "# ends in frame " + (i + 1);
            const value = loom.threading.filter(el => el == i).length + "";
            base_info.push({ label, value });
        }
        for (let j = 0; j < (0, loom_1.numTreadles)(loom); j++) {
            const label = "frames on treadle " + (j + 1);
            const value = loom.tieup.reduce((acc, el, ndx) => {
                if (el[j] == true)
                    return acc + "" + (ndx + 1) + ",";
                else
                    return acc;
            }, "");
            base_info.push({ label, value });
        }
        return base_info;
    }
};
//# sourceMappingURL=shafttreadle.js.map