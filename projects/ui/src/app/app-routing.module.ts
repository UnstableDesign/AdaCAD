import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { AppComponent } from './app.component';
import { NgxGoogleAnalyticsModule } from 'ngx-google-analytics';
import { environment } from '../environments/environment';

export const routes: Routes = [

  {
    path: '**',
    component: AppComponent,
    children: []
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes), NgxGoogleAnalyticsModule.forRoot(environment.firebase.measurementId as string)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
