"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.compose = void 0;
const driver_1 = require("./driver");
const discover_1 = require("./discover");
async function compose(mode, fs, allFrameworkSpecs) {
    var _a, _b, _c, _d;
    let bundle = { version: "v1alpha" };
    const spec = await (0, discover_1.discover)(fs, allFrameworkSpecs);
    const driver = (0, driver_1.getDriver)(mode, spec);
    if ((_a = spec.detectedCommands) === null || _a === void 0 ? void 0 : _a.run) {
        bundle.server = {
            start: {
                cmd: spec.detectedCommands.run.cmd.split(" "),
            },
        };
    }
    driver.install();
    if ((_b = spec.frameworkHooks) === null || _b === void 0 ? void 0 : _b.afterInstall) {
        bundle = driver.execHook(bundle, spec.frameworkHooks.afterInstall);
    }
    driver.build();
    if ((_c = spec.frameworkHooks) === null || _c === void 0 ? void 0 : _c.afterBuild) {
        bundle = driver.execHook(bundle, (_d = spec.frameworkHooks) === null || _d === void 0 ? void 0 : _d.afterBuild);
    }
    if (bundle.server) {
        driver.export(bundle);
    }
    return bundle;
}
exports.compose = compose;
