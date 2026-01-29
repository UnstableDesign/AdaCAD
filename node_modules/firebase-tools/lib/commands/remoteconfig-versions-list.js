"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.command = void 0;
const logger_1 = require("../logger");
const rcVersion = require("../remoteconfig/versionslist");
const command_1 = require("../command");
const projectUtils_1 = require("../projectUtils");
const requireAuth_1 = require("../requireAuth");
const requirePermissions_1 = require("../requirePermissions");
const utils_1 = require("../utils");
const Table = require("cli-table3");
const tableHead = ["Update User", "Version Number", "Update Time"];
function pushTableContents(table, version) {
    var _a;
    return table.push([
        (_a = version.updateUser) === null || _a === void 0 ? void 0 : _a.email,
        version.versionNumber,
        version.updateTime ? (0, utils_1.datetimeString)(new Date(version.updateTime)) : "",
    ]);
}
exports.command = new command_1.Command("remoteconfig:versions:list")
    .description("get a list of Remote Config template versions that have been published for a Firebase project")
    .option("--limit <maxResults>", "limit the number of versions being returned. Pass '0' to fetch all versions")
    .before(requireAuth_1.requireAuth)
    .before(requirePermissions_1.requirePermissions, ["cloudconfig.configs.get"])
    .action(async (options) => {
    const versionsList = await rcVersion.getVersions((0, projectUtils_1.needProjectId)(options), options.limit);
    const table = new Table({ head: tableHead, style: { head: ["green"] } });
    for (let item = 0; item < versionsList.versions.length; item++) {
        pushTableContents(table, versionsList.versions[item]);
    }
    logger_1.logger.info(table.toString());
    return versionsList;
});
