import { inject, Injectable } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { GoogleAnalyticsService } from 'ngx-google-analytics';



@Injectable({
  providedIn: 'root',
})
export class AnalyticsService {

  private analytics = inject(GoogleAnalyticsService);
  constructor(private router: Router) {
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: NavigationEnd) => {
      console.log('Navigation End Called', event.urlAfterRedirects);
      this.analytics.event(event.urlAfterRedirects, 'page_view');
    });
  }


  trackEvent(action_name: string, data: any) {
    console.log('Log Event', action_name, data);

    this.analytics.event(action_name, data);
  }
}
