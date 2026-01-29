"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listEntries = void 0;
const api_1 = require("../api");
const apiv2_1 = require("../apiv2");
const error_1 = require("../error");
const API_VERSION = "v2";
async function listEntries(projectId, filter, pageSize, order) {
    const client = new apiv2_1.Client({ urlPrefix: (0, api_1.cloudloggingOrigin)(), apiVersion: API_VERSION });
    try {
        const result = await client.post("/entries:list", {
            resourceNames: [`projects/${projectId}`],
            filter: filter,
            orderBy: `timestamp ${order}`,
            pageSize: pageSize,
        });
        return result.body.entries;
    }
    catch (err) {
        throw new error_1.FirebaseError("Failed to retrieve log entries from Google Cloud.", {
            original: err,
        });
    }
}
exports.listEntries = listEntries;
