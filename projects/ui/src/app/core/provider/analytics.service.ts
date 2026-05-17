import { Injectable } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

declare let gtag: Function;


@Injectable({
  providedIn: 'root',
})
export class AnalyticsService {
  constructor(private router: Router) {
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: NavigationEnd) => {
      gtag('config', environment.firebase.measurementId, {
        'page_path': event.urlAfterRedirects
      });
    });
  }


  trackEvent(action_name: string, data: any) {
    gtag('event', action_name, data);
  }
}
