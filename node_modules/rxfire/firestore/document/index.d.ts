/**
 * @license
 * Copyright 2023 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import { DocumentReference, DocumentSnapshot, DocumentData } from '../interfaces';
import { Observable } from 'rxjs';
import { SnapshotOptions } from 'firebase/firestore';
export declare function doc<T = DocumentData>(ref: DocumentReference<T>): Observable<DocumentSnapshot<T>>;
/**
 * Returns a stream of a document, mapped to its data payload and optionally the document ID
 * @param query
 * @param options
 */
export declare function docData<T = DocumentData, R extends T = T>(ref: DocumentReference<T>, options?: {
    idField?: keyof R;
} & SnapshotOptions): Observable<T | R | undefined>;
export declare function snapToData<T = DocumentData, R extends T = T>(snapshot: DocumentSnapshot<T>, options?: {
    idField?: keyof R;
} & SnapshotOptions): T | R | undefined;
