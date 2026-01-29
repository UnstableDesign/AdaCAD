"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getColorForSim = exports.getDiameter = exports.standardizeMaterialLists = exports.setMaterialStretch = exports.getMaterialStretch = exports.setMaterialID = exports.createMaterial = void 0;
const defaults_1 = require("../utils/defaults");
const utils_1 = require("../utils/utils");
const createMaterial = (matDict) => {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j;
    const m = {
        id: -1,
        name: '',
        stretch: 1,
        insert: true,
        visible: true,
        color: "#666666",
        thickness: 100,
        diameter: defaults_1.defaults.default_material_diameter,
        type: 0,
        notes: '',
        rgb: { r: 102, g: 102, b: 102 }
    };
    if (matDict) {
        m.id = (_a = matDict.id) !== null && _a !== void 0 ? _a : -1;
        m.name = (_b = matDict.name) !== null && _b !== void 0 ? _b : 'unnamed material';
        m.insert = (_c = matDict.insert) !== null && _c !== void 0 ? _c : true;
        m.visible = (_d = matDict.visible) !== null && _d !== void 0 ? _d : true;
        m.color = (_e = matDict.color) !== null && _e !== void 0 ? _e : "#666666";
        m.thickness = (_f = matDict.thickness) !== null && _f !== void 0 ? _f : defaults_1.defaults.default_material_diameter;
        m.diameter = (_g = matDict.diameter) !== null && _g !== void 0 ? _g : defaults_1.defaults.default_material_diameter;
        m.rgb = (0, utils_1.hexToRgb)(m.color.trim());
        m.type = (_h = matDict.type) !== null && _h !== void 0 ? _h : defaults_1.defaults.material_type;
        if (matDict.type === undefined)
            m.type = 0;
        m.notes = (_j = matDict.notes) !== null && _j !== void 0 ? _j : "";
    }
    return m;
};
exports.createMaterial = createMaterial;
const setMaterialID = (m, id) => {
    m.id = id;
    if (!m.name) {
        m.name = 'Material ' + (id + 1);
    }
    return m;
};
exports.setMaterialID = setMaterialID;
const getMaterialStretch = (m) => {
    return m.stretch;
};
exports.getMaterialStretch = getMaterialStretch;
const setMaterialStretch = (m, stretch) => {
    if (stretch > 1 || stretch < 0)
        console.error("STRETCH IS OUT OF BOUNDS ", stretch);
    if (stretch < 0)
        stretch = 0;
    if (stretch > 1)
        stretch = 1;
    m.stretch = stretch;
    return m;
};
exports.setMaterialStretch = setMaterialStretch;
/**
 * given a list of material mappings, returns a list where they are all the same size,
 * @param systems the material mappings to compare
 */
const standardizeMaterialLists = (shuttles) => {
    if (shuttles.length === 0)
        return [];
    const standard = shuttles.map(el => el.slice());
    //standardize teh lengths of all the returned arrays 
    const max_length = standard.reduce((acc, el) => {
        const len = el.length;
        if (len > acc)
            return len;
        else
            return acc;
    }, 0);
    standard.forEach((sys) => {
        if (sys.length < max_length) {
            for (let i = sys.length; i < max_length; i++) {
                sys.push(sys[0]);
            }
        }
    });
    return standard;
};
exports.standardizeMaterialLists = standardizeMaterialLists;
const getDiameter = (id, ms) => {
    const material = ms.find(el => el.id == id);
    if (material === undefined)
        return 0;
    return material.diameter;
};
exports.getDiameter = getDiameter;
const getColorForSim = (id, ms) => {
    const s = ms.find(el => el.id == id);
    if (s == undefined)
        return "0x000000";
    return parseInt(s.color.replace("#", "0x"), 16);
};
exports.getColorForSim = getColorForSim;
//# sourceMappingURL=material.js.map