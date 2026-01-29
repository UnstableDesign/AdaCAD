"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.retrieveRoleInfo = exports.displayResources = exports.displayEvents = exports.displayExternalServices = exports.displayExtensionVersionInfo = void 0;
const clc = require("colorette");
const semver = require("semver");
const path = require("path");
const refs = require("../extensions/refs");
const logger_1 = require("../logger");
const types_1 = require("./types");
const iam = require("../gcp/iam");
const secretsUtils_1 = require("./secretsUtils");
const TASKS_ROLE = "cloudtasks.enqueuer";
const TASKS_API = "cloudtasks.googleapis.com";
async function displayExtensionVersionInfo(args) {
    var _a, _b, _c, _d, _e, _f, _g;
    const { spec, extensionVersion, latestApprovedVersion, latestVersion } = args;
    const lines = [];
    const extensionRef = extensionVersion
        ? refs.toExtensionRef(refs.parse(extensionVersion === null || extensionVersion === void 0 ? void 0 : extensionVersion.ref))
        : "";
    lines.push(`${clc.bold("Extension:")} ${(_a = spec.displayName) !== null && _a !== void 0 ? _a : "Unnamed extension"} ${extensionRef ? `(${extensionRef})` : ""}`);
    if (spec.description) {
        lines.push(`${clc.bold("Description:")} ${spec.description}`);
    }
    let versionNote = "";
    const latestRelevantVersion = latestApprovedVersion || latestVersion;
    if (latestRelevantVersion && semver.eq(spec.version, latestRelevantVersion)) {
        versionNote = `- ${clc.green("Latest")}`;
    }
    if ((extensionVersion === null || extensionVersion === void 0 ? void 0 : extensionVersion.state) === "DEPRECATED") {
        versionNote = `- ${clc.red("Deprecated")}`;
    }
    lines.push(`${clc.bold("Version:")} ${spec.version} ${versionNote}`);
    if (extensionVersion) {
        let reviewStatus;
        switch ((_b = extensionVersion.listing) === null || _b === void 0 ? void 0 : _b.state) {
            case "APPROVED":
                reviewStatus = clc.bold(clc.green("Accepted"));
                break;
            case "REJECTED":
                reviewStatus = clc.bold(clc.red("Rejected"));
                break;
            default:
                reviewStatus = clc.bold(clc.yellow("Unreviewed"));
        }
        lines.push(`${clc.bold("Review status:")} ${reviewStatus}`);
        if (latestApprovedVersion) {
            lines.push(`${clc.bold("View in Extensions Hub:")} https://extensions.dev/extensions/${extensionRef}`);
        }
        if (extensionVersion.buildSourceUri) {
            const buildSourceUri = new URL(extensionVersion.buildSourceUri);
            buildSourceUri.pathname = path.join(buildSourceUri.pathname, (_c = extensionVersion.extensionRoot) !== null && _c !== void 0 ? _c : "");
            lines.push(`${clc.bold("Source in GitHub:")} ${buildSourceUri.toString()}`);
        }
        else {
            lines.push(`${clc.bold("Source download URI:")} ${(_d = extensionVersion.sourceDownloadUri) !== null && _d !== void 0 ? _d : "-"}`);
        }
    }
    lines.push(`${clc.bold("License:")} ${(_e = spec.license) !== null && _e !== void 0 ? _e : "-"}`);
    lines.push(displayResources(spec));
    if ((_f = spec.events) === null || _f === void 0 ? void 0 : _f.length) {
        lines.push(displayEvents(spec));
    }
    if ((_g = spec.externalServices) === null || _g === void 0 ? void 0 : _g.length) {
        lines.push(displayExternalServices(spec));
    }
    const apis = impliedApis(spec);
    if (apis.length) {
        lines.push(displayApis(apis));
    }
    const roles = impliedRoles(spec);
    if (roles.length) {
        lines.push(await displayRoles(roles));
    }
    logger_1.logger.info(`\n${lines.join("\n")}`);
    return lines;
}
exports.displayExtensionVersionInfo = displayExtensionVersionInfo;
function displayExternalServices(spec) {
    var _a, _b;
    const lines = (_b = (_a = spec.externalServices) === null || _a === void 0 ? void 0 : _a.map((service) => {
        return `  - ${clc.cyan(`${service.name} (${service.pricingUri})`)}`;
    })) !== null && _b !== void 0 ? _b : [];
    return clc.bold("External services used:\n") + lines.join("\n");
}
exports.displayExternalServices = displayExternalServices;
function displayEvents(spec) {
    var _a, _b;
    const lines = (_b = (_a = spec.events) === null || _a === void 0 ? void 0 : _a.map((event) => {
        return `  - ${clc.magenta(event.type)}${event.description ? `: ${event.description}` : ""}`;
    })) !== null && _b !== void 0 ? _b : [];
    return clc.bold("Events emitted:\n") + lines.join("\n");
}
exports.displayEvents = displayEvents;
function displayResources(spec) {
    var _a;
    const lines = spec.resources.map((resource) => {
        let type = resource.type;
        switch (resource.type) {
            case "firebaseextensions.v1beta.function":
                type = "Cloud Function (1st gen)";
                break;
            case "firebaseextensions.v1beta.v2function":
                type = "Cloud Function (2nd gen)";
                break;
            default:
        }
        return `  - ${clc.blueBright(`${resource.name} (${type})`)}${resource.description ? `: ${resource.description}` : ""}`;
    });
    lines.push(...new Set((_a = spec.lifecycleEvents) === null || _a === void 0 ? void 0 : _a.map((event) => {
        return `  - ${clc.blueBright(`${event.taskQueueTriggerFunction} (Cloud Task queue)`)}`;
    })));
    lines.push(...spec.params
        .filter((param) => {
        return param.type === "SECRET";
    })
        .map((param) => {
        return `  - ${clc.blueBright(`${param.param} (Cloud Secret Manager secret)`)}`;
    }));
    return clc.bold("Resources created:\n") + (lines.length ? lines.join("\n") : " - None");
}
exports.displayResources = displayResources;
async function retrieveRoleInfo(role) {
    const res = await iam.getRole(role);
    return `  - ${clc.yellow(res.title || res.name)}${res.description ? `: ${res.description}` : ""}`;
}
exports.retrieveRoleInfo = retrieveRoleInfo;
async function displayRoles(roles) {
    const lines = await Promise.all(roles.map((role) => {
        return retrieveRoleInfo(role.role);
    }));
    return clc.bold("Roles granted:\n") + lines.join("\n");
}
function displayApis(apis) {
    const lines = apis.map((api) => {
        return `  - ${clc.cyan(api.apiName)}: ${api.reason}`;
    });
    return clc.bold("APIs used:\n") + lines.join("\n");
}
function usesTasks(spec) {
    return spec.resources.some((r) => { var _a; return r.type === types_1.FUNCTIONS_RESOURCE_TYPE && ((_a = r.properties) === null || _a === void 0 ? void 0 : _a.taskQueueTrigger) !== undefined; });
}
function impliedRoles(spec) {
    var _a, _b, _c;
    const roles = [];
    if ((0, secretsUtils_1.usesSecrets)(spec) && !((_a = spec.roles) === null || _a === void 0 ? void 0 : _a.some((r) => r.role === secretsUtils_1.SECRET_ROLE))) {
        roles.push({
            role: secretsUtils_1.SECRET_ROLE,
            reason: "Allows the extension to read secret values from Cloud Secret Manager.",
        });
    }
    if (usesTasks(spec) && !((_b = spec.roles) === null || _b === void 0 ? void 0 : _b.some((r) => r.role === TASKS_ROLE))) {
        roles.push({
            role: TASKS_ROLE,
            reason: "Allows the extension to enqueue Cloud Tasks.",
        });
    }
    return roles.concat((_c = spec.roles) !== null && _c !== void 0 ? _c : []);
}
function impliedApis(spec) {
    var _a, _b;
    const apis = [];
    if (usesTasks(spec) && !((_a = spec.apis) === null || _a === void 0 ? void 0 : _a.some((a) => a.apiName === TASKS_API))) {
        apis.push({
            apiName: TASKS_API,
            reason: "Allows the extension to enqueue Cloud Tasks.",
        });
    }
    return apis.concat((_b = spec.apis) !== null && _b !== void 0 ? _b : []);
}
