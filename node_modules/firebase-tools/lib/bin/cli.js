"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cli = void 0;
const updateNotifierPkg = require("update-notifier-cjs");
const clc = require("colorette");
const marked_terminal_1 = require("marked-terminal");
const marked_1 = require("marked");
marked_1.marked.use((0, marked_terminal_1.markedTerminal)());
const fs = require("node:fs");
const configstore_1 = require("../configstore");
const errorOut_1 = require("../errorOut");
const handlePreviewToggles_1 = require("../handlePreviewToggles");
const logger_1 = require("../logger");
const client = require("..");
const fsutils = require("../fsutils");
const utils = require("../utils");
const experiments_1 = require("../experiments");
const fetchMOTD_1 = require("../fetchMOTD");
function cli(pkg) {
    const updateNotifier = updateNotifierPkg({ pkg });
    const args = process.argv.slice(2);
    let cmd;
    if (!process.env.DEBUG && args.includes("--debug")) {
        process.env.DEBUG = "true";
    }
    process.env.IS_FIREBASE_CLI = "true";
    const logFilename = (0, logger_1.useFileLogger)();
    logger_1.logger.debug("-".repeat(70));
    logger_1.logger.debug("Command:      ", process.argv.join(" "));
    logger_1.logger.debug("CLI Version:  ", pkg.version);
    logger_1.logger.debug("Platform:     ", process.platform);
    logger_1.logger.debug("Node Version: ", process.version);
    logger_1.logger.debug("Time:         ", new Date().toString());
    if (utils.envOverrides.length) {
        logger_1.logger.debug("Env Overrides:", utils.envOverrides.join(", "));
    }
    logger_1.logger.debug("-".repeat(70));
    logger_1.logger.debug();
    (0, experiments_1.enableExperimentsFromCliEnvVariable)();
    (0, fetchMOTD_1.fetchMOTD)();
    process.on("exit", (code) => {
        code = process.exitCode || code;
        if (!process.env.DEBUG && code < 2 && fsutils.fileExistsSync(logFilename)) {
            fs.unlinkSync(logFilename);
        }
        if (code > 0 && process.stdout.isTTY) {
            const lastError = configstore_1.configstore.get("lastError") || 0;
            const timestamp = Date.now();
            if (lastError > timestamp - 120000) {
                let help;
                if (code === 1 && cmd) {
                    help = "Having trouble? Try " + clc.bold("firebase [command] --help");
                }
                else {
                    help = "Having trouble? Try again or contact support with contents of firebase-debug.log";
                }
                if (cmd) {
                    console.log();
                    console.log(help);
                }
            }
            configstore_1.configstore.set("lastError", timestamp);
        }
        else {
            configstore_1.configstore.delete("lastError");
        }
        try {
            const installMethod = !process.env.FIREPIT_VERSION ? "npm" : "automatic script";
            const updateCommand = !process.env.FIREPIT_VERSION
                ? "npm install -g firebase-tools"
                : "curl -sL https://firebase.tools | upgrade=true bash";
            const updateMessage = `Update available ${clc.gray("{currentVersion}")} → ${clc.green("{latestVersion}")}\n` +
                `To update to the latest version using ${installMethod}, run\n${clc.cyan(updateCommand)}\n` +
                `For other CLI management options, visit the ${(0, marked_1.marked)("[CLI documentation](https://firebase.google.com/docs/cli#update-cli)")}`;
            updateNotifier.notify({ defer: false, isGlobal: true, message: updateMessage });
        }
        catch (err) {
            logger_1.logger.debug("Error when notifying about new CLI updates:");
            if (err instanceof Error) {
                logger_1.logger.debug(err);
            }
            else {
                logger_1.logger.debug(`${err}`);
            }
        }
    });
    process.on("uncaughtException", (err) => {
        (0, errorOut_1.errorOut)(err);
    });
    if (!(0, handlePreviewToggles_1.handlePreviewToggles)(args)) {
        if (!args.length) {
            client.cli.help();
        }
        else {
            cmd = client.cli.parse(process.argv);
        }
    }
}
exports.cli = cli;
