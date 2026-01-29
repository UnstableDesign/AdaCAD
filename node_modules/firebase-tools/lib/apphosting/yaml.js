"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toEnvList = exports.toEnvMap = exports.AppHostingYamlConfig = void 0;
const path_1 = require("path");
const utils_1 = require("../utils");
const config_1 = require("./config");
const yaml = require("yaml");
const jsYaml = require("js-yaml");
const path = require("path");
const fsutils_1 = require("../fsutils");
const error_1 = require("../error");
class AppHostingYamlConfig {
    constructor() {
        this.env = {};
    }
    static async loadFromFile(filePath) {
        var _a;
        if (!(0, fsutils_1.fileExistsSync)(filePath)) {
            throw new error_1.FirebaseError(`Cannot load ${filePath} from given path, it doesn't exist`);
        }
        const config = new AppHostingYamlConfig();
        const file = await (0, utils_1.readFileFromDirectory)((0, path_1.dirname)(filePath), (0, path_1.basename)(filePath));
        config.filename = path.basename(filePath);
        const loadedAppHostingYaml = (_a = (await (0, utils_1.wrappedSafeLoad)(file.source))) !== null && _a !== void 0 ? _a : {};
        if (loadedAppHostingYaml.env) {
            config.env = toEnvMap(loadedAppHostingYaml.env);
        }
        return config;
    }
    static empty() {
        return new AppHostingYamlConfig();
    }
    merge(other, allowSecretsToBecomePlaintext = true) {
        var _a;
        if (!allowSecretsToBecomePlaintext) {
            const wereSecrets = Object.entries(this.env)
                .filter(([, env]) => env.secret)
                .map(([key]) => key);
            if (wereSecrets.some((key) => { var _a; return (_a = other.env[key]) === null || _a === void 0 ? void 0 : _a.value; })) {
                throw new error_1.FirebaseError(`Cannot convert secret to plaintext in ${(_a = other.filename) !== null && _a !== void 0 ? _a : "apphosting yaml"}`);
            }
        }
        this.env = Object.assign(Object.assign({}, this.env), other.env);
    }
    async upsertFile(filePath) {
        let yamlConfigToWrite = {};
        if ((0, fsutils_1.fileExistsSync)(filePath)) {
            const file = await (0, utils_1.readFileFromDirectory)((0, path_1.dirname)(filePath), (0, path_1.basename)(filePath));
            yamlConfigToWrite = await (0, utils_1.wrappedSafeLoad)(file.source);
        }
        yamlConfigToWrite.env = toEnvList(this.env);
        (0, config_1.store)(filePath, yaml.parseDocument(jsYaml.dump(yamlConfigToWrite)));
    }
}
exports.AppHostingYamlConfig = AppHostingYamlConfig;
function toEnvMap(envs) {
    return Object.fromEntries(envs.map((env) => {
        const variable = env.variable;
        const tmp = Object.assign({}, env);
        delete env.variable;
        return [variable, tmp];
    }));
}
exports.toEnvMap = toEnvMap;
function toEnvList(envs) {
    return Object.entries(envs).map(([variable, env]) => {
        return Object.assign(Object.assign({}, env), { variable });
    });
}
exports.toEnvList = toEnvList;
