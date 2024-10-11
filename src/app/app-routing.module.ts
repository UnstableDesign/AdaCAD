import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { AppComponent } from './app.component';
import { CommunityComponent } from './community/community.component';


export const routes: Routes = [
  {
    path: 'community',
    component: CommunityComponent,
    children: []
  },
   {
     path: 'app',
     component: AppComponent,
     children: []
   }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
