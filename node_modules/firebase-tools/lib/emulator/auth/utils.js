"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mirrorFieldTo = exports.authEmulatorUrl = exports.logError = exports.toUnixTimestamp = exports.randomDigits = exports.randomBase64UrlStr = exports.randomId = exports.parseAbsoluteUri = exports.canonicalizeEmailAddress = exports.isValidPhoneNumber = exports.isValidEmailAddress = void 0;
const url_1 = require("url");
const registry_1 = require("../registry");
const types_1 = require("../types");
const emulatorLogger_1 = require("../emulatorLogger");
function isValidEmailAddress(email) {
    return /^[^@]+@[^@]+$/.test(email);
}
exports.isValidEmailAddress = isValidEmailAddress;
function isValidPhoneNumber(phoneNumber) {
    return /^\+/.test(phoneNumber);
}
exports.isValidPhoneNumber = isValidPhoneNumber;
function canonicalizeEmailAddress(email) {
    return email.toLowerCase();
}
exports.canonicalizeEmailAddress = canonicalizeEmailAddress;
function parseAbsoluteUri(uri) {
    try {
        return new url_1.URL(uri);
    }
    catch (_a) {
        return undefined;
    }
}
exports.parseAbsoluteUri = parseAbsoluteUri;
function randomId(len) {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let autoId = "";
    for (let i = 0; i < len; i++) {
        autoId += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return autoId;
}
exports.randomId = randomId;
function randomBase64UrlStr(len) {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789_-";
    let autoId = "";
    for (let i = 0; i < len; i++) {
        autoId += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return autoId;
}
exports.randomBase64UrlStr = randomBase64UrlStr;
function randomDigits(len) {
    let digits = "";
    for (let i = 0; i < len; i++) {
        digits += Math.floor(Math.random() * 10);
    }
    return digits;
}
exports.randomDigits = randomDigits;
function toUnixTimestamp(date) {
    return Math.floor(date.getTime() / 1000);
}
exports.toUnixTimestamp = toUnixTimestamp;
function logError(err) {
    if (!registry_1.EmulatorRegistry.isRunning(types_1.Emulators.AUTH)) {
        console.error(err);
    }
    emulatorLogger_1.EmulatorLogger.forEmulator(types_1.Emulators.AUTH).log("WARN", err.stack || err.message || err.constructor.name);
}
exports.logError = logError;
function authEmulatorUrl(req) {
    if (registry_1.EmulatorRegistry.isRunning(types_1.Emulators.AUTH)) {
        return registry_1.EmulatorRegistry.url(types_1.Emulators.AUTH);
    }
    else {
        return registry_1.EmulatorRegistry.url(types_1.Emulators.AUTH, req);
    }
}
exports.authEmulatorUrl = authEmulatorUrl;
function mirrorFieldTo(dest, field, source) {
    const value = source[field];
    if (value === undefined) {
        delete dest[field];
    }
    else {
        dest[field] = value;
    }
}
exports.mirrorFieldTo = mirrorFieldTo;
