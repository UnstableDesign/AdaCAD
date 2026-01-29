"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.hasMessage = exports.isBillingError = exports.getError = exports.getErrStatus = exports.isObject = exports.getErrStack = exports.getErrMsg = exports.FirebaseError = void 0;
const lodash_1 = require("lodash");
const DEFAULT_CHILDREN = [];
const DEFAULT_EXIT = 1;
const DEFAULT_STATUS = 500;
class FirebaseError extends Error {
    constructor(message, options = {}) {
        super();
        this.name = "FirebaseError";
        this.children = (0, lodash_1.defaultTo)(options.children, DEFAULT_CHILDREN);
        this.context = options.context;
        this.exit = (0, lodash_1.defaultTo)(options.exit, DEFAULT_EXIT);
        this.message = message;
        this.original = options.original;
        this.status = (0, lodash_1.defaultTo)(options.status, DEFAULT_STATUS);
    }
}
exports.FirebaseError = FirebaseError;
function getErrMsg(err, defaultMsg) {
    if (err instanceof Error) {
        return err.message;
    }
    else if (typeof err === "string") {
        return err;
    }
    else if (defaultMsg) {
        return defaultMsg;
    }
    return JSON.stringify(err);
}
exports.getErrMsg = getErrMsg;
function getErrStack(err) {
    if (err instanceof Error) {
        return err.stack || err.message;
    }
    return getErrMsg(err);
}
exports.getErrStack = getErrStack;
function isObject(value) {
    return typeof value === "object" && value !== null;
}
exports.isObject = isObject;
function getErrStatus(err, defaultStatus) {
    if (isObject(err) && err.status && typeof err.status === "number") {
        return err.status;
    }
    return defaultStatus || DEFAULT_STATUS;
}
exports.getErrStatus = getErrStatus;
function getError(err) {
    if (err instanceof Error) {
        return err;
    }
    return Error(getErrMsg(err));
}
exports.getError = getError;
function isBillingError(e) {
    var _a, _b, _c, _d;
    return !!((_d = (_c = (_b = (_a = e.context) === null || _a === void 0 ? void 0 : _a.body) === null || _b === void 0 ? void 0 : _b.error) === null || _c === void 0 ? void 0 : _c.details) === null || _d === void 0 ? void 0 : _d.find((d) => {
        var _a;
        return (((_a = d.violations) === null || _a === void 0 ? void 0 : _a.find((v) => v.type === "serviceusage/billing-enabled")) ||
            d.reason === "UREQ_PROJECT_BILLING_NOT_FOUND");
    }));
}
exports.isBillingError = isBillingError;
const hasMessage = (e) => !!(e === null || e === void 0 ? void 0 : e.message);
exports.hasMessage = hasMessage;
