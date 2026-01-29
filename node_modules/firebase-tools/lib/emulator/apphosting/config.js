"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getLocalAppHostingConfiguration = void 0;
const path_1 = require("path");
const config_1 = require("../../apphosting/config");
const yaml_1 = require("../../apphosting/yaml");
async function getLocalAppHostingConfiguration(backendDir) {
    const appHostingConfigPaths = (0, config_1.listAppHostingFilesInPath)(backendDir);
    const fileNameToPathMap = Object.fromEntries(appHostingConfigPaths.map((path) => [(0, path_1.basename)(path), path]));
    const output = yaml_1.AppHostingYamlConfig.empty();
    const baseFilePath = fileNameToPathMap[config_1.APPHOSTING_BASE_YAML_FILE];
    const emulatorsFilePath = fileNameToPathMap[config_1.APPHOSTING_EMULATORS_YAML_FILE];
    const localFilePath = fileNameToPathMap[config_1.APPHOSTING_LOCAL_YAML_FILE];
    if (baseFilePath) {
        const baseFile = await yaml_1.AppHostingYamlConfig.loadFromFile(baseFilePath);
        output.merge(baseFile, false);
    }
    if (emulatorsFilePath) {
        const emulatorsConfig = await yaml_1.AppHostingYamlConfig.loadFromFile(emulatorsFilePath);
        output.merge(emulatorsConfig, false);
    }
    if (localFilePath) {
        const localYamlConfig = await yaml_1.AppHostingYamlConfig.loadFromFile(localFilePath);
        output.merge(localYamlConfig, true);
    }
    return output;
}
exports.getLocalAppHostingConfiguration = getLocalAppHostingConfiguration;
