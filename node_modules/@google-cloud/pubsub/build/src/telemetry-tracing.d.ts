/*!
 * Copyright 2020-2024 Google LLC
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
import { SpanContext, Span, SpanKind, TextMapGetter, TextMapSetter, Context } from '@opentelemetry/api';
import { Attributes, PubsubMessage } from './publisher/pubsub-message';
import { PublishOptions } from './publisher/index';
import { Duration } from './temporal';
export { Span };
/**
 * Determination of the level of OTel support we're providing.
 *
 * @private
 * @internal
 */
export declare enum OpenTelemetryLevel {
    /**
     * None: OTel support is not enabled because we found no trace provider, or
     * the user has not enabled it.
     */
    None = 0,
    /**
     * Legacy: We found a trace provider, but the user also specified the old
     * manual enable flag; this will trigger the legacy attribute being included.
     * The modern propagation attribute will _also_ be included.
     */
    Legacy = 1,
    /**
     * Modern: We will only inject/extract the modern propagation attribute.
     */
    Modern = 2
}
/**
 * Manually set the OpenTelemetry enabledness.
 *
 * @param enabled The enabled flag to use, to override any automated methods.
 * @private
 * @internal
 */
export declare function setGloballyEnabled(enabled: boolean): void;
/**
 * Tries to divine what sort of OpenTelemetry we're supporting. See the enum
 * for the meaning of the values, and other notes.
 *
 * Legacy OTel is no longer officially supported, but we don't want to
 * break anyone at a non-major.
 *
 * @private
 * @internal
 */
export declare function isEnabled(publishSettings?: PublishOptions): OpenTelemetryLevel;
/**
 * Our Carrier object for propagation is anything with an 'attributes'
 * object, which is one of several possible Message classes. (They're
 * different for publish and subscribe.)
 *
 * Also we add a parentSpan optional member for passing around the
 * actual Span object within the client library. This can be a publish
 * or subscriber span, depending on the context.
 *
 * @private
 * @internal
 */
export interface MessageWithAttributes {
    attributes?: Attributes | null | undefined;
    parentSpan?: Span;
}
/**
 * Implements common members for the TextMap getter and setter interfaces for Pub/Sub messages.
 *
 * @private
 * @internal
 */
export declare class PubsubMessageGetSet {
    static keyPrefix: string;
    keys(carrier: MessageWithAttributes): string[];
    protected attributeName(key: string): string;
}
/**
 * Implements the TextMap getter interface for Pub/Sub messages.
 *
 * @private
 * @internal
 */
export declare class PubsubMessageGet extends PubsubMessageGetSet implements TextMapGetter<MessageWithAttributes> {
    get(carrier: MessageWithAttributes, key: string): string | string[] | undefined;
}
/**
 * Implements the TextMap setter interface for Pub/Sub messages.
 *
 * @private
 * @internal
 */
export declare class PubsubMessageSet extends PubsubMessageGetSet implements TextMapSetter<MessageWithAttributes> {
    set(carrier: MessageWithAttributes, key: string, value: string): void;
}
/**
 * The getter to use when calling extract() on a Pub/Sub message.
 *
 * @private
 * @internal
 */
export declare const pubsubGetter: PubsubMessageGet;
/**
 * The setter to use when calling inject() on a Pub/Sub message.
 *
 * @private
 * @internal
 */
export declare const pubsubSetter: PubsubMessageSet;
/**
 * Description of the data structure passed for span attributes.
 *
 * @private
 * @internal
 */
export interface SpanAttributes {
    [x: string]: string | number | boolean;
}
/**
 * Converts a SpanContext to a full Context, as needed.
 *
 * @private
 * @internal
 */
export declare function spanContextToContext(parent?: SpanContext): Context | undefined;
/**
 * The modern propagation attribute name.
 *
 * Technically this is determined by the OpenTelemetry library, but
 * in practice, it follows the W3C spec, so this should be the right
 * one. The only thing we're using it for, anyway, is emptying user
 * supplied attributes.
 *
 * @private
 * @internal
 */
export declare const modernAttributeName = "googclient_traceparent";
/**
 * The old legacy attribute name.
 *
 * @private
 * @internal
 */
export declare const legacyAttributeName = "googclient_OpenTelemetrySpanContext";
export interface AttributeParams {
    topicName?: string;
    subName?: string;
    projectId?: string;
    topicId?: string;
    subId?: string;
}
/**
 * Break down the subscription's full name into its project and ID.
 *
 * @private
 * @internal
 */
export declare function getSubscriptionInfo(fullName: string): AttributeParams;
/**
 * Break down the subscription's full name into its project and ID.
 *
 * @private
 * @internal
 */
export declare function getTopicInfo(fullName: string): AttributeParams;
/**
 * Contains utility methods for creating spans.
 *
 * @private
 * @internal
 */
export declare class PubsubSpans {
    static createAttributes(params: AttributeParams, message?: PubsubMessage, caller?: string): SpanAttributes;
    static createPublisherSpan(message: PubsubMessage, topicName: string, caller: string): Span | undefined;
    static updatePublisherTopicName(span: Span, topicName: string): void;
    static createReceiveSpan(message: PubsubMessage, subName: string, parent: Context | undefined, caller: string): Span | undefined;
    static createChildSpan(name: string, message?: PubsubMessage, parentSpan?: Span, attributes?: SpanAttributes): Span | undefined;
    static createPublishFlowSpan(message: PubsubMessage): Span | undefined;
    static createPublishSchedulerSpan(message: PubsubMessage): Span | undefined;
    static createPublishRpcSpan(messages: MessageWithAttributes[], topicName: string, caller: string): Span | undefined;
    static createAckRpcSpan(messageSpans: (Span | undefined)[], subName: string, caller: string): Span | undefined;
    static createModackRpcSpan(messageSpans: (Span | undefined)[], subName: string, type: 'modack' | 'nack', caller: string, deadline?: Duration, isInitial?: boolean): Span | undefined;
    static createReceiveFlowSpan(message: MessageWithAttributes): Span | undefined;
    static createReceiveSchedulerSpan(message: MessageWithAttributes): Span | undefined;
    static createReceiveProcessSpan(message: MessageWithAttributes, subName: string): Span | undefined;
    static setReceiveProcessResult(span: Span, isAck: boolean): void;
}
/**
 * Creates and manipulates Pub/Sub-related events on spans.
 *
 * @private
 * @internal
 */
export declare class PubsubEvents {
    static addEvent(text: string, message: MessageWithAttributes, attributes?: Attributes): void;
    static publishStart(message: MessageWithAttributes): void;
    static publishEnd(message: MessageWithAttributes): void;
    static ackStart(message: MessageWithAttributes): void;
    static ackEnd(message: MessageWithAttributes): void;
    static modackStart(message: MessageWithAttributes): void;
    static modackEnd(message: MessageWithAttributes): void;
    static nackStart(message: MessageWithAttributes): void;
    static nackEnd(message: MessageWithAttributes): void;
    static ackCalled(span: Span): void;
    static nackCalled(span: Span): void;
    static modAckCalled(span: Span, deadline: Duration): void;
    static modAckStart(message: MessageWithAttributes, deadline: Duration, isInitial: boolean): void;
    static modAckEnd(message: MessageWithAttributes): void;
    static shutdown(message: MessageWithAttributes): void;
}
/**
 * Injects the trace context into a Pub/Sub message (or other object with
 * an 'attributes' object) for propagation.
 *
 * This is for the publish side.
 *
 * @private
 * @internal
 */
export declare function injectSpan(span: Span, message: MessageWithAttributes, enabled: OpenTelemetryLevel): void;
/**
 * Returns true if this message potentially contains a span context.
 *
 * @private
 * @internal
 */
export declare function containsSpanContext(message: MessageWithAttributes): boolean;
/**
 * Extracts the trace context from a Pub/Sub message (or other object with
 * an 'attributes' object) from a propagation, for receive processing. If no
 * context was present, create a new parent span.
 *
 * This is for the receive side.
 *
 * @private
 * @internal
 */
export declare function extractSpan(message: MessageWithAttributes, subName: string, enabled: OpenTelemetryLevel): Span | undefined;
export declare const legacyExports: {
    /**
     * @deprecated
     * Use the new telemetry functionality instead; see the updated OpenTelemetry
     * sample for an example.
     */
    createSpan: (spanName: string, kind: SpanKind, attributes?: SpanAttributes, parent?: SpanContext) => Span;
};
