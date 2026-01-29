"use strict";
/*!
 * Copyright 2019 Google Inc. All Rights Reserved.
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
exports.MessageBatch = void 0;
const _1 = require("./");
const pubsub_message_1 = require("./pubsub-message");
const tracing = require("../telemetry-tracing");
/**
 * @typedef BatchPublishOptions
 * @property {number} [maxBytes=1 * 1024 * 1024] The maximum number of bytes to
 *     buffer before sending a payload.
 * @property {number} [maxMessages=100] The maximum number of messages to
 *     buffer before sending a payload.
 * @property {number} [maxMilliseconds=10] The maximum duration to wait before
 *     sending a payload.
 */
/**
 * Call used to help batch messages.
 *
 * @private
 *
 * @param {BatchPublishOptions} options The batching options.
 */
class MessageBatch {
    constructor(options, topicName) {
        this.options = options;
        this.topicName = topicName;
        this.messages = [];
        this.callbacks = [];
        this.created = Date.now();
        this.bytes = 0;
    }
    /**
     * Updates our options from new values.
     *
     * @param {BatchPublishOptions} options The new options.
     */
    setOptions(options) {
        this.options = options;
    }
    /**
     * Adds a message to the current batch.
     *
     * @param {object} message The message to publish.
     * @param {PublishCallback} callback The callback function.
     */
    add(message, callback) {
        this.messages.push(message);
        this.callbacks.push(callback);
        this.bytes += (0, pubsub_message_1.calculateMessageSize)(message);
        tracing.PubsubSpans.createPublishSchedulerSpan(message);
    }
    end() {
        this.messages.forEach(m => { var _a; return (_a = m.publishSchedulerSpan) === null || _a === void 0 ? void 0 : _a.end(); });
        return {
            messages: this.messages,
            callbacks: this.callbacks,
        };
    }
    /**
     * Indicates if a given message can fit in the batch.
     *
     * @param {object} message The message in question.
     * @returns {boolean}
     */
    canFit(message) {
        const { maxMessages, maxBytes } = this.options;
        return (this.messages.length < maxMessages &&
            this.bytes + (0, pubsub_message_1.calculateMessageSize)(message) <= maxBytes);
    }
    /**
     * Checks to see if this batch is at the maximum allowed payload size.
     * When publishing ordered messages, it is ok to exceed the user configured
     * thresholds while a batch is in flight.
     *
     * @returns {boolean}
     */
    isAtMax() {
        const { maxMessages, maxBytes } = _1.BATCH_LIMITS;
        return this.messages.length >= maxMessages || this.bytes >= maxBytes;
    }
    /**
     * Indicates if the batch is at capacity.
     *
     * @returns {boolean}
     */
    isFull() {
        const { maxMessages, maxBytes } = this.options;
        return this.messages.length >= maxMessages || this.bytes >= maxBytes;
    }
}
exports.MessageBatch = MessageBatch;
//# sourceMappingURL=message-batch.js.map