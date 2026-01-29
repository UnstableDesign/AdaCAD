"use strict";
/*!
 * Copyright 2018 Google Inc. All Rights Reserved.
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
exports.Subscriber = exports.Message = exports.SubscriberSpans = exports.AckError = exports.AckResponses = exports.StatusError = void 0;
const precise_date_1 = require("@google-cloud/precise-date");
const projectify_1 = require("@google-cloud/projectify");
const promisify_1 = require("@google-cloud/promisify");
const histogram_1 = require("./histogram");
const lease_manager_1 = require("./lease-manager");
const message_queues_1 = require("./message-queues");
const message_stream_1 = require("./message-stream");
const default_options_1 = require("./default-options");
const tracing = require("./telemetry-tracing");
const temporal_1 = require("./temporal");
const events_1 = require("events");
var message_stream_2 = require("./message-stream");
Object.defineProperty(exports, "StatusError", { enumerable: true, get: function () { return message_stream_2.StatusError; } });
exports.AckResponses = {
    PermissionDenied: 'PERMISSION_DENIED',
    FailedPrecondition: 'FAILED_PRECONDITION',
    Success: 'SUCCESS',
    Invalid: 'INVALID',
    Other: 'OTHER',
};
/**
 * Thrown when an error is detected in an ack/nack/modack call, when
 * exactly-once delivery is enabled on the subscription. This will
 * only be thrown for actual errors that can't be retried.
 */
class AckError extends Error {
    constructor(errorCode, message) {
        let finalMessage = `${errorCode}`;
        if (message) {
            finalMessage += ` : ${message}`;
        }
        super(finalMessage);
        this.errorCode = errorCode;
    }
}
exports.AckError = AckError;
/**
 * Tracks the various spans related to subscriber/receive tracing.
 *
 * @private
 */
class SubscriberSpans {
    // These are always attached to a message.
    constructor(parent) {
        this.parent = parent;
    }
    // Start a flow control span if needed.
    flowStart() {
        if (!this.flow) {
            this.flow = tracing.PubsubSpans.createReceiveFlowSpan(this.parent);
        }
    }
    // End any flow control span.
    flowEnd() {
        if (this.flow) {
            this.flow.end();
            this.flow = undefined;
        }
    }
    // Emit an event for starting to send an ack.
    ackStart() {
        tracing.PubsubEvents.ackStart(this.parent);
    }
    // Emit an event for the ack having been sent.
    ackEnd() {
        tracing.PubsubEvents.ackEnd(this.parent);
    }
    // Emit an event for calling ack.
    ackCall() {
        if (this.processing) {
            tracing.PubsubEvents.ackCalled(this.processing);
        }
    }
    // Emit an event for starting to send a nack.
    nackStart() {
        tracing.PubsubEvents.nackStart(this.parent);
    }
    // Emit an event for the nack having been sent.
    nackEnd() {
        tracing.PubsubEvents.nackEnd(this.parent);
    }
    // Emit an event for calling nack.
    nackCall() {
        if (this.processing) {
            tracing.PubsubEvents.nackCalled(this.processing);
        }
    }
    // Emit an event for starting to send a modAck.
    modAckStart(deadline, isInitial) {
        tracing.PubsubEvents.modAckStart(this.parent, deadline, isInitial);
    }
    // Emit an event for the modAck having been sent.
    modAckEnd() {
        tracing.PubsubEvents.modAckEnd(this.parent);
    }
    // Emit an event for calling modAck.
    // Note that we don't currently support users calling modAck directly, but
    // this may be used in the future for things like fully managed pull
    // subscriptions.
    modAckCall(deadline) {
        if (this.processing) {
            tracing.PubsubEvents.modAckCalled(this.processing, deadline);
        }
    }
    // Start a scheduler span if needed.
    // Note: This is not currently used in Node, because there is no
    // scheduler process, due to the way messages are delivered one at a time.
    schedulerStart() {
        if (!this.scheduler) {
            this.scheduler = tracing.PubsubSpans.createReceiveSchedulerSpan(this.parent);
        }
    }
    // End any scheduler span.
    schedulerEnd() {
        if (this.scheduler) {
            this.scheduler.end();
            this.scheduler = undefined;
        }
    }
    // Start a processing span if needed.
    // This is for user processing, during on('message') delivery.
    processingStart(subName) {
        if (!this.processing) {
            this.processing = tracing.PubsubSpans.createReceiveProcessSpan(this.parent, subName);
        }
    }
    // End any processing span.
    processingEnd() {
        if (this.processing) {
            this.processing.end();
            this.processing = undefined;
        }
    }
    // If we shut down before processing can finish.
    shutdown() {
        tracing.PubsubEvents.shutdown(this.parent);
    }
}
exports.SubscriberSpans = SubscriberSpans;
/**
 * Date object with nanosecond precision. Supports all standard Date arguments
 * in addition to several custom types.
 *
 * @external PreciseDate
 * @see {@link https://github.com/googleapis/nodejs-precise-date|PreciseDate}
 */
/**
 * Message objects provide a simple interface for users to get message data and
 * acknowledge the message.
 *
 * @example
 * ```
 * subscription.on('message', message => {
 *   // {
 *   //   ackId: 'RUFeQBJMJAxESVMrQwsqWBFOBCEhPjA',
 *   //   attributes: {key: 'value'},
 *   //   data: Buffer.from('Hello, world!'),
 *   //   id: '1551297743043',
 *   //   orderingKey: 'ordering-key',
 *   //   publishTime: new PreciseDate('2019-02-27T20:02:19.029534186Z'),
 *   //   received: 1551297743043,
 *   //   length: 13
 *   // }
 * });
 * ```
 */
class Message {
    /**
     * @private
     *
     * Ends any open subscribe telemetry tracing span.
     */
    endParentSpan() {
        var _a;
        (_a = this.parentSpan) === null || _a === void 0 ? void 0 : _a.end();
        delete this.parentSpan;
    }
    /**
     * @hideconstructor
     *
     * @param {Subscriber} sub The parent subscriber.
     * @param {object} message The raw message response.
     */
    constructor(sub, { ackId, message, deliveryAttempt }) {
        /**
         * This ID is used to acknowledge the message.
         *
         * @name Message#ackId
         * @type {string}
         */
        this.ackId = ackId;
        /**
         * Optional attributes for this message.
         *
         * @name Message#attributes
         * @type {object}
         */
        this.attributes = message.attributes || {};
        /**
         * The message data as a Buffer.
         *
         * @name Message#data
         * @type {Buffer}
         */
        this.data = message.data;
        /**
         * Delivery attempt counter is 1 + (the sum of number of NACKs and number of
         * ack_deadline exceeds) for this message.
         *
         * @name Message#deliveryAttempt
         * @type {number}
         */
        this.deliveryAttempt = Number(deliveryAttempt || 0);
        /**
         * ID of the message, assigned by the server when the message is published.
         * Guaranteed to be unique within the topic.
         *
         * @name Message#id
         * @type {string}
         */
        this.id = message.messageId;
        /**
         * Identifies related messages for which publish order should be respected.
         * If a `Subscription` has `enableMessageOrdering` set to `true`, messages
         * published with the same `orderingKey` value will be delivered to
         * subscribers in the order in which they are received by the Pub/Sub
         * system.
         *
         * **EXPERIMENTAL:** This feature is part of a closed alpha release. This
         * API might be changed in backward-incompatible ways and is not recommended
         * for production use. It is not subject to any SLA or deprecation policy.
         *
         * @name Message#orderingKey
         * @type {string}
         */
        this.orderingKey = message.orderingKey;
        /**
         * The time at which the message was published.
         *
         * @name Message#publishTime
         * @type {external:PreciseDate}
         */
        this.publishTime = new precise_date_1.PreciseDate(message.publishTime);
        /**
         * The time at which the message was recieved by the subscription.
         *
         * @name Message#received
         * @type {number}
         */
        this.received = Date.now();
        /**
         * Telemetry tracing objects.
         *
         * @private
         */
        this.subSpans = new SubscriberSpans(this);
        /**
         * Save the state of the subscription into the message for later tracing.
         *
         * @private
         * @internal
         */
        this.isExactlyOnceDelivery = sub.isExactlyOnceDelivery;
        this._handled = false;
        this._length = this.data.length;
        this._subscriber = sub;
    }
    /**
     * The length of the message data.
     *
     * @type {number}
     */
    get length() {
        return this._length;
    }
    /**
     * Sets this message's exactly once delivery acks to permanent failure. This is
     * meant for internal library use only.
     *
     * @private
     */
    ackFailed(error) {
        this._ackFailed = error;
    }
    /**
     * Acknowledges the message.
     *
     * @example
     * ```
     * subscription.on('message', message => {
     *   message.ack();
     * });
     * ```
     */
    ack() {
        if (!this._handled) {
            this._handled = true;
            this.subSpans.ackCall();
            this.subSpans.processingEnd();
            this._subscriber.ack(this);
        }
    }
    /**
     * Acknowledges the message, expecting a response (for exactly-once delivery subscriptions).
     * If exactly-once delivery is not enabled, this will immediately resolve successfully.
     *
     * @example
     * ```
     * subscription.on('message', async (message) => {
     *   const response = await message.ackWithResponse();
     * });
     * ```
     */
    async ackWithResponse() {
        if (!this._subscriber.isExactlyOnceDelivery) {
            this.ack();
            return exports.AckResponses.Success;
        }
        if (this._ackFailed) {
            throw this._ackFailed;
        }
        if (!this._handled) {
            this._handled = true;
            this.subSpans.ackCall();
            this.subSpans.processingEnd();
            try {
                return await this._subscriber.ackWithResponse(this);
            }
            catch (e) {
                this.ackFailed(e);
                throw e;
            }
        }
        else {
            return exports.AckResponses.Invalid;
        }
    }
    /**
     * Modifies the ack deadline.
     * At present time, this should generally not be called by users.
     *
     * @param {number} deadline The number of seconds to extend the deadline.
     * @private
     */
    modAck(deadline) {
        if (!this._handled) {
            this.subSpans.modAckCall(temporal_1.Duration.from({ seconds: deadline }));
            this._subscriber.modAck(this, deadline);
        }
    }
    /**
     * Modifies the ack deadline, expecting a response (for exactly-once delivery subscriptions).
     * If exactly-once delivery is not enabled, this will immediately resolve successfully.
     * At present time, this should generally not be called by users.
     *
     * @param {number} deadline The number of seconds to extend the deadline.
     * @private
     */
    async modAckWithResponse(deadline) {
        if (!this._subscriber.isExactlyOnceDelivery) {
            this.modAck(deadline);
            return exports.AckResponses.Success;
        }
        if (this._ackFailed) {
            throw this._ackFailed;
        }
        if (!this._handled) {
            this.subSpans.modAckCall(temporal_1.Duration.from({ seconds: deadline }));
            try {
                return await this._subscriber.modAckWithResponse(this, deadline);
            }
            catch (e) {
                this.ackFailed(e);
                throw e;
            }
        }
        else {
            return exports.AckResponses.Invalid;
        }
    }
    /**
     * Removes the message from our inventory and schedules it to be redelivered.
     *
     * @example
     * ```
     * subscription.on('message', message => {
     *   message.nack();
     * });
     * ```
     */
    nack() {
        if (!this._handled) {
            this._handled = true;
            this.subSpans.nackCall();
            this.subSpans.processingEnd();
            this._subscriber.nack(this);
        }
    }
    /**
     * Removes the message from our inventory and schedules it to be redelivered,
     * with the modAck response being returned (for exactly-once delivery subscriptions).
     * If exactly-once delivery is not enabled, this will immediately resolve successfully.
     *
     * @example
     * ```
     * subscription.on('message', async (message) => {
     *   const response = await message.nackWithResponse();
     * });
     * ```
     */
    async nackWithResponse() {
        if (!this._subscriber.isExactlyOnceDelivery) {
            this.nack();
            return exports.AckResponses.Success;
        }
        if (this._ackFailed) {
            throw this._ackFailed;
        }
        if (!this._handled) {
            this._handled = true;
            this.subSpans.nackCall();
            this.subSpans.processingEnd();
            try {
                return await this._subscriber.nackWithResponse(this);
            }
            catch (e) {
                this.ackFailed(e);
                throw e;
            }
        }
        else {
            return exports.AckResponses.Invalid;
        }
    }
}
exports.Message = Message;
const minAckDeadlineForExactlyOnceDelivery = temporal_1.Duration.from({ seconds: 60 });
/**
 * Subscriber class is used to manage all message related functionality.
 *
 * @private
 * @class
 *
 * @param {Subscription} subscription The corresponding subscription.
 * @param {SubscriberOptions} options The subscriber options.
 */
class Subscriber extends events_1.EventEmitter {
    constructor(subscription, options = {}) {
        super();
        this.ackDeadline = default_options_1.defaultOptions.subscription.ackDeadline;
        this.maxMessages = default_options_1.defaultOptions.subscription.maxOutstandingMessages;
        this.maxBytes = default_options_1.defaultOptions.subscription.maxOutstandingBytes;
        this.useLegacyFlowControl = false;
        this.isOpen = false;
        this._useLegacyOpenTelemetry = false;
        this._histogram = new histogram_1.Histogram({ min: 10, max: 600 });
        this._latencies = new histogram_1.Histogram();
        this._subscription = subscription;
        this.setOptions(options);
    }
    /**
     * Update our ack extension time that will be used by the lease manager
     * for sending modAcks.
     *
     * Should not be called from outside this class, except for unit tests.
     *
     * @param {number} [ackTimeSeconds] The number of seconds that the last
     *   ack took after the message was received. If this is undefined, then
     *   we won't update the histogram, but we will still recalculate the
     *   ackDeadline based on the situation.
     *
     * @private
     */
    updateAckDeadline(ackTimeSeconds) {
        // Start with the value we already have.
        let ackDeadline = this.ackDeadline;
        // If we got an ack time reading, update the histogram (and ackDeadline).
        if (ackTimeSeconds) {
            this._histogram.add(ackTimeSeconds);
            ackDeadline = this._histogram.percentile(99);
        }
        // Grab our current min/max deadline values, based on whether exactly-once
        // delivery is enabled, and the defaults.
        const [minDeadline, maxDeadline] = this.getMinMaxDeadlines();
        if (minDeadline) {
            ackDeadline = Math.max(ackDeadline, minDeadline.totalOf('second'));
        }
        if (maxDeadline) {
            ackDeadline = Math.min(ackDeadline, maxDeadline.totalOf('second'));
        }
        // Set the bounded result back.
        this.ackDeadline = ackDeadline;
    }
    getMinMaxDeadlines() {
        var _a, _b;
        // If this is an exactly-once delivery subscription, and the user
        // didn't set their own minimum ack periods, set it to the default
        // for exactly-once delivery.
        const defaultMinDeadline = this.isExactlyOnceDelivery
            ? minAckDeadlineForExactlyOnceDelivery
            : default_options_1.defaultOptions.subscription.minAckDeadline;
        const defaultMaxDeadline = default_options_1.defaultOptions.subscription.maxAckDeadline;
        // Pull in any user-set min/max.
        const minDeadline = (_a = this._options.minAckDeadline) !== null && _a !== void 0 ? _a : defaultMinDeadline;
        const maxDeadline = (_b = this._options.maxAckDeadline) !== null && _b !== void 0 ? _b : defaultMaxDeadline;
        return [minDeadline, maxDeadline];
    }
    /**
     * Returns true if an exactly-once delivery subscription has been detected.
     *
     * @private
     */
    get isExactlyOnceDelivery() {
        if (!this.subscriptionProperties) {
            return false;
        }
        return !!this.subscriptionProperties.exactlyOnceDeliveryEnabled;
    }
    /**
     * Sets our subscription properties from incoming messages.
     *
     * @param {SubscriptionProperties} subscriptionProperties The new properties.
     * @private
     */
    setSubscriptionProperties(subscriptionProperties) {
        const previouslyEnabled = this.isExactlyOnceDelivery;
        this.subscriptionProperties = subscriptionProperties;
        // Update ackDeadline in case the flag switched.
        if (previouslyEnabled !== this.isExactlyOnceDelivery) {
            this.updateAckDeadline();
            // For exactly-once delivery, make sure the subscription ack deadline is 60.
            // (Otherwise fall back to the default of 10 seconds.)
            const subscriptionAckDeadlineSeconds = this.isExactlyOnceDelivery
                ? 60
                : 10;
            this._stream.setStreamAckDeadline(temporal_1.Duration.from({ seconds: subscriptionAckDeadlineSeconds }));
        }
    }
    /**
     * The 99th percentile of request latencies.
     *
     * @type {number}
     * @private
     */
    get modAckLatency() {
        const latency = this._latencies.percentile(99);
        let bufferTime = 0;
        if (this._modAcks) {
            bufferTime = this._modAcks.maxMilliseconds;
        }
        return latency * 1000 + bufferTime;
    }
    /**
     * The full name of the Subscription.
     *
     * @type {string}
     * @private
     */
    get name() {
        if (!this._name) {
            const { name, projectId } = this._subscription;
            this._name = (0, projectify_1.replaceProjectIdToken)(name, projectId);
        }
        return this._name;
    }
    /**
     * Acknowledges the supplied message.
     *
     * @param {Message} message The message to acknowledge.
     * @returns {Promise<void>}
     * @private
     */
    async ack(message) {
        const ackTimeSeconds = (Date.now() - message.received) / 1000;
        this.updateAckDeadline(ackTimeSeconds);
        tracing.PubsubEvents.ackStart(message);
        // Ignore this in this version of the method (but hook catch
        // to avoid unhandled exceptions).
        const resultPromise = this._acks.add(message);
        resultPromise.catch(() => { });
        await this._acks.onFlush();
        tracing.PubsubEvents.ackEnd(message);
        message.endParentSpan();
        this._inventory.remove(message);
    }
    /**
     * Acknowledges the supplied message, expecting a response (for exactly
     * once subscriptions).
     *
     * @param {Message} message The message to acknowledge.
     * @returns {Promise<AckResponse>}
     * @private
     */
    async ackWithResponse(message) {
        const ackTimeSeconds = (Date.now() - message.received) / 1000;
        this.updateAckDeadline(ackTimeSeconds);
        tracing.PubsubEvents.ackStart(message);
        await this._acks.add(message);
        tracing.PubsubEvents.ackEnd(message);
        message.endParentSpan();
        this._inventory.remove(message);
        // No exception means Success.
        return exports.AckResponses.Success;
    }
    /**
     * Closes the subscriber. The returned promise will resolve once any pending
     * acks/modAcks are finished.
     *
     * @returns {Promise}
     * @private
     */
    async close() {
        if (!this.isOpen) {
            return;
        }
        this.isOpen = false;
        this._stream.destroy();
        const remaining = this._inventory.clear();
        await this._waitForFlush();
        remaining.forEach(m => {
            m.subSpans.shutdown();
            m.endParentSpan();
        });
        this.emit('close');
        this._acks.close();
        this._modAcks.close();
    }
    /**
     * Gets the subscriber client instance.
     *
     * @returns {Promise<object>}
     * @private
     */
    async getClient() {
        const pubsub = this._subscription.pubsub;
        const [client] = await (0, promisify_1.promisify)(pubsub.getClient_).call(pubsub, {
            client: 'SubscriberClient',
        });
        return client;
    }
    /**
     * Modifies the acknowledge deadline for the provided message.
     *
     * @param {Message} message The message to modify.
     * @param {number} deadline The deadline in seconds.
     * @returns {Promise<void>}
     * @private
     */
    async modAck(message, deadline) {
        const startTime = Date.now();
        const responsePromise = this._modAcks.add(message, deadline);
        responsePromise.catch(() => { });
        await this._modAcks.onFlush();
        const latency = (Date.now() - startTime) / 1000;
        this._latencies.add(latency);
    }
    /**
     * Modifies the acknowledge deadline for the provided message, expecting
     * a reply (for exactly-once delivery subscriptions).
     *
     * @param {Message} message The message to modify.
     * @param {number} deadline The deadline.
     * @returns {Promise<AckResponse>}
     * @private
     */
    async modAckWithResponse(message, deadline) {
        const startTime = Date.now();
        await this._modAcks.add(message, deadline);
        const latency = (Date.now() - startTime) / 1000;
        this._latencies.add(latency);
        // No exception means Success.
        return exports.AckResponses.Success;
    }
    /**
     * Modfies the acknowledge deadline for the provided message and then removes
     * it from our inventory.
     *
     * @param {Message} message The message.
     * @return {Promise<void>}
     * @private
     */
    async nack(message) {
        message.subSpans.nackStart();
        await this.modAck(message, 0);
        message.subSpans.nackEnd();
        message.endParentSpan();
        this._inventory.remove(message);
    }
    /**
     * Modfies the acknowledge deadline for the provided message and then removes
     * it from our inventory, expecting a response from modAck (for
     * exactly-once delivery subscriptions).
     *
     * @param {Message} message The message.
     * @return {Promise<AckResponse>}
     * @private
     */
    async nackWithResponse(message) {
        message.subSpans.nackStart();
        const response = await this.modAckWithResponse(message, 0);
        message.subSpans.nackEnd();
        message.endParentSpan();
        return response;
    }
    /**
     * Starts pulling messages.
     * @private
     */
    open() {
        const { batching, flowControl, streamingOptions } = this._options;
        this._acks = new message_queues_1.AckQueue(this, batching);
        this._modAcks = new message_queues_1.ModAckQueue(this, batching);
        this._inventory = new lease_manager_1.LeaseManager(this, flowControl);
        this._stream = new message_stream_1.MessageStream(this, streamingOptions);
        this._stream
            .on('error', err => this.emit('error', err))
            .on('debug', msg => this.emit('debug', msg))
            .on('data', (data) => this._onData(data))
            .once('close', () => this.close());
        this._inventory
            .on('full', () => this._stream.pause())
            .on('free', () => this._stream.resume());
        this._stream.start().catch(err => {
            this.emit('error', err);
            this.close();
        });
        this.isOpen = true;
    }
    /**
     * Sets subscriber options.
     *
     * @param {SubscriberOptions} options The options.
     * @private
     */
    setOptions(options) {
        this._options = options;
        this._useLegacyOpenTelemetry = options.enableOpenTelemetryTracing || false;
        // The user-set ackDeadline value basically pegs the extension time.
        // We'll emulate it by overwriting min/max.
        const passedAckDeadline = options.ackDeadline;
        if (passedAckDeadline !== undefined) {
            this.ackDeadline = passedAckDeadline;
            options.minAckDeadline = temporal_1.Duration.from({ seconds: passedAckDeadline });
            options.maxAckDeadline = temporal_1.Duration.from({ seconds: passedAckDeadline });
        }
        this.useLegacyFlowControl = options.useLegacyFlowControl || false;
        if (options.flowControl) {
            this.maxMessages =
                options.flowControl.maxMessages ||
                    default_options_1.defaultOptions.subscription.maxOutstandingMessages;
            this.maxBytes =
                options.flowControl.maxBytes ||
                    default_options_1.defaultOptions.subscription.maxOutstandingBytes;
            // In the event that the user has specified the maxMessages option, we
            // want to make sure that the maxStreams option isn't higher.
            // It doesn't really make sense to open 5 streams if the user only wants
            // 1 message at a time.
            if (!options.streamingOptions) {
                options.streamingOptions = {};
            }
            const { maxStreams = default_options_1.defaultOptions.subscription.maxStreams } = options.streamingOptions;
            options.streamingOptions.maxStreams = Math.min(maxStreams, this.maxMessages);
        }
        if (this._inventory) {
            this._inventory.setOptions(this._options.flowControl);
        }
    }
    /**
     * Constructs a telemetry span from the incoming message.
     *
     * @param {Message} message One of the received messages
     * @private
     */
    createParentSpan(message) {
        const enabled = tracing.isEnabled({
            enableOpenTelemetryTracing: this._useLegacyOpenTelemetry,
        });
        if (enabled) {
            tracing.extractSpan(message, this.name, enabled);
        }
    }
    /**
     * Callback to be invoked when a new message is available.
     *
     * New messages will be added to the subscribers inventory, which in turn will
     * automatically extend the messages ack deadline until either:
     *   a. the user acks/nacks it
     *   b. the maxExtension option is hit
     *
     * If the message puts us at/over capacity, then we'll pause our message
     * stream until we've freed up some inventory space.
     *
     * New messages must immediately issue a ModifyAckDeadline request
     * (aka receipt) to confirm with the backend that we did infact receive the
     * message and its ok to start ticking down on the deadline.
     *
     * @private
     */
    _onData(response) {
        // Grab the subscription properties for exactly-once delivery and ordering flags.
        if (response.subscriptionProperties) {
            this.setSubscriptionProperties(response.subscriptionProperties);
        }
        const { receivedMessages } = response;
        for (const data of receivedMessages) {
            const message = new Message(this, data);
            this.createParentSpan(message);
            if (this.isOpen) {
                if (this.isExactlyOnceDelivery) {
                    // For exactly-once delivery, we must validate that we got a valid
                    // lease on the message before actually leasing it.
                    message.subSpans.modAckStart(temporal_1.Duration.from({ seconds: this.ackDeadline }), true);
                    message
                        .modAckWithResponse(this.ackDeadline)
                        .then(() => {
                        this._inventory.add(message);
                    })
                        .catch(() => {
                        // Temporary failures will retry, so if an error reaches us
                        // here, that means a permanent failure. Silently drop these.
                        this._discardMessage(message);
                    })
                        .finally(() => {
                        message.subSpans.modAckEnd();
                    });
                }
                else {
                    message.subSpans.modAckStart(temporal_1.Duration.from({ seconds: this.ackDeadline }), true);
                    message.modAck(this.ackDeadline);
                    message.subSpans.modAckEnd();
                    this._inventory.add(message);
                }
            }
            else {
                message.subSpans.shutdown();
                message.nack();
            }
        }
    }
    // Internal: This is here to provide a hook for unit testing, at least for now.
    _discardMessage(message) {
        message;
    }
    /**
     * Returns a promise that will resolve once all pending requests have settled.
     *
     * @private
     *
     * @returns {Promise}
     */
    async _waitForFlush() {
        const promises = [];
        if (this._acks.numPendingRequests) {
            promises.push(this._acks.onFlush());
            this._acks.flush();
        }
        if (this._modAcks.numPendingRequests) {
            promises.push(this._modAcks.onFlush());
            this._modAcks.flush();
        }
        if (this._acks.numInFlightRequests) {
            promises.push(this._acks.onDrain());
        }
        if (this._modAcks.numInFlightRequests) {
            promises.push(this._modAcks.onDrain());
        }
        await Promise.all(promises);
    }
}
exports.Subscriber = Subscriber;
//# sourceMappingURL=subscriber.js.map