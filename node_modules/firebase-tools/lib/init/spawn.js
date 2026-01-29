"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.spawnWithCommandString = exports.spawnWithOutput = exports.wrapSpawn = void 0;
const spawn = require("cross-spawn");
const logger_1 = require("../logger");
const error_1 = require("../error");
function wrapSpawn(cmd, args, projectDir) {
    return new Promise((resolve, reject) => {
        const installer = spawn(cmd, args, {
            cwd: projectDir,
            stdio: "inherit",
            env: Object.assign({}, process.env),
        });
        installer.on("error", (err) => {
            logger_1.logger.debug((0, error_1.getErrStack)(err));
        });
        installer.on("close", (code) => {
            if (code === 0) {
                return resolve();
            }
            return reject(new Error(`Error: spawn(${cmd}, [${args.join(", ")}]) \n exited with code: ${code || "null"}`));
        });
    });
}
exports.wrapSpawn = wrapSpawn;
function spawnWithOutput(cmd, args) {
    return new Promise((resolve, reject) => {
        var _a, _b;
        const child = spawn(cmd, args);
        let output = "";
        (_a = child.stdout) === null || _a === void 0 ? void 0 : _a.on("data", (data) => {
            if ((0, error_1.isObject)(data) && data.toString) {
                output += data.toString();
            }
            else {
                output += JSON.stringify(data);
            }
        });
        (_b = child.stderr) === null || _b === void 0 ? void 0 : _b.on("data", (data) => {
            logger_1.logger.debug(`Error: spawn(${cmd}, ${args.join(", ")})\n  Stderr:\n${JSON.stringify(data)}\n`);
        });
        child.on("error", (err) => {
            logger_1.logger.debug((0, error_1.getErrStack)(err));
        });
        child.on("close", (code) => {
            if (code === 0) {
                resolve(output);
            }
            else {
                reject(new Error(`Error: spawn(${cmd}, [${args.join(", ")}]) \n exited with code: ${code || "null"}`));
            }
        });
    });
}
exports.spawnWithOutput = spawnWithOutput;
function spawnWithCommandString(cmd, projectDir, environmentVariables) {
    return new Promise((resolve, reject) => {
        const installer = spawn(cmd, {
            cwd: projectDir,
            stdio: "inherit",
            shell: true,
            env: Object.assign(Object.assign({}, process.env), environmentVariables),
        });
        installer.on("error", (err) => {
            logger_1.logger.log("DEBUG", (0, error_1.getErrStack)(err));
        });
        installer.on("close", (code) => {
            if (code === 0) {
                return resolve();
            }
            return reject(new Error(`Error: spawn(${cmd}) \n exited with code: ${code || "null"}`));
        });
    });
}
exports.spawnWithCommandString = spawnWithCommandString;
