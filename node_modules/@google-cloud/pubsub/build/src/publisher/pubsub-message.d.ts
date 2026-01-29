/*!
 * Copyright 2021 Google LLC
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
import { google } from '../../protos/protos';
import * as tracing from '../telemetry-tracing';
/**
 * Strings are the only allowed values for keys and values in message attributes.
 */
export type Attributes = Record<string, string>;
/**
 * The basic {data, attributes} for a message to be published.
 */
export interface PubsubMessage extends google.pubsub.v1.IPubsubMessage, tracing.MessageWithAttributes {
    /**
     * If we've calculated the size of this message, it will be cached here.
     * This is done to avoid having to build up the attribute size over and over.
     *
     * This field should not be used outside of this library. Its implementation
     * may change, and it may disappear later.
     *
     * @private
     * @internal
     */
    calculatedSize?: number;
    /**
     * If tracing is enabled, track the message span.
     *
     * @private
     * @internal
     */
    messageSpan?: tracing.Span;
    /**
     * If tracing is enabled, track the batching (publish scheduling) period.
     *
     * @private
     * @internal
     */
    publishSchedulerSpan?: tracing.Span;
    /**
     * If this is a message being received from a subscription, expose the ackId
     * internally. Primarily for tracing.
     *
     * @private
     * @internal
     */
    ackId?: string;
    /**
     * If this is a message being received from a subscription, expose the exactly
     * once delivery flag internally. Primarily for tracing.
     *
     * @private
     * @internal
     */
    isExactlyOnceDelivery?: boolean;
}
/**
 * Since we tag a fair number of extra things into messages sent to the Pub/Sub
 * server, this filters everything down to what needs to be sent. This should be
 * used right before gRPC calls.
 *
 * @private
 * @internal
 */
export declare function filterMessage(message: PubsubMessage): google.pubsub.v1.IPubsubMessage;
/**
 * Precisely calculates the size of a message with optional `data` and
 * `attributes` fields. If a `data` field is present, its {@link Buffer#length}
 * member will be used. If `attributes` are present, each attribute's
 * key and value will be calculated for byte length.
 *
 * When the calculation is complete, the result will be stored in
 * `calculatedSize`. Since this calculation is generally only done
 * after the message has been handed off to this library, there shouldn't
 * be an issue with it being updated after the fact.
 *
 * This should not be used outside of this library. Its implementation
 * may change.
 *
 * @private
 * @internal
 */
export declare function calculateMessageSize(message: PubsubMessage | google.pubsub.v1.IPubsubMessage): number;
