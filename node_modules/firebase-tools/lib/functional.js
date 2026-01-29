"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.optionalValueMatches = exports.nullsafeVisitor = exports.mapObject = exports.partitionRecord = exports.partition = exports.assertExhaustive = exports.zipIn = exports.zip = exports.reduceFlat = exports.flatten = exports.flattenArray = exports.flattenObject = void 0;
function* flattenObject(obj) {
    function* helper(path, obj) {
        for (const [k, v] of Object.entries(obj)) {
            if (typeof v !== "object" || v === null) {
                yield [[...path, k].join("."), v];
            }
            else {
                yield* helper([...path, k], v);
            }
        }
    }
    yield* helper([], obj);
}
exports.flattenObject = flattenObject;
function* flattenArray(arr) {
    for (const val of arr) {
        if (Array.isArray(val)) {
            yield* flattenArray(val);
        }
        else {
            yield val;
        }
    }
}
exports.flattenArray = flattenArray;
function flatten(objOrArr) {
    if (Array.isArray(objOrArr)) {
        return flattenArray(objOrArr);
    }
    else {
        return flattenObject(objOrArr);
    }
}
exports.flatten = flatten;
function reduceFlat(accum, next) {
    return [...(accum || []), ...flatten([next])];
}
exports.reduceFlat = reduceFlat;
function* zip(left, right) {
    if (left.length !== right.length) {
        throw new Error("Cannot zip between two lists of differen lengths");
    }
    for (let i = 0; i < left.length; i++) {
        yield [left[i], right[i]];
    }
}
exports.zip = zip;
const zipIn = (other) => (elem, ndx) => {
    return [elem, other[ndx]];
};
exports.zipIn = zipIn;
function assertExhaustive(val, message) {
    throw new Error(message || `Never has a value (${val}).`);
}
exports.assertExhaustive = assertExhaustive;
function partition(arr, predicate) {
    return arr.reduce((acc, elem) => {
        acc[predicate(elem) ? 0 : 1].push(elem);
        return acc;
    }, [[], []]);
}
exports.partition = partition;
function partitionRecord(rec, predicate) {
    return Object.entries(rec).reduce((acc, [key, val]) => {
        acc[predicate(key, val) ? 0 : 1][key] = val;
        return acc;
    }, [{}, {}]);
}
exports.partitionRecord = partitionRecord;
function mapObject(input, transform) {
    const result = {};
    for (const [k, v] of Object.entries(input)) {
        result[k] = transform(v);
    }
    return result;
}
exports.mapObject = mapObject;
const nullsafeVisitor = (func, ...rest) => (first) => {
    if (first === null) {
        return null;
    }
    return func(first, ...rest);
};
exports.nullsafeVisitor = nullsafeVisitor;
function optionalValueMatches(lhs, rhs, defaultValue) {
    lhs = lhs === undefined ? defaultValue : lhs;
    rhs = rhs === undefined ? defaultValue : rhs;
    return lhs === rhs;
}
exports.optionalValueMatches = optionalValueMatches;
