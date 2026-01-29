"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handlePreviewToggles = void 0;
const colorette_1 = require("colorette");
const experiments = require("./experiments");
function errorOut(name) {
    console.log(`${(0, colorette_1.bold)((0, colorette_1.red)("Error:"))} Did not recognize preview feature ${(0, colorette_1.bold)(name || "")}`);
    process.exit(1);
}
function handlePreviewToggles(args) {
    const name = args[1];
    const isValid = experiments.isValidExperiment(name);
    if (args[0] === "--open-sesame") {
        console.log(`${(0, colorette_1.bold)("firebase --open-sesame")} is deprecated and wil be removed in a future ` +
            `version. Use the new "experiments" family of commands, including ${(0, colorette_1.bold)("firebase experiments:enable")}`);
        if (isValid) {
            console.log(`Enabling experiment ${(0, colorette_1.bold)(name)} ...`);
            experiments.setEnabled(name, true);
            experiments.flushToDisk();
            console.log("Experiment enabled!");
            return process.exit(0);
        }
        errorOut(name);
    }
    else if (args[0] === "--close-sesame") {
        console.log(`${(0, colorette_1.bold)("firebase --open-sesame")} is deprecated and wil be removed in a future ` +
            `version. Use the new "experiments" family of commands, including ${(0, colorette_1.bold)("firebase experiments:disable")}`);
        if (isValid) {
            console.log(`Disabling experiment ${(0, colorette_1.bold)(name)}...`);
            experiments.setEnabled(name, false);
            experiments.flushToDisk();
            return process.exit(0);
        }
        errorOut(name);
    }
    return false;
}
exports.handlePreviewToggles = handlePreviewToggles;
