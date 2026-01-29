"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.equal = exports.toExtensionVersionName = exports.toExtensionName = exports.toExtensionVersionRef = exports.toExtensionRef = exports.parse = void 0;
const semver = require("semver");
const error_1 = require("../error");
const refRegex = new RegExp(/^([^/@\n]+)\/{1}([^/@\n]+)(@{1}([^\n]+)|)$/);
function parse(refOrName) {
    const ret = parseRef(refOrName) || parseName(refOrName);
    if (!ret || !ret.publisherId || !ret.extensionId) {
        throw new error_1.FirebaseError(`Unable to parse ${refOrName} as an extension ref.\n` +
            "Expected format is either publisherId/extensionId@version or " +
            "publishers/publisherId/extensions/extensionId/versions/version. If you " +
            "are referring to a local extension directory, please ensure the directory exists.");
    }
    if (ret.version &&
        !semver.valid(ret.version) &&
        !semver.validRange(ret.version) &&
        !["latest", "latest-approved"].includes(ret.version)) {
        throw new error_1.FirebaseError(`Extension reference ${JSON.stringify(ret, null, 2)} contains an invalid version ${ret.version}.`);
    }
    return ret;
}
exports.parse = parse;
function parseRef(ref) {
    const parts = refRegex.exec(ref);
    if (parts && (parts.length === 5 || parts.length === 7)) {
        return {
            publisherId: parts[1],
            extensionId: parts[2],
            version: parts[4],
        };
    }
}
function parseName(name) {
    const parts = name.split("/");
    if (parts[0] !== "publishers" || parts[2] !== "extensions") {
        return;
    }
    if (parts.length === 4) {
        return {
            publisherId: parts[1],
            extensionId: parts[3],
        };
    }
    if (parts.length === 6 && parts[4] === "versions") {
        return {
            publisherId: parts[1],
            extensionId: parts[3],
            version: parts[5],
        };
    }
}
function toExtensionRef(ref) {
    return `${ref.publisherId}/${ref.extensionId}`;
}
exports.toExtensionRef = toExtensionRef;
function toExtensionVersionRef(ref) {
    if (!ref.version) {
        throw new error_1.FirebaseError(`Ref does not have a version`);
    }
    return `${ref.publisherId}/${ref.extensionId}@${ref.version}`;
}
exports.toExtensionVersionRef = toExtensionVersionRef;
function toExtensionName(ref) {
    return `publishers/${ref.publisherId}/extensions/${ref.extensionId}`;
}
exports.toExtensionName = toExtensionName;
function toExtensionVersionName(ref) {
    if (!ref.version) {
        throw new error_1.FirebaseError(`Ref does not have a version`);
    }
    return `publishers/${ref.publisherId}/extensions/${ref.extensionId}/versions/${ref.version}`;
}
exports.toExtensionVersionName = toExtensionVersionName;
function equal(a, b) {
    return (!!a &&
        !!b &&
        a.publisherId === b.publisherId &&
        a.extensionId === b.extensionId &&
        a.version === b.version);
}
exports.equal = equal;
