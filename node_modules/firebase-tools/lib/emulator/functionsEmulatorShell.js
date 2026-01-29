"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FunctionsEmulatorShell = void 0;
const uuid = require("uuid");
const utils = require("../utils");
const functionsEmulator_1 = require("./functionsEmulator");
const logger_1 = require("../logger");
const error_1 = require("../error");
class FunctionsEmulatorShell {
    constructor(emu) {
        this.emu = emu;
        this.urls = {};
        this.triggers = emu.getTriggerDefinitions();
        this.emulatedFunctions = this.triggers.map((t) => t.id);
        const entryPoints = this.triggers.map((t) => t.entryPoint);
        utils.logLabeledBullet("functions", `Loaded functions: ${entryPoints.join(", ")}`);
        for (const trigger of this.triggers) {
            if (trigger.httpsTrigger) {
                this.urls[trigger.id] = functionsEmulator_1.FunctionsEmulator.getHttpFunctionUrl(this.emu.getProjectId(), trigger.name, trigger.region, this.emu.getInfo());
            }
        }
    }
    createLegacyEvent(eventTrigger, data, opts) {
        var _a, _b;
        let resource = opts.resource;
        if (typeof resource === "object" && resource.name) {
            resource = resource.name;
        }
        return {
            eventId: uuid.v4(),
            timestamp: new Date().toISOString(),
            eventType: eventTrigger.eventType,
            resource: resource,
            params: opts.params,
            auth: { admin: ((_a = opts.auth) === null || _a === void 0 ? void 0 : _a.admin) || false, variable: (_b = opts.auth) === null || _b === void 0 ? void 0 : _b.variable },
            data,
        };
    }
    createCloudEvent(eventTrigger, data, opts) {
        var _a, _b;
        const ce = {
            specversion: "1.0",
            datacontenttype: "application/json",
            id: uuid.v4(),
            type: eventTrigger.eventType,
            time: new Date().toISOString(),
            source: "",
            data,
        };
        if (eventTrigger.eventType.startsWith("google.cloud.storage")) {
            ce.source = `projects/_/buckets/${(_a = eventTrigger.eventFilters) === null || _a === void 0 ? void 0 : _a.bucket}`;
        }
        else if (eventTrigger.eventType.startsWith("google.cloud.pubsub")) {
            ce.source = eventTrigger.eventFilters.topic;
            data = Object.assign(Object.assign({}, data), { messageId: uuid.v4() });
        }
        else if (eventTrigger.eventType.startsWith("google.cloud.firestore")) {
            ce.source = `projects/_/databases/(default)`;
            if (opts.resource) {
                ce.document = opts.resource;
            }
        }
        else if (eventTrigger.eventType.startsWith("google.firebase.database")) {
            ce.source = `projects/_/locations/_/instances/${(_b = eventTrigger.eventFilterPathPatterns) === null || _b === void 0 ? void 0 : _b.instance}`;
            if (opts.resource) {
                ce.ref = opts.resource;
            }
        }
        return ce;
    }
    call(trigger, data, opts) {
        logger_1.logger.debug(`shell:${trigger.name}: trigger=${JSON.stringify(trigger)}`);
        logger_1.logger.debug(`shell:${trigger.name}: opts=${JSON.stringify(opts)}, data=${JSON.stringify(data)}`);
        const eventTrigger = trigger.eventTrigger;
        if (!eventTrigger) {
            throw new error_1.FirebaseError(`Function ${trigger.name} is not a background function`);
        }
        let body;
        if (trigger.platform === "gcfv1") {
            body = this.createLegacyEvent(eventTrigger, data, opts);
        }
        else {
            body = this.createCloudEvent(eventTrigger, data, opts);
        }
        this.emu.sendRequest(trigger, body);
    }
}
exports.FunctionsEmulatorShell = FunctionsEmulatorShell;
