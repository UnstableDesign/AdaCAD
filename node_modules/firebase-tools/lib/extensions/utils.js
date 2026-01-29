"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getResourceRuntime = exports.formatTimestamp = exports.getRandomString = exports.convertExtensionOptionToLabeledList = void 0;
const types_1 = require("./types");
function convertExtensionOptionToLabeledList(options) {
    return options.map((option) => {
        return {
            checked: false,
            name: option.label,
            value: option.value,
        };
    });
}
exports.convertExtensionOptionToLabeledList = convertExtensionOptionToLabeledList;
function getRandomString(length) {
    const SUFFIX_CHAR_SET = "abcdefghijklmnopqrstuvwxyz0123456789";
    let result = "";
    for (let i = 0; i < length; i++) {
        result += SUFFIX_CHAR_SET.charAt(Math.floor(Math.random() * SUFFIX_CHAR_SET.length));
    }
    return result;
}
exports.getRandomString = getRandomString;
function formatTimestamp(timestamp) {
    if (!timestamp) {
        return "";
    }
    const withoutMs = timestamp.split(".")[0];
    return withoutMs.replace("T", " ");
}
exports.formatTimestamp = formatTimestamp;
function getResourceRuntime(resource) {
    var _a, _b, _c;
    switch (resource.type) {
        case types_1.FUNCTIONS_RESOURCE_TYPE:
            return (_a = resource.properties) === null || _a === void 0 ? void 0 : _a.runtime;
        case types_1.FUNCTIONS_V2_RESOURCE_TYPE:
            return (_c = (_b = resource.properties) === null || _b === void 0 ? void 0 : _b.buildConfig) === null || _c === void 0 ? void 0 : _c.runtime;
        default:
            return undefined;
    }
}
exports.getResourceRuntime = getResourceRuntime;
