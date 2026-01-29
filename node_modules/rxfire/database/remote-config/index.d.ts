import { Observable } from 'rxjs';
type RemoteConfig = import('firebase/remote-config').RemoteConfig;
type RemoteConfigValue = import('firebase/remote-config').Value;
export type AllParameters = {
    [key: string]: RemoteConfigValue;
};
export declare function getValue(remoteConfig: RemoteConfig, key: string): Observable<import("@firebase/remote-config").Value>;
export declare function getString(remoteConfig: RemoteConfig, key: string): Observable<string>;
export declare function getNumber(remoteConfig: RemoteConfig, key: string): Observable<number>;
export declare function getBoolean(remoteConfig: RemoteConfig, key: string): Observable<boolean>;
export declare function getAll(remoteConfig: RemoteConfig): Observable<AllParameters>;
export {};
