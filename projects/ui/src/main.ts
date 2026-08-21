import { enableProdMode, importProvidersFrom, provideZoneChangeDetection } from '@angular/core';
import { provideHttpClient, withInterceptorsFromDi, withXhr } from '@angular/common/http';
import { BrowserModule, bootstrapApplication } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { AppRoutingModule, routes } from './app/app-routing.module';
import { CoreModule } from './app/core/core.module';
import './app/core/provider/firebase-app';
import { environment } from './environments/environment';
import * as Sentry from "@sentry/angular";
import { appConfig } from './app.config';
import { AppComponent } from './app/app.component';

Sentry.init({
  dsn: environment.sentry.dsn,
  integrations: [
    Sentry.feedbackIntegration({
      // Additional SDK configuration goes in here, for example:
      colorScheme: "system",
    }),
  ],
  dataCollection: {
    // To disable sending user data and HTTP bodies, uncomment the lines below. For more info visit:
    // https://docs.sentry.io/platforms/javascript/guides/angular/configuration/options/#dataCollection
    // userInfo: false,
    // httpBodies: []

  }
});


if (environment.production) {
  enableProdMode();
}



bootstrapApplication(AppComponent, appConfig);
