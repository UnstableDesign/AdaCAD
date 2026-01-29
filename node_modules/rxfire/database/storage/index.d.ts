import { Observable } from 'rxjs';
import type { UploadTaskSnapshot, StorageReference, UploadMetadata, StringFormat, UploadTask, UploadResult } from 'firebase/storage';
export declare function fromTask(task: UploadTask): Observable<UploadTaskSnapshot>;
export declare function getDownloadURL(ref: StorageReference): Observable<string>;
export declare function getMetadata(ref: StorageReference): Observable<any>;
export declare function uploadBytesResumable(ref: StorageReference, data: Blob | Uint8Array | ArrayBuffer, metadata?: UploadMetadata): Observable<UploadTaskSnapshot>;
export declare function uploadString(ref: StorageReference, data: string, format?: StringFormat, metadata?: UploadMetadata): Observable<UploadResult>;
export declare function percentage(task: UploadTask): Observable<{
    progress: number;
    snapshot: UploadTaskSnapshot;
}>;
