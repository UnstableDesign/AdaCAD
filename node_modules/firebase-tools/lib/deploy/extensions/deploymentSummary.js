"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deletesSummary = exports.configuresSummary = exports.updatesSummary = exports.createsSummary = exports.humanReadable = void 0;
const clc = require("colorette");
const refs = require("../../extensions/refs");
const humanReadable = (dep) => `${clc.bold(dep.instanceId)} (${dep.ref ? `${refs.toExtensionVersionRef(dep.ref)}` : `Installed from local source`})`;
exports.humanReadable = humanReadable;
const humanReadableUpdate = (from, to) => {
    var _a;
    if (from.ref &&
        to.ref &&
        from.ref.publisherId === to.ref.publisherId &&
        from.ref.extensionId === to.ref.extensionId) {
        return `\t${clc.bold(from.instanceId)} (${refs.toExtensionVersionRef(from.ref)} => ${((_a = to.ref) === null || _a === void 0 ? void 0 : _a.version) || ""})`;
    }
    else {
        const fromRef = from.ref
            ? `${refs.toExtensionVersionRef(from.ref)}`
            : `Installed from local source`;
        const toRef = to.ref ? `${refs.toExtensionVersionRef(to.ref)}` : `Installed from local source`;
        return `\t${clc.bold(from.instanceId)} (${fromRef} => ${toRef})`;
    }
};
function createsSummary(toCreate) {
    const instancesToCreate = toCreate.map((s) => `\t${(0, exports.humanReadable)(s)}`).join("\n");
    return toCreate.length
        ? `The following extension instances will be created:\n${instancesToCreate}\n`
        : "";
}
exports.createsSummary = createsSummary;
function updatesSummary(toUpdate, have) {
    const instancesToUpdate = toUpdate
        .map((to) => {
        const from = have.find((exists) => exists.instanceId === to.instanceId);
        if (!from) {
            return "";
        }
        return humanReadableUpdate(from, to);
    })
        .join("\n");
    return toUpdate.length
        ? `The following extension instances will be updated:\n${instancesToUpdate}\n`
        : "";
}
exports.updatesSummary = updatesSummary;
function configuresSummary(toConfigure) {
    const instancesToConfigure = toConfigure.map((s) => `\t${(0, exports.humanReadable)(s)}`).join("\n");
    return toConfigure.length
        ? `The following extension instances will be configured:\n${instancesToConfigure}\n`
        : "";
}
exports.configuresSummary = configuresSummary;
function deletesSummary(toDelete, isDynamic) {
    const instancesToDelete = toDelete.map((s) => `\t${(0, exports.humanReadable)(s)}`).join("\n");
    const definedLocation = isDynamic ? "your local source code" : "'firebase.json'";
    return toDelete.length
        ? `The following extension instances are found in your project but do not exist in ${definedLocation}:\n${instancesToDelete}\n`
        : "";
}
exports.deletesSummary = deletesSummary;
