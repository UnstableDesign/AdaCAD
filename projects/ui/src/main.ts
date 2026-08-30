import { enableProdMode } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import './app/core/provider/firebase-app';
import { environment } from './environments/environment';
import * as Sentry from "@sentry/angular";
import { appConfig } from './app.config';
import { AppComponent } from './app/app.component';

Sentry.init({
  dsn: environment.sentry.dsn,
  enabled: environment.production,
  environment: environment.production ? 'production' : 'development',
  integrations: [
    // Sentry.feedbackIntegration({
    //   // Additional SDK configuration goes in here, for example:
    //   colorScheme: "system",
    // }),
  ],
  dataCollection: {
    // To disable sending user data and HTTP bodies, uncomment the lines below. For more info visit:
    // https://docs.sentry.io/platforms/javascript/guides/angular/configuration/options/#dataCollection
    userInfo: false,
    httpBodies: []

  }
});


if (environment.production) {
  enableProdMode();
}



bootstrapApplication(AppComponent, appConfig);
