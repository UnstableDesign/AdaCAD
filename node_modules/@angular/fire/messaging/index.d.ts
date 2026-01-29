import * as rxjs from 'rxjs';
import { Messaging as Messaging$1, deleteToken as deleteToken$1, getMessaging as getMessaging$1, getToken as getToken$1, isSupported as isSupported$1, onMessage as onMessage$1 } from 'firebase/messaging';
export * from 'firebase/messaging';
import * as i0 from '@angular/core';
import { Injector, EnvironmentProviders } from '@angular/core';

interface Messaging extends Messaging$1 {
}
declare class Messaging {
    constructor(messaging: Messaging$1);
}
interface MessagingInstances extends Array<Messaging$1> {
}
declare class MessagingInstances {
    constructor();
}
declare const messagingInstance$: rxjs.Observable<Messaging$1>;

declare class MessagingModule {
    constructor();
    static ɵfac: i0.ɵɵFactoryDeclaration<MessagingModule, never>;
    static ɵmod: i0.ɵɵNgModuleDeclaration<MessagingModule, never, never, never>;
    static ɵinj: i0.ɵɵInjectorDeclaration<MessagingModule>;
}
declare function provideMessaging(fn: (injector: Injector) => Messaging$1, ...deps: any[]): EnvironmentProviders;

declare const deleteToken: typeof deleteToken$1;
declare const getMessaging: typeof getMessaging$1;
declare const getToken: typeof getToken$1;
declare const isSupported: typeof isSupported$1;
declare const onMessage: typeof onMessage$1;

export { Messaging, MessagingInstances, MessagingModule, deleteToken, getMessaging, getToken, isSupported, messagingInstance$, onMessage, provideMessaging };
