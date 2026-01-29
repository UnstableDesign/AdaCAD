"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ensureFirebaseAlertsTriggerRegion = void 0;
const error_1 = require("../../../error");
function ensureFirebaseAlertsTriggerRegion(endpoint) {
    if (!endpoint.eventTrigger.region) {
        endpoint.eventTrigger.region = "global";
    }
    if (endpoint.eventTrigger.region !== "global") {
        throw new error_1.FirebaseError("A firebase alerts trigger must specify 'global' trigger location");
    }
    return Promise.resolve();
}
exports.ensureFirebaseAlertsTriggerRegion = ensureFirebaseAlertsTriggerRegion;
