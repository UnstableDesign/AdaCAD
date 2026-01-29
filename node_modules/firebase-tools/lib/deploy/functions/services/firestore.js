"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ensureFirestoreTriggerRegion = exports.clearCache = void 0;
const firestore = require("../../../gcp/firestore");
const error_1 = require("../../../error");
const dbCache = new Map();
const dbPromiseCache = new Map();
function clearCache() {
    dbCache.clear();
    dbPromiseCache.clear();
}
exports.clearCache = clearCache;
async function getDatabase(project, databaseId) {
    const key = `${project}/${databaseId}`;
    if (dbCache.has(key)) {
        return dbCache.get(key);
    }
    if (dbPromiseCache.has(key)) {
        return dbPromiseCache.get(key);
    }
    const dbPromise = firestore
        .getDatabase(project, databaseId)
        .then((db) => {
        dbCache.set(key, db);
        dbPromiseCache.delete(key);
        return db;
    })
        .catch((error) => {
        dbPromiseCache.delete(key);
        throw error;
    });
    dbPromiseCache.set(key, dbPromise);
    return dbPromise;
}
async function ensureFirestoreTriggerRegion(endpoint) {
    var _a;
    const db = await getDatabase(endpoint.project, ((_a = endpoint.eventTrigger.eventFilters) === null || _a === void 0 ? void 0 : _a.database) || "(default)");
    const dbRegion = db.locationId;
    if (!endpoint.eventTrigger.region) {
        endpoint.eventTrigger.region = dbRegion;
    }
    if (endpoint.eventTrigger.region !== dbRegion) {
        throw new error_1.FirebaseError("A firestore trigger location must match the firestore database region.");
    }
}
exports.ensureFirestoreTriggerRegion = ensureFirestoreTriggerRegion;
