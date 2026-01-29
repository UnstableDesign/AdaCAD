"use strict";
/*!
 * Copyright 2017 Google Inc. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.Throttler = void 0;
exports.promisifySome = promisifySome;
exports.noop = noop;
exports.addToBucket = addToBucket;
const promisify_1 = require("@google-cloud/promisify");
/**
 * This replaces usage of promisifyAll(), going forward. Instead of opting
 * some methods out, you will need to opt methods in. Additionally, this
 * function validates method names against the class using TypeScript,
 * to generate compile-time failures for misspellings and changes.
 *
 * Future work in the library should all be Promise-first.
 *
 * @private
 */
function promisifySome(class_, classProto, methods, options) {
    methods.forEach(methodName => {
        // Do the same stream checks as promisifyAll().
        const m = classProto[methodName];
        classProto[methodName] = (0, promisify_1.promisify)(m, options);
    });
}
function noop() { }
/**
 * Provides a very simple throttling capability for tasks like error logs.
 * This ensures that no task is actually completed unless N millis have passed
 * since the last one.
 *
 * @private
 */
class Throttler {
    constructor(minMillis) {
        this.minMillis = minMillis;
    }
    /**
     * Performs the task requested, if enough time has passed since the
     * last successful call.
     */
    doMaybe(task) {
        const now = Date.now();
        const doTask = !this.lastTime ||
            (this.lastTime && now - this.lastTime >= this.minMillis);
        if (doTask) {
            task();
            this.lastTime = now;
        }
    }
}
exports.Throttler = Throttler;
/**
 * Takes care of managing a Map of buckets to the bucket arrays themselves.
 *
 * @private
 */
function addToBucket(map, bucket, item) {
    var _a;
    const items = (_a = map.get(bucket)) !== null && _a !== void 0 ? _a : [];
    items.push(item);
    map.set(bucket, items);
}
//# sourceMappingURL=util.js.map