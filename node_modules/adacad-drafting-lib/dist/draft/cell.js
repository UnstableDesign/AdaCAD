"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cellToSequenceVal = exports.getCellValue = exports.setCellValue = exports.createCellFromSequenceVal = exports.toggleHeddle = exports.createCell = void 0;
const createCell = (setting) => {
    if (setting !== null && typeof setting !== 'boolean')
        console.error("CREATE CELL GOT NON BOOLEAN VALUE", setting);
    const c = {
        is_set: false,
        is_up: false
    };
    if (setting === null || setting === undefined) {
        c.is_set = false;
        c.is_up = false;
    }
    else {
        c.is_set = true;
        c.is_up = setting;
    }
    return c;
};
exports.createCell = createCell;
const toggleHeddle = (c) => {
    if (!c.is_set) {
        c.is_set = true;
        c.is_up = true;
    }
    else {
        c.is_up = !c.is_up;
    }
    return c;
};
exports.toggleHeddle = toggleHeddle;
const createCellFromSequenceVal = (val) => {
    const c = {
        is_set: false,
        is_up: false
    };
    switch (val) {
        case 0:
            c.is_set = true;
            c.is_up = false;
            break;
        case 1:
            c.is_set = true;
            c.is_up = true;
            break;
        case 2:
            c.is_set = false;
            c.is_up = false;
            break;
    }
    return c;
};
exports.createCellFromSequenceVal = createCellFromSequenceVal;
const setCellValue = (c, value) => {
    if (value === null) {
        c.is_up = false;
        c.is_set = false;
    }
    else {
        c.is_up = value;
        c.is_set = true;
    }
    return c;
};
exports.setCellValue = setCellValue;
const getCellValue = (c) => {
    if (c.is_set) {
        return c.is_up;
    }
    return null;
};
exports.getCellValue = getCellValue;
const cellToSequenceVal = (c) => {
    if (!c.is_set)
        return 2;
    return c.is_up ? 1 : 0;
};
exports.cellToSequenceVal = cellToSequenceVal;
//# sourceMappingURL=cell.js.map