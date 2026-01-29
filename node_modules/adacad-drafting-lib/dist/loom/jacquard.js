"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.jacquard_utils = void 0;
const draft_1 = require("../draft");
const utils_1 = require("../utils");
const loom_1 = require("./loom");
exports.jacquard_utils = {
    type: 'jacquard',
    displayname: 'jacquard loom',
    dx: "draft exclusively from drawdown, disregarding any frame and treadle information",
    getDressingInfo: (dd, loom, ls) => {
        const unit_string = utils_1.density_units.find(el => el.value == ls.units);
        const unit_string_text = (unit_string !== undefined) ? unit_string.viewValue : 'undefined';
        return [
            { label: 'loom type', value: 'jacquard' },
            { label: 'warp density', value: ls.epi + " " + unit_string_text },
            { label: 'warp ends', value: (0, draft_1.warps)(dd) + " ends" },
            { label: 'width', value: (0, loom_1.calcWidth)(dd, ls) + " " + ls.units },
            { label: 'weft picks', value: (0, draft_1.wefts)(dd) + " picks" }
        ];
    }
};
//# sourceMappingURL=jacquard.js.map