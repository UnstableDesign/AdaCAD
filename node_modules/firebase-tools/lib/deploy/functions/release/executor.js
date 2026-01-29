"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InlineExecutor = exports.QueueExecutor = exports.DEFAULT_RETRY_CODES = void 0;
const queue_1 = require("../../../throttler/queue");
exports.DEFAULT_RETRY_CODES = [429, 409, 503];
function parseErrorCode(err) {
    var _a, _b, _c, _d, _e, _f;
    return (err.status ||
        err.code ||
        ((_b = (_a = err.context) === null || _a === void 0 ? void 0 : _a.response) === null || _b === void 0 ? void 0 : _b.statusCode) ||
        ((_c = err.original) === null || _c === void 0 ? void 0 : _c.code) ||
        ((_f = (_e = (_d = err.original) === null || _d === void 0 ? void 0 : _d.context) === null || _e === void 0 ? void 0 : _e.response) === null || _f === void 0 ? void 0 : _f.statusCode));
}
async function handler(op) {
    try {
        op.result = await op.func();
    }
    catch (err) {
        const code = parseErrorCode(err);
        if (op.retryCodes.includes(code)) {
            throw err;
        }
        err.code = code;
        op.error = err;
    }
    return;
}
class QueueExecutor {
    constructor(options) {
        this.queue = new queue_1.Queue(Object.assign(Object.assign({}, options), { handler }));
    }
    async run(func, opts) {
        const retryCodes = (opts === null || opts === void 0 ? void 0 : opts.retryCodes) || exports.DEFAULT_RETRY_CODES;
        const op = {
            func,
            retryCodes,
        };
        await this.queue.run(op);
        if (op.error) {
            throw op.error;
        }
        return op.result;
    }
}
exports.QueueExecutor = QueueExecutor;
class InlineExecutor {
    run(func) {
        return func();
    }
}
exports.InlineExecutor = InlineExecutor;
