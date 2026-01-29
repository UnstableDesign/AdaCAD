"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.encodeRFC5987 = void 0;
function encodeRFC5987(str) {
    return encodeURIComponent(str)
        .replace(/['()*]/g, (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`)
        .replace(/%(7C|60|5E)/g, (str, hex) => String.fromCharCode(parseInt(hex, 16)));
}
exports.encodeRFC5987 = encodeRFC5987;
