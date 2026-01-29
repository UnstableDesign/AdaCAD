"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.populateDefaultParams = exports.isSystemParam = exports.readEnvFile = exports.promptForNewParams = exports.getParamsForUpdate = exports.getParams = exports.setNewDefaults = exports.buildBindingOptionsWithBaseValue = exports.getBaseParamBindings = void 0;
const path = require("path");
const clc = require("colorette");
const fs = require("fs-extra");
const error_1 = require("../error");
const logger_1 = require("../logger");
const extensionsHelper_1 = require("./extensionsHelper");
const askUserForParam = require("./askUserForParam");
const env = require("../functions/env");
const NONINTERACTIVE_ERROR_MESSAGE = "As of firebase-tools@11, `ext:install`, `ext:update` and `ext:configure` are interactive only commands. " +
    "To deploy an extension noninteractively, use an extensions manifest and `firebase deploy --only extensions`.  " +
    "See https://firebase.google.com/docs/extensions/manifest for more details";
function getBaseParamBindings(params) {
    let ret = {};
    for (const [k, v] of Object.entries(params)) {
        ret = Object.assign(Object.assign({}, ret), { [k]: v.baseValue });
    }
    return ret;
}
exports.getBaseParamBindings = getBaseParamBindings;
function buildBindingOptionsWithBaseValue(baseParams) {
    let paramOptions = {};
    for (const [k, v] of Object.entries(baseParams)) {
        paramOptions = Object.assign(Object.assign({}, paramOptions), { [k]: { baseValue: v } });
    }
    return paramOptions;
}
exports.buildBindingOptionsWithBaseValue = buildBindingOptionsWithBaseValue;
function setNewDefaults(params, newDefaults) {
    for (const param of params) {
        if (newDefaults[param.param]) {
            param.default = newDefaults[param.param];
        }
        else if (param.param === `firebaseextensions.v1beta.function/location` &&
            newDefaults["LOCATION"]) {
            param.default = newDefaults["LOCATION"];
        }
    }
    return params;
}
exports.setNewDefaults = setNewDefaults;
async function getParams(args) {
    let params;
    if (args.nonInteractive) {
        throw new error_1.FirebaseError(NONINTERACTIVE_ERROR_MESSAGE);
    }
    else {
        const firebaseProjectParams = await (0, extensionsHelper_1.getFirebaseProjectParams)(args.projectId);
        params = await askUserForParam.ask({
            projectId: args.projectId,
            instanceId: args.instanceId,
            paramSpecs: args.paramSpecs,
            firebaseProjectParams,
            reconfiguring: !!args.reconfiguring,
        });
    }
    return params;
}
exports.getParams = getParams;
async function getParamsForUpdate(args) {
    let params;
    if (args.nonInteractive) {
        throw new error_1.FirebaseError(NONINTERACTIVE_ERROR_MESSAGE);
    }
    else {
        params = await promptForNewParams({
            spec: args.spec,
            newSpec: args.newSpec,
            currentParams: args.currentParams,
            projectId: args.projectId,
            instanceId: args.instanceId,
        });
    }
    return params;
}
exports.getParamsForUpdate = getParamsForUpdate;
async function promptForNewParams(args) {
    var _a, _b;
    const newParamBindingOptions = buildBindingOptionsWithBaseValue(args.currentParams);
    const firebaseProjectParams = await (0, extensionsHelper_1.getFirebaseProjectParams)(args.projectId);
    const sameParam = (param1) => (param2) => {
        return param1.type === param2.type && param1.param === param2.param;
    };
    const paramDiff = (left, right) => {
        return left.filter((aLeft) => !right.find(sameParam(aLeft)));
    };
    let combinedOldParams = args.spec.params.concat((_a = args.spec.systemParams.filter((p) => !p.advanced)) !== null && _a !== void 0 ? _a : []);
    let combinedNewParams = args.newSpec.params.concat((_b = args.newSpec.systemParams.filter((p) => !p.advanced)) !== null && _b !== void 0 ? _b : []);
    if (combinedOldParams.some((p) => p.param === "LOCATION") &&
        combinedNewParams.some((p) => p.param === "firebaseextensions.v1beta.function/location") &&
        !!args.currentParams["LOCATION"]) {
        newParamBindingOptions["firebaseextensions.v1beta.function/location"] = {
            baseValue: args.currentParams["LOCATION"],
        };
        delete newParamBindingOptions["LOCATION"];
        combinedOldParams = combinedOldParams.filter((p) => p.param !== "LOCATION");
        combinedNewParams = combinedNewParams.filter((p) => p.param !== "firebaseextensions.v1beta.function/location");
    }
    const oldParams = combinedOldParams.filter((p) => Object.keys(args.currentParams).includes(p.param));
    let paramsDiffDeletions = paramDiff(oldParams, combinedNewParams);
    paramsDiffDeletions = (0, extensionsHelper_1.substituteParams)(paramsDiffDeletions, firebaseProjectParams);
    let paramsDiffAdditions = paramDiff(combinedNewParams, oldParams);
    paramsDiffAdditions = (0, extensionsHelper_1.substituteParams)(paramsDiffAdditions, firebaseProjectParams);
    if (paramsDiffDeletions.length) {
        logger_1.logger.info("The following params will no longer be used:");
        for (const param of paramsDiffDeletions) {
            logger_1.logger.info(clc.red(`- ${param.param}: ${args.currentParams[param.param.toUpperCase()]}`));
            delete newParamBindingOptions[param.param.toUpperCase()];
        }
    }
    if (paramsDiffAdditions.length) {
        logger_1.logger.info("To update this instance, configure the following new parameters:");
        for (const param of paramsDiffAdditions) {
            const chosenValue = await askUserForParam.askForParam({
                projectId: args.projectId,
                instanceId: args.instanceId,
                paramSpec: param,
                reconfiguring: false,
            });
            newParamBindingOptions[param.param] = chosenValue;
        }
    }
    return newParamBindingOptions;
}
exports.promptForNewParams = promptForNewParams;
function readEnvFile(envPath) {
    const buf = fs.readFileSync(path.resolve(envPath), "utf8");
    const result = env.parse(buf.toString().trim());
    if (result.errors.length) {
        throw new error_1.FirebaseError(`Error while parsing ${envPath} - unable to parse following lines:\n${result.errors.join("\n")}`);
    }
    return result.envs;
}
exports.readEnvFile = readEnvFile;
function isSystemParam(paramName) {
    const regex = /^firebaseextensions\.[a-zA-Z0-9\.]*\//;
    return regex.test(paramName);
}
exports.isSystemParam = isSystemParam;
function populateDefaultParams(params, spec) {
    var _a;
    const ret = Object.assign({}, params);
    for (const p of spec.params) {
        ret[p.param] = (_a = ret[p.param]) !== null && _a !== void 0 ? _a : p.default;
    }
    return ret;
}
exports.populateDefaultParams = populateDefaultParams;
