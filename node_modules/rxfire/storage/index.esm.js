import { getDownloadURL as getDownloadURL$1, getMetadata as getMetadata$1, uploadBytesResumable as uploadBytesResumable$1, uploadString as uploadString$1 } from 'firebase/storage';
import { Observable, from } from 'rxjs';
import { shareReplay, map } from 'rxjs/operators';

function fromTask(task) {
    return new Observable(function (subscriber) {
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
        subscriber.add(from(task).subscribe({
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
    return from(getDownloadURL$1(ref));
}
// TODO: fix storage typing in firebase, then apply the same fix here
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getMetadata(ref) {
    return from(getMetadata$1(ref));
}
// MARK: Breaking change (renaming put to uploadBytesResumable)
function uploadBytesResumable(ref, data, metadata) {
    return new Observable(function (subscriber) {
        var task = uploadBytesResumable$1(ref, data, metadata);
        var subscription = fromTask(task).subscribe(subscriber);
        return function unsubscribe() {
            subscription.unsubscribe();
            task.cancel();
        };
    }).pipe(shareReplay({ bufferSize: 1, refCount: true }));
}
// MARK: Breaking change (renaming put to uploadString)
function uploadString(ref, data, format, metadata) {
    return from(uploadString$1(ref, data, format, metadata));
}
function percentage(task) {
    return fromTask(task).pipe(map(function (snapshot) { return ({
        progress: (snapshot.bytesTransferred / snapshot.totalBytes) * 100,
        snapshot: snapshot,
    }); }));
}

export { fromTask, getDownloadURL, getMetadata, percentage, uploadBytesResumable, uploadString };
//# sourceMappingURL=index.esm.js.map
