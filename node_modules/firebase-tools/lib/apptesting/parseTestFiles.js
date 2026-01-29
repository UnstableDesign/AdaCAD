"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseTestFiles = void 0;
const fsutils_1 = require("../fsutils");
const path_1 = require("path");
const logger_1 = require("../logger");
const types_1 = require("./types");
const utils_1 = require("../utils");
const error_1 = require("../error");
function createFilter(pattern) {
    const regex = pattern ? new RegExp(pattern) : undefined;
    return (s) => !regex || regex.test(s);
}
async function parseTestFiles(dir, targetUri, filePattern, namePattern) {
    try {
        new URL(targetUri);
    }
    catch (ex) {
        const errMsg = "Invalid URL" + (targetUri.startsWith("http") ? "" : " (must include protocol)");
        throw new error_1.FirebaseError(errMsg, { original: (0, error_1.getError)(ex) });
    }
    const fileFilterFn = createFilter(filePattern);
    const nameFilterFn = createFilter(namePattern);
    async function parseTestFilesRecursive(testDir) {
        const items = (0, fsutils_1.listFiles)(testDir);
        const results = [];
        for (const item of items) {
            const path = (0, path_1.join)(testDir, item);
            if ((0, fsutils_1.dirExistsSync)(path)) {
                results.push(...(await parseTestFilesRecursive(path)));
            }
            else if (fileFilterFn(path) && (0, fsutils_1.fileExistsSync)(path)) {
                try {
                    const file = await (0, utils_1.readFileFromDirectory)(testDir, item);
                    const parsedFile = (0, utils_1.wrappedSafeLoad)(file.source);
                    const tests = parsedFile.tests;
                    const defaultConfig = parsedFile.defaultConfig;
                    if (!tests || !tests.length) {
                        logger_1.logger.info(`No tests found in ${path}. Ignoring.`);
                        continue;
                    }
                    for (const rawTestDef of parsedFile.tests) {
                        if (!nameFilterFn(rawTestDef.testName))
                            continue;
                        const testDef = toTestDef(rawTestDef, targetUri, defaultConfig);
                        results.push(testDef);
                    }
                }
                catch (ex) {
                    const errMsg = (0, error_1.getErrMsg)(ex);
                    const errDetails = errMsg ? `Error details: \n${errMsg}` : "";
                    logger_1.logger.info(`Unable to parse test file ${path}. Ignoring.${errDetails}`);
                    continue;
                }
            }
        }
        return results;
    }
    return parseTestFilesRecursive(dir);
}
exports.parseTestFiles = parseTestFiles;
function toTestDef(testDef, targetUri, defaultConfig) {
    var _a, _b, _c, _d, _e, _f, _g;
    const steps = (_a = testDef.steps) !== null && _a !== void 0 ? _a : [];
    const route = (_d = (_c = (_b = testDef.testConfig) === null || _b === void 0 ? void 0 : _b.route) !== null && _c !== void 0 ? _c : defaultConfig === null || defaultConfig === void 0 ? void 0 : defaultConfig.route) !== null && _d !== void 0 ? _d : "";
    const browsers = (_g = (_f = (_e = testDef.testConfig) === null || _e === void 0 ? void 0 : _e.browsers) !== null && _f !== void 0 ? _f : defaultConfig === null || defaultConfig === void 0 ? void 0 : defaultConfig.browsers) !== null && _g !== void 0 ? _g : [types_1.Browser.CHROME];
    return {
        testCase: {
            startUri: targetUri + route,
            displayName: testDef.testName,
            instructions: { steps },
        },
        testExecution: browsers.map((browser) => ({ config: { browser } })),
    };
}
