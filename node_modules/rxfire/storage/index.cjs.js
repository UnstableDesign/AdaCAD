'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var storage = require('firebase/storage');
var rxjs = require('rxjs');
var operators = require('rxjs/operators');

function fromTask(task) {
    return new rxjs.Observable(function (subscriber) {
        var lastSnapshot = null;
        var complete = false;
        var hasError = false;
        var error = null;
        var emit = function (snapshot) {
            lastSnapshot = snapshot;
            schedule();
        };
        var id = null;
        /**
         * Schedules an async event to check and emit
         * the most recent snapshot, and complete or error
         * if necessary.
         */
        var schedule = function () {
            if (!id) {
                id = setTimeout(function () {
                    id = null;
                    if (lastSnapshot)
                        subscriber.next(lastSnapshot);
                    if (complete)
                        subscriber.complete();
                    if (hasError)
                        subscriber.error(error);
                });
            }
        };
        subscriber.add(function () {
            // If we have any emissions checks scheduled, cancel them.
            if (id)
                clearTimeout(id);
        });
        // Emit the initial snapshot
        emit(task.snapshot);
        // Take each update and schedule them to be emitted (see `emit`)
        subscriber.add(task.on('state_changed', emit));
        // task is a promise, so we can convert that to an observable,
        // this is done for the ergonomics around making sure we don't
        // try to push errors or completions through closed subscribers
        subscriber.add(rxjs.from(task).subscribe({
            next: emit,
            error: function (err) {
                hasError = true;
                error = err;
                schedule();
            },
            complete: function () {
                complete = true;
                schedule();
            },
        }));
    });
}
function getDownloadURL(ref) {
    return rxjs.from(storage.getDownloadURL(ref));
}
// TODO: fix storage typing in firebase, then apply the same fix here
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getMetadata(ref) {
    return rxjs.from(storage.getMetadata(ref));
}
// MARK: Breaking change (renaming put to uploadBytesResumable)
function uploadBytesResumable(ref, data, metadata) {
    return new rxjs.Observable(function (subscriber) {
        var task = storage.uploadBytesResumable(ref, data, metadata);
        var subscription = fromTask(task).subscribe(subscriber);
        return function unsubscribe() {
            subscription.unsubscribe();
            task.cancel();
        };
    }).pipe(operators.shareReplay({ bufferSize: 1, refCount: true }));
}
// MARK: Breaking change (renaming put to uploadString)
function uploadString(ref, data, format, metadata) {
    return rxjs.from(storage.uploadString(ref, data, format, metadata));
}
function percentage(task) {
    return fromTask(task).pipe(operators.map(function (snapshot) { return ({
        progress: (snapshot.bytesTransferred / snapshot.totalBytes) * 100,
        snapshot: snapshot,
    }); }));
}

exports.fromTask = fromTask;
exports.getDownloadURL = getDownloadURL;
exports.getMetadata = getMetadata;
exports.percentage = percentage;
exports.uploadBytesResumable = uploadBytesResumable;
exports.uploadString = uploadString;
//# sourceMappingURL=index.cjs.js.map
