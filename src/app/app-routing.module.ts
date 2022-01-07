import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { WeaverComponent } from './weaver/weaver.component';
import { MixerComponent } from './mixer/mixer.component';
import { LoginComponent } from './core/login/login.component';
import { ProfileComponent } from './core/profile/profile.component';
import { SignupComponent } from './core/signup/signup.component';
import { EmailComponent } from './core/email/email.component';

const routes: Routes = [
 // { path: '', redirectTo: 'login', pathMatch: 'full' },
  // { path: 'login', component: LoginComponent },
  // { path: 'email-login', component: EmailComponent },
  // { path: 'signup', component: SignupComponent },
  // { path: 'profile', component: ProfileComponent },
   {
     path: '',
     component: MixerComponent,
     children: []
   },
  {
    path: 'weaver',
    component: WeaverComponent,
    children: []
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
