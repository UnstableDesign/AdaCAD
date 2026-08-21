import { provideHttpClient, withInterceptorsFromDi, withXhr } from '@angular/common/http';
import { BrowserModule, bootstrapApplication } from '@angular/platform-browser';
import { provideRouter, Router } from '@angular/router';
import { environment } from './environments/environment';
import * as Sentry from "@sentry/angular";

import { ApplicationConfig, APP_INITIALIZER, ErrorHandler, importProvidersFrom, provideZoneChangeDetection } from '@angular/core';
import { AppRoutingModule, routes } from './app/app-routing.module';
import { CoreModule } from './app/core/core.module';

export const appConfig: ApplicationConfig = {
    providers: [
        provideZoneChangeDetection(), importProvidersFrom(BrowserModule, AppRoutingModule, CoreModule),
        provideRouter(routes),
        provideHttpClient(withXhr(), withInterceptorsFromDi()),
        {
            provide: ErrorHandler,
            useValue: Sentry.createErrorHandler(),
        },
        {
            provide: Sentry.TraceService,
            deps: [Router],
        },
        {
            provide: APP_INITIALIZER,
            useFactory: () => () => { },
            deps: [Sentry.TraceService],
            multi: true,
        },
    ]
};