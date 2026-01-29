"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRuntime = exports.DEFAULT_RUNTIME = exports.getFunctionProperties = exports.getFunctionResourcesWithParamSubstitution = exports.readPostinstall = exports.readExtensionYaml = void 0;
const supported = require("../../deploy/functions/runtimes/supported");
const error_1 = require("../../error");
const extensionsHelper_1 = require("../extensionsHelper");
const utils_1 = require("../utils");
const utils_2 = require("../../utils");
const SPEC_FILE = "extension.yaml";
const POSTINSTALL_FILE = "POSTINSTALL.md";
const validFunctionTypes = [
    "firebaseextensions.v1beta.function",
    "firebaseextensions.v1beta.v2function",
    "firebaseextensions.v1beta.scheduledFunction",
];
async function readExtensionYaml(directory) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j;
    const extensionYaml = await (0, utils_2.readFileFromDirectory)(directory, SPEC_FILE);
    const source = extensionYaml.source;
    const spec = (0, utils_2.wrappedSafeLoad)(source);
    spec.params = (_a = spec.params) !== null && _a !== void 0 ? _a : [];
    spec.systemParams = (_b = spec.systemParams) !== null && _b !== void 0 ? _b : [];
    spec.resources = (_c = spec.resources) !== null && _c !== void 0 ? _c : [];
    spec.apis = (_d = spec.apis) !== null && _d !== void 0 ? _d : [];
    spec.roles = (_e = spec.roles) !== null && _e !== void 0 ? _e : [];
    spec.externalServices = (_f = spec.externalServices) !== null && _f !== void 0 ? _f : [];
    spec.events = (_g = spec.events) !== null && _g !== void 0 ? _g : [];
    spec.lifecycleEvents = (_h = spec.lifecycleEvents) !== null && _h !== void 0 ? _h : [];
    spec.contributors = (_j = spec.contributors) !== null && _j !== void 0 ? _j : [];
    return spec;
}
exports.readExtensionYaml = readExtensionYaml;
async function readPostinstall(directory) {
    const content = await (0, utils_2.readFileFromDirectory)(directory, POSTINSTALL_FILE);
    return content.source;
}
exports.readPostinstall = readPostinstall;
function getFunctionResourcesWithParamSubstitution(extensionSpec, params) {
    const rawResources = extensionSpec.resources.filter((resource) => validFunctionTypes.includes(resource.type));
    return (0, extensionsHelper_1.substituteParams)(rawResources, params);
}
exports.getFunctionResourcesWithParamSubstitution = getFunctionResourcesWithParamSubstitution;
function getFunctionProperties(resources) {
    return resources.map((r) => r.properties);
}
exports.getFunctionProperties = getFunctionProperties;
exports.DEFAULT_RUNTIME = supported.latest("nodejs");
function getRuntime(resources) {
    if (resources.length === 0) {
        return exports.DEFAULT_RUNTIME;
    }
    const invalidRuntimes = [];
    const runtimes = resources.map((r) => {
        const runtime = (0, utils_1.getResourceRuntime)(r);
        if (!runtime) {
            return exports.DEFAULT_RUNTIME;
        }
        if (!supported.runtimeIsLanguage(runtime, "nodejs")) {
            invalidRuntimes.push(runtime);
            return exports.DEFAULT_RUNTIME;
        }
        return runtime;
    });
    if (invalidRuntimes.length) {
        throw new error_1.FirebaseError(`The following runtimes are not supported by the Emulator Suite: ${invalidRuntimes.join(", ")}. \n Only Node runtimes are supported.`);
    }
    return supported.latest("nodejs", runtimes);
}
exports.getRuntime = getRuntime;
