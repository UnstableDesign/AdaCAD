"use strict";
const program = require("commander");
const clc = require("colorette");
const leven = require("leven");
const logger_1 = require("./logger");
const pkg = require("../package.json");
program.version(pkg.version);
program.option("-P, --project <alias_or_project_id>", "the Firebase project to use for this command");
program.option("--account <email>", "the Google account to use for authorization");
program.option("-j, --json", "output JSON instead of text, also triggers non-interactive mode");
program.option("--token <token>", "DEPRECATED - will be removed in a future major version - supply an auth token for this command");
program.option("--non-interactive", "error out of the command instead of waiting for prompts");
program.option("-i, --interactive", "force prompts to be displayed");
program.option("--debug", "print verbose debug output and keep a debug log file");
program.option("-c, --config <path>", "path to the firebase.json file to use for configuration");
const client = {
    cli: program,
    logger: require("./logger"),
    errorOut: require("./errorOut").errorOut,
    getCommand: (name) => {
        for (let i = 0; i < client.cli.commands.length; i++) {
            if (client.cli.commands[i]._name === name) {
                return client.cli.commands[i];
            }
        }
        return;
    },
};
require("./commands").load(client);
function suggestCommands(cmd, cmdList) {
    const suggestion = cmdList.find((c) => {
        return leven(c, cmd) < c.length * 0.4;
    });
    if (suggestion) {
        logger_1.logger.error();
        logger_1.logger.error("Did you mean " + clc.bold(suggestion) + "?");
        return suggestion;
    }
}
const commandNames = program.commands.map((cmd) => {
    return cmd._name;
});
const RENAMED_COMMANDS = {
    "delete-site": "hosting:disable",
    "disable:hosting": "hosting:disable",
    "data:get": "database:get",
    "data:push": "database:push",
    "data:remove": "database:remove",
    "data:set": "database:set",
    "data:update": "database:update",
    "deploy:hosting": "deploy --only hosting",
    "deploy:database": "deploy --only database",
    "prefs:token": "login:ci",
};
program.action((_, args) => {
    (0, logger_1.useConsoleLoggers)();
    const cmd = args[0];
    logger_1.logger.error(clc.bold(clc.red("Error:")), clc.bold(cmd), "is not a Firebase command");
    if (RENAMED_COMMANDS[cmd]) {
        logger_1.logger.error();
        logger_1.logger.error(clc.bold(cmd) + " has been renamed, please run", clc.bold("firebase " + RENAMED_COMMANDS[cmd]), "instead");
    }
    else {
        if (!suggestCommands(cmd, commandNames)) {
            suggestCommands(args.join(":"), commandNames);
        }
    }
    process.exit(1);
});
module.exports = client;
