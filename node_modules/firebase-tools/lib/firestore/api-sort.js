"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.compareFieldOverride = exports.compareApiField = exports.compareApiBackupSchedule = exports.compareApiBackup = exports.compareLocation = exports.compareApiDatabase = exports.compareApiIndex = exports.compareSpecIndex = void 0;
const API = require("./api-types");
const util = require("./util");
const QUERY_SCOPE_SEQUENCE = [
    API.QueryScope.COLLECTION_GROUP,
    API.QueryScope.COLLECTION,
    undefined,
];
const API_SCOPE_SEQUENCE = [
    API.ApiScope.ANY_API,
    API.ApiScope.DATASTORE_MODE_API,
    API.ApiScope.MONGODB_COMPATIBLE_API,
    undefined,
];
const DENSITY_SEQUENCE = [
    API.Density.DENSITY_UNSPECIFIED,
    API.Density.SPARSE_ALL,
    API.Density.SPARSE_ANY,
    API.Density.DENSE,
    undefined,
];
const ORDER_SEQUENCE = [API.Order.ASCENDING, API.Order.DESCENDING, undefined];
const ARRAY_CONFIG_SEQUENCE = [API.ArrayConfig.CONTAINS, undefined];
function compareSpecIndex(a, b) {
    if (a.collectionGroup !== b.collectionGroup) {
        return a.collectionGroup.localeCompare(b.collectionGroup);
    }
    if (a.queryScope !== b.queryScope) {
        return compareQueryScope(a.queryScope, b.queryScope);
    }
    let cmp = compareArrays(a.fields, b.fields, compareIndexField);
    if (cmp !== 0) {
        return cmp;
    }
    cmp = compareApiScope(a.apiScope, b.apiScope);
    if (cmp !== 0) {
        return cmp;
    }
    cmp = compareDensity(a.density, b.density);
    if (cmp !== 0) {
        return cmp;
    }
    cmp = compareBoolean(a.multikey, b.multikey);
    if (cmp !== 0) {
        return cmp;
    }
    return compareBoolean(a.unique, b.unique);
}
exports.compareSpecIndex = compareSpecIndex;
function compareApiIndex(a, b) {
    if (a.name && b.name) {
        const aName = util.parseIndexName(a.name);
        const bName = util.parseIndexName(b.name);
        if (aName.collectionGroupId !== bName.collectionGroupId) {
            return aName.collectionGroupId.localeCompare(bName.collectionGroupId);
        }
    }
    if (a.queryScope !== b.queryScope) {
        return compareQueryScope(a.queryScope, b.queryScope);
    }
    let cmp = compareArrays(a.fields, b.fields, compareIndexField);
    if (cmp !== 0) {
        return cmp;
    }
    cmp = compareApiScope(a.apiScope, b.apiScope);
    if (cmp !== 0) {
        return cmp;
    }
    cmp = compareDensity(a.density, b.density);
    if (cmp !== 0) {
        return cmp;
    }
    cmp = compareBoolean(a.multikey, b.multikey);
    if (cmp !== 0) {
        return cmp;
    }
    return compareBoolean(a.unique, b.unique);
}
exports.compareApiIndex = compareApiIndex;
function compareApiDatabase(a, b) {
    return a.name > b.name ? 1 : -1;
}
exports.compareApiDatabase = compareApiDatabase;
function compareLocation(a, b) {
    return a.locationId > b.locationId ? 1 : -1;
}
exports.compareLocation = compareLocation;
function compareApiBackup(a, b) {
    const aLocation = a.name.split("/")[3];
    const bLocation = b.name.split("/")[3];
    if (aLocation && bLocation && aLocation !== bLocation) {
        return aLocation > bLocation ? 1 : -1;
    }
    if (a.snapshotTime && b.snapshotTime && a.snapshotTime !== b.snapshotTime) {
        return a.snapshotTime > b.snapshotTime ? -1 : 1;
    }
    return a.name > b.name ? 1 : -1;
}
exports.compareApiBackup = compareApiBackup;
function compareApiBackupSchedule(a, b) {
    if (a.dailyRecurrence && !b.dailyRecurrence) {
        return -1;
    }
    else if (a.weeklyRecurrence && b.dailyRecurrence) {
        return 1;
    }
    return a.name > b.name ? 1 : -1;
}
exports.compareApiBackupSchedule = compareApiBackupSchedule;
function compareApiField(a, b) {
    const aName = util.parseFieldName(a.name);
    const bName = util.parseFieldName(b.name);
    if (aName.collectionGroupId !== bName.collectionGroupId) {
        return aName.collectionGroupId.localeCompare(bName.collectionGroupId);
    }
    if (aName.fieldPath !== bName.fieldPath) {
        return aName.fieldPath.localeCompare(bName.fieldPath);
    }
    return compareArraysSorted(a.indexConfig.indexes || [], b.indexConfig.indexes || [], compareApiIndex);
}
exports.compareApiField = compareApiField;
function compareFieldOverride(a, b) {
    if (a.collectionGroup !== b.collectionGroup) {
        return a.collectionGroup.localeCompare(b.collectionGroup);
    }
    const compareTtl = Number(!!a.ttl) - Number(!!b.ttl);
    if (compareTtl) {
        return compareTtl;
    }
    if (a.fieldPath !== b.fieldPath) {
        return a.fieldPath.localeCompare(b.fieldPath);
    }
    return compareArraysSorted(a.indexes, b.indexes, compareFieldIndex);
}
exports.compareFieldOverride = compareFieldOverride;
function compareIndexField(a, b) {
    if (a.fieldPath !== b.fieldPath) {
        return a.fieldPath.localeCompare(b.fieldPath);
    }
    if (a.order !== b.order) {
        return compareOrder(a.order, b.order);
    }
    if (a.arrayConfig !== b.arrayConfig) {
        return compareArrayConfig(a.arrayConfig, b.arrayConfig);
    }
    if (a.vectorConfig !== b.vectorConfig) {
        return compareVectorConfig(a.vectorConfig, b.vectorConfig);
    }
    return 0;
}
function compareFieldIndex(a, b) {
    if (a.queryScope !== b.queryScope) {
        return compareQueryScope(a.queryScope, b.queryScope);
    }
    if (a.order !== b.order) {
        return compareOrder(a.order, b.order);
    }
    if (a.arrayConfig !== b.arrayConfig) {
        return compareArrayConfig(a.arrayConfig, b.arrayConfig);
    }
    let cmp = compareApiScope(a.apiScope, b.apiScope);
    if (cmp !== 0) {
        return cmp;
    }
    cmp = compareDensity(a.density, b.density);
    if (cmp !== 0) {
        return cmp;
    }
    cmp = compareBoolean(a.multikey, b.multikey);
    if (cmp !== 0) {
        return cmp;
    }
    return compareBoolean(a.unique, b.unique);
}
function compareQueryScope(a, b) {
    return QUERY_SCOPE_SEQUENCE.indexOf(a) - QUERY_SCOPE_SEQUENCE.indexOf(b);
}
function compareApiScope(a, b) {
    if (a === b) {
        return 0;
    }
    if (a === undefined) {
        return -1;
    }
    if (b === undefined) {
        return 1;
    }
    return API_SCOPE_SEQUENCE.indexOf(a) - API_SCOPE_SEQUENCE.indexOf(b);
}
function compareDensity(a, b) {
    if (a === b) {
        return 0;
    }
    if (a === undefined) {
        return -1;
    }
    if (b === undefined) {
        return 1;
    }
    return DENSITY_SEQUENCE.indexOf(a) - DENSITY_SEQUENCE.indexOf(b);
}
function compareOrder(a, b) {
    return ORDER_SEQUENCE.indexOf(a) - ORDER_SEQUENCE.indexOf(b);
}
function compareBoolean(a, b) {
    if (a === b) {
        return 0;
    }
    if (a === undefined) {
        return -1;
    }
    if (b === undefined) {
        return 1;
    }
    return Number(a) - Number(b);
}
function compareArrayConfig(a, b) {
    return ARRAY_CONFIG_SEQUENCE.indexOf(a) - ARRAY_CONFIG_SEQUENCE.indexOf(b);
}
function compareVectorConfig(a, b) {
    if (!a) {
        if (!b) {
            return 0;
        }
        else {
            return 1;
        }
    }
    else if (!b) {
        return -1;
    }
    return a.dimension - b.dimension;
}
function compareArrays(a, b, fn) {
    const minFields = Math.min(a.length, b.length);
    for (let i = 0; i < minFields; i++) {
        const cmp = fn(a[i], b[i]);
        if (cmp !== 0) {
            return cmp;
        }
    }
    return a.length - b.length;
}
function compareArraysSorted(a, b, fn) {
    const aSorted = a.sort(fn);
    const bSorted = b.sort(fn);
    return compareArrays(aSorted, bSorted, fn);
}
