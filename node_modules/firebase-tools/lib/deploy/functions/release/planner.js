"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkForV2Upgrade = exports.checkForIllegalUpdate = exports.checkForUnsafeUpdate = exports.upgradedScheduleFromV1ToV2 = exports.changedV2PubSubTopic = exports.changedTriggerRegion = exports.upgradedToGCFv2WithoutSettingConcurrency = exports.createDeploymentPlan = exports.calculateUpdate = exports.calculateChangesets = void 0;
const functionsDeployHelper_1 = require("../functionsDeployHelper");
const deploymentTool_1 = require("../../../deploymentTool");
const error_1 = require("../../../error");
const utils = require("../../../utils");
const backend = require("../backend");
const v2events = require("../../../functions/events/v2");
function calculateChangesets(want, have, keyFn, deleteAll) {
    const toCreate = utils.groupBy(Object.keys(want)
        .filter((id) => !have[id])
        .map((id) => want[id]), keyFn);
    const toDelete = utils.groupBy(Object.keys(have)
        .filter((id) => !want[id])
        .filter((id) => deleteAll || (0, deploymentTool_1.isFirebaseManaged)(have[id].labels || {}))
        .map((id) => have[id]), keyFn);
    const toSkipPredicate = (id) => !!(!want[id].targetedByOnly &&
        have[id].state === "ACTIVE" &&
        have[id].hash &&
        want[id].hash &&
        want[id].hash === have[id].hash);
    const toSkipEndpointsMap = Object.keys(want)
        .filter((id) => have[id])
        .filter((id) => toSkipPredicate(id))
        .reduce((memo, id) => {
        memo[id] = want[id];
        return memo;
    }, {});
    const toSkip = utils.groupBy(Object.values(toSkipEndpointsMap), keyFn);
    if (Object.keys(toSkip).length) {
        utils.logLabeledBullet("functions", "Skipping the deploy of unchanged functions.");
    }
    const toUpdate = utils.groupBy(Object.keys(want)
        .filter((id) => have[id])
        .filter((id) => !toSkipEndpointsMap[id])
        .map((id) => calculateUpdate(want[id], have[id])), (eu) => keyFn(eu.endpoint));
    const result = {};
    const keys = new Set([
        ...Object.keys(toCreate),
        ...Object.keys(toDelete),
        ...Object.keys(toUpdate),
        ...Object.keys(toSkip),
    ]);
    for (const key of keys) {
        result[key] = {
            endpointsToCreate: toCreate[key] || [],
            endpointsToUpdate: toUpdate[key] || [],
            endpointsToDelete: toDelete[key] || [],
            endpointsToSkip: toSkip[key] || [],
        };
    }
    return result;
}
exports.calculateChangesets = calculateChangesets;
function calculateUpdate(want, have) {
    checkForIllegalUpdate(want, have);
    const update = {
        endpoint: want,
        unsafe: checkForUnsafeUpdate(want, have),
    };
    const needsDelete = changedTriggerRegion(want, have) ||
        changedV2PubSubTopic(want, have) ||
        upgradedScheduleFromV1ToV2(want, have);
    if (needsDelete) {
        update.deleteAndRecreate = have;
    }
    return update;
}
exports.calculateUpdate = calculateUpdate;
function createDeploymentPlan(args) {
    let { wantBackend, haveBackend, codebase, filters, deleteAll } = args;
    let deployment = {};
    wantBackend = backend.matchingBackend(wantBackend, (endpoint) => {
        return (0, functionsDeployHelper_1.endpointMatchesAnyFilter)(endpoint, filters);
    });
    const wantedEndpoint = backend.hasEndpoint(wantBackend);
    haveBackend = backend.matchingBackend(haveBackend, (endpoint) => {
        return wantedEndpoint(endpoint) || (0, functionsDeployHelper_1.endpointMatchesAnyFilter)(endpoint, filters);
    });
    const regions = new Set([
        ...Object.keys(wantBackend.endpoints),
        ...Object.keys(haveBackend.endpoints),
    ]);
    for (const region of regions) {
        const changesets = calculateChangesets(wantBackend.endpoints[region] || {}, haveBackend.endpoints[region] || {}, (e) => `${codebase}-${e.region}-${e.availableMemoryMb || "default"}`, deleteAll);
        deployment = Object.assign(Object.assign({}, deployment), changesets);
    }
    if (upgradedToGCFv2WithoutSettingConcurrency(wantBackend, haveBackend)) {
        utils.logLabeledBullet("functions", "You are updating one or more functions to Google Cloud Functions v2, " +
            "which introduces support for concurrent execution. New functions " +
            "default to 80 concurrent executions, but existing functions keep the " +
            "old default of 1. You can change this with the 'concurrency' option.");
    }
    return deployment;
}
exports.createDeploymentPlan = createDeploymentPlan;
function upgradedToGCFv2WithoutSettingConcurrency(want, have) {
    return backend.someEndpoint(want, (endpoint) => {
        var _a, _b;
        if (((_b = (_a = have.endpoints[endpoint.region]) === null || _a === void 0 ? void 0 : _a[endpoint.id]) === null || _b === void 0 ? void 0 : _b.platform) !== "gcfv1") {
            return false;
        }
        if (endpoint.platform !== "gcfv2") {
            return false;
        }
        if (endpoint.concurrency) {
            return false;
        }
        return true;
    });
}
exports.upgradedToGCFv2WithoutSettingConcurrency = upgradedToGCFv2WithoutSettingConcurrency;
function changedTriggerRegion(want, have) {
    if (want.platform !== "gcfv2") {
        return false;
    }
    if (have.platform !== "gcfv2") {
        return false;
    }
    if (!backend.isEventTriggered(want)) {
        return false;
    }
    if (!backend.isEventTriggered(have)) {
        return false;
    }
    return want.eventTrigger.region !== have.eventTrigger.region;
}
exports.changedTriggerRegion = changedTriggerRegion;
function changedV2PubSubTopic(want, have) {
    if (want.platform !== "gcfv2") {
        return false;
    }
    if (have.platform !== "gcfv2") {
        return false;
    }
    if (!backend.isEventTriggered(want)) {
        return false;
    }
    if (!backend.isEventTriggered(have)) {
        return false;
    }
    if (want.eventTrigger.eventType !== v2events.PUBSUB_PUBLISH_EVENT) {
        return false;
    }
    if (have.eventTrigger.eventType !== v2events.PUBSUB_PUBLISH_EVENT) {
        return false;
    }
    return have.eventTrigger.eventFilters.topic !== want.eventTrigger.eventFilters.topic;
}
exports.changedV2PubSubTopic = changedV2PubSubTopic;
function upgradedScheduleFromV1ToV2(want, have) {
    if (have.platform !== "gcfv1") {
        return false;
    }
    if (want.platform !== "gcfv2") {
        return false;
    }
    if (!backend.isScheduleTriggered(have)) {
        return false;
    }
    if (!backend.isScheduleTriggered(want)) {
        return false;
    }
    return true;
}
exports.upgradedScheduleFromV1ToV2 = upgradedScheduleFromV1ToV2;
function checkForUnsafeUpdate(want, have) {
    return (backend.isEventTriggered(want) &&
        backend.isEventTriggered(have) &&
        want.eventTrigger.eventType ===
            v2events.CONVERTABLE_EVENTS[have.eventTrigger.eventType]);
}
exports.checkForUnsafeUpdate = checkForUnsafeUpdate;
function checkForIllegalUpdate(want, have) {
    const triggerType = (e) => {
        if (backend.isHttpsTriggered(e)) {
            return "an HTTPS";
        }
        else if (backend.isCallableTriggered(e)) {
            return "a callable";
        }
        else if (backend.isEventTriggered(e)) {
            return "a background triggered";
        }
        else if (backend.isScheduleTriggered(e)) {
            return "a scheduled";
        }
        else if (backend.isTaskQueueTriggered(e)) {
            return "a task queue";
        }
        else if (backend.isBlockingTriggered(e)) {
            return e.blockingTrigger.eventType;
        }
        throw Error("Functions release planner is not able to handle an unknown trigger type");
    };
    const wantType = triggerType(want);
    const haveType = triggerType(have);
    const upgradingHttpsFunction = backend.isHttpsTriggered(have) && backend.isCallableTriggered(want);
    if (wantType !== haveType && !upgradingHttpsFunction) {
        throw new error_1.FirebaseError(`[${(0, functionsDeployHelper_1.getFunctionLabel)(want)}] Changing from ${haveType} function to ${wantType} function is not allowed. Please delete your function and create a new one instead.`);
    }
    if (want.platform === "gcfv1" && have.platform === "gcfv2") {
        throw new error_1.FirebaseError(`[${(0, functionsDeployHelper_1.getFunctionLabel)(want)}] Functions cannot be downgraded from GCFv2 to GCFv1`);
    }
    exports.checkForV2Upgrade(want, have);
}
exports.checkForIllegalUpdate = checkForIllegalUpdate;
function checkForV2Upgrade(want, have) {
    if (want.platform === "gcfv2" && have.platform === "gcfv1") {
        throw new error_1.FirebaseError(`[${(0, functionsDeployHelper_1.getFunctionLabel)(have)}] Upgrading from 1st Gen to 2nd Gen is not yet supported. ` +
            "See https://firebase.google.com/docs/functions/2nd-gen-upgrade before migrating to 2nd Gen.");
    }
}
exports.checkForV2Upgrade = checkForV2Upgrade;
