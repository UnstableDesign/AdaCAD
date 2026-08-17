import { enableProdMode, importProvidersFrom, provideZoneChangeDetection } from '@angular/core';
import { provideHttpClient, withInterceptorsFromDi, withXhr } from '@angular/common/http';
import { BrowserModule, bootstrapApplication } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { AppRoutingModule, routes } from './app/app-routing.module';
import { AppComponent } from './app/app.component';
import { CoreModule } from './app/core/core.module';
import './app/core/provider/firebase-app';
import { environment } from './environments/environment';


if (environment.production) {
  enableProdMode();
}



bootstrapApplication(AppComponent, {
  providers: [
    provideZoneChangeDetection(), importProvidersFrom(BrowserModule, AppRoutingModule, CoreModule),
    provideRouter(routes),
    provideHttpClient(withXhr(), withInterceptorsFromDi()),
  ]
});
