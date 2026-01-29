"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.command = void 0;
const command_1 = require("../command");
const logger_1 = require("../logger");
const requirePermissions_1 = require("../requirePermissions");
const types_1 = require("../emulator/types");
const commandUtils_1 = require("../emulator/commandUtils");
const firestore_1 = require("../gcp/firestore");
const pretty_print_1 = require("../firestore/pretty-print");
exports.command = new command_1.Command("firestore:backups:get <backup>")
    .description("get a Cloud Firestore database backup")
    .before(requirePermissions_1.requirePermissions, ["datastore.backups.get"])
    .before(commandUtils_1.warnEmulatorNotSupported, types_1.Emulators.FIRESTORE)
    .action(async (backupName, options) => {
    const backup = await (0, firestore_1.getBackup)(backupName);
    const printer = new pretty_print_1.PrettyPrint();
    if (options.json) {
        logger_1.logger.info(JSON.stringify(backup, undefined, 2));
    }
    else {
        printer.prettyPrintBackup(backup);
    }
    return backup;
});
