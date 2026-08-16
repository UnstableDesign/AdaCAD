import * as Sentry from "@sentry/angular";
import { enableProdMode, importProvidersFrom, provideZoneChangeDetection } from '@angular/core';


import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { getAnalytics, provideAnalytics } from '@angular/fire/analytics';
import { initializeApp, provideFirebaseApp } from '@angular/fire/app';
import { getAuth, provideAuth } from '@angular/fire/auth';
import { getDatabase, provideDatabase } from '@angular/fire/database';
import { getFirestore, provideFirestore } from '@angular/fire/firestore';
import { getFunctions, provideFunctions } from '@angular/fire/functions';
import { getMessaging, provideMessaging } from '@angular/fire/messaging';
import { getPerformance, providePerformance } from '@angular/fire/performance';
import { getRemoteConfig, provideRemoteConfig } from '@angular/fire/remote-config';
import { getStorage, provideStorage } from '@angular/fire/storage';
import { BrowserModule, bootstrapApplication } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { AppRoutingModule, routes } from './app/app-routing.module';
import { AppComponent } from './app/app.component';
import { CoreModule } from './app/core/core.module';
import { environment } from './environments/environment';

Sentry.init({
  dsn: "https://3cf82c759b0d55d1d365c341af388bae@o4511911397949440.ingest.us.sentry.io/4511911408959488",
  integrations: [Sentry.browserTracingIntegration(), Sentry.replayIntegration()],
  tracesSampleRate: 1,
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1,
  enableLogs: true,
  debug: true
})

if (environment.production) {
  enableProdMode();
}



bootstrapApplication(AppComponent, {
  providers: [
    provideZoneChangeDetection(), importProvidersFrom(BrowserModule, AppRoutingModule, CoreModule),
    provideRouter(routes),
    provideHttpClient(withInterceptorsFromDi()),
    provideFirebaseApp(() => initializeApp(environment.firebase)),
    provideFirestore(() => getFirestore()),
    provideAnalytics(() => getAnalytics()),
    provideAuth(() => getAuth()),
    provideDatabase(() => getDatabase()),
    provideFirestore(() => getFirestore()),
    provideFunctions(() => getFunctions()),
    provideMessaging(() => getMessaging()),
    providePerformance(() => getPerformance()),
    provideRemoteConfig(() => getRemoteConfig()),
    provideStorage(() => getStorage()),
  ]
});