"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.compileErrors = void 0;
const graphqlError_1 = require("../../../dataconnect/graphqlError");
const dataconnectEmulator_1 = require("../../../emulator/dataconnectEmulator");
async function compileErrors(configDir, errorFilter) {
    const errors = (await dataconnectEmulator_1.DataConnectEmulator.build({ configDir })).errors;
    return ((errors === null || errors === void 0 ? void 0 : errors.filter((e) => {
        var _a;
        const isOperationError = ["query", "mutation"].includes((_a = e.path) === null || _a === void 0 ? void 0 : _a[0]);
        if (errorFilter === "operations")
            return isOperationError;
        if (errorFilter === "schema")
            return !isOperationError;
        return true;
    }).map(graphqlError_1.prettify).join("\n")) || "");
}
exports.compileErrors = compileErrors;
