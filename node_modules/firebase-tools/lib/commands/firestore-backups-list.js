"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.command = void 0;
const command_1 = require("../command");
const logger_1 = require("../logger");
const requirePermissions_1 = require("../requirePermissions");
const types_1 = require("../emulator/types");
const commandUtils_1 = require("../emulator/commandUtils");
const firestore_1 = require("../gcp/firestore");
const utils_1 = require("../utils");
const pretty_print_1 = require("../firestore/pretty-print");
exports.command = new command_1.Command("firestore:backups:list")
    .description("list all Cloud Firestore backups in a given location")
    .option("-l, --location <locationId>", "location to search for backups, for example 'nam5'. Run 'firebase firestore:locations' to get a list of eligible locations. Defaults to all locations")
    .before(requirePermissions_1.requirePermissions, ["datastore.backups.list"])
    .before(commandUtils_1.warnEmulatorNotSupported, types_1.Emulators.FIRESTORE)
    .action(async (options) => {
    var _a;
    const printer = new pretty_print_1.PrettyPrint();
    const location = (_a = options.location) !== null && _a !== void 0 ? _a : "-";
    const listBackupsResponse = await (0, firestore_1.listBackups)(options.project, location);
    const backups = listBackupsResponse.backups || [];
    if (options.json) {
        logger_1.logger.info(JSON.stringify(listBackupsResponse, undefined, 2));
    }
    else {
        printer.prettyPrintBackups(backups);
        if (listBackupsResponse.unreachable && listBackupsResponse.unreachable.length > 0) {
            (0, utils_1.logWarning)("We were not able to reach the following locations: " +
                listBackupsResponse.unreachable.join(", "));
        }
    }
    return backups;
});
