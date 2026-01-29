"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runWithVirtualEnv = exports.virtualEnvCmd = exports.DEFAULT_VENV_DIR = void 0;
const path = require("path");
const spawn = require("cross-spawn");
const logger_1 = require("../logger");
const utils_1 = require("../utils");
exports.DEFAULT_VENV_DIR = "venv";
function virtualEnvCmd(cwd, venvDir) {
    const activateScriptPath = utils_1.IS_WINDOWS ? ["Scripts", "activate.bat"] : ["bin", "activate"];
    const venvActivate = `"${path.join(cwd, venvDir, ...activateScriptPath)}"`;
    return {
        command: utils_1.IS_WINDOWS ? venvActivate : ".",
        args: [utils_1.IS_WINDOWS ? "" : venvActivate],
    };
}
exports.virtualEnvCmd = virtualEnvCmd;
function runWithVirtualEnv(commandAndArgs, cwd, envs, spawnOpts = {}, venvDir = exports.DEFAULT_VENV_DIR) {
    const { command, args } = virtualEnvCmd(cwd, venvDir);
    args.push("&&", ...commandAndArgs);
    logger_1.logger.debug(`Running command with virtualenv: command=${command}, args=${JSON.stringify(args)}`);
    return spawn(command, args, Object.assign(Object.assign({ shell: true, cwd, stdio: ["pipe", "pipe", "pipe", "pipe"] }, spawnOpts), { env: envs }));
}
exports.runWithVirtualEnv = runWithVirtualEnv;
