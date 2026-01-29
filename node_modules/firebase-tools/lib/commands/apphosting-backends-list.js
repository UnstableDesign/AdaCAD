"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.printBackendsTable = exports.command = void 0;
const command_1 = require("../command");
const utils_1 = require("../utils");
const error_1 = require("../error");
const logger_1 = require("../logger");
const projectUtils_1 = require("../projectUtils");
const requireAuth_1 = require("../requireAuth");
const apphosting = require("../gcp/apphosting");
const Table = require("cli-table3");
const TABLE_HEAD = ["Backend", "Repository", "URL", "Primary Region", "Updated Date"];
exports.command = new command_1.Command("apphosting:backends:list")
    .description("list Firebase App Hosting backends")
    .before(requireAuth_1.requireAuth)
    .before(apphosting.ensureApiEnabled)
    .action(async (options) => {
    var _a;
    const projectId = (0, projectUtils_1.needProjectId)(options);
    let backendRes;
    try {
        backendRes = await apphosting.listBackends(projectId, "-");
    }
    catch (err) {
        throw new error_1.FirebaseError(`Unable to list backends present for project: ${projectId}. Please check the parameters you have provided.`, { original: err });
    }
    const backends = (_a = backendRes.backends) !== null && _a !== void 0 ? _a : [];
    printBackendsTable(backends);
    return backends;
});
function printBackendsTable(backends) {
    var _a, _b, _c;
    const table = new Table({
        head: TABLE_HEAD,
        style: { head: ["green"] },
    });
    for (const backend of backends) {
        const { location, id } = apphosting.parseBackendName(backend.name);
        table.push([
            id,
            (_c = (_b = (_a = backend.codebase) === null || _a === void 0 ? void 0 : _a.repository) === null || _b === void 0 ? void 0 : _b.split("/").pop()) !== null && _c !== void 0 ? _c : "",
            backend.uri.startsWith("https:") ? backend.uri : "https://" + backend.uri,
            location,
            (0, utils_1.datetimeString)(new Date(backend.updateTime)),
        ]);
    }
    logger_1.logger.info(table.toString());
}
exports.printBackendsTable = printBackendsTable;
