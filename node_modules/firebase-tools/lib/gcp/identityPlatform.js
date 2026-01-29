"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateConfig = exports.setBlockingFunctionsConfig = exports.getConfig = exports.getBlockingFunctionsConfig = void 0;
const proto = require("./proto");
const api_1 = require("../api");
const apiv2_1 = require("../apiv2");
const API_VERSION = "v2";
const adminApiClient = new apiv2_1.Client({
    urlPrefix: (0, api_1.identityOrigin)() + "/admin",
    apiVersion: API_VERSION,
});
async function getBlockingFunctionsConfig(project) {
    const config = (await getConfig(project)) || {};
    if (!config.blockingFunctions) {
        config.blockingFunctions = {};
    }
    return config.blockingFunctions;
}
exports.getBlockingFunctionsConfig = getBlockingFunctionsConfig;
async function getConfig(project) {
    const response = await adminApiClient.get(`projects/${project}/config`);
    return response.body;
}
exports.getConfig = getConfig;
async function setBlockingFunctionsConfig(project, blockingConfig) {
    const config = (await updateConfig(project, { blockingFunctions: blockingConfig }, "blockingFunctions")) || {};
    if (!config.blockingFunctions) {
        config.blockingFunctions = {};
    }
    return config.blockingFunctions;
}
exports.setBlockingFunctionsConfig = setBlockingFunctionsConfig;
async function updateConfig(project, config, updateMask) {
    if (!updateMask) {
        updateMask = proto.fieldMasks(config).join(",");
    }
    const response = await adminApiClient.patch(`projects/${project}/config`, config, {
        queryParams: {
            updateMask,
        },
    });
    return response.body;
}
exports.updateConfig = updateConfig;
